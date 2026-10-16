import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { BookingStatus, Role, Prisma } from '@prisma/client'
import { getAuthUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/bookings
 * Retrieves all bookings with optional filtering by venueId, status, userId, or date.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const venueId = searchParams.get('venueId')
    const statusParam = searchParams.get('status')
    const userId = searchParams.get('userId')
    const dateParam = searchParams.get('date')
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    const where: Prisma.BookingWhereInput = {}

    if (venueId) where.venue_id = venueId
    if (statusParam && Object.values(BookingStatus).includes(statusParam as BookingStatus)) {
      where.status = statusParam as BookingStatus
    }
    if (userId) where.user_id = userId
    if (dateParam) {
      const parsedDate = new Date(dateParam)
      const eventDate = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate())
      where.event_date = eventDate
    }

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: Math.min(limit, 100),
      include: {
        venue: {
          select: {
            venue_id: true,
            venue_name: true,
            capacity: true,
            location: true,
            status: true,
          },
        },
        user: {
          select: {
            user_id: true,
            name: true,
            email: true,
            department: true,
            role: true,
          },
        },
        approvals: {
          include: {
            employee: {
              select: {
                employee_code: true,
                designation: true,
                user: { select: { name: true } },
              },
            },
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      count: bookings.length,
      bookings: bookings.map((b) => ({
        id: b.booking_id,
        booking_id: b.booking_id,
        purpose: b.event_name,
        eventName: b.event_name,
        description: b.event_description,
        venueId: b.venue_id,
        venueName: b.venue.venue_name,
        venueLocation: b.venue.location,
        requesterId: b.user_id,
        requesterName: b.user.name,
        department: b.user.department,
        date: b.event_date.toISOString().split('T')[0],
        startTime: b.start_time,
        endTime: b.end_time,
        attendees: b.expected_attendees,
        status: b.status,
        approvals: b.approvals,
        createdAt: b.created_at.toISOString(),
      })),
    })
  } catch (error: any) {
    console.error('Error in GET /api/bookings:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch bookings.' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/bookings
 * Submits a new booking with comprehensive DBMS validation rules.
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

    // 1. Verify venue existence and ACTIVE status
    const venue = await prisma.venue.findUnique({
      where: { venue_id: venueId },
    })

    if (!venue) {
      return NextResponse.json({ error: 'Selected venue not found.' }, { status: 404 })
    }

    if (venue.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: `Venue is currently ${venue.status.toLowerCase()} and cannot be reserved.` },
        { status: 400 }
      )
    }

    // 2. Resolve requester user
    let user = null
    if (authUser?.userId) {
      user = await prisma.user.findUnique({ where: { user_id: authUser.userId } })
    }

    if (!user) {
      let prismaRole: Role = Role.STUDENT
      if (roleHeader.toLowerCase() === 'admin') prismaRole = Role.ADMIN
      else if (roleHeader.toLowerCase() === 'employee') prismaRole = Role.EMPLOYEE

      user = await prisma.user.findFirst({ where: { role: prismaRole } })
      if (!user) user = await prisma.user.findFirst()
    }

    if (!user) {
      return NextResponse.json(
        { error: 'No user account found to associate with this booking.' },
        { status: 400 }
      )
    }

    // 3. Date & Time Validation Rules
    const startDate = new Date(startAt)
    const endDate = new Date(endAt)

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({ error: 'Invalid startAt or endAt date timestamp.' }, { status: 400 })
    }

    const eventDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
    const startTimeStr = startDate.toTimeString().slice(0, 5) // "14:00"
    const endTimeStr = endDate.toTimeString().slice(0, 5)     // "16:00"

    // Rule: start_time < end_time
    if (startTimeStr >= endTimeStr) {
      return NextResponse.json(
        { error: 'Validation Error: start_time must be strictly before end_time.' },
        { status: 400 }
      )
    }

    // Rule: event_date >= CURRENT_DATE
    const today = new Date()
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    if (eventDate < todayDate) {
      return NextResponse.json(
        { error: 'Validation Error: Cannot schedule a booking for a past date.' },
        { status: 400 }
      )
    }

    // 4. Attendee Capacity Validation Rules
    const attendees = typeof expectedAttendees === 'number' ? expectedAttendees : 50
    if (attendees <= 0) {
      return NextResponse.json(
        { error: 'Validation Error: expected_attendees must be greater than 0.' },
        { status: 400 }
      )
    }

    if (attendees > venue.capacity) {
      return NextResponse.json(
        {
          error: `Capacity Exceeded: Expected attendees (${attendees}) exceeds venue capacity (${venue.capacity} seats).`,
        },
        { status: 400 }
      )
    }

    // 5. Overlap Conflict Detection Query
    // (S_exist < E_req) AND (E_exist > S_req) for active statuses
    const existingConflict = await prisma.booking.findFirst({
      where: {
        venue_id: venue.venue_id,
        event_date: eventDate,
        status: { in: [BookingStatus.PENDING, BookingStatus.APPROVED] },
        AND: [
          { start_time: { lt: endTimeStr } },
          { end_time: { gt: startTimeStr } },
        ],
      },
    })

    if (existingConflict) {
      return NextResponse.json(
        {
          error: `Time Slot Conflict: This venue already has an active reservation from ${existingConflict.start_time} to ${existingConflict.end_time}.`,
          conflictId: existingConflict.booking_id,
        },
        { status: 409 }
      )
    }

    // 6. Create booking
    const booking = await prisma.booking.create({
      data: {
        user_id: user.user_id,
        venue_id: venue.venue_id,
        event_name: purpose,
        event_description: description || null,
        event_date: eventDate,
        start_time: startTimeStr,
        end_time: endTimeStr,
        expected_attendees: attendees,
        status: BookingStatus.PENDING,
      },
      include: {
        venue: { select: { venue_name: true, capacity: true } },
        user: { select: { name: true, email: true, department: true } },
      },
    })

    // 7. Dispatch in-app notification
    await prisma.notification.create({
      data: {
        user_id: user.user_id,
        booking_id: booking.booking_id,
        title: 'Booking Request Submitted',
        message: `Booking for ${venue.venue_name} on ${eventDate.toISOString().split('T')[0]} (${startTimeStr}-${endTimeStr}) has been recorded and is pending authority approval.`,
        notification_type: 'BOOKING_SUBMITTED',
      },
    })

    // 8. Write Audit Log
    await prisma.auditLog.create({
      data: {
        user_id: user.user_id,
        action: 'BOOKING_CREATED',
        entity_type: 'BOOKING',
        entity_id: booking.booking_id,
        details: JSON.stringify({
          venueId: venue.venue_id,
          venueName: venue.venue_name,
          slot: `${startTimeStr}-${endTimeStr}`,
          attendees,
        }),
      },
    })

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.booking_id,
        _id: booking.booking_id,
        purpose: booking.event_name,
        venueName: booking.venue.venue_name,
        requesterName: booking.user.name,
        date: booking.event_date.toISOString().split('T')[0],
        startTime: booking.start_time,
        endTime: booking.end_time,
        status: booking.status,
      },
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error in POST /api/bookings:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to create booking' },
      { status: 500 }
    )
  }
}
