import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyPassword, signToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/**
 * POST /api/auth/login
 * Pure SQL query authenticating credentials with bcrypt verification and audit logging.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    // 1. Look up user by unique email in PostgreSQL via raw SQL LEFT JOIN
    const userRows = await prisma.$queryRaw<Array<{
      user_id: string
      name: string
      email: string
      password_hash: string
      role: any
      department: string
      phone: string | null
      employee_id: string | null
      employee_code: string | null
      designation: string | null
    }>>`
      SELECT 
        u.user_id, u.name, u.email, u.password_hash, u.role, u.department, u.phone,
        e.employee_id, e.employee_code, e.designation
      FROM users u
      LEFT JOIN employees e ON u.user_id = e.user_id
      WHERE u.email = ${normalizedEmail}
      LIMIT 1;
    `
    const user = userRows[0]

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      )
    }

    // 2. Cryptographic password verification using bcrypt
    const isPasswordValid = await verifyPassword(password, user.password_hash)
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      )
    }

    // 3. Issue signed JWT token
    const token = signToken({
      userId: user.user_id,
      email: user.email,
      role: user.role,
      name: user.name,
    })

    // 4. Record Audit Log in SQL for Non-Repudiation
    const detailsJson = JSON.stringify({
      email: user.email,
      role: user.role,
      employeeId: user.employee_id || null,
      authMethod: 'PASSWORD_BCRYPT',
      userAgent: request.headers.get('user-agent') || 'Unknown',
    })

    await prisma.$executeRaw`
      INSERT INTO audit_logs (
        log_id, user_id, action, entity_type, entity_id, details, created_at
      )
      VALUES (
        gen_random_uuid()::text, ${user.user_id}, 'LOGIN', 'USER',
        ${user.user_id}, ${detailsJson}, NOW()
      );
    `

    const response = NextResponse.json({
      success: true,
      message: 'Authentication successful (SQL Verified).',
      token,
      user: {
        userId: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        employeeCode: user.employee_code || null,
        designation: user.designation || null,
      },
    })

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    })

    return response
  } catch (error: any) {
    console.error('Error in SQL POST /api/auth/login:', error)
    return NextResponse.json(
      { error: error?.message || 'Authentication failed.' },
      { status: 500 }
    )
  }
}
