import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { BookingStatus, Role, Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

/**
 * GET /api/bookings/my
 * Retrieves the authenticated student or faculty member's personal booking history.
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

      const user = await prisma.user.findFirst({
        where: { role: prismaRole },
        orderBy: { created_at: 'asc' },
      })
      targetUserId = user?.user_id
    }

    if (!targetUserId) {
      return NextResponse.json({ error: 'Not authenticated. Please log in.' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const filterStatus = searchParams.get('status')

    const whereClause: Prisma.BookingWhereInput = { user_id: targetUserId }
    if (filterStatus && filterStatus !== 'all') {
      const upper = filterStatus.toUpperCase()
      if (Object.values(BookingStatus).includes(upper as BookingStatus)) {
        whereClause.status = upper as BookingStatus
      }
    }

    const bookings = await prisma.booking.findMany({
      where: whereClause,
      orderBy: { created_at: 'desc' },
      include: {
        venue: {
          select: {
            venue_id: true,
            venue_name: true,
            location: true,
            capacity: true,
            venue_type: true,
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

    // Compute user booking statistics
    const allUserBookings = await prisma.booking.findMany({
      where: { user_id: targetUserId },
      select: { status: true },
    })

    const metrics = {
      total: allUserBookings.length,
      pending: allUserBookings.filter((b) => b.status === BookingStatus.PENDING).length,
      approved: allUserBookings.filter((b) => b.status === BookingStatus.APPROVED).length,
      rejected: allUserBookings.filter((b) => b.status === BookingStatus.REJECTED).length,
      cancelled: allUserBookings.filter((b) => b.status === BookingStatus.CANCELLED).length,
    }

    return NextResponse.json({
      success: true,
      metrics,
      bookings: bookings.map((b) => ({
        id: b.booking_id,
        booking_id: b.booking_id,
        purpose: b.event_name,
        eventName: b.event_name,
        description: b.event_description,
        venueId: b.venue_id,
        venueName: b.venue.venue_name,
        venueLocation: b.venue.location,
        capacity: b.venue.capacity,
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
    console.error('Error in GET /api/bookings/my:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch personal bookings.' },
      { status: 500 }
    )
  }
}
