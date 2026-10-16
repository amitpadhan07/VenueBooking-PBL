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

        const sampleUser = await prisma.user.findFirst({
          where: { role: prismaRole },
          orderBy: { created_at: 'asc' },
        })
        targetUserId = sampleUser?.user_id
      }
    }

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'Not authenticated. Please log in.' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { user_id: targetUserId },
      select: {
        user_id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        phone: true,
        created_at: true,
        employee: {
          select: {
            employee_id: true,
            employee_code: true,
            designation: true,
            department: true,
            authorities: {
              where: { status: 'ACTIVE' },
              include: {
                venue: {
                  select: {
                    venue_id: true,
                    venue_name: true,
                    capacity: true,
                    location: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User profile not found.' },
        { status: 404 }
      )
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
        employee: user.employee
          ? {
              employeeId: user.employee.employee_id,
              employeeCode: user.employee.employee_code,
              designation: user.employee.designation,
              authorizedVenues: user.employee.authorities.map((a) => ({
                authorityId: a.authority_id,
                venueId: a.venue.venue_id,
                venueName: a.venue.venue_name,
                capacity: a.venue.capacity,
                location: a.venue.location,
              })),
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
