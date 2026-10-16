import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { BookingStatus, Role } from '@prisma/client'

/**
 * GET /api/bookings
 * Samridhi Thapa - Booking Retrieval API
 * Supports filtering by venueId, status, and eventDate with composite B-Tree index lookup.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const venueId = searchParams.get('venueId')
    const status = searchParams.get('status') as BookingStatus | null
    const date = searchParams.get('date')

    const where: any = {}
    if (venueId) where.venue_id = venueId
    if (status && Object.values(BookingStatus).includes(status)) where.status = status
    if (date) {
      const parsedDate = new Date(date)
      if (!isNaN(parsedDate.getTime())) {
        where.event_date = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate())
      }
    }

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: [{ event_date: 'desc' }, { start_time: 'asc' }],
      include: {
        venue: { select: { venue_name: true, location: true, capacity: true } },
        user: { select: { name: true, email: true, department: true } },
      },
    })

    return NextResponse.json({
      success: true,
      count: bookings.length,
      bookings: bookings.map((b) => ({
        id: b.booking_id,
        _id: b.booking_id,
        purpose: b.event_name,
        description: b.event_description,
        venueId: b.venue_id,
        venueName: b.venue.venue_name,
        location: b.venue.location,
        venueCapacity: b.venue.capacity,
        requesterId: b.user_id,
        requesterName: b.user.name,
        department: b.user.department,
        date: b.event_date.toISOString().split('T')[0],
        startTime: b.start_time,
        endTime: b.end_time,
        attendees: b.expected_attendees,
        status: b.status,
        createdAt: b.created_at,
      })),
    })
  } catch (error: any) {
    console.error('Error in GET /api/bookings:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch bookings' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/bookings
 * Samridhi Thapa - Core Booking Submission & Interval Overlap Engine
 *
 * Implements:
 * 1. Domain Constraints (expected_attendees > 0)
 * 2. Venue Capacity Rules (expected_attendees <= venue.capacity)
 * 3. Temporal Constraints (start_time < end_time, event_date >= CURRENT_DATE)
 * 4. Mathematical Interval Overlap:
 *    Conflict <=> (S_exist < E_req) AND (E_exist > S_req)
 */
export async function POST(request: NextRequest) {
  try {
    const roleHeader = request.headers.get('x-demo-role') || 'Student'
    const body = await request.json()
    const { venueId, purpose, startAt, endAt, expectedAttendees } = body

    if (!venueId || !purpose || !startAt || !endAt) {
      return NextResponse.json(
        { error: 'All fields (venue, purpose, start time, end time) are required.' },
        { status: 400 }
      )
    }

    // Verify venue existence and active status
    const venue = await prisma.venue.findUnique({
      where: { venue_id: venueId },
    })

    if (!venue) {
      return NextResponse.json(
        { error: 'Selected venue does not exist in the database.' },
        { status: 404 }
      )
    }

    if (venue.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: `Venue '${venue.venue_name}' is currently ${venue.status.toLowerCase()} and cannot be reserved.` },
        { status: 400 }
      )
    }

    // Domain & Capacity Constraint Verification
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

    // Temporal Validation
    const startDate = new Date(startAt)
    const endDate = new Date(endAt)

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date/time format provided.' },
        { status: 400 }
      )
    }

    if (startDate >= endDate) {
      return NextResponse.json(
        { error: 'Temporal Constraint Violation: Start time must precede end time.' },
        { status: 400 }
      )
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const eventDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())

    if (eventDate < today) {
      return NextResponse.json(
        { error: 'Temporal Constraint Violation: Cannot schedule venue bookings for past dates.' },
        { status: 400 }
      )
    }

    const startTimeStr = startDate.toTimeString().slice(0, 5) // "HH:MM"
    const endTimeStr = endDate.toTimeString().slice(0, 5)     // "HH:MM"

    // Determine requester identity based on active demo role or token
    let prismaRole: Role = Role.STUDENT
    if (roleHeader.toLowerCase() === 'admin') prismaRole = Role.ADMIN
    else if (roleHeader.toLowerCase() === 'employee') prismaRole = Role.EMPLOYEE

    let user = await prisma.user.findFirst({
      where: { role: prismaRole },
    })

    if (!user) {
      user = await prisma.user.findFirst()
    }

    if (!user) {
      return NextResponse.json(
        { error: 'No authorized user account found to associate with this booking.' },
        { status: 400 }
      )
    }

    // Universal Mathematical Interval Overlap Engine:
    // Conflict <=> (S_exist < E_req) AND (E_exist > S_req)
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
          error: `Conflict: Venue '${venue.venue_name}' is already reserved for '${existingConflict.event_name}' between ${existingConflict.start_time} and ${existingConflict.end_time} on ${eventDate.toISOString().split('T')[0]}.`,
        },
        { status: 409 }
      )
    }

    // Insert new booking record in PENDING state
    const booking = await prisma.booking.create({
      data: {
        user_id: user.user_id,
        venue_id: venue.venue_id,
        event_name: purpose,
        event_date: eventDate,
        start_time: startTimeStr,
        end_time: endTimeStr,
        expected_attendees: attendeesNum,
        status: BookingStatus.PENDING,
      },
      include: {
        venue: { select: { venue_name: true } },
        user: { select: { name: true } },
      },
    })

    // Dispatch in-app transactional notification
    await prisma.notification.create({
      data: {
        user_id: user.user_id,
        booking_id: booking.booking_id,
        title: 'Booking Request Submitted',
        message: `Booking for ${venue.venue_name} on ${eventDate.toISOString().split('T')[0]} (${startTimeStr}-${endTimeStr}) is pending employee approval.`,
        notification_type: 'BOOKING_SUBMITTED',
      },
    })

    return NextResponse.json({
      success: true,
      booking: {
        _id: booking.booking_id,
        id: booking.booking_id,
        purpose: booking.event_name,
        venueName: booking.venue.venue_name,
        requesterName: booking.user.name,
        status: booking.status,
        date: eventDate.toISOString().split('T')[0],
        startTime: startTimeStr,
        endTime: endTimeStr,
        attendees: attendeesNum,
      },
    })
  } catch (error: any) {
    console.error('Error in POST /api/bookings:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to create booking' },
      { status: 500 }
    )
  }
}
