import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/**
 * PATCH /api/bookings/[id]/cancel
 * Pure SQL transactional cancellation of booking with notification and audit logging.
 */
async function handleCancellation(
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

    // 1. Fetch booking with venue and user via raw SQL
    const bookingRows = await prisma.$queryRaw<Array<{
      booking_id: string
      user_id: string
      status: string
      venue_name: string
      user_name: string
    }>>`
      SELECT b.booking_id, b.user_id, b.status, v.venue_name, u.name AS user_name
      FROM bookings b
      JOIN venues v ON b.venue_id = v.venue_id
      JOIN users u ON b.user_id = u.user_id
      WHERE b.booking_id = ${id}
      LIMIT 1
    `
    const booking = bookingRows[0]

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found.' }, { status: 404 })
    }

    // Terminal state protection
    if (booking.status === 'CANCELLED') {
      return NextResponse.json({ error: 'Booking is already cancelled.' }, { status: 400 })
    }

    if (booking.status === 'REJECTED' || booking.status === 'COMPLETED') {
      return NextResponse.json(
        { error: `Cannot cancel a booking in ${booking.status} status.` },
        { status: 400 }
      )
    }

    const actorId = authUser?.userId || booking.user_id

    // 2. Execute cancellation transaction using pure raw SQL
    const updated = await prisma.$transaction(async (tx) => {
      // Step 1: SQL UPDATE status
      const updatedRows = await tx.$queryRaw<Array<{ booking_id: string; status: string; updated_at: string }>>`
        UPDATE bookings 
        SET status = 'CANCELLED'::"BookingStatus", updated_at = NOW()
        WHERE booking_id = ${id}
        RETURNING booking_id, status, updated_at::text
      `

      // Step 2: SQL INSERT notification
      await tx.$executeRaw`
        INSERT INTO notifications (
          notification_id, user_id, booking_id, title, message, notification_type, is_read, created_at
        )
        VALUES (
          gen_random_uuid()::text, ${booking.user_id}, ${booking.booking_id},
          'Booking Cancelled',
          ${`Booking for ${booking.venue_name} has been cancelled. Reason: ${reason}`},
          'BOOKING_CANCELLED', false, NOW()
        )
      `

      // Step 3: SQL INSERT audit log
      const auditDetails = JSON.stringify({
        venueName: booking.venue_name,
        reason,
        previousStatus: booking.status,
      })

      await tx.$executeRaw`
        INSERT INTO audit_logs (
          log_id, user_id, action, entity_type, entity_id, details, created_at
        )
        VALUES (
          gen_random_uuid()::text, ${actorId}, 'BOOKING_CANCELLED', 'BOOKING',
          ${booking.booking_id}, ${auditDetails}, NOW()
        )
      `

      return updatedRows[0]
    })

    return NextResponse.json({
      success: true,
      message: 'Booking successfully cancelled via SQL transaction.',
      booking: {
        id: updated.booking_id,
        status: updated.status,
        updatedAt: updated.updated_at,
      },
    })
  } catch (error: any) {
    console.error('Error in SQL PATCH /api/bookings/[id]/cancel:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to cancel booking.' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return handleCancellation(request, context)
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return handleCancellation(request, context)
}
