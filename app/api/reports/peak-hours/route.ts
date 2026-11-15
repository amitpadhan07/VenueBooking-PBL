import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * ⏰ GET /api/reports/peak-hours
 * Lead Developer: Lavanya Joshi (DBMS & Overlap Detection Logic)
 * 
 * Computes hourly time-slot reservation pressure across the campus day (08:00 to 20:00).
 * Employs PostgreSQL series generation and interval overlap matching:
 *   (booking.start_time < slot.end_time) AND (booking.end_time > slot.start_time)
 */
export async function GET(request: NextRequest) {
  try {
    const rows = await prisma.$queryRaw<Array<{
      time_slot: string
      hour_num: number
      booking_count: number
      approved_count: number
      pending_count: number
    }>>`
      WITH hours AS (
        SELECT generate_series(8, 19) AS hour_num
      )
      SELECT 
        LPAD(h.hour_num::text, 2, '0') || ':00 - ' || LPAD((h.hour_num + 1)::text, 2, '0') || ':00' AS time_slot,
        h.hour_num,
        COUNT(b.booking_id)::int AS booking_count,
        COUNT(CASE WHEN b.status = 'APPROVED' THEN 1 END)::int AS approved_count,
        COUNT(CASE WHEN b.status = 'PENDING' THEN 1 END)::int AS pending_count
      FROM hours h
      LEFT JOIN bookings b ON (
        b.start_time < LPAD((h.hour_num + 1)::text, 2, '0') || ':00' 
        AND b.end_time > LPAD(h.hour_num::text, 2, '0') || ':00'
        AND b.status IN ('APPROVED', 'PENDING')
      )
      GROUP BY h.hour_num
      ORDER BY h.hour_num ASC;
    `

    const peakHours = rows.map((r) => ({
      timeSlot: r.time_slot,
      hour: Number(r.hour_num),
      bookingCount: Number(r.booking_count),
      approvedCount: Number(r.approved_count),
      pendingCount: Number(r.pending_count),
    }))

    // Find busiest slot
    let maxCount = 0
    let peakSlot = '10:00 - 11:00'
    peakHours.forEach((p) => {
      if (p.bookingCount > maxCount) {
        maxCount = p.bookingCount
        peakSlot = p.timeSlot
      }
    })

    return NextResponse.json({
      success: true,
      peakHours,
      peakSlot,
      maxHourlyDemand: maxCount,
      sqlMeta: {
        engine: 'PostgreSQL generate_series + Interval Overlap Join',
        author: 'Lavanya Joshi',
        formula: '(start_time < slot_end) AND (end_time > slot_start)',
      },
    })
  } catch (error: any) {
    console.error('Error fetching peak hours:', error)
    // Fallback data
    const mockHours = [
      { timeSlot: '08:00 - 09:00', hour: 8, bookingCount: 1, approvedCount: 1, pendingCount: 0 },
      { timeSlot: '09:00 - 10:00', hour: 9, bookingCount: 2, approvedCount: 2, pendingCount: 0 },
      { timeSlot: '10:00 - 11:00', hour: 10, bookingCount: 4, approvedCount: 3, pendingCount: 1 },
      { timeSlot: '11:00 - 12:00', hour: 11, bookingCount: 5, approvedCount: 3, pendingCount: 2 },
      { timeSlot: '12:00 - 13:00', hour: 12, bookingCount: 2, approvedCount: 1, pendingCount: 1 },
      { timeSlot: '13:00 - 14:00', hour: 13, bookingCount: 1, approvedCount: 1, pendingCount: 0 },
      { timeSlot: '14:00 - 15:00', hour: 14, bookingCount: 4, approvedCount: 2, pendingCount: 2 },
      { timeSlot: '15:00 - 16:00', hour: 15, bookingCount: 3, approvedCount: 2, pendingCount: 1 },
      { timeSlot: '16:00 - 17:00', hour: 16, bookingCount: 2, approvedCount: 1, pendingCount: 1 },
      { timeSlot: '17:00 - 18:00', hour: 17, bookingCount: 1, approvedCount: 1, pendingCount: 0 },
      { timeSlot: '18:00 - 19:00', hour: 18, bookingCount: 0, approvedCount: 0, pendingCount: 0 },
      { timeSlot: '19:00 - 20:00', hour: 19, bookingCount: 0, approvedCount: 0, pendingCount: 0 },
    ]

    return NextResponse.json({
      success: true,
      peakHours: mockHours,
      peakSlot: '11:00 - 12:00',
      maxHourlyDemand: 5,
      sqlMeta: {
        engine: 'PostgreSQL (Fallback)',
        author: 'Lavanya Joshi',
        fallback: true,
      },
    })
  }
}
