import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyPassword, signToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

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

    // 1. Look up user by unique email in PostgreSQL
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        employee: true,
      },
    })

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

    // 4. Record Audit Log for Non-Repudiation
    await prisma.auditLog.create({
      data: {
        user_id: user.user_id,
        action: 'LOGIN',
        entity_type: 'USER',
        entity_id: user.user_id,
        details: JSON.stringify({
          email: user.email,
          role: user.role,
          employeeId: user.employee?.employee_id || null,
          authMethod: 'PASSWORD_BCRYPT',
          userAgent: request.headers.get('user-agent') || 'Unknown',
        }),
      },
    })

    const response = NextResponse.json({
      success: true,
      message: 'Authentication successful.',
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        phone: user.phone,
        employee_id: user.employee?.employee_id || null,
        employee_code: user.employee?.employee_code || null,
      },
      token,
    })

    // 5. Store session in HTTP-only cookie
    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return response
  } catch (error: any) {
    console.error('Error in POST /api/auth/login:', error)
    return NextResponse.json(
      { error: error?.message || 'Authentication error.' },
      { status: 500 }
    )
  }
}
