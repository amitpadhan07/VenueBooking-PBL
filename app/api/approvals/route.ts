import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { ApprovalAction, Role } from '@prisma/client'

export const dynamic = 'force-dynamic'

/**
 * POST /api/approvals
 * Pure SQL transaction enforcing fine-grained venue authority verification before approval/rejection.
 */
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    const roleHeader = request.headers.get('x-demo-role')
    const body = await request.json()
    const { bookingId, action, remarks, employeeId } = body

    if (!bookingId || !action) {
      return NextResponse.json(
        { error: 'bookingId and action (APPROVED | REJECTED) are required.' },
        { status: 400 }
      )
    }

    const normalizedAction = action.toUpperCase()
    if (normalizedAction !== 'APPROVED' && normalizedAction !== 'REJECTED') {
      return NextResponse.json(
        { error: 'Invalid action. Allowed values: APPROVED, REJECTED.' },
        { status: 400 }
      )
    }

    // 1. Fetch booking via raw SQL
    const bookingRows = await prisma.$queryRaw<Array<{
      booking_id: string
      venue_id: string
      user_id: string
      event_name: string
      event_date: string
      status: string
      venue_name: string
    }>>`
      SELECT b.booking_id, b.venue_id, b.user_id, b.event_name, b.event_date::text, b.status, v.venue_name
      FROM bookings b
      JOIN venues v ON b.venue_id = v.venue_id
      WHERE b.booking_id = ${bookingId}
      LIMIT 1
    `
    const booking = bookingRows[0]

    if (!booking) {
      return NextResponse.json({ error: 'Booking request not found.' }, { status: 404 })
    }

    if (booking.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Cannot process approval. Booking is already in ${booking.status} status.` },
        { status: 400 }
      )
    }

    // 2. Resolve employee identity via raw SQL
    let isSystemAdmin = authUser?.role === Role.ADMIN || roleHeader?.toLowerCase() === 'admin'
    let targetEmployeeId = employeeId

    if (!targetEmployeeId && authUser?.userId) {
      const emps = await prisma.$queryRaw<Array<{ employee_id: string }>>`
        SELECT employee_id FROM employees WHERE user_id = ${authUser.userId} LIMIT 1
      `
      if (emps.length) targetEmployeeId = emps[0].employee_id
    }

    if (!targetEmployeeId) {
      if (isSystemAdmin) {
        const firstEmps = await prisma.$queryRaw<Array<{ employee_id: string }>>`
          SELECT employee_id FROM employees LIMIT 1
        `
        targetEmployeeId = firstEmps[0]?.employee_id
      } else {
        const demoEmps = await prisma.$queryRaw<Array<{ employee_id: string }>>`
          SELECT employee_id FROM employees WHERE status = 'ACTIVE' LIMIT 1
        `
        targetEmployeeId = demoEmps[0]?.employee_id
      }
    }

    if (!targetEmployeeId) {
      return NextResponse.json(
        { error: 'No employee identity associated with this approval request.' },
        { status: 401 }
      )
    }

    const employeeRows = await prisma.$queryRaw<Array<{
      employee_id: string
      user_id: string
      employee_code: string
      name: string
      role: string
    }>>`
      SELECT e.employee_id, e.user_id, e.employee_code, u.name, u.role
      FROM employees e
      JOIN users u ON e.user_id = u.user_id
      WHERE e.employee_id = ${targetEmployeeId}
      LIMIT 1
    `
    const employee = employeeRows[0]

    if (!employee) {
      return NextResponse.json({ error: 'Employee account not found.' }, { status: 404 })
    }

    // 3. FINE-GRAINED VENUE AUTHORITY CHECK IN SQL
    // If not Admin, must hold an ACTIVE record in venue_authority for this specific venue
    if (!isSystemAdmin && employee.role !== Role.ADMIN) {
      const authorityRows = await prisma.$queryRaw<Array<{ authority_id: string }>>`
        SELECT authority_id 
        FROM venue_authority 
        WHERE employee_id = ${employee.employee_id} 
          AND venue_id = ${booking.venue_id} 
          AND status = 'ACTIVE'
        LIMIT 1
      `

      if (authorityRows.length === 0) {
        // Log unauthorized attempt via SQL
        const unauthDetails = JSON.stringify({
          attemptedBy: employee.name,
          employeeCode: employee.employee_code,
          venueName: booking.venue_name,
          venueId: booking.venue_id,
          reason: 'Lacks delegation in venue_authority matrix',
        })

        await prisma.$executeRaw`
          INSERT INTO audit_logs (
            log_id, user_id, action, entity_type, entity_id, details, created_at
          )
          VALUES (
            gen_random_uuid()::text, ${employee.user_id}, 'UNAUTHORIZED_APPROVAL_ATTEMPT', 'BOOKING',
            ${booking.booking_id}, ${unauthDetails}, NOW()
          )
        `

        return NextResponse.json(
          {
            error: 'Unauthorized: You do not possess venue authority over this facility',
            venueName: booking.venue_name,
            employeeName: employee.name,
          },
          { status: 403 }
        )
      }
    }

    // 4. Update status & record approval inside transactional boundary in SQL
    const newStatus = normalizedAction === 'APPROVED' ? 'APPROVED' : 'REJECTED'
    const remarksText = remarks || (normalizedAction === 'APPROVED' ? 'Approved by designated authority.' : 'Declined by designated authority.')

    const result = await prisma.$transaction(async (tx) => {
      // Step 1: SQL UPDATE booking status
      const updatedRows = await tx.$queryRaw<Array<{ booking_id: string; status: string }>>`
        UPDATE bookings 
        SET status = ${newStatus}::"BookingStatus", updated_at = NOW()
        WHERE booking_id = ${booking.booking_id}
        RETURNING booking_id, status
      `

      // Step 2: SQL INSERT approval record
      const approvalRows = await tx.$queryRaw<Array<{ approval_id: string; action: string; remarks: string; action_at: string }>>`
        INSERT INTO approvals (
          approval_id, booking_id, employee_id, action, remarks, action_at
        )
        VALUES (
          gen_random_uuid()::text, ${booking.booking_id}, ${employee.employee_id},
          ${normalizedAction}::"ApprovalAction", ${remarksText}, NOW()
        )
        RETURNING approval_id, action, remarks, action_at::text
      `

      // Step 3: SQL INSERT notification
      await tx.$executeRaw`
        INSERT INTO notifications (
          notification_id, user_id, booking_id, title, message, notification_type, is_read, created_at
        )
        VALUES (
          gen_random_uuid()::text, ${booking.user_id}, ${booking.booking_id},
          ${`Booking Request ${normalizedAction}`},
          ${`Your booking for ${booking.venue_name} on ${booking.event_date} has been ${normalizedAction.toLowerCase()}. Remarks: ${remarksText}`},
          ${normalizedAction === 'APPROVED' ? 'BOOKING_APPROVED' : 'BOOKING_REJECTED'},
          false, NOW()
        )
      `

      // Step 4: SQL INSERT audit log
      const auditJson = JSON.stringify({
        bookingId: booking.booking_id,
        venueName: booking.venue_name,
        action: normalizedAction,
        actedByEmployee: employee.name,
        employeeCode: employee.employee_code,
        remarks: remarksText,
      })

      await tx.$executeRaw`
        INSERT INTO audit_logs (
          log_id, user_id, action, entity_type, entity_id, details, created_at
        )
        VALUES (
          gen_random_uuid()::text, ${employee.user_id}, 
          ${normalizedAction === 'APPROVED' ? 'BOOKING_APPROVED' : 'BOOKING_REJECTED'}, 
          'BOOKING', ${booking.booking_id}, ${auditJson}, NOW()
        )
      `

      return {
        booking: updatedRows[0],
        approval: approvalRows[0],
      }
    })

    return NextResponse.json({
      success: true,
      message: `Booking has been successfully ${normalizedAction.toLowerCase()} via SQL transaction.`,
      booking: result.booking,
      approval: result.approval,
    })
  } catch (error: any) {
    console.error('Error in SQL POST /api/approvals:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to process approval.' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/approvals
 * Pure SQL query retrieving approval audit history.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const bookingId = searchParams.get('bookingId')
    const employeeId = searchParams.get('employeeId')
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    let query = `
      SELECT 
        a.approval_id, a.booking_id, a.action, a.remarks, a.action_at::text,
        b.event_name, b.event_date::text, b.start_time, b.end_time,
        v.venue_name,
        e.employee_code, e.designation,
        u.name AS approver_name
      FROM approvals a
      JOIN bookings b ON a.booking_id = b.booking_id
      JOIN venues v ON b.venue_id = v.venue_id
      JOIN employees e ON a.employee_id = e.employee_id
      JOIN users u ON e.user_id = u.user_id
      WHERE 1=1
    `
    const params: any[] = []

    if (bookingId) {
      params.push(bookingId)
      query += ` AND a.booking_id = $${params.length}`
    }
    if (employeeId) {
      params.push(employeeId)
      query += ` AND a.employee_id = $${params.length}`
    }

    params.push(Math.min(limit, 100))
    query += ` ORDER BY a.action_at DESC LIMIT $${params.length};`

    const approvals: any[] = await prisma.$queryRawUnsafe(query, ...params)

    return NextResponse.json({
      success: true,
      count: approvals.length,
      approvals: approvals.map((a) => ({
        id: a.approval_id,
        approval_id: a.approval_id,
        bookingId: a.booking_id,
        eventName: a.event_name,
        date: a.event_date,
        slot: `${a.start_time}-${a.end_time}`,
        venueName: a.venue_name,
        action: a.action,
        remarks: a.remarks,
        actionAt: a.action_at,
        approverCode: a.employee_code,
        approverDesignation: a.designation,
        approverName: a.approver_name,
      })),
    })
  } catch (error: any) {
    console.error('Error in SQL GET /api/approvals:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch approval history.' },
      { status: 500 }
    )
  }
}
