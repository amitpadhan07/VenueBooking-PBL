import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/audit-logs
 * Pure SQL query fetching immutable audit trail with LEFT JOIN on users directory.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const actionFilter = searchParams.get('action')
    const limitParam = parseInt(searchParams.get('limit') || '50', 10)

    let query = `
      SELECT 
        al.log_id, al.action, al.entity_type, al.entity_id, al.details, al.created_at::text,
        u.name AS user_name, u.email AS user_email, u.role AS user_role
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.user_id
      WHERE 1=1
    `
    const params: any[] = []

    if (actionFilter && actionFilter !== 'ALL') {
      params.push(actionFilter)
      query += ` AND al.action = $${params.length}`
    }

    params.push(Math.min(limitParam, 100))
    query += ` ORDER BY al.created_at DESC LIMIT $${params.length};`

    const logs: any[] = await prisma.$queryRawUnsafe(query, ...params)

    const countRows = await prisma.$queryRaw<Array<{ total: number }>>`
      SELECT COUNT(*)::int AS total FROM audit_logs;
    `
    const totalCount = countRows[0]?.total ?? logs.length

    return NextResponse.json({
      success: true,
      totalCount,
      logs: logs.map((log) => ({
        logId: log.log_id,
        action: log.action,
        entityType: log.entity_type,
        entityId: log.entity_id,
        details: log.details ? (log.details.startsWith('{') ? JSON.parse(log.details) : log.details) : null,
        userName: log.user_name || 'System / Anonymous',
        userEmail: log.user_email || 'N/A',
        userRole: log.user_role || 'N/A',
        createdAt: log.created_at,
      })),
    })
  } catch (error: any) {
    console.error('Error in SQL GET /api/audit-logs:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch audit trail.' },
      { status: 500 }
    )
  }
}
