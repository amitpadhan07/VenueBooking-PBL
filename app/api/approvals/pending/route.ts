import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { Role } from '@prisma/client'

export const dynamic = 'force-dynamic'

/**
 * GET /api/approvals/pending
 * Pure SQL query fetching pending bookings filtered by employee's active venue authority.
 */
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    const { searchParams } = new URL(request.url)
    const employeeIdParam = searchParams.get('employeeId')
    const roleHeader = request.headers.get('x-demo-role')

    let isSystemAdmin = authUser?.role === Role.ADMIN || roleHeader?.toLowerCase() === 'admin'
    let targetEmployeeId = employeeIdParam

    if (!targetEmployeeId && authUser?.userId) {
      const emps = await prisma.$queryRaw<Array<{ employee_id: string }>>`
        SELECT employee_id FROM employees WHERE user_id = ${authUser.userId} LIMIT 1
      `
      if (emps.length) targetEmployeeId = emps[0].employee_id
    }

    if (!isSystemAdmin && !targetEmployeeId && roleHeader?.toLowerCase() === 'employee') {
      const emps = await prisma.$queryRaw<Array<{ employee_id: string }>>`
        SELECT employee_id FROM employees WHERE status = 'ACTIVE' LIMIT 1
      `
      targetEmployeeId = emps[0]?.employee_id ?? null
    }

    // Pure SQL Query with multi-table JOIN and Subquery for authority checking
    let pendingBookings: any[] = []

    if (isSystemAdmin || !targetEmployeeId) {
      pendingBookings = await prisma.$queryRaw<any[]>`
        SELECT 
          b.booking_id, b.event_name, b.event_description, b.event_date::text,
          b.start_time, b.end_time, b.expected_attendees, b.status, b.created_at::text,
          v.venue_id, v.venue_name, v.location, v.capacity, v.venue_type,
          u.user_id, u.name AS requester_name, u.email AS requester_email, u.department, u.phone
        FROM bookings b
        JOIN venues v ON b.venue_id = v.venue_id
        JOIN users u ON b.user_id = u.user_id
        WHERE b.status = 'PENDING'
        ORDER BY b.created_at ASC;
      `
    } else {
      pendingBookings = await prisma.$queryRaw<any[]>`
        SELECT 
          b.booking_id, b.event_name, b.event_description, b.event_date::text,
          b.start_time, b.end_time, b.expected_attendees, b.status, b.created_at::text,
          v.venue_id, v.venue_name, v.location, v.capacity, v.venue_type,
          u.user_id, u.name AS requester_name, u.email AS requester_email, u.department, u.phone
        FROM bookings b
        JOIN venues v ON b.venue_id = v.venue_id
        JOIN users u ON b.user_id = u.user_id
        WHERE b.status = 'PENDING'
          AND b.venue_id IN (
            SELECT venue_id 
            FROM venue_authority 
            WHERE employee_id = ${targetEmployeeId} 
              AND status = 'ACTIVE'
          )
        ORDER BY b.created_at ASC;
      `
    }

    return NextResponse.json({
      success: true,
      count: pendingBookings.length,
      bookings: pendingBookings.map((b) => ({
        bookingId: b.booking_id,
        eventName: b.event_name,
        description: b.event_description,
        venueId: b.venue_id,
        venueName: b.venue_name,
        venueLocation: b.location,
        venueCapacity: b.capacity,
        venueType: b.venue_type,
        requesterName: b.requester_name,
        requesterEmail: b.requester_email,
        department: b.department,
        phone: b.phone,
        date: b.event_date,
        startTime: b.start_time,
        endTime: b.end_time,
        attendees: b.expected_attendees,
        status: b.status,
        submittedAt: b.created_at,
      })),
    })
  } catch (error: any) {
    console.error('Error in SQL GET /api/approvals/pending:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch pending approvals.' },
      { status: 500 }
    )
  }
}
