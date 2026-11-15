import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/bookingData';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role') || 'Admin';

  const total = store.bookings.length;
  const approved = store.bookings.filter((b) => b.status === 'APPROVED').length;
  const pending = store.bookings.filter((b) => b.status === 'PENDING').length;
  const utilization = store.venues.length > 0 ? Math.round((approved / (store.venues.length * 4)) * 100) : 0;

  return NextResponse.json({
    identity: {
      role,
      name: role === 'Student' ? 'Alex Rivera' : role === 'Employee' ? 'Prof. Alan Turing' : 'Admin User',
    },
    bookings: store.bookings,
    venues: store.venues,
    notifications: [
      {
        _id: 'n-1',
        title: 'Booking Request Updated',
        message: 'Main Auditorium reservation is currently APPROVED.',
        createdAt: new Date().toISOString(),
      },
      {
        _id: 'n-2',
        title: 'New Availability Slots',
        message: 'Seminar Hall 1 slots open for tomorrow.',
        createdAt: new Date().toISOString(),
      },
    ],
    metrics: {
      total,
      approved,
      pending,
      utilization,
    },
  });
}
