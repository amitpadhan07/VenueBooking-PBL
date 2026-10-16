import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/audit-logs
 * Defense Requirement: Audit Trail & Tamper-Evident Logging
 * Provides non-repudiation and immutable transaction records
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const actionFilter = searchParams.get('action')
    const limitParam = parseInt(searchParams.get('limit') || '50', 10)

    const whereClause: any = {}
    if (actionFilter && actionFilter !== 'ALL') {
      whereClause.action = actionFilter
    }

    const logs = await prisma.auditLog.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            role: true,
            department: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
      take: limitParam,
    })

    const totalCount = await prisma.auditLog.count()

    return NextResponse.json({
      success: true,
      totalCount,
      logs: logs.map((log) => ({
        logId: log.log_id,
        action: log.action,
        entityType: log.entity_type,
        entityId: log.entity_id,
        details: log.details ? (log.details.startsWith('{') ? JSON.parse(log.details) : log.details) : null,
        userName: log.user?.name || 'System / Anonymous',
        userEmail: log.user?.email || 'N/A',
        userRole: log.user?.role || 'N/A',
        createdAt: log.created_at.toISOString(),
      })),
    })
  } catch (error: any) {
    console.error('Error in GET /api/audit-logs:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch audit trail.' },
      { status: 500 }
    )
  }
}
