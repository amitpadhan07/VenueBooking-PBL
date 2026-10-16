import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/bookings/availability?venueId=...&date=...
 * Pure SQL query determining reserved slots and computing open intervals.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const venueId = searchParams.get('venueId')
    const dateParam = searchParams.get('date')

    if (!venueId) {
      return NextResponse.json({ error: 'venueId query parameter is required.' }, { status: 400 })
    }

    // 1. Fetch venue details via raw SQL
    const venues = await prisma.$queryRaw<Array<{ venue_id: string; venue_name: string; capacity: number; location: string; venue_type: string; status: string }>>`
      SELECT venue_id, venue_name, capacity, location, venue_type, status 
      FROM venues 
      WHERE venue_id = ${venueId}
      LIMIT 1
    `
    const venue = venues[0]

    if (!venue) {
      return NextResponse.json({ error: 'Venue not found.' }, { status: 404 })
    }

    const targetDate = dateParam ? new Date(dateParam) : new Date()
    const eventDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate())
    const dateStr = eventDate.toISOString().split('T')[0]

    // 2. Fetch all conflicting active reservations via raw SQL with INNER JOIN
    const activeBookings = await prisma.$queryRaw<Array<{ booking_id: string; event_name: string; start_time: string; end_time: string; status: string; requester: string; department: string }>>`
      SELECT 
        b.booking_id, b.event_name, b.start_time, b.end_time, b.status, 
        u.name AS requester, u.department
      FROM bookings b
      JOIN users u ON b.user_id = u.user_id
      WHERE b.venue_id = ${venueId}
        AND b.event_date = ${eventDate}::date
        AND b.status IN ('PENDING', 'APPROVED')
      ORDER BY b.start_time ASC
    `

    // Compute free windows between 08:00 and 20:00 (Campus Operational Hours)
    const operationalStart = '08:00'
    const operationalEnd = '20:00'

    const reservedSlots = activeBookings.map((b) => ({
      bookingId: b.booking_id,
      purpose: b.event_name,
      requester: b.requester,
      department: b.department,
      startTime: b.start_time,
      endTime: b.end_time,
      status: b.status,
    }))

    // Calculate open windows
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
    console.error('Error in SQL GET /api/bookings/availability:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to determine venue availability.' },
      { status: 500 }
    )
  }
}
