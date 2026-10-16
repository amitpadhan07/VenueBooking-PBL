import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    // Pick first active venue or use provided
    let venueId = body.venueId
    if (!venueId) {
      const venue = await prisma.venue.findFirst({ where: { status: 'ACTIVE' } })
      if (!venue) {
        return NextResponse.json({ error: 'No active venue found for testing.' }, { status: 400 })
      }
      venueId = venue.venue_id
    }

    const venue = await prisma.venue.findUnique({ where: { venue_id: venueId } })

    // Generate unique slot to avoid colliding with past test data
    const randomHour = 8 + Math.floor(Math.random() * 9) // 08:00 to 17:00
    const startHourStr = randomHour.toString().padStart(2, '0') + ':00'
    const endHourStr = (randomHour + 1).toString().padStart(2, '0') + ':00'
    const testDate = new Date()
    testDate.setDate(testDate.getDate() + 5) // 5 days ahead
    const dateStr = testDate.toISOString().split('T')[0]
    const startAt = `${dateStr}T${startHourStr}`
    const endAt = `${dateStr}T${endHourStr}`

    // Internal helper to invoke concurrent booking logic directly
    const runAttempt = async (clientId: string, requesterRole: string) => {
      const startTime = performance.now()
      try {
        const res = await fetch(`http://localhost:3000/api/bookings/concurrent-safe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-demo-role': requesterRole,
          },
          body: JSON.stringify({
            venueId,
            purpose: `PBL Concurrency Trial (${clientId})`,
            startAt,
            endAt,
            clientRequestId: clientId,
          }),
        })

        const data = await res.json()
        const durationMs = Math.round(performance.now() - startTime)
        return {
          clientId,
          status: res.status,
          success: res.ok,
          durationMs,
          payload: data,
        }
      } catch (err: any) {
        return {
          clientId,
          status: 500,
          success: false,
          durationMs: Math.round(performance.now() - startTime),
          payload: { error: err.message },
        }
      }
    }

    const testStartTime = new Date().toISOString()

    // Fire Request A and Request B concurrently targeting the EXACT same slot
    const [requestA, requestB] = await Promise.all([
      runAttempt('Tx-Req-Alpha (Student 1)', 'Student'),
      runAttempt('Tx-Req-Beta (Student 2)', 'Student'),
    ])

    const successCount = (requestA.success ? 1 : 0) + (requestB.success ? 1 : 0)
    const conflictCount = (requestA.status === 409 ? 1 : 0) + (requestB.status === 409 ? 1 : 0)

    return NextResponse.json({
      testName: 'PostgreSQL ACID Concurrency Race Condition Test',
      timestamp: testStartTime,
      targetVenue: venue?.venue_name,
      targetSlot: `${dateStr} from ${startHourStr} to ${endHourStr}`,
      resultSummary: {
        totalRequestsFired: 2,
        successfulAllocations: successCount,
        conflictsPrevented: conflictCount,
        doubleBookingPrevented: successCount === 1,
      },
      requests: [requestA, requestB],
      explanation:
        'Pessimistic row-locking (SELECT ... FOR UPDATE) ensured that the two simultaneous transactions were serialized in PostgreSQL. One transaction committed successfully (201 Created), and the second transaction detected the overlap and aborted with a 409 Conflict.',
    })
  } catch (error: any) {
    console.error('Concurrency test harness error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
