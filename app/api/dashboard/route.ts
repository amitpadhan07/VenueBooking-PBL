import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { Role as PrismaRole } from '@prisma/client'

export const dynamic = 'force-dynamic'

/**
 * GET /api/dashboard
 * Pure SQL query fetching comprehensive workspace metrics, venues, recent bookings, and alerts.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const roleParam = searchParams.get('role') || 'Admin'

    let prismaRole: PrismaRole = PrismaRole.ADMIN
    if (roleParam.toLowerCase() === 'student') prismaRole = PrismaRole.STUDENT
    else if (roleParam.toLowerCase() === 'employee') prismaRole = PrismaRole.EMPLOYEE

    // 1. Resolve user profile via SQL
    const userRows = await prisma.$queryRaw<Array<{ user_id: string; name: string }>>`
      SELECT user_id, name FROM users WHERE role = ${prismaRole}::"Role" ORDER BY created_at ASC LIMIT 1;
    `
    const user = userRows[0]

    // 2. Fetch venues inventory via SQL
    const venues = await prisma.$queryRaw<Array<{
      venue_id: string
      venue_name: string
      venue_type: string
      capacity: number
      location: string
      status: string
    }>>`
      SELECT venue_id, venue_name, venue_type, capacity, location, status FROM venues ORDER BY venue_name ASC;
    `

    // 3. Fetch recent bookings with multi-table JOIN via SQL
    const bookings = await prisma.$queryRaw<Array<{
      booking_id: string
      event_name: string
      event_date: string
      start_time: string
      end_time: string
      status: string
      venue_id: string
      venue_name: string
      requester_id: string
      requester_name: string
    }>>`
      SELECT 
        b.booking_id, b.event_name, b.event_date::text, b.start_time, b.end_time, b.status,
        v.venue_id, v.venue_name,
        u.user_id AS requester_id, u.name AS requester_name
      FROM bookings b
      JOIN venues v ON b.venue_id = v.venue_id
      JOIN users u ON b.user_id = u.user_id
      ORDER BY b.created_at DESC
      LIMIT 20;
    `

    // 4. Fetch notifications via SQL
    const notifications = await prisma.$queryRaw<Array<{
      notification_id: string
      title: string
      message: string
      notification_type: string
    }>>`
      SELECT notification_id, title, message, notification_type
      FROM notifications
      ORDER BY created_at DESC
      LIMIT 10;
    `

    // 5. Aggregate booking metrics via SQL COUNT + CASE
    const bookingMetricRows = await prisma.$queryRaw<Array<{ total: number; approved: number; pending: number }>>`
      SELECT 
        COUNT(*)::int AS total,
        COUNT(CASE WHEN status = 'APPROVED' THEN 1 END)::int AS approved,
        COUNT(CASE WHEN status = 'PENDING' THEN 1 END)::int AS pending
      FROM bookings;
    `
    const bookingMetrics = bookingMetricRows[0] || { total: 0, approved: 0, pending: 0 }

    // 6. Aggregate venue utilization metrics via SQL
    const venueMetricRows = await prisma.$queryRaw<Array<{ total_venues: number; active_venues: number }>>`
      SELECT 
        COUNT(*)::int AS total_venues,
        COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END)::int AS active_venues
      FROM venues;
    `
    const venueMetrics = venueMetricRows[0] || { total_venues: 0, active_venues: 0 }
    const utilization = venueMetrics.total_venues > 0 
      ? Math.round((venueMetrics.active_venues / venueMetrics.total_venues) * 100) 
      : 100

    return NextResponse.json({
      identity: {
        role: roleParam,
        name: user?.name ?? (roleParam === 'Admin' ? 'System Administrator' : roleParam === 'Employee' ? 'Auditorium Manager' : 'Student User'),
      },
      venues: venues.map((v) => ({
        _id: v.venue_id,
        id: v.venue_id,
        name: v.venue_name,
        type: v.venue_type,
        capacity: v.capacity,
        location: v.location,
        status: v.status.toLowerCase(),
      })),
      bookings: bookings.map((b) => ({
        _id: b.booking_id,
        id: b.booking_id,
        purpose: b.event_name,
        venueName: b.venue_name,
        venueId: b.venue_id,
        requesterName: b.requester_name,
        requesterId: b.requester_id,
        status: b.status,
        date: b.event_date,
        startTime: b.start_time,
        endTime: b.end_time,
      })),
      notifications: notifications.map((n) => ({
        _id: n.notification_id,
        id: n.notification_id,
        title: n.title,
        message: n.message,
        type: n.notification_type,
      })),
      metrics: {
        total: bookingMetrics.total,
        approved: bookingMetrics.approved,
        pending: bookingMetrics.pending,
        utilization,
      },
    })
  } catch (error: any) {
    console.error('Error in SQL GET /api/dashboard:', error)
    return NextResponse.json(
      { error: error?.message || 'Database query failed.' },
      { status: 500 }
    )
  }
}
