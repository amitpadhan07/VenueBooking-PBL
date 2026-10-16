import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { Role } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)

    let targetUserId = authUser?.userId

    // If no JWT session token, check demo header or fallback to representative role
    if (!targetUserId) {
      const demoRole = request.headers.get('x-demo-role')
      if (demoRole) {
        let prismaRole: Role = Role.ADMIN
        if (demoRole.toLowerCase() === 'student') prismaRole = Role.STUDENT
        else if (demoRole.toLowerCase() === 'employee') prismaRole = Role.EMPLOYEE

        // Pure SQL query for fallback demo user lookup
        const sampleUsers = await prisma.$queryRaw<Array<{ user_id: string }>>`
          SELECT user_id FROM users 
          WHERE role = ${prismaRole}::"Role" 
          ORDER BY created_at ASC 
          LIMIT 1;
        `
        targetUserId = sampleUsers[0]?.user_id
      }
    }

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'Not authenticated. Please log in.' },
        { status: 401 }
      )
    }

    // Pure SQL Query: Relational LEFT JOIN between users and employees
    const userRows = await prisma.$queryRaw<Array<{
      user_id: string
      name: string
      email: string
      role: Role
      department: string | null
      phone: string | null
      created_at: Date
      employee_id: string | null
      employee_code: string | null
      designation: string | null
    }>>`
      SELECT 
        u.user_id,
        u.name,
        u.email,
        u.role,
        u.department,
        u.phone,
        u.created_at,
        e.employee_id,
        e.employee_code,
        e.designation
      FROM users u
      LEFT JOIN employees e ON u.user_id = e.user_id
      WHERE u.user_id = ${targetUserId}
      LIMIT 1;
    `

    const user = userRows[0]
    if (!user) {
      return NextResponse.json(
        { error: 'User profile not found.' },
        { status: 404 }
      )
    }

    // If employee profile exists, fetch authorized venues via pure SQL INNER JOIN
    let authorizedVenues: Array<{
      authorityId: string
      venueId: string
      venueName: string
      capacity: number
      location: string
    }> = []

    if (user.employee_id) {
      const authRows = await prisma.$queryRaw<Array<{
        authority_id: string
        venue_id: string
        venue_name: string
        capacity: number
        location: string
      }>>`
        SELECT 
          va.authority_id,
          v.venue_id,
          v.venue_name,
          v.capacity,
          v.location
        FROM venue_authority va
        INNER JOIN venues v ON va.venue_id = v.venue_id
        WHERE va.employee_id = ${user.employee_id} 
          AND va.status = 'ACTIVE'::"AuthorityStatus";
      `
      authorizedVenues = authRows.map((r) => ({
        authorityId: r.authority_id,
        venueId: r.venue_id,
        venueName: r.venue_name,
        capacity: r.capacity,
        location: r.location,
      }))
    }

    return NextResponse.json({
      success: true,
      user: {
        userId: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        phone: user.phone,
        employee: user.employee_id
          ? {
              employeeId: user.employee_id,
              employeeCode: user.employee_code,
              designation: user.designation,
              authorizedVenues,
            }
          : null,
      },
    })
  } catch (error: any) {
    console.error('Error in GET /api/auth/me:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to retrieve profile.' },
      { status: 500 }
    )
  }
}
