import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { hashPassword, signToken } from '@/lib/auth'
import { Role } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password, department, phone, role } = body

    if (!name || !email || !password || !department) {
      return NextResponse.json(
        { error: 'Name, email, password, and department are required fields.' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email address already exists.' },
        { status: 409 }
      )
    }

    // Determine Role
    let assignedRole: Role = Role.STUDENT
    if (role) {
      const upperRole = String(role).toUpperCase()
      if (['STUDENT', 'FACULTY', 'EMPLOYEE', 'ADMIN'].includes(upperRole)) {
        assignedRole = upperRole as Role
      }
    }

    // Hash password with bcrypt (10 rounds)
    const passwordHash = await hashPassword(password)

    // Create user in database
    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password_hash: passwordHash,
        role: assignedRole,
        department: department.trim(),
        phone: phone ? phone.trim() : null,
      },
    })

    // If Employee, auto-provision employee profile
    if (assignedRole === Role.EMPLOYEE) {
      const empCode = `EMP_${Math.floor(1000 + Math.random() * 9000)}`
      await prisma.employee.create({
        data: {
          user_id: newUser.user_id,
          employee_code: empCode,
          designation: 'Department Staff',
          department: newUser.department,
          status: 'ACTIVE',
        },
      })
    }

    // Non-repudiation: Audit log record
    await prisma.auditLog.create({
      data: {
        user_id: newUser.user_id,
        action: 'USER_REGISTERED',
        entity_type: 'USER',
        entity_id: newUser.user_id,
        details: JSON.stringify({
          email: newUser.email,
          role: newUser.role,
          department: newUser.department,
          method: 'BCRYPT_10_ROUNDS',
        }),
      },
    })

    // Sign JWT Token
    const token = signToken({
      userId: newUser.user_id,
      email: newUser.email,
      role: newUser.role,
      name: newUser.name,
    })

    const response = NextResponse.json(
      {
        success: true,
        message: 'Account registered successfully.',
        user: {
          user_id: newUser.user_id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          department: newUser.department,
          phone: newUser.phone,
        },
        token,
      },
      { status: 201 }
    )

    // Set secure HTTP-only cookie
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
    console.error('Error in POST /api/auth/register:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error during registration.' },
      { status: 500 }
    )
  }
}
