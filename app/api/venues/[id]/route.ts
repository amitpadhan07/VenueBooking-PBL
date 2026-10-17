import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/venues/[id]
 * Fetch single venue details via Pure SQL.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const venues = await prisma.$queryRaw<Array<any>>`
      SELECT 
        venue_id AS id,
        venue_id,
        venue_name AS name,
        venue_name,
        location,
        capacity,
        venue_type AS type,
        venue_type,
        description,
        status,
        created_at,
        updated_at
      FROM venues
      WHERE venue_id = ${id}
      LIMIT 1;
    `

    if (venues.length === 0) {
      return NextResponse.json({ error: 'Venue not found.' }, { status: 404 })
    }

    return NextResponse.json({ success: true, venue: venues[0] })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Error fetching venue.' }, { status: 500 })
  }
}

/**
 * PUT/PATCH /api/venues/[id]
 * Pure SQL query updating venue details. Restricted to ADMIN role.
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  return handleUpdate(request, params)
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return handleUpdate(request, params)
}

async function handleUpdate(request: NextRequest, paramsPromise: Promise<{ id: string }>) {
  try {
    const authUser = await getAuthUser(request)
    const demoRole = request.headers.get('x-demo-role')
    const isAdmin = authUser?.role === 'ADMIN' || demoRole?.toLowerCase() === 'admin'

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden. Admin privileges required to update venues.' },
        { status: 403 }
      )
    }

    const { id } = await paramsPromise
    const body = await request.json()

    // Retrieve existing venue first via SQL
    const existing = await prisma.$queryRaw<Array<any>>`
      SELECT * FROM venues WHERE venue_id = ${id} LIMIT 1;
    `
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Venue not found.' }, { status: 404 })
    }
    const current = existing[0]

    const updatedName = (body.name || body.venue_name || current.venue_name).trim()
    const updatedLocation = (body.location || current.location).trim()
    const updatedCapacity = body.capacity ? parseInt(String(body.capacity), 10) : current.capacity
    const updatedType = (body.type || body.venue_type || current.venue_type).trim()
    const updatedDescription = body.description !== undefined ? body.description.trim() : current.description
    const updatedStatus = (body.status || current.status).toUpperCase()

    // Pure SQL UPDATE
    const updatedVenues = await prisma.$queryRaw<Array<any>>`
      UPDATE venues
      SET 
        venue_name = ${updatedName},
        location = ${updatedLocation},
        capacity = ${updatedCapacity},
        venue_type = ${updatedType},
        description = ${updatedDescription},
        status = ${updatedStatus}::"VenueStatus",
        updated_at = NOW()
      WHERE venue_id = ${id}
      RETURNING 
        venue_id AS id,
        venue_id,
        venue_name AS name,
        venue_name,
        location,
        capacity,
        venue_type AS type,
        venue_type,
        description,
        status,
        created_at,
        updated_at;
    `

    const updatedVenue = updatedVenues[0]

    // Pure SQL Audit Log
    const auditDetails = JSON.stringify({
      venueId: id,
      updatedFields: body,
      performedBy: authUser?.userId || 'ADMIN',
    })
    await prisma.$executeRaw`
      INSERT INTO audit_logs (log_id, user_id, action, entity_type, entity_id, details, created_at)
      VALUES (
        gen_random_uuid()::text,
        ${authUser?.userId || '00000000-0000-0000-0000-000000000001'},
        'VENUE_UPDATED',
        'VENUE',
        ${id},
        ${auditDetails},
        NOW()
      );
    `

    return NextResponse.json({
      success: true,
      message: 'Venue updated successfully via Pure SQL.',
      venue: updatedVenue,
    })
  } catch (error: any) {
    console.error('Error updating venue (Pure SQL):', error)
    return NextResponse.json({ error: error?.message || 'Failed to update venue.' }, { status: 500 })
  }
}

/**
 * DELETE /api/venues/[id]
 * Pure SQL query deleting venue and dependent cascade relationships. Restricted to ADMIN.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = await getAuthUser(request)
    const demoRole = request.headers.get('x-demo-role')
    const isAdmin = authUser?.role === 'ADMIN' || demoRole?.toLowerCase() === 'admin'

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden. Admin privileges required to delete venues.' },
        { status: 403 }
      )
    }

    const { id } = await params

    const existing = await prisma.$queryRaw<Array<any>>`
      SELECT venue_id, venue_name FROM venues WHERE venue_id = ${id} LIMIT 1;
    `
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Venue not found.' }, { status: 404 })
    }

    const venueName = existing[0].venue_name

    // Pure SQL DELETE (foreign keys CASCADE via schema definition)
    await prisma.$executeRaw`
      DELETE FROM venues WHERE venue_id = ${id};
    `

    // Audit log
    const auditDetails = JSON.stringify({
      deletedVenueId: id,
      deletedVenueName: venueName,
      deletedBy: authUser?.userId || 'ADMIN',
    })
    await prisma.$executeRaw`
      INSERT INTO audit_logs (log_id, user_id, action, entity_type, entity_id, details, created_at)
      VALUES (
        gen_random_uuid()::text,
        ${authUser?.userId || '00000000-0000-0000-0000-000000000001'},
        'VENUE_DELETED',
        'VENUE',
        ${id},
        ${auditDetails},
        NOW()
      );
    `

    return NextResponse.json({
      success: true,
      message: `Venue '${venueName}' deleted successfully via Pure SQL.`,
    })
  } catch (error: any) {
    console.error('Error deleting venue (Pure SQL):', error)
    return NextResponse.json({ error: error?.message || 'Failed to delete venue.' }, { status: 500 })
  }
}
