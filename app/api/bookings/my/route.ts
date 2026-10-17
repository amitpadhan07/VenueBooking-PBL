import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { Role } from '@prisma/client'

export const dynamic = 'force-dynamic'

/**
 * GET /api/bookings/my
 * Pure SQL query retrieving student/faculty personal bookings and statistical metrics.
 */
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    const roleHeader = request.headers.get('x-demo-role') || 'Student'

    let targetUserId = authUser?.userId

    if (!targetUserId) {
      let prismaRole: Role = Role.STUDENT
      if (roleHeader.toLowerCase() === 'admin') prismaRole = Role.ADMIN
      else if (roleHeader.toLowerCase() === 'employee') prismaRole = Role.EMPLOYEE

      const users = await prisma.$queryRaw<Array<{ user_id: string }>>`
        SELECT user_id FROM users WHERE role = ${prismaRole}::"Role" ORDER BY created_at ASC LIMIT 1
      `
      targetUserId = users[0]?.user_id
    }

    if (!targetUserId) {
      return NextResponse.json({ error: 'Not authenticated. Please log in.' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const filterStatus = searchParams.get('status')

    // 1. Fetch personal bookings via raw SQL with INNER JOIN
    let query = `
      SELECT 
        b.booking_id, b.event_name, b.event_description, b.event_date::text, 
        b.start_time, b.end_time, b.expected_attendees, b.status, b.created_at::text,
        v.venue_id, v.venue_name, v.location, v.capacity, v.venue_type
      FROM bookings b
      JOIN venues v ON b.venue_id = v.venue_id
      WHERE b.user_id = $1
    `
    const params: any[] = [targetUserId]

    if (filterStatus && filterStatus !== 'all') {
      params.push(filterStatus.toUpperCase())
      query += ` AND b.status = $${params.length}::"BookingStatus"`
    }

    query += ` ORDER BY b.created_at DESC;`

    const bookings: any[] = await prisma.$queryRawUnsafe(query, ...params)

    // 2. Compute aggregate booking counts via SQL aggregation
    const metricRows = await prisma.$queryRaw<Array<{ total: number; pending: number; approved: number; rejected: number; cancelled: number }>>`
      SELECT 
        COUNT(*)::int AS total,
        COUNT(CASE WHEN status = 'PENDING' THEN 1 END)::int AS pending,
        COUNT(CASE WHEN status = 'APPROVED' THEN 1 END)::int AS approved,
        COUNT(CASE WHEN status = 'REJECTED' THEN 1 END)::int AS rejected,
        COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END)::int AS cancelled
      FROM bookings
      WHERE user_id = ${targetUserId}
    `
    const metrics = metricRows[0] || { total: 0, pending: 0, approved: 0, rejected: 0, cancelled: 0 }

    return NextResponse.json({
      success: true,
      metrics,
      bookings: bookings.map((b) => ({
        id: b.booking_id,
        booking_id: b.booking_id,
        purpose: b.event_name,
        eventName: b.event_name,
        event_name: b.event_name,
        description: b.event_description,
        event_description: b.event_description,
        venueId: b.venue_id,
        venue_id: b.venue_id,
        venueName: b.venue_name,
        venue_name: b.venue_name,
        venueLocation: b.location,
        location: b.location,
        capacity: b.capacity,
        venueCapacity: b.capacity,
        date: b.event_date,
        event_date: b.event_date,
        startTime: b.start_time,
        start_time: b.start_time,
        endTime: b.end_time,
        end_time: b.end_time,
        attendees: b.expected_attendees,
        expected_attendees: b.expected_attendees,
        status: b.status,
        createdAt: b.created_at,
        created_at: b.created_at,
      })),
    })
  } catch (error: any) {
    console.error('Error in SQL GET /api/bookings/my:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch personal bookings.' },
      { status: 500 }
    )
  }
}
