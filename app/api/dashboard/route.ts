import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { Role as PrismaRole } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const roleParam = searchParams.get('role') || 'Admin'

    // Map query string role to Prisma enum
    let prismaRole: PrismaRole = PrismaRole.ADMIN
    if (roleParam.toLowerCase() === 'student') prismaRole = PrismaRole.STUDENT
    else if (roleParam.toLowerCase() === 'employee') prismaRole = PrismaRole.EMPLOYEE

    // Pick representative user for the selected demo role
    const user = await prisma.user.findFirst({
      where: { role: prismaRole },
      orderBy: { created_at: 'asc' },
    })

    const venues = await prisma.venue.findMany({
      orderBy: { venue_name: 'asc' },
    })

    const bookings = await prisma.booking.findMany({
      include: {
        venue: { select: { venue_name: true } },
        user: { select: { name: true, email: true } },
      },
      orderBy: { created_at: 'desc' },
      take: 20,
    })

    const notifications = await prisma.notification.findMany({
      orderBy: { created_at: 'desc' },
      take: 10,
    })

    const totalBookings = await prisma.booking.count()
    const approvedBookings = await prisma.booking.count({ where: { status: 'APPROVED' } })
    const pendingBookings = await prisma.booking.count({ where: { status: 'PENDING' } })
    const totalVenues = await prisma.venue.count()
    const activeVenues = await prisma.venue.count({ where: { status: 'ACTIVE' } })
    const utilization = totalVenues > 0 ? Math.round((activeVenues / totalVenues) * 100) : 100

    return NextResponse.json({
      identity: {
        role: roleParam,
        name: user?.name ?? (roleParam === 'Admin' ? 'System Administrator' : roleParam === 'Employee' ? 'Auditorium Manager' : 'Student User'),
      },
      venues: venues.map((v) => ({
        _id: v.venue_id,
        id: v.venue_id,
        name: v.venue_name,
        type: v.venue_type,
        capacity: v.capacity,
        location: v.location,
        status: v.status.toLowerCase(),
      })),
      bookings: bookings.map((b) => ({
        _id: b.booking_id,
        id: b.booking_id,
        purpose: b.event_name,
        venueName: b.venue.venue_name,
        venueId: b.venue_id,
        requesterName: b.user.name,
        requesterId: b.user_id,
        status: b.status,
        date: b.event_date.toISOString().split('T')[0],
        startTime: b.start_time,
        endTime: b.end_time,
      })),
      notifications: notifications.map((n) => ({
        _id: n.notification_id,
        id: n.notification_id,
        title: n.title,
        message: n.message,
        type: n.notification_type,
      })),
      metrics: {
        total: totalBookings,
        approved: approvedBookings,
        pending: pendingBookings,
        utilization,
      },
    })
  } catch (error: any) {
    console.error('Error in /api/dashboard:', error)
    return NextResponse.json(
      { error: error?.message || 'Database error occurred' },
      { status: 500 }
    )
  }
}
