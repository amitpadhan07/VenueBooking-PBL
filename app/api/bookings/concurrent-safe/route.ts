import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { Role } from '@prisma/client'

export const dynamic = 'force-dynamic'

/**
 * POST /api/bookings/concurrent-safe
 * Pure SQL Implementation of ACID Transaction with Pessimistic Row-Level Locking (SELECT ... FOR UPDATE)
 * Lead Developer: Lavanya Joshi (DBMS & Backend)
 */
export async function POST(request: NextRequest) {
  try {
    const roleHeader = request.headers.get('x-demo-role') || 'Student'
    const body = await request.json()
    const { venueId, purpose, startAt, endAt, clientRequestId } = body

    if (!venueId || !purpose || !startAt || !endAt) {
      return NextResponse.json(
        { error: 'All fields (venueId, purpose, startAt, endAt) are required.' },
        { status: 400 }
      )
    }

    const startDate = new Date(startAt)
    const endDate = new Date(endAt)
    const eventDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
    const startTimeStr = startDate.toTimeString().slice(0, 5)
    const endTimeStr = endDate.toTimeString().slice(0, 5)

    // Determine user to associate via raw SQL
    let prismaRole: Role = Role.STUDENT
    if (roleHeader.toLowerCase() === 'admin') prismaRole = Role.ADMIN
    else if (roleHeader.toLowerCase() === 'employee') prismaRole = Role.EMPLOYEE

    const users = await prisma.$queryRaw<Array<{ user_id: string; name: string; email: string }>>`
      SELECT user_id, name, email FROM users WHERE role = ${prismaRole}::"Role" LIMIT 1
    `
    let user = users[0]
    if (!user) {
      const fallbackUsers = await prisma.$queryRaw<Array<{ user_id: string; name: string; email: string }>>`
        SELECT user_id, name, email FROM users LIMIT 1
      `
      user = fallbackUsers[0]
    }

    if (!user) {
      return NextResponse.json({ error: 'No user account found in PostgreSQL directory.' }, { status: 400 })
    }

    // Execute within a strict PostgreSQL ACID transaction using pure raw SQL queries
    const result = await prisma.$transaction(
      async (tx) => {
        // Step 1: ENTRY SECTION - Acquire Pessimistic Row Lock on the venue row
        // Relational equivalent of a binary mutex: serializes concurrent transactions on this tuple
        const lockedVenues = await tx.$queryRaw<Array<{ venue_id: string; venue_name: string; capacity: number; status: string }>>`
          SELECT venue_id, venue_name, capacity, status 
          FROM venues 
          WHERE venue_id = ${venueId} 
          FOR UPDATE
        `

        if (!lockedVenues.length) {
          throw new Error('VENUE_NOT_FOUND')
        }

        const venue = lockedVenues[0]
        if (venue.status !== 'ACTIVE') {
          throw new Error('VENUE_INACTIVE')
        }

        // Step 2: CRITICAL SECTION - SQL interval overlap conflict check
        // Rule: (S_exist < E_req) AND (E_exist > S_req)
        const conflicts = await tx.$queryRaw<Array<{ booking_id: string; start_time: string; end_time: string }>>`
          SELECT booking_id, start_time, end_time 
          FROM bookings 
          WHERE venue_id = ${venueId}
            AND event_date = ${eventDate}::date
            AND status IN ('PENDING', 'APPROVED')
            AND start_time < ${endTimeStr}
            AND end_time > ${startTimeStr}
          LIMIT 1
        `

        if (conflicts.length > 0) {
          const conflict = conflicts[0]
          const err = new Error(`SLOT_CONFLICT: Collides with booking (${conflict.start_time} - ${conflict.end_time})`)
          ;(err as any).code = 'CONFLICT'
          ;(err as any).conflictId = conflict.booking_id
          throw err
        }

        // Step 3: CRITICAL SECTION - Insert booking via SQL
        const insertedBookings = await tx.$queryRaw<Array<{ booking_id: string; event_name: string; event_date: Date; start_time: string; end_time: string; status: string }>>`
          INSERT INTO bookings (
            booking_id, user_id, venue_id, event_name, event_description, 
            event_date, start_time, end_time, expected_attendees, status, created_at, updated_at
          )
          VALUES (
            gen_random_uuid()::text, ${user.user_id}, ${venue.venue_id}, ${purpose}, ${purpose},
            ${eventDate}::date, ${startTimeStr}, ${endTimeStr}, 50, 'PENDING', NOW(), NOW()
          )
          RETURNING booking_id, event_name, event_date, start_time, end_time, status
        `
        const newBooking = insertedBookings[0]

        // Step 4: ACID Atomicity - Insert notification record via SQL
        await tx.$executeRaw`
          INSERT INTO notifications (
            notification_id, user_id, booking_id, title, message, notification_type, is_read, created_at
          )
          VALUES (
            gen_random_uuid()::text, ${user.user_id}, ${newBooking.booking_id},
            'Booking Request Submitted (ACID Locked)',
            ${`Booking for ${venue.venue_name} on ${eventDate.toISOString().split('T')[0]} (${startTimeStr}-${endTimeStr}) registered via row-locked transaction.`},
            'BOOKING_TRANSACTION_ACID', false, NOW()
          )
        `

        // Step 5: ACID Atomicity - Insert audit log record via SQL
        const auditDetails = JSON.stringify({
          venueId: venue.venue_id,
          venueName: venue.venue_name,
          clientRequestId,
          isolationLevel: 'READ_COMMITTED_FOR_UPDATE',
          slot: `${startTimeStr}-${endTimeStr}`,
        })

        await tx.$executeRaw`
          INSERT INTO audit_logs (
            log_id, user_id, action, entity_type, entity_id, details, created_at
          )
          VALUES (
            gen_random_uuid()::text, ${user.user_id}, 'BOOKING_CREATED_TRANSACTIONAL', 'BOOKING',
            ${newBooking.booking_id}, ${auditDetails}, NOW()
          )
        `

        return {
          booking: newBooking,
          venueName: venue.venue_name,
          requesterName: user.name,
        }
      },
      {
        maxWait: 15000,
        timeout: 25000,
      }
    )

    return NextResponse.json({
      success: true,
      isolation: 'PostgreSQL Row-Level Lock (SELECT ... FOR UPDATE)',
      booking: {
        id: result.booking.booking_id,
        purpose: result.booking.event_name,
        venueName: result.venueName,
        requester: result.requesterName,
        date: new Date(result.booking.event_date).toISOString().split('T')[0],
        startTime: result.booking.start_time,
        endTime: result.booking.end_time,
        status: result.booking.status,
      },
      committedAt: new Date().toISOString(),
    }, { status: 201 })
  } catch (error: any) {
    if (error.code === 'CONFLICT' || error.message?.startsWith('SLOT_CONFLICT')) {
      return NextResponse.json(
        {
          error: 'Concurrency Conflict: Another transaction has reserved or locked this slot.',
          details: error.message,
          conflictId: error.conflictId,
        },
        { status: 409 }
      )
    }

    console.error('Transactional SQL booking error:', error)
    return NextResponse.json(
      { error: error.message || 'Transaction aborted.' },
      { status: 500 }
    )
  }
}
