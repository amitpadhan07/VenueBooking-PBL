import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/bookings/[id]
 * Pure SQL query fetching comprehensive booking details with multi-table JOINs.
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

    // 1. Fetch booking with venue and requester via raw SQL INNER JOIN
    const bookingRows = await prisma.$queryRaw<Array<{
      booking_id: string
      event_name: string
      event_description: string | null
      event_date: string
      start_time: string
      end_time: string
      expected_attendees: number
      status: string
      created_at: string
      updated_at: string
      venue_id: string
      venue_name: string
      location: string
      capacity: number
      venue_type: string
      venue_status: string
      user_id: string
      requester_name: string
      requester_email: string
      department: string
      role: string
      phone: string | null
    }>>`
      SELECT 
        b.booking_id, b.event_name, b.event_description, b.event_date::text, 
        b.start_time, b.end_time, b.expected_attendees, b.status, 
        b.created_at::text, b.updated_at::text,
        v.venue_id, v.venue_name, v.location, v.capacity, v.venue_type, v.status AS venue_status,
        u.user_id, u.name AS requester_name, u.email AS requester_email, u.department, u.role, u.phone
      FROM bookings b
      JOIN venues v ON b.venue_id = v.venue_id
      JOIN users u ON b.user_id = u.user_id
      WHERE b.booking_id = ${id}
      LIMIT 1
    `
    const b = bookingRows[0]

    if (!b) {
      return NextResponse.json({ error: 'Booking not found.' }, { status: 404 })
    }

    // 2. Fetch approvals audit history via raw SQL
    const approvals = await prisma.$queryRaw<Array<{
      approval_id: string
      action: string
      remarks: string | null
      action_at: string
      employee_code: string
      designation: string
      department: string
      employee_name: string
      employee_email: string
    }>>`
      SELECT 
        a.approval_id, a.action, a.remarks, a.action_at::text,
        e.employee_code, e.designation, e.department,
        u.name AS employee_name, u.email AS employee_email
      FROM approvals a
      JOIN employees e ON a.employee_id = e.employee_id
      JOIN users u ON e.user_id = u.user_id
      WHERE a.booking_id = ${id}
      ORDER BY a.action_at DESC
    `

    // 3. Fetch notifications via raw SQL
    const notifications = await prisma.$queryRaw<Array<{
      notification_id: string
      title: string
      message: string
      notification_type: string
      is_read: boolean
      created_at: string
    }>>`
      SELECT notification_id, title, message, notification_type, is_read, created_at::text
      FROM notifications
      WHERE booking_id = ${id}
      ORDER BY created_at DESC
    `

    return NextResponse.json({
      success: true,
      booking: {
        id: b.booking_id,
        booking_id: b.booking_id,
        eventName: b.event_name,
        purpose: b.event_name,
        description: b.event_description,
        venue: {
          venue_id: b.venue_id,
          venue_name: b.venue_name,
          location: b.location,
          capacity: b.capacity,
          venue_type: b.venue_type,
          status: b.venue_status,
        },
        requester: {
          user_id: b.user_id,
          name: b.requester_name,
          email: b.requester_email,
          department: b.department,
          role: b.role,
          phone: b.phone,
        },
        date: b.event_date,
        startTime: b.start_time,
        endTime: b.end_time,
        expectedAttendees: b.expected_attendees,
        status: b.status,
        approvals,
        notifications,
        createdAt: b.created_at,
        updatedAt: b.updated_at,
      },
    })
  } catch (error: any) {
    console.error('Error in SQL GET /api/bookings/[id]:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch booking details.' },
      { status: 500 }
    )
  }
}
