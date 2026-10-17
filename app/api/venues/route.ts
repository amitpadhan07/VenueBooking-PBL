import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/venues
 * Pure SQL query returning all venues ordered by name.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')

    let venues
    if (status && type) {
      venues = await prisma.$queryRaw<Array<any>>`
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
        WHERE status = ${status}::"VenueStatus" AND venue_type = ${type}
        ORDER BY venue_name ASC;
      `
    } else if (status) {
      venues = await prisma.$queryRaw<Array<any>>`
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
        WHERE status = ${status}::"VenueStatus"
        ORDER BY venue_name ASC;
      `
    } else if (type) {
      venues = await prisma.$queryRaw<Array<any>>`
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
        WHERE venue_type = ${type}
        ORDER BY venue_name ASC;
      `
    } else {
      venues = await prisma.$queryRaw<Array<any>>`
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
        ORDER BY venue_name ASC;
      `
    }

    return NextResponse.json({
      success: true,
      count: venues.length,
      venues,
    })
  } catch (error: any) {
    console.error('Error in GET /api/venues (Pure SQL):', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch venues.' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/venues
 * Pure SQL query adding a new venue. Restricted to ADMIN role.
 */
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    const demoRole = request.headers.get('x-demo-role')
    const isAdmin = authUser?.role === 'ADMIN' || demoRole?.toLowerCase() === 'admin'

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden. Admin privileges required to create venues.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, venue_name, location, capacity, type, venue_type, description, status } = body

    const finalName = (name || venue_name || '').trim()
    const finalLocation = (location || '').trim()
    const finalCapacity = parseInt(String(capacity), 10)
    const finalType = (type || venue_type || 'Auditorium').trim()
    const finalDescription = (description || '').trim()
    const finalStatus = (status || 'ACTIVE').toUpperCase()

    if (!finalName || !finalLocation || isNaN(finalCapacity) || finalCapacity <= 0) {
      return NextResponse.json(
        { error: 'Venue name, location, and valid positive capacity are required.' },
        { status: 400 }
      )
    }

    // Pure SQL INSERT INTO venues
    const insertedVenues = await prisma.$queryRaw<Array<any>>`
      INSERT INTO venues (
        venue_id, venue_name, location, capacity, venue_type, description, status, created_at, updated_at
      )
      VALUES (
        gen_random_uuid()::text,
        ${finalName},
        ${finalLocation},
        ${finalCapacity},
        ${finalType},
        ${finalDescription},
        ${finalStatus}::"VenueStatus",
        NOW(),
        NOW()
      )
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

    const newVenue = insertedVenues[0]

    // Audit log pure SQL insert
    const detailsJson = JSON.stringify({
      venueId: newVenue.venue_id,
      venueName: newVenue.venue_name,
      capacity: newVenue.capacity,
      createdBy: authUser?.userId || 'ADMIN_SYSTEM',
    })

    await prisma.$executeRaw`
      INSERT INTO audit_logs (
        log_id, user_id, action, entity_type, entity_id, details, created_at
      )
      VALUES (
        gen_random_uuid()::text,
        ${authUser?.userId || '00000000-0000-0000-0000-000000000001'},
        'VENUE_CREATED',
        'VENUE',
        ${newVenue.venue_id},
        ${detailsJson},
        NOW()
      );
    `

    return NextResponse.json({
      success: true,
      message: 'Venue created successfully via Pure SQL.',
      venue: newVenue,
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error in POST /api/venues (Pure SQL):', error)
    if (error?.message?.includes('venues_venue_name_key') || error?.code === '23505') {
      return NextResponse.json(
        { error: 'A venue with this name already exists in the system.' },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: error?.message || 'Failed to create venue.' },
      { status: 500 }
    )
  }
}
