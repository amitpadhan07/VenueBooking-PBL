import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { BookingStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'

/**
 * GET /api/bookings/availability?venueId=...&date=...
 * Returns reserved slots and computed available intervals for a venue on a given date.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const venueId = searchParams.get('venueId')
    const dateParam = searchParams.get('date')

    if (!venueId) {
      return NextResponse.json({ error: 'venueId query parameter is required.' }, { status: 400 })
    }

    const venue = await prisma.venue.findUnique({
      where: { venue_id: venueId },
      select: {
        venue_id: true,
        venue_name: true,
        capacity: true,
        location: true,
        venue_type: true,
        status: true,
      },
    })

    if (!venue) {
      return NextResponse.json({ error: 'Venue not found.' }, { status: 404 })
    }

    const targetDate = dateParam ? new Date(dateParam) : new Date()
    const eventDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate())
    const dateStr = eventDate.toISOString().split('T')[0]

    // Fetch all active bookings on this date for the venue
    const activeBookings = await prisma.booking.findMany({
      where: {
        venue_id: venueId,
        event_date: eventDate,
        status: { in: [BookingStatus.PENDING, BookingStatus.APPROVED] },
      },
      orderBy: { start_time: 'asc' },
      select: {
        booking_id: true,
        event_name: true,
        start_time: true,
        end_time: true,
        status: true,
        user: { select: { name: true, department: true } },
      },
    })

    // Compute free windows between 08:00 and 20:00 (Campus Operational Hours)
    const operationalStart = '08:00'
    const operationalEnd = '20:00'

    const reservedSlots = activeBookings.map((b) => ({
      bookingId: b.booking_id,
      purpose: b.event_name,
      requester: b.user.name,
      startTime: b.start_time,
      endTime: b.end_time,
      status: b.status,
    }))

    // Calculate free intervals
    const availableWindows: Array<{ start: string; end: string }> = []
    let currentPointer = operationalStart

    for (const slot of reservedSlots) {
      if (slot.startTime > currentPointer) {
        availableWindows.push({ start: currentPointer, end: slot.startTime })
      }
      if (slot.endTime > currentPointer) {
        currentPointer = slot.endTime
      }
    }

    if (currentPointer < operationalEnd) {
      availableWindows.push({ start: currentPointer, end: operationalEnd })
    }

    return NextResponse.json({
      success: true,
      venue,
      date: dateStr,
      operationalHours: { start: operationalStart, end: operationalEnd },
      reservedSlots,
      availableWindows,
      isFullyBooked: availableWindows.length === 0,
    })
  } catch (error: any) {
    console.error('Error in GET /api/bookings/availability:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to determine venue availability.' },
      { status: 500 }
    )
  }
}
