import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { hashPassword, signToken } from '@/lib/auth'
import { Role } from '@prisma/client'

export const dynamic = 'force-dynamic'

/**
 * POST /api/auth/register
 * Pure SQL query validating uniqueness, inserting user and employee profile, and recording audit trail.
 */
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

    // 1. Check if user already exists via raw SQL
    const existingRows = await prisma.$queryRaw<Array<{ user_id: string }>>`
      SELECT user_id FROM users WHERE email = ${normalizedEmail} LIMIT 1;
    `

    if (existingRows.length > 0) {
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

    // 2. Insert user into database via raw SQL
    const insertedUsers = await prisma.$queryRaw<Array<{
      user_id: string
      name: string
      email: string
      role: any
      department: string
    }>>`
      INSERT INTO users (
        user_id, name, email, password_hash, role, department, phone, created_at, updated_at
      )
      VALUES (
        gen_random_uuid()::text, ${name.trim()}, ${normalizedEmail}, ${passwordHash}, 
        ${assignedRole}::"Role", ${department.trim()}, ${phone ? phone.trim() : null}, NOW(), NOW()
      )
      RETURNING user_id, name, email, role, department;
    `
    const newUser = insertedUsers[0]

    // 3. If Employee, auto-provision employee profile via raw SQL
    if (assignedRole === Role.EMPLOYEE) {
      const empCode = `EMP_${Math.floor(1000 + Math.random() * 9000)}`
      await prisma.$executeRaw`
        INSERT INTO employees (
          employee_id, user_id, employee_code, designation, department, status, created_at
        )
        VALUES (
          gen_random_uuid()::text, ${newUser.user_id}, ${empCode}, 'Department Staff', ${newUser.department}, 'ACTIVE', NOW()
        );
      `
    }

    // 4. Non-repudiation: Audit log record via raw SQL
    const detailsJson = JSON.stringify({
      email: newUser.email,
      role: newUser.role,
      department: newUser.department,
      method: 'BCRYPT_10_ROUNDS',
    })

    await prisma.$executeRaw`
      INSERT INTO audit_logs (
        log_id, user_id, action, entity_type, entity_id, details, created_at
      )
      VALUES (
        gen_random_uuid()::text, ${newUser.user_id}, 'USER_REGISTERED', 'USER',
        ${newUser.user_id}, ${detailsJson}, NOW()
      );
    `

    // 5. Issue token
    const token = signToken({
      userId: newUser.user_id,
      email: newUser.email,
      role: newUser.role,
      name: newUser.name,
    })

    const response = NextResponse.json({
      success: true,
      message: 'Account registered successfully via SQL.',
      token,
      user: {
        userId: newUser.user_id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        department: newUser.department,
      },
    }, { status: 201 })

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24,
    })

    return response
  } catch (error: any) {
    console.error('Error in SQL POST /api/auth/register:', error)
    return NextResponse.json(
      { error: error?.message || 'Registration failed.' },
      { status: 500 }
    )
  }
}
