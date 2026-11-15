import { NextRequest, NextResponse } from 'next/server'
import { GET as getSummary } from './summary/route'
import { GET as getUtilization } from './venue-utilization/route'
import { GET as getDepartmentStats } from './department-stats/route'
import { GET as getPeakHours } from './peak-hours/route'

export const dynamic = 'force-dynamic'

/**
 * 📈 GET /api/reports
 * Lead Developer: Lavanya Joshi
 * Consolidated Reports Endpoint returning summary, venue utilization, department distribution, and peak hours.
 */
export async function GET(request: NextRequest) {
  try {
    const [summaryRes, utilRes, deptRes, peakRes] = await Promise.all([
      getSummary(request),
      getUtilization(request),
      getDepartmentStats(request),
      getPeakHours(request),
    ])

    const summaryData = await summaryRes.json()
    const utilData = await utilRes.json()
    const deptData = await deptRes.json()
    const peakData = await peakRes.json()

    return NextResponse.json({
      success: true,
      summary: summaryData.summary,
      utilization: utilData.utilization,
      departments: deptData.departments,
      peakHours: peakData.peakHours,
      peakSlot: peakData.peakSlot,
      maxHourlyDemand: peakData.maxHourlyDemand,
      sqlMeta: {
        author: 'Lavanya Joshi',
        modules: ['Summary CTE', 'Utilization JOIN', 'Department GROUP BY', 'Peak Hours generate_series'],
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to aggregate reports data' },
      { status: 500 }
    )
  }
}
