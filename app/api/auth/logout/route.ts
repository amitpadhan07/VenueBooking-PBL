import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)

    if (authUser) {
      const detailsJson = JSON.stringify({
        email: authUser.email,
        role: authUser.role,
        ip: request.headers.get('x-forwarded-for') || '127.0.0.1',
      })
      await prisma.$executeRaw`
        INSERT INTO audit_logs (log_id, user_id, action, entity_type, entity_id, details, created_at)
        VALUES (
          gen_random_uuid()::text,
          ${authUser.userId},
          'LOGOUT',
          'USER',
          ${authUser.userId},
          ${detailsJson},
          NOW()
        );
      `
    }

    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully.',
    })

    // Clear session cookie
    response.cookies.set({
      name: 'auth_token',
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    })

    return response
  } catch (error: any) {
    console.error('Error in POST /api/auth/logout:', error)
    return NextResponse.json(
      { error: error?.message || 'Error logging out.' },
      { status: 500 }
    )
  }
}
