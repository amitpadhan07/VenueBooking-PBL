import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { BookingStatus, Role } from '@prisma/client'

export const dynamic = 'force-dynamic'

/**
 * GET /api/approvals/pending
 * Returns pending bookings. If an employee is logged in (or selected),
 * only returns bookings for venues the employee holds ACTIVE authority over.
 * If Admin, returns all pending bookings.
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
      const emp = await prisma.employee.findUnique({
        where: { user_id: authUser.userId },
      })
      if (emp) targetEmployeeId = emp.employee_id
    }

    if (!isSystemAdmin && !targetEmployeeId && roleHeader?.toLowerCase() === 'employee') {
      const emp = await prisma.employee.findFirst({ where: { status: 'ACTIVE' } })
      targetEmployeeId = emp?.employee_id
    }

    let venueFilter: any = {}

    // If employee, find their active authorized venues
    if (!isSystemAdmin && targetEmployeeId) {
      const authorities = await prisma.venueAuthority.findMany({
        where: {
          employee_id: targetEmployeeId,
          status: 'ACTIVE',
        },
        select: { venue_id: true },
      })

      const authorizedVenueIds = authorities.map((a) => a.venue_id)
      venueFilter = { venue_id: { in: authorizedVenueIds } }
    }

    const pendingBookings = await prisma.booking.findMany({
      where: {
        status: BookingStatus.PENDING,
        ...venueFilter,
      },
      include: {
        venue: true,
        user: {
          select: {
            name: true,
            email: true,
            department: true,
            phone: true,
          },
        },
      },
      orderBy: { created_at: 'asc' },
    })

    return NextResponse.json({
      success: true,
      count: pendingBookings.length,
      bookings: pendingBookings.map((b) => ({
        bookingId: b.booking_id,
        eventName: b.event_name,
        description: b.event_description,
        venueId: b.venue_id,
        venueName: b.venue.venue_name,
        venueLocation: b.venue.location,
        venueCapacity: b.venue.capacity,
        requesterName: b.user.name,
        requesterEmail: b.user.email,
        department: b.user.department,
        phone: b.user.phone,
        eventDate: b.event_date.toISOString().split('T')[0],
        startTime: b.start_time,
        endTime: b.end_time,
        expectedAttendees: b.expected_attendees,
        status: b.status,
        createdAt: b.created_at.toISOString(),
      })),
    })
  } catch (error: any) {
    console.error('Error in GET /api/approvals/pending:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch pending approvals.' },
      { status: 500 }
    )
  }
}
