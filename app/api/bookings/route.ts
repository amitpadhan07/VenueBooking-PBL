import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { Role } from '@prisma/client'
import { getAuthUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/bookings
 * Samridhi Thapa & Lavanya Joshi - Relational Booking Retrieval API
 * Pure SQL query retrieving bookings with composite B-Tree index lookup and multi-table JOINs.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const venueId = searchParams.get('venueId')
    const statusParam = searchParams.get('status')
    const userId = searchParams.get('userId')
    const dateParam = searchParams.get('date')
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    // Construct raw SQL query with multi-table INNER JOIN
    let query = `
      SELECT 
        b.booking_id, b.event_name, b.event_description, b.event_date::text, 
        b.start_time, b.end_time, b.expected_attendees, b.status, b.created_at::text,
        v.venue_id, v.venue_name, v.capacity, v.location, v.status AS venue_status,
        u.user_id, u.name AS requester_name, u.email AS requester_email, u.department, u.role
      FROM bookings b
      JOIN venues v ON b.venue_id = v.venue_id
      JOIN users u ON b.user_id = u.user_id
      WHERE 1=1
    `
    const params: any[] = []

    if (venueId) {
      params.push(venueId)
      query += ` AND b.venue_id = $${params.length}`
    }
    if (statusParam) {
      params.push(statusParam.toUpperCase())
      query += ` AND b.status = $${params.length}::"BookingStatus"`
    }
    if (userId) {
      params.push(userId)
      query += ` AND b.user_id = $${params.length}`
    }
    if (dateParam) {
      params.push(dateParam)
      query += ` AND b.event_date = $${params.length}::date`
    }

    params.push(Math.min(limit, 100))
    query += ` ORDER BY b.created_at DESC LIMIT $${params.length};`

    const bookings: any[] = await prisma.$queryRawUnsafe(query, ...params)

    return NextResponse.json({
      success: true,
      count: bookings.length,
      bookings: bookings.map((b) => ({
        id: b.booking_id,
        _id: b.booking_id,
        booking_id: b.booking_id,
        purpose: b.event_name,
        eventName: b.event_name,
        description: b.event_description,
        venueId: b.venue_id,
        venueName: b.venue_name,
        location: b.location,
        venueLocation: b.location,
        venueCapacity: b.capacity,
        requesterId: b.user_id,
        requesterName: b.requester_name,
        department: b.department,
        date: typeof b.event_date === 'string' ? b.event_date.split('T')[0] : b.event_date,
        startTime: b.start_time,
        endTime: b.end_time,
        attendees: b.expected_attendees,
        status: b.status,
        createdAt: b.created_at,
      })),
    })
  } catch (error: any) {
    console.error('Error in SQL GET /api/bookings:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch bookings.' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/bookings
 * Samridhi Thapa & Lavanya Joshi - Core Booking Submission & Interval Overlap Engine
 *
 * Implements:
 * 1. Domain Constraints (expected_attendees > 0)
 * 2. Venue Capacity Rules (expected_attendees <= venue.capacity)
 * 3. Temporal Constraints (start_time < end_time, event_date >= CURRENT_DATE)
 * 4. Mathematical Interval Overlap:
 *    Conflict <=> (S_exist < E_req) AND (E_exist > S_req)
 * 5. Pure SQL Execution ($queryRaw & $executeRaw)
 */
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    const roleHeader = request.headers.get('x-demo-role') || 'Student'
    const body = await request.json()
    const { venueId, purpose, description, startAt, endAt, expectedAttendees } = body

    if (!venueId || !purpose || !startAt || !endAt) {
      return NextResponse.json(
        { error: 'All mandatory fields (venueId, purpose, startAt, endAt) are required.' },
        { status: 400 }
      )
    }

    // 1. Verify venue existence and ACTIVE status using SQL
    const venues = await prisma.$queryRaw<Array<{ venue_id: string; venue_name: string; capacity: number; status: string }>>`
      SELECT venue_id, venue_name, capacity, status FROM venues WHERE venue_id = ${venueId} LIMIT 1
    `
    const venue = venues[0]

    if (!venue) {
      return NextResponse.json({ error: 'Selected venue does not exist in the database.' }, { status: 404 })
    }

    if (venue.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: `Venue '${venue.venue_name}' is currently ${venue.status.toLowerCase()} and cannot be reserved.` },
        { status: 400 }
      )
    }

    // 2. Resolve requester user using SQL
    let user = null
    if (authUser?.userId) {
      const users = await prisma.$queryRaw<Array<{ user_id: string; name: string; email: string; department: string }>>`
        SELECT user_id, name, email, department FROM users WHERE user_id = ${authUser.userId} LIMIT 1
      `
      user = users[0]
    }

    if (!user) {
      let prismaRole: Role = Role.STUDENT
      if (roleHeader.toLowerCase() === 'admin') prismaRole = Role.ADMIN
      else if (roleHeader.toLowerCase() === 'employee') prismaRole = Role.EMPLOYEE

      const users = await prisma.$queryRaw<Array<{ user_id: string; name: string; email: string; department: string }>>`
        SELECT user_id, name, email, department FROM users WHERE role = ${prismaRole}::"Role" LIMIT 1
      `
      user = users[0]
      if (!user) {
        const fallbackUsers = await prisma.$queryRaw<Array<{ user_id: string; name: string; email: string; department: string }>>`
          SELECT user_id, name, email, department FROM users LIMIT 1
        `
        user = fallbackUsers[0]
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: 'No authorized user account found to associate with this booking.' },
        { status: 400 }
      )
    }

    // 3. Date & Time Validation Rules
    const startDate = new Date(startAt)
    const endDate = new Date(endAt)

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({ error: 'Invalid startAt or endAt timestamp format.' }, { status: 400 })
    }

    const eventDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
    const startTimeStr = startDate.toTimeString().slice(0, 5) // "HH:MM"
    const endTimeStr = endDate.toTimeString().slice(0, 5)     // "HH:MM"

    // Rule: start_time < end_time
    if (startDate >= endDate || startTimeStr >= endTimeStr) {
      return NextResponse.json(
        { error: 'Temporal Constraint Violation: Start time must precede end time.' },
        { status: 400 }
      )
    }

    // Rule: event_date >= CURRENT_DATE
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (eventDate < today) {
      return NextResponse.json(
        { error: 'Temporal Constraint Violation: Cannot schedule venue bookings for past dates.' },
        { status: 400 }
      )
    }

    // 4. Attendee Capacity Validation Rules
    const attendeesNum = Number(expectedAttendees) || 50
    if (attendeesNum <= 0) {
      return NextResponse.json(
        { error: 'Domain Constraint Violation: Expected attendees must be greater than 0.' },
        { status: 400 }
      )
    }

    if (attendeesNum > venue.capacity) {
      return NextResponse.json(
        {
          error: `Capacity Rule Violation: Expected attendees (${attendeesNum}) exceeds the venue's maximum capacity (${venue.capacity} seats).`,
        },
        { status: 400 }
      )
    }

    // 5. Overlap Conflict Detection Query in SQL: (S_exist < E_req) AND (E_exist > S_req)
    const conflicts = await prisma.$queryRaw<Array<{ booking_id: string; event_name: string; start_time: string; end_time: string }>>`
      SELECT booking_id, event_name, start_time, end_time 
      FROM bookings 
      WHERE venue_id = ${venue.venue_id}
        AND event_date = ${eventDate}::date
        AND status IN ('PENDING'::"BookingStatus", 'APPROVED'::"BookingStatus")
        AND start_time < ${endTimeStr}
        AND end_time > ${startTimeStr}
      LIMIT 1
    `

    if (conflicts.length > 0) {
      const conflict = conflicts[0]
      return NextResponse.json(
        {
          error: `Conflict: Venue '${venue.venue_name}' is already reserved for '${conflict.event_name}' between ${conflict.start_time} and ${conflict.end_time} on ${eventDate.toISOString().split('T')[0]}.`,
          conflictId: conflict.booking_id,
        },
        { status: 409 }
      )
    }

    // 6. Insert booking using Pure SQL
    const inserted = await prisma.$queryRaw<Array<{ booking_id: string; event_name: string; event_date: Date; start_time: string; end_time: string; status: string }>>`
      INSERT INTO bookings (
        booking_id, user_id, venue_id, event_name, event_description, 
        event_date, start_time, end_time, expected_attendees, status, created_at, updated_at
      )
      VALUES (
        gen_random_uuid()::text, ${user.user_id}, ${venue.venue_id}, ${purpose}, ${description || null},
        ${eventDate}::date, ${startTimeStr}, ${endTimeStr}, ${attendeesNum}, 'PENDING'::"BookingStatus", NOW(), NOW()
      )
      RETURNING booking_id, event_name, event_date, start_time, end_time, status
    `
    const booking = inserted[0]

    // 7. Dispatch in-app transactional notification using SQL
    await prisma.$executeRaw`
      INSERT INTO notifications (
        notification_id, user_id, booking_id, title, message, notification_type, is_read, created_at
      )
      VALUES (
        gen_random_uuid()::text, ${user.user_id}, ${booking.booking_id},
        'Booking Request Submitted',
        ${`Booking for ${venue.venue_name} on ${eventDate.toISOString().split('T')[0]} (${startTimeStr}-${endTimeStr}) is pending employee approval.`},
        'BOOKING_SUBMITTED', false, NOW()
      )
    `

    // 8. Write Audit Log using SQL
    const auditJson = JSON.stringify({
      venueId: venue.venue_id,
      venueName: venue.venue_name,
      slot: `${startTimeStr}-${endTimeStr}`,
      attendees: attendeesNum,
    })

    await prisma.$executeRaw`
      INSERT INTO audit_logs (
        log_id, user_id, action, entity_type, entity_id, details, created_at
      )
      VALUES (
        gen_random_uuid()::text, ${user.user_id}, 'BOOKING_CREATED', 'BOOKING',
        ${booking.booking_id}, ${auditJson}, NOW()
      )
    `

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.booking_id,
        _id: booking.booking_id,
        purpose: booking.event_name,
        venueName: venue.venue_name,
        requesterName: user.name,
        date: eventDate.toISOString().split('T')[0],
        startTime: startTimeStr,
        endTime: endTimeStr,
        attendees: attendeesNum,
        status: booking.status,
      },
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error in SQL POST /api/bookings:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to create booking' },
      { status: 500 }
    )
  }
}
