import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export const PRESET_QUERIES = [
  {
    id: 'join-bookings-users-venues',
    title: 'Multi-Table INNER JOIN (Bookings ⋈ Users ⋈ Venues)',
    description: 'Retrieves all event bookings along with student requester profiles and venue capacities.',
    sql: `SELECT 
  b.booking_id, 
  b.event_name, 
  u.name AS requester, 
  u.department, 
  v.venue_name, 
  v.capacity, 
  b.event_date::text, 
  b.start_time, 
  b.end_time, 
  b.status
FROM bookings b
JOIN users u ON b.user_id = u.user_id
JOIN venues v ON b.venue_id = v.venue_id
ORDER BY b.created_at DESC
LIMIT 10;`,
  },
  {
    id: 'authority-matrix-join',
    title: 'Venue Authority Matrix JOIN (Employees ⋈ Venues)',
    description: 'Displays the relational mapping of which campus staff is authorized to approve which venue.',
    sql: `SELECT 
  va.authority_id, 
  e.employee_code, 
  u.name AS employee_name, 
  e.designation, 
  v.venue_name, 
  v.location, 
  va.status
FROM venue_authority va
JOIN employees e ON va.employee_id = e.employee_id
JOIN users u ON e.user_id = u.user_id
JOIN venues v ON va.venue_id = v.venue_id;`,
  },
  {
    id: 'dept-aggregation',
    title: 'Departmental Aggregation & GROUP BY',
    description: 'Computes total venue reservation requests aggregated across academic departments.',
    sql: `SELECT 
  u.department, 
  COUNT(b.booking_id)::int AS total_requests,
  COUNT(CASE WHEN b.status = 'APPROVED' THEN 1 END)::int AS approved_count,
  COUNT(CASE WHEN b.status = 'PENDING' THEN 1 END)::int AS pending_count
FROM users u
LEFT JOIN bookings b ON u.user_id = b.user_id
GROUP BY u.department
ORDER BY total_requests DESC;`,
  },
  {
    id: 'venue-utilization',
    title: 'Venue Utilization & Status Breakdown',
    description: 'Aggregates booking density per physical facility.',
    sql: `SELECT 
  v.venue_name, 
  v.capacity, 
  v.venue_type, 
  COUNT(b.booking_id)::int AS total_bookings, 
  v.status
FROM venues v
LEFT JOIN bookings b ON v.venue_id = b.venue_id
GROUP BY v.venue_id, v.venue_name, v.capacity, v.venue_type, v.status
ORDER BY total_bookings DESC;`,
  },
  {
    id: 'available-venues-subquery',
    title: 'Unreserved Venues (Subquery with NOT IN)',
    description: 'Finds venues currently having zero conflicting active bookings.',
    sql: `SELECT 
  v.venue_id, 
  v.venue_name, 
  v.capacity, 
  v.location
FROM venues v
WHERE v.venue_id NOT IN (
  SELECT DISTINCT venue_id FROM bookings WHERE status IN ('APPROVED', 'PENDING')
);`,
  },
]

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { queryId, customSql } = body

    let sqlToExecute = customSql
    if (queryId) {
      const preset = PRESET_QUERIES.find((q) => q.id === queryId)
      if (preset) sqlToExecute = preset.sql
    }

    if (!sqlToExecute || typeof sqlToExecute !== 'string') {
      return NextResponse.json({ error: 'SQL query text is required.' }, { status: 400 })
    }

    // Security Guard: Only allow SELECT queries in this academic lab
    const trimmed = sqlToExecute.trim()
    if (!trimmed.toLowerCase().startsWith('select')) {
      return NextResponse.json(
        { error: 'Academic Lab Security: Only SELECT queries are permitted in this live playground.' },
        { status: 403 }
      )
    }

    const startTime = performance.now()
    const rows: any[] = await prisma.$queryRawUnsafe(sqlToExecute)
    const durationMs = Math.round((performance.now() - startTime) * 100) / 100

    const columns = rows.length > 0 ? Object.keys(rows[0]) : []

    return NextResponse.json({
      success: true,
      query: sqlToExecute,
      durationMs,
      rowCount: rows.length,
      columns,
      rows,
    })
  } catch (error: any) {
    console.error('SQL query execution error:', error)
    return NextResponse.json(
      { error: error?.message || 'SQL execution failed.' },
      { status: 500 }
    )
  }
}
