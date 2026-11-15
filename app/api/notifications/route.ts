import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const notifications = await prisma.$queryRaw<Array<{
      notification_id: string
      booking_id: string | null
      title: string
      message: string
      notification_type: string
      is_read: boolean
      created_at: Date
    }>>`
      SELECT notification_id, booking_id, title, message, notification_type, is_read, created_at
      FROM notifications
      WHERE user_id = ${auth.userId}::uuid
      ORDER BY created_at DESC
      LIMIT 30;
    `

    const unreadCount = notifications.filter((n) => !n.is_read).length

    return NextResponse.json({
      notifications: notifications.map((n) => ({
        id: n.notification_id,
        notification_id: n.notification_id,
        booking_id: n.booking_id,
        title: n.title,
        message: n.message,
        type: n.notification_type,
        is_read: n.is_read,
        created_at: n.created_at,
      })),
      unreadCount,
    })
  } catch (error: any) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await getAuthUser(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const { notificationId } = body

    if (notificationId) {
      await prisma.$executeRaw`
        UPDATE notifications
        SET is_read = true
        WHERE notification_id = ${notificationId}::uuid
          AND user_id = ${auth.userId}::uuid;
      `
    } else {
      // Mark all as read for user
      await prisma.$executeRaw`
        UPDATE notifications
        SET is_read = true
        WHERE user_id = ${auth.userId}::uuid;
      `
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error updating notifications:', error)
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 })
  }
}

