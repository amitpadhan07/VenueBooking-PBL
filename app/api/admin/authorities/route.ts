import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { AuthorityStatus, Role } from '@prisma/client'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/authorities
 * Retrieve complete Venue Authority Matrix: (Employees ⋈ VenueAuthorities ⋈ Venues)
 */
export async function GET(request: NextRequest) {
  try {
    const authorities = await prisma.venueAuthority.findMany({
      include: {
        employee: {
          include: {
            user: {
              select: {
                user_id: true,
                name: true,
                email: true,
                department: true,
              },
            },
          },
        },
        venue: {
          select: {
            venue_id: true,
            venue_name: true,
            venue_type: true,
            capacity: true,
            location: true,
          },
        },
        assigner: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { assigned_at: 'desc' },
    })

    const employees = await prisma.employee.findMany({
      where: { status: 'ACTIVE' },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            department: true,
          },
        },
      },
    })

    const venues = await prisma.venue.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { venue_name: 'asc' },
    })

    return NextResponse.json({
      success: true,
      matrix: authorities.map((a) => ({
        authorityId: a.authority_id,
        employeeId: a.employee_id,
        employeeName: a.employee.user.name,
        employeeCode: a.employee.employee_code,
        designation: a.employee.designation,
        department: a.employee.department,
        venueId: a.venue_id,
        venueName: a.venue.venue_name,
        venueType: a.venue.venue_type,
        capacity: a.venue.capacity,
        location: a.venue.location,
        status: a.status,
        assignedBy: a.assigner.name,
        assignedAt: a.assigned_at.toISOString(),
      })),
      employees: employees.map((e) => ({
        employeeId: e.employee_id,
        userId: e.user_id,
        name: e.user.name,
        email: e.user.email,
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
    console.error('Error in GET /api/admin/authorities:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch authority matrix.' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/authorities
 * Admin delegates authority over a specific venue to an employee
 * Business Rule: Enforces composite uniqueness (employee_id, venue_id)
 */
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    const body = await request.json()
    const { employeeId, venueId } = body

    if (!employeeId || !venueId) {
      return NextResponse.json(
        { error: 'Employee ID and Venue ID are required.' },
        { status: 400 }
      )
    }

    // Identify assigner (Admin)
    let assignerId = authUser?.userId
    if (!assignerId) {
      const adminUser = await prisma.user.findFirst({ where: { role: Role.ADMIN } })
      assignerId = adminUser?.user_id
    }

    if (!assignerId) {
      return NextResponse.json(
        { error: 'No administrator account found to authorize delegation.' },
        { status: 403 }
      )
    }

    // Verify employee and venue exist
    const employee = await prisma.employee.findUnique({
      where: { employee_id: employeeId },
      include: { user: true },
    })

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found.' }, { status: 404 })
    }

    const venue = await prisma.venue.findUnique({
      where: { venue_id: venueId },
    })

    if (!venue) {
      return NextResponse.json({ error: 'Venue not found.' }, { status: 404 })
    }

    // Upsert to handle unique constraint (employee_id, venue_id)
    const authority = await prisma.venueAuthority.upsert({
      where: {
        employee_id_venue_id: {
          employee_id: employeeId,
          venue_id: venueId,
        },
      },
      update: {
        status: AuthorityStatus.ACTIVE,
        assigned_by: assignerId,
        assigned_at: new Date(),
      },
      create: {
        employee_id: employeeId,
        venue_id: venueId,
        assigned_by: assignerId,
        status: AuthorityStatus.ACTIVE,
      },
    })

    // Create Notification for the assigned employee
    await prisma.notification.create({
      data: {
        user_id: employee.user_id,
        title: 'Venue Authority Delegated',
        message: `You have been delegated approval authority for ${venue.venue_name}.`,
        notification_type: 'VENUE_AUTHORITY_ASSIGNED',
      },
    })

    // Tamper-Evident Audit Trail
    await prisma.auditLog.create({
      data: {
        user_id: assignerId,
        action: 'VENUE_AUTHORITY_ASSIGNED',
        entity_type: 'VENUE_AUTHORITY',
        entity_id: authority.authority_id,
        details: JSON.stringify({
          employeeId: employee.employee_id,
          employeeName: employee.user.name,
          venueId: venue.venue_id,
          venueName: venue.venue_name,
          delegatedAt: new Date().toISOString(),
        }),
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: `Authority over ${venue.venue_name} granted to ${employee.user.name}.`,
        authority,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error in POST /api/admin/authorities:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to assign venue authority.' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/authorities
 * Revoke authority over a venue
 */
export async function DELETE(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    const { searchParams } = new URL(request.url)
    const authorityId = searchParams.get('id')

    if (!authorityId) {
      return NextResponse.json(
        { error: 'Authority ID parameter is required.' },
        { status: 400 }
      )
    }

    const authority = await prisma.venueAuthority.findUnique({
      where: { authority_id: authorityId },
      include: {
        employee: { include: { user: true } },
        venue: true,
      },
    })

    if (!authority) {
      return NextResponse.json({ error: 'Authority record not found.' }, { status: 404 })
    }

    // Transition status to REVOKED
    const updated = await prisma.venueAuthority.update({
      where: { authority_id: authorityId },
      data: { status: AuthorityStatus.REVOKED },
    })

    // Audit Log for revocation
    await prisma.auditLog.create({
      data: {
        user_id: authUser?.userId || authority.assigned_by,
        action: 'VENUE_AUTHORITY_REVOKED',
        entity_type: 'VENUE_AUTHORITY',
        entity_id: authority.authority_id,
        details: JSON.stringify({
          employeeId: authority.employee_id,
          employeeName: authority.employee.user.name,
          venueId: authority.venue_id,
          venueName: authority.venue.venue_name,
          revokedAt: new Date().toISOString(),
        }),
      },
    })

    // Notification for employee
    await prisma.notification.create({
      data: {
        user_id: authority.employee.user_id,
        title: 'Venue Authority Revoked',
        message: `Your administrative approval authority for ${authority.venue.venue_name} has been revoked.`,
        notification_type: 'VENUE_AUTHORITY_REVOKED',
      },
    })

    return NextResponse.json({
      success: true,
      message: `Authority over ${authority.venue.venue_name} revoked for ${authority.employee.user.name}.`,
      authority: updated,
    })
  } catch (error: any) {
    console.error('Error in DELETE /api/admin/authorities:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to revoke authority.' },
      { status: 500 }
    )
  }
}
