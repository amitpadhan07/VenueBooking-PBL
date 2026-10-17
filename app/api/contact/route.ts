import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/**
 * POST /api/contact
 * Handles contact us form submission and records non-repudiation audit entry.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, department, subject, message } = body

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required.' },
        { status: 400 }
      )
    }

    const authUser = await getAuthUser(request)

    // Log the message inquiry into audit_logs table via pure SQL
    const detailsJson = JSON.stringify({
      contactName: name.trim(),
      contactEmail: email.trim(),
      department: (department || 'General').trim(),
      subject: (subject || 'General Inquiry').trim(),
      messageSnippet: message.trim().slice(0, 300),
      ip: request.headers.get('x-forwarded-for') || '127.0.0.1',
    })

    await prisma.$executeRaw`
      INSERT INTO audit_logs (
        log_id, user_id, action, entity_type, entity_id, details, created_at
      )
      VALUES (
        gen_random_uuid()::text,
        ${authUser?.userId || '00000000-0000-0000-0000-000000000001'},
        'CONTACT_SUBMISSION',
        'SYSTEM',
        'INQUIRY',
        ${detailsJson},
        NOW()
      );
    `

    return NextResponse.json({
      success: true,
      message: 'Thank you! Your inquiry has been received by Campus Facilities and Venue Administration.',
    })
  } catch (error: any) {
    console.error('Error handling contact message:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to submit message.' },
      { status: 500 }
    )
  }
}
