import { NextRequest, NextResponse } from 'next/server';
import { calculateAvailability } from '@/lib/bookingData';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const venueId = searchParams.get('venueId');
    const date = searchParams.get('date');

    if (!venueId || !date) {
      return NextResponse.json(
        {
          error: 'Missing required query parameters: "venueId" and "date" are required.',
          example: '/api/bookings/availability?venueId=v1&date=2026-11-16',
        },
        { status: 400 }
      );
    }

    const availability = calculateAvailability(venueId, date);

    return NextResponse.json(availability, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Internal Server Error while calculating availability' },
      { status: 500 }
    );
  }
}
