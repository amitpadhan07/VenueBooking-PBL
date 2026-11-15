import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/bookings/[id]/verify
 * Campus Security & Venue Gate Pass Verification Endpoint:
 * 1. Looks up the booking record in PostgreSQL by booking_id.
 * 2. Determines verification status:
 *    - VALID: Approved and event date/time is today/upcoming.
 *    - EXPIRED: Event scheduled date and end time have passed.
 *    - REJECTED: Booking was declined by authority.
 *    - CANCELLED: Booking was cancelled.
 *    - PENDING: Booking is awaiting approval.
 *    - INVALID: No record found.
 * 3. Returns authorized requester name, department, venue name, and allotted time slot.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          verificationStatus: 'INVALID',
          error: 'Booking identifier is required for verification.',
        },
        { status: 400 }
      )
    }

    // Pure SQL Query with multi-table INNER JOIN on bookings, venues, and users
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
      venue_id: string
      venue_name: string
      location: string
      capacity: number
      venue_type: string
      user_id: string
      requester_name: string
      requester_email: string
      department: string
      phone: string | null
      role: string
    }>>`
      SELECT 
        b.booking_id, b.event_name, b.event_description, b.event_date::text,
        b.start_time, b.end_time, b.expected_attendees, b.status, b.created_at::text,
        v.venue_id, v.venue_name, v.location, v.capacity, v.venue_type,
        u.user_id, u.name AS requester_name, u.email AS requester_email, u.department, u.phone, u.role
      FROM bookings b
      JOIN venues v ON b.venue_id = v.venue_id
      JOIN users u ON b.user_id = u.user_id
      WHERE b.booking_id = ${id}
      LIMIT 1;
    `

    const b = bookingRows[0]

    if (!b) {
      return NextResponse.json(
        {
          success: false,
          verificationStatus: 'INVALID',
          error: 'No authentic campus booking found matching this identifier.',
          verifiedAt: new Date().toISOString(),
        },
        { status: 404 }
      )
    }

    // Determine temporal validity
    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]
    const currentHourMin = now.toTimeString().slice(0, 5) // "HH:MM"

    const eventDateStr = typeof b.event_date === 'string'
      ? b.event_date.split('T')[0]
      : new Date(b.event_date).toISOString().split('T')[0]

    let verificationStatus: 'VALID' | 'EXPIRED' | 'REJECTED' | 'CANCELLED' | 'PENDING' | 'INVALID' = 'INVALID'
    let statusMessage = ''

    if (b.status === 'APPROVED') {
      if (eventDateStr > todayStr) {
        verificationStatus = 'VALID'
        statusMessage = 'Officially authorized for scheduled upcoming event date.'
      } else if (eventDateStr === todayStr) {
        // Same day: check if end_time has passed
        const endTimeSlice = b.end_time.slice(0, 5)
        if (currentHourMin <= endTimeSlice) {
          verificationStatus = 'VALID'
          statusMessage = 'Active today: Officially authorized for venue entry.'
        } else {
          verificationStatus = 'EXPIRED'
          statusMessage = 'Event duration for today has concluded.'
        }
      } else {
        verificationStatus = 'EXPIRED'
        statusMessage = 'Pass expired: Event date has passed.'
      }
    } else if (b.status === 'REJECTED') {
      verificationStatus = 'REJECTED'
      statusMessage = 'Reservation was rejected by designated authority. Entry not permitted.'
    } else if (b.status === 'CANCELLED') {
      verificationStatus = 'CANCELLED'
      statusMessage = 'Booking was cancelled. Entry not permitted.'
    } else if (b.status === 'PENDING') {
      verificationStatus = 'PENDING'
      statusMessage = 'Awaiting administrative approval. Not authorized for entry.'
    } else if (b.status === 'COMPLETED') {
      verificationStatus = 'EXPIRED'
      statusMessage = 'Event concluded and archived.'
    }

    // Fetch latest approval record if any
    const approvalRows = await prisma.$queryRaw<Array<{
      action: string
      remarks: string | null
      action_at: string
      approver_name: string
      employee_code: string
      designation: string
    }>>`
      SELECT 
        a.action, a.remarks, a.action_at::text,
        u.name AS approver_name, e.employee_code, e.designation
      FROM approvals a
      JOIN employees e ON a.employee_id = e.employee_id
      JOIN users u ON e.user_id = u.user_id
      WHERE a.booking_id = ${id}
      ORDER BY a.action_at DESC
      LIMIT 1;
    `
    const approval = approvalRows[0] || null

    return NextResponse.json({
      success: true,
      verificationStatus,
      statusMessage,
      bookingId: b.booking_id,
      eventName: b.event_name,
      eventDescription: b.event_description,
      requesterName: b.requester_name,
      department: b.department,
      requesterEmail: b.requester_email,
      requesterPhone: b.phone,
      venueName: b.venue_name,
      venueLocation: b.location,
      venueCapacity: b.capacity,
      eventDate: eventDateStr,
      startTime: b.start_time,
      endTime: b.end_time,
      allottedTimeSlot: `${eventDateStr} (${b.start_time} - ${b.end_time})`,
      expectedAttendees: b.expected_attendees,
      bookingStatus: b.status,
      approvalDetails: approval
        ? {
            approvedBy: approval.approver_name,
            approverCode: approval.employee_code,
            designation: approval.designation,
            remarks: approval.remarks,
            actionAt: approval.action_at,
          }
        : null,
      verifiedAt: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Error in GET /api/bookings/[id]/verify:', error)
    return NextResponse.json(
      {
        success: false,
        verificationStatus: 'INVALID',
        error: error?.message || 'Internal error verifying booking pass.',
      },
      { status: 500 }
    )
  }
}
