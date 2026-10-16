import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { BookingStatus, Role, Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

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

    // Determine user to associate before opening the transaction
    let prismaRole: Role = Role.STUDENT
    if (roleHeader.toLowerCase() === 'admin') prismaRole = Role.ADMIN
    else if (roleHeader.toLowerCase() === 'employee') prismaRole = Role.EMPLOYEE

    let user = await prisma.user.findFirst({ where: { role: prismaRole } })
    if (!user) user = await prisma.user.findFirst()
    if (!user) {
      return NextResponse.json({ error: 'No user account found.' }, { status: 400 })
    }

    // Execute within a strict PostgreSQL ACID transaction with Row-Level Locking
    // Timeout set to 25s to accommodate remote SSL database latency
    const result = await prisma.$transaction(
      async (tx) => {
        // Step 1: Acquire Pessimistic Row Lock on the venue row
        // This forces concurrent booking requests on the same venue to serialize
        const lockedVenues: Array<{ venue_id: string; venue_name: string; capacity: number; status: string }> =
          await tx.$queryRaw`SELECT venue_id, venue_name, capacity, status FROM venues WHERE venue_id = ${venueId} FOR UPDATE`

        if (!lockedVenues.length) {
          throw new Error('VENUE_NOT_FOUND')
        }

        const venue = lockedVenues[0]
        if (venue.status !== 'ACTIVE') {
          throw new Error('VENUE_INACTIVE')
        }

        // Step 2: Critical Section - Check for overlapping bookings
        const conflicts = await tx.booking.findMany({
          where: {
            venue_id: venueId,
            event_date: eventDate,
            status: { in: [BookingStatus.PENDING, BookingStatus.APPROVED] },
            AND: [
              { start_time: { lt: endTimeStr } },
              { end_time: { gt: startTimeStr } },
            ],
          },
        })

        if (conflicts.length > 0) {
          const conflict = conflicts[0]
          const err = new Error(`SLOT_CONFLICT: Collides with booking (${conflict.start_time} - ${conflict.end_time})`)
          ;(err as any).code = 'CONFLICT'
          ;(err as any).conflictId = conflict.booking_id
          throw err
        }

        // Step 3: Insert booking
        const newBooking = await tx.booking.create({
          data: {
            user_id: user.user_id,
            venue_id: venue.venue_id,
            event_name: purpose,
            event_date: eventDate,
            start_time: startTimeStr,
            end_time: endTimeStr,
            expected_attendees: 50,
            status: BookingStatus.PENDING,
          },
          include: {
            venue: { select: { venue_name: true } },
            user: { select: { name: true, email: true } },
          },
        })

        // Step 4: ACID Atomicity - Create notification
        const notification = await tx.notification.create({
          data: {
            user_id: user.user_id,
            booking_id: newBooking.booking_id,
            title: 'Booking Request Submitted (ACID Locked)',
            message: `Booking for ${venue.venue_name} on ${eventDate.toISOString().split('T')[0]} (${startTimeStr}-${endTimeStr}) registered via row-locked transaction.`,
            notification_type: 'BOOKING_TRANSACTION_ACID',
          },
        })

        // Step 5: ACID Atomicity - Create audit log
        await tx.auditLog.create({
          data: {
            user_id: user.user_id,
            action: 'BOOKING_CREATED_TRANSACTIONAL',
            entity_type: 'BOOKING',
            entity_id: newBooking.booking_id,
            details: JSON.stringify({
              venueId: venue.venue_id,
              venueName: venue.venue_name,
              clientRequestId,
              isolationLevel: 'READ_COMMITTED_FOR_UPDATE',
              slot: `${startTimeStr}-${endTimeStr}`,
            }),
          },
        })

        return {
          booking: newBooking,
          notification,
          venueName: venue.venue_name,
        }
      },
      {
        maxWait: 15000,
        timeout: 25000,
      }
    )

    return NextResponse.json({
      success: true,
      isolation: 'PostgreSQL Row-Level Lock (FOR UPDATE)',
      booking: {
        id: result.booking.booking_id,
        purpose: result.booking.event_name,
        venueName: result.venueName,
        requester: result.booking.user.name,
        date: result.booking.event_date.toISOString().split('T')[0],
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

    console.error('Transactional booking error:', error)
    return NextResponse.json(
      { error: error.message || 'Transaction aborted.' },
      { status: 500 }
    )
  }
}
