import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/users
 * Returns list of all registered users with their roles and employee profiles. Pure SQL.
 */
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    const demoRole = request.headers.get('x-demo-role')
    const isAdmin = authUser?.role === 'ADMIN' || demoRole?.toLowerCase() === 'admin'

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden. Admin privileges required.' },
        { status: 403 }
      )
    }

    const users = await prisma.$queryRaw<Array<any>>`
      SELECT 
        u.user_id,
        u.name,
        u.email,
        u.role,
        u.department,
        u.phone,
        u.created_at,
        u.updated_at,
        e.employee_id,
        e.employee_code,
        e.designation,
        COUNT(b.booking_id) AS total_bookings
      FROM users u
      LEFT JOIN employees e ON u.user_id = e.user_id
      LEFT JOIN bookings b ON u.user_id = b.user_id
      GROUP BY 
        u.user_id, u.name, u.email, u.role, u.department, u.phone, 
        u.created_at, u.updated_at, e.employee_id, e.employee_code, e.designation
      ORDER BY u.created_at DESC;
    `

    return NextResponse.json({
      success: true,
      count: users.length,
      users: users.map(u => ({
        ...u,
        total_bookings: Number(u.total_bookings || 0),
      })),
    })
  } catch (error: any) {
    console.error('Error fetching users (Pure SQL):', error)
    return NextResponse.json({ error: error?.message || 'Failed to fetch users.' }, { status: 500 })
  }
}

/**
 * PATCH /api/admin/users
 * Update user role or department via Pure SQL.
 */
export async function PATCH(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    const demoRole = request.headers.get('x-demo-role')
    const isAdmin = authUser?.role === 'ADMIN' || demoRole?.toLowerCase() === 'admin'

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden. Admin privileges required.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { userId, role, department, phone } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId is required.' }, { status: 400 })
    }

    const existingUsers = await prisma.$queryRaw<Array<any>>`
      SELECT user_id, role, department FROM users WHERE user_id = ${userId} LIMIT 1;
    `
    if (existingUsers.length === 0) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 })
    }

    const current = existingUsers[0]
    const newRole = role ? String(role).toUpperCase() : current.role
    const newDept = department ? String(department).trim() : current.department

    // Pure SQL Update
    const updatedUsers = await prisma.$queryRaw<Array<any>>`
      UPDATE users
      SET 
        role = ${newRole}::"Role",
        department = ${newDept},
        updated_at = NOW()
      WHERE user_id = ${userId}
      RETURNING user_id, name, email, role, department, updated_at;
    `

    // If upgraded to EMPLOYEE and doesn't have employee record, auto-create via SQL
    if (newRole === 'EMPLOYEE' || newRole === 'ADMIN') {
      const empCheck = await prisma.$queryRaw<Array<any>>`
        SELECT employee_id FROM employees WHERE user_id = ${userId} LIMIT 1;
      `
      if (empCheck.length === 0) {
        const empCode = `EMP_${Math.floor(1000 + Math.random() * 9000)}`
        await prisma.$executeRaw`
          INSERT INTO employees (
            employee_id, user_id, employee_code, designation, department, status, created_at
          )
          VALUES (
            gen_random_uuid()::text, ${userId}, ${empCode}, 'Campus Staff', ${newDept}, 'ACTIVE', NOW()
          );
        `
      }
    }

    // Pure SQL Audit Log
    const auditDetails = JSON.stringify({
      targetUserId: userId,
      oldRole: current.role,
      newRole,
      updatedBy: authUser?.userId || 'ADMIN',
    })
    await prisma.$executeRaw`
      INSERT INTO audit_logs (log_id, user_id, action, entity_type, entity_id, details, created_at)
      VALUES (
        gen_random_uuid()::text,
        ${authUser?.userId || '00000000-0000-0000-0000-000000000001'},
        'USER_ROLE_UPDATED',
        'USER',
        ${userId},
        ${auditDetails},
        NOW()
      );
    `

    return NextResponse.json({
      success: true,
      message: `User role updated to ${newRole} via Pure SQL.`,
      user: updatedUsers[0],
    })
  } catch (error: any) {
    console.error('Error updating user (Pure SQL):', error)
    return NextResponse.json({ error: error?.message || 'Failed to update user.' }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/users
 * Delete a user from database via Pure SQL.
 */
export async function DELETE(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    const demoRole = request.headers.get('x-demo-role')
    const isAdmin = authUser?.role === 'ADMIN' || demoRole?.toLowerCase() === 'admin'

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden. Admin privileges required.' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required.' }, { status: 400 })
    }

    if (userId === authUser?.userId) {
      return NextResponse.json({ error: 'You cannot delete your own active administrator account.' }, { status: 400 })
    }

    const existing = await prisma.$queryRaw<Array<any>>`
      SELECT user_id, name, email FROM users WHERE user_id = ${userId} LIMIT 1;
    `
    if (existing.length === 0) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 })
    }

    const targetUser = existing[0]

    // Pure SQL DELETE (CASCADE will remove employee, bookings, approvals)
    await prisma.$executeRaw`
      DELETE FROM users WHERE user_id = ${userId};
    `

    // Audit Log
    const auditDetails = JSON.stringify({
      deletedUserId: userId,
      deletedUserName: targetUser.name,
      deletedUserEmail: targetUser.email,
      deletedBy: authUser?.userId || 'ADMIN',
    })
    await prisma.$executeRaw`
      INSERT INTO audit_logs (log_id, user_id, action, entity_type, entity_id, details, created_at)
      VALUES (
        gen_random_uuid()::text,
        ${authUser?.userId || '00000000-0000-0000-0000-000000000001'},
        'USER_DELETED',
        'USER',
        ${userId},
        ${auditDetails},
        NOW()
      );
    `

    return NextResponse.json({
      success: true,
      message: `User ${targetUser.name} deleted successfully via Pure SQL.`,
    })
  } catch (error: any) {
    console.error('Error deleting user (Pure SQL):', error)
    return NextResponse.json({ error: error?.message || 'Failed to delete user.' }, { status: 500 })
  }
}
