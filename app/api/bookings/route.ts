import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { BookingStatus, Role } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const roleHeader = request.headers.get('x-demo-role') || 'Student'
    const body = await request.json()
    const { venueId, purpose, startAt, endAt } = body

    if (!venueId || !purpose || !startAt || !endAt) {
      return NextResponse.json(
        { error: 'All fields (venue, purpose, start time, end time) are required.' },
        { status: 400 }
      )
    }

    // Verify venue exists
    const venue = await prisma.venue.findUnique({
      where: { venue_id: venueId },
    })

    if (!venue) {
      return NextResponse.json(
        { error: 'Selected venue not found.' },
        { status: 404 }
      )
    }

    // Determine requester based on role
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
        { error: 'No user account found to associate with this booking.' },
        { status: 400 }
      )
    }

    const startDate = new Date(startAt)
    const endDate = new Date(endAt)

    const eventDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
    const startTimeStr = startDate.toTimeString().slice(0, 5) // "14:00"
    const endTimeStr = endDate.toTimeString().slice(0, 5)     // "16:00"

    // Check for overlap conflicts on the same venue and date
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
        { error: `Conflict: This venue already has a booking between ${existingConflict.start_time} and ${existingConflict.end_time}.` },
        { status: 409 }
      )
    }

    // Create booking
    const booking = await prisma.booking.create({
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
        user: { select: { name: true } },
      },
    })

    // Create in-app notification
    await prisma.notification.create({
      data: {
        user_id: user.user_id,
        booking_id: booking.booking_id,
        title: 'Booking Request Submitted',
        message: `Booking for ${venue.venue_name} on ${eventDate.toISOString().split('T')[0]} (${startTimeStr}-${endTimeStr}) is pending approval.`,
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
