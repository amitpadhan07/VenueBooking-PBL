import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { Role } from '@prisma/client'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/authorities
 * Pure SQL query retrieving complete Venue Authority Matrix: (Employees ⋈ VenueAuthorities ⋈ Venues)
 */
export async function GET(request: NextRequest) {
  try {
    const authorities = await prisma.$queryRaw<Array<{
      authority_id: string
      employee_id: string
      venue_id: string
      assigned_by: string
      assigned_at: string
      status: string
      employee_code: string
      designation: string
      department: string
      user_id: string
      employee_name: string
      employee_email: string
      venue_name: string
      venue_type: string
      capacity: number
      location: string
      assigner_name: string
    }>>`
      SELECT 
        va.authority_id, va.employee_id, va.venue_id, va.assigned_by, va.assigned_at::text, va.status,
        e.employee_code, e.designation, e.department,
        u_emp.user_id, u_emp.name AS employee_name, u_emp.email AS employee_email,
        v.venue_name, v.venue_type, v.capacity, v.location,
        u_asg.name AS assigner_name
      FROM venue_authority va
      JOIN employees e ON va.employee_id = e.employee_id
      JOIN users u_emp ON e.user_id = u_emp.user_id
      JOIN venues v ON va.venue_id = v.venue_id
      JOIN users u_asg ON va.assigned_by = u_asg.user_id
      ORDER BY va.assigned_at DESC;
    `

    const employees = await prisma.$queryRaw<Array<{
      employee_id: string
      user_id: string
      employee_code: string
      designation: string
      department: string
      name: string
      email: string
    }>>`
      SELECT 
        e.employee_id, e.user_id, e.employee_code, e.designation, e.department,
        u.name, u.email
      FROM employees e
      JOIN users u ON e.user_id = u.user_id
      WHERE e.status = 'ACTIVE';
    `

    const venues = await prisma.$queryRaw<Array<{
      venue_id: string
      venue_name: string
      venue_type: string
      capacity: number
    }>>`
      SELECT venue_id, venue_name, venue_type, capacity 
      FROM venues 
      WHERE status = 'ACTIVE' 
      ORDER BY venue_name ASC;
    `

    return NextResponse.json({
      success: true,
      matrix: authorities.map((a) => ({
        authorityId: a.authority_id,
        employeeId: a.employee_id,
        employeeName: a.employee_name,
        employeeCode: a.employee_code,
        designation: a.designation,
        department: a.department,
        venueId: a.venue_id,
        venueName: a.venue_name,
        venueType: a.venue_type,
        capacity: a.capacity,
        location: a.location,
        status: a.status,
        assignedBy: a.assigner_name,
        assignedAt: a.assigned_at,
      })),
      employees: employees.map((e) => ({
        employeeId: e.employee_id,
        userId: e.user_id,
        name: e.name,
        email: e.email,
        employeeCode: e.employee_code,
        designation: e.designation,
        department: e.department,
      })),
      venues: venues.map((v) => ({
        venueId: v.venue_id,
        venueName: v.venue_name,
        venueType: v.venue_type,
        capacity: v.capacity,
      })),
    })
  } catch (error: any) {
    console.error('Error in SQL GET /api/admin/authorities:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to retrieve authority matrix.' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/authorities
 * Pure SQL query assigning or delegating authority over a specific venue to an employee.
 */
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    const roleHeader = request.headers.get('x-demo-role')

    const isSystemAdmin = authUser?.role === Role.ADMIN || roleHeader?.toLowerCase() === 'admin'
    if (!isSystemAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Only Administrators can delegate venue authority.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { employeeId, venueId } = body

    if (!employeeId || !venueId) {
      return NextResponse.json(
        { error: 'Both employeeId and venueId are required.' },
        { status: 400 }
      )
    }

    let assignerId = authUser?.userId
    if (!assignerId) {
      const adminUsers = await prisma.$queryRaw<Array<{ user_id: string }>>`
        SELECT user_id FROM users WHERE role = 'ADMIN'::"Role" LIMIT 1
      `
      assignerId = adminUsers[0]?.user_id
    }

    if (!assignerId) {
      return NextResponse.json(
        { error: 'No administrator profile found to record delegation.' },
        { status: 400 }
      )
    }

    // 1. Verify existence of employee and venue via SQL
    const employeeRows = await prisma.$queryRaw<Array<{ employee_id: string; user_id: string; employee_code: string; name: string }>>`
      SELECT e.employee_id, e.user_id, e.employee_code, u.name
      FROM employees e
      JOIN users u ON e.user_id = u.user_id
      WHERE e.employee_id = ${employeeId}
      LIMIT 1
    `
    const employee = employeeRows[0]
    if (!employee) {
      return NextResponse.json({ error: 'Employee not found.' }, { status: 404 })
    }

    const venueRows = await prisma.$queryRaw<Array<{ venue_id: string; venue_name: string }>>`
      SELECT venue_id, venue_name FROM venues WHERE venue_id = ${venueId} LIMIT 1
    `
    const venue = venueRows[0]
    if (!venue) {
      return NextResponse.json({ error: 'Venue not found.' }, { status: 404 })
    }

    // 2. SQL UPSERT into venue_authority using ON CONFLICT DO UPDATE
    const authorityRows = await prisma.$queryRaw<Array<{ authority_id: string; status: string; assigned_at: string }>>`
      INSERT INTO venue_authority (
        authority_id, employee_id, venue_id, assigned_by, assigned_at, status
      )
      VALUES (
        gen_random_uuid()::text, ${employee.employee_id}, ${venue.venue_id}, ${assignerId}, NOW(), 'ACTIVE'::"AuthorityStatus"
      )
      ON CONFLICT ("employee_id", "venue_id")
      DO UPDATE SET status = 'ACTIVE'::"AuthorityStatus", assigned_by = ${assignerId}, assigned_at = NOW()
      RETURNING authority_id, status, assigned_at::text;
    `
    const authority = authorityRows[0]

    // 3. SQL INSERT notification
    await prisma.$executeRaw`
      INSERT INTO notifications (
        notification_id, user_id, title, message, notification_type, is_read, created_at
      )
      VALUES (
        gen_random_uuid()::text, ${employee.user_id}, 'Venue Authority Delegated',
        ${`You have been designated as an authorized approver for ${venue.venue_name}.`},
        'VENUE_AUTHORITY_ASSIGNED', false, NOW()
      )
    `

    // 4. SQL INSERT audit log
    const auditJson = JSON.stringify({
      employeeCode: employee.employee_code,
      employeeName: employee.name,
      venueName: venue.venue_name,
      delegatedBy: assignerId,
    })

    await prisma.$executeRaw`
      INSERT INTO audit_logs (
        log_id, user_id, action, entity_type, entity_id, details, created_at
      )
      VALUES (
        gen_random_uuid()::text, ${assignerId}, 'VENUE_AUTHORITY_ASSIGNED', 'VENUE_AUTHORITY',
        ${authority.authority_id}, ${auditJson}, NOW()
      )
    `

    return NextResponse.json({
      success: true,
      message: `Authority over ${venue.venue_name} successfully granted to ${employee.name} (${employee.employee_code}) via SQL UPSERT.`,
      authority,
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error in SQL POST /api/admin/authorities:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to grant venue authority.' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/authorities?id=[authorityId]
 * Pure SQL query revoking venue approval authority from an employee.
 */
export async function DELETE(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    const roleHeader = request.headers.get('x-demo-role')

    const isSystemAdmin = authUser?.role === Role.ADMIN || roleHeader?.toLowerCase() === 'admin'
    if (!isSystemAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Only Administrators can revoke venue authority.' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const authorityId = searchParams.get('id')

    if (!authorityId) {
      return NextResponse.json({ error: 'Authority ID is required.' }, { status: 400 })
    }

    // 1. Fetch authority record via SQL
    const authorityRows = await prisma.$queryRaw<Array<{
      authority_id: string
      employee_id: string
      venue_id: string
      user_id: string
      employee_code: string
      name: string
      venue_name: string
    }>>`
      SELECT 
        va.authority_id, va.employee_id, va.venue_id,
        u.user_id, e.employee_code, u.name, v.venue_name
      FROM venue_authority va
      JOIN employees e ON va.employee_id = e.employee_id
      JOIN users u ON e.user_id = u.user_id
      JOIN venues v ON va.venue_id = v.venue_id
      WHERE va.authority_id = ${authorityId}
      LIMIT 1
    `
    const authority = authorityRows[0]

    if (!authority) {
      return NextResponse.json({ error: 'Authority record not found.' }, { status: 404 })
    }

    // 2. SQL UPDATE status to REVOKED
    await prisma.$executeRaw`
      UPDATE venue_authority 
      SET status = 'REVOKED'::"AuthorityStatus"
      WHERE authority_id = ${authorityId}
    `

    // 3. SQL INSERT audit log
    const auditJson = JSON.stringify({
      employeeCode: authority.employee_code,
      employeeName: authority.name,
      venueName: authority.venue_name,
    })

    await prisma.$executeRaw`
      INSERT INTO audit_logs (
        log_id, user_id, action, entity_type, entity_id, details, created_at
      )
      VALUES (
        gen_random_uuid()::text, ${authUser?.userId || null}, 'VENUE_AUTHORITY_REVOKED', 'VENUE_AUTHORITY',
        ${authorityId}, ${auditJson}, NOW()
      )
    `

    // 4. SQL INSERT notification
    await prisma.$executeRaw`
      INSERT INTO notifications (
        notification_id, user_id, title, message, notification_type, is_read, created_at
      )
      VALUES (
        gen_random_uuid()::text, ${authority.user_id}, 'Venue Authority Revoked',
        ${`Your approval authority over ${authority.venue_name} has been revoked by administration.`},
        'VENUE_AUTHORITY_REVOKED', false, NOW()
      )
    `

    return NextResponse.json({
      success: true,
      message: `Authority over ${authority.venue_name} successfully revoked from ${authority.name} via SQL.`,
    })
  } catch (error: any) {
    console.error('Error in SQL DELETE /api/admin/authorities:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to revoke authority.' },
      { status: 500 }
    )
  }
}
