import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { BookingStatus } from '@prisma/client'
import { getAuthUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/**
 * PATCH /api/bookings/[id]/cancel
 * Cancels a booking, transitions status to CANCELLED, dispatches alert and writes audit log.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const authUser = await getAuthUser(request)
    const body = await request.json().catch(() => ({}))
    const reason = body?.reason || 'Cancelled by requester'

    if (!id) {
      return NextResponse.json({ error: 'Booking ID is required.' }, { status: 400 })
    }

    const booking = await prisma.booking.findUnique({
      where: { booking_id: id },
      include: {
        venue: { select: { venue_name: true } },
        user: { select: { user_id: true, name: true, email: true } },
      },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found.' }, { status: 404 })
    }

    // Terminal state protection
    if (booking.status === BookingStatus.CANCELLED) {
      return NextResponse.json(
        { error: 'Booking is already cancelled.' },
        { status: 400 }
      )
    }

    if (booking.status === BookingStatus.REJECTED || booking.status === BookingStatus.COMPLETED) {
      return NextResponse.json(
        { error: `Cannot cancel a booking in ${booking.status} status.` },
        { status: 400 }
      )
    }

    // Execute cancellation transaction
    const updated = await prisma.$transaction(async (tx) => {
      const updatedBooking = await tx.booking.update({
        where: { booking_id: id },
        data: { status: BookingStatus.CANCELLED },
      })

      // Send in-app notification
      await tx.notification.create({
        data: {
          user_id: booking.user_id,
          booking_id: booking.booking_id,
          title: 'Booking Cancelled',
          message: `Booking for ${booking.venue.venue_name} has been cancelled. Reason: ${reason}`,
          notification_type: 'BOOKING_CANCELLED',
        },
      })

      // Record audit log
      await tx.auditLog.create({
        data: {
          user_id: authUser?.userId || booking.user_id,
          action: 'BOOKING_CANCELLED',
          entity_type: 'BOOKING',
          entity_id: booking.booking_id,
          details: JSON.stringify({
            venueName: booking.venue.venue_name,
            reason,
            previousStatus: booking.status,
          }),
        },
      })

      return updatedBooking
    })

    return NextResponse.json({
      success: true,
      message: 'Booking successfully cancelled.',
      booking: {
        id: updated.booking_id,
        status: updated.status,
        updatedAt: updated.updated_at.toISOString(),
      },
    })
  } catch (error: any) {
    console.error('Error in PATCH /api/bookings/[id]/cancel:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to cancel booking.' },
      { status: 500 }
    )
  }
}
