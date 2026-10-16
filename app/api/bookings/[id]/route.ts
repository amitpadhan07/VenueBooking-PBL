import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/bookings/[id]
 * Fetches detailed profile of a single booking, including requester, venue, approvals, and notifications.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: 'Booking ID is required.' }, { status: 400 })
    }

    const booking = await prisma.booking.findUnique({
      where: { booking_id: id },
      include: {
        venue: {
          select: {
            venue_id: true,
            venue_name: true,
            location: true,
            capacity: true,
            venue_type: true,
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
            phone: true,
          },
        },
        approvals: {
          orderBy: { action_at: 'desc' },
          include: {
            employee: {
              select: {
                employee_code: true,
                designation: true,
                department: true,
                user: { select: { name: true, email: true } },
              },
            },
          },
        },
        notifications: {
          orderBy: { created_at: 'desc' },
          select: {
            notification_id: true,
            title: true,
            message: true,
            notification_type: true,
            is_read: true,
            created_at: true,
          },
        },
      },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found.' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.booking_id,
        booking_id: booking.booking_id,
        eventName: booking.event_name,
        purpose: booking.event_name,
        description: booking.event_description,
        venue: booking.venue,
        requester: booking.user,
        date: booking.event_date.toISOString().split('T')[0],
        startTime: booking.start_time,
        endTime: booking.end_time,
        expectedAttendees: booking.expected_attendees,
        status: booking.status,
        approvals: booking.approvals,
        notifications: booking.notifications,
        createdAt: booking.created_at.toISOString(),
        updatedAt: booking.updated_at.toISOString(),
      },
    })
  } catch (error: any) {
    console.error('Error in GET /api/bookings/[id]:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch booking details.' },
      { status: 500 }
    )
  }
}
