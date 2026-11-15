import { NextRequest, NextResponse } from 'next/server';
import { store, checkIntervalOverlap, Booking } from '@/lib/bookingData';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ bookings: store.bookings });
}

export async function POST(request: NextRequest) {
  try {
    const role = request.headers.get('x-demo-role') || 'Student';
    const body = await request.json();

    const { venueId, purpose, startAt, endAt, eventDate, startTime, endTime } = body;

    if (!venueId || !purpose) {
      return NextResponse.json(
        { error: 'Venue ID and Purpose are required.' },
        { status: 400 }
      );
    }

    // Determine date, startTime, and endTime either from startAt/endAt or explicit fields
    let bookingDate = eventDate;
    let sTime = startTime;
    let eTime = endTime;

    if (startAt && (!bookingDate || !sTime)) {
      const parts = startAt.split('T');
      bookingDate = parts[0];
      sTime = parts[1]?.slice(0, 5) || '08:00';
    }
    if (endAt && !eTime) {
      const parts = endAt.split('T');
      eTime = parts[1]?.slice(0, 5) || '10:00';
    }

    if (!bookingDate || !sTime || !eTime) {
      return NextResponse.json(
        { error: 'Valid date, start time and end time are required.' },
        { status: 400 }
      );
    }

    if (sTime >= eTime) {
      return NextResponse.json(
        { error: 'Start time must be strictly before end time.' },
        { status: 400 }
      );
    }

    // Check for double booking / conflict
    const venue = store.venues.find(
      (v) => v.venueId === venueId || v._id === venueId || v.name === venueId
    );
    const venueKey = venue?.venueId || venue?._id || venueId;
    const venueName = venue?.name || venueId;

    const conflict = store.bookings.find(
      (b) =>
        (b.venueId === venueKey || b.venueName === venueName || b.venueId === venueId) &&
        b.eventDate === bookingDate &&
        (b.status === 'PENDING' || b.status === 'APPROVED') &&
        checkIntervalOverlap(sTime, eTime, b.startTime, b.endTime)
    );

    if (conflict) {
      return NextResponse.json(
        {
          error: `Time slot conflict: Venue is already reserved from ${conflict.startTime} to ${conflict.endTime} (${conflict.status}).`,
          conflictSlot: {
            startTime: conflict.startTime,
            endTime: conflict.endTime,
            status: conflict.status,
          },
        },
        { status: 409 }
      );
    }

    const newBooking: Booking = {
      _id: `b-${Date.now()}`,
      bookingId: `b-${Date.now()}`,
      venueId: venueKey,
      venueName,
      eventDate: bookingDate,
      startTime: sTime,
      endTime: eTime,
      startAt: `${bookingDate}T${sTime}`,
      endAt: `${bookingDate}T${eTime}`,
      purpose,
      requesterName: role === 'Student' ? 'Alex Rivera' : role === 'Employee' ? 'Prof. Alan Turing' : 'Admin User',
      requesterRole: role,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    store.bookings.unshift(newBooking);

    return NextResponse.json(
      {
        message: 'Booking request submitted successfully.',
        booking: newBooking,
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to create booking' },
      { status: 500 }
    );
  }
}
