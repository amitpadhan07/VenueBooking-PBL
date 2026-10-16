import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)

    if (authUser) {
      await prisma.auditLog.create({
        data: {
          user_id: authUser.userId,
          action: 'LOGOUT',
          entity_type: 'USER',
          entity_id: authUser.userId,
          details: JSON.stringify({
            email: authUser.email,
            role: authUser.role,
            timestamp: new Date().toISOString(),
          }),
        },
      })
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
