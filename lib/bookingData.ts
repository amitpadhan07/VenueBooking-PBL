export interface Venue {
  _id: string;
  venueId: string;
  name: string;
  type: string;
  capacity: number;
  location: string;
  status: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
}

export interface Booking {
  _id: string;
  bookingId: string;
  venueId: string;
  venueName: string;
  eventDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm (24-hour format)
  endTime: string;   // HH:mm (24-hour format)
  startAt: string;   // ISO or datetime-local
  endAt: string;     // ISO or datetime-local
  purpose: string;
  requesterName: string;
  requesterRole: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  createdAt: string;
}

export interface TimeSlotInterval {
  startTime: string;
  endTime: string;
  status?: 'PENDING' | 'APPROVED' | 'AVAILABLE' | 'REJECTED' | 'CANCELLED';
  purpose?: string;
  bookingId?: string;
}

export interface AvailabilityResponse {
  venueId: string;
  venueName?: string;
  date: string;
  operatingHours: {
    start: string;
    end: string;
  };
  occupiedSlots: TimeSlotInterval[];
  availableSlots: TimeSlotInterval[];
  bookings: Booking[];
}

// Global in-memory storage fallback to ensure persistent interactive state across requests
const initialVenues: Venue[] = [
  {
    _id: 'venue-1',
    venueId: 'v1',
    name: 'Main Auditorium',
    type: 'Auditorium',
    capacity: 500,
    location: 'Campus Center Block A',
    status: 'ACTIVE',
  },
  {
    _id: 'venue-2',
    venueId: 'v2',
    name: 'Seminar Hall 1',
    type: 'Seminar Hall',
    capacity: 150,
    location: 'Academic Block 2, Floor 1',
    status: 'ACTIVE',
  },
  {
    _id: 'venue-3',
    venueId: 'v3',
    name: 'Advanced Computing Lab',
    type: 'Computer Lab',
    capacity: 60,
    location: 'IT Building Level 3',
    status: 'ACTIVE',
  },
  {
    _id: 'venue-4',
    venueId: 'v4',
    name: 'Executive Conference Room',
    type: 'Conference Room',
    capacity: 30,
    location: 'Admin Block 1st Floor',
    status: 'ACTIVE',
  },
];

// Helper to get formatted date string for today and tomorrow
function getDateOffset(daysOffset = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const todayStr = getDateOffset(0);
const tomorrowStr = getDateOffset(1);

const initialBookings: Booking[] = [
  {
    _id: 'b-101',
    bookingId: 'b-101',
    venueId: 'v1',
    venueName: 'Main Auditorium',
    eventDate: todayStr,
    startTime: '10:00',
    endTime: '12:00',
    startAt: `${todayStr}T10:00`,
    endAt: `${todayStr}T12:00`,
    purpose: 'Annual Tech Symposium Keynote',
    requesterName: 'Dr. Sarah Connor',
    requesterRole: 'Faculty',
    status: 'APPROVED',
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'b-102',
    bookingId: 'b-102',
    venueId: 'v1',
    venueName: 'Main Auditorium',
    eventDate: todayStr,
    startTime: '14:00',
    endTime: '16:00',
    startAt: `${todayStr}T14:00`,
    endAt: `${todayStr}T16:00`,
    purpose: 'Robotics Club Exhibition Setup',
    requesterName: 'Alex Rivera',
    requesterRole: 'Student',
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'b-103',
    bookingId: 'b-103',
    venueId: 'v2',
    venueName: 'Seminar Hall 1',
    eventDate: todayStr,
    startTime: '09:00',
    endTime: '11:00',
    startAt: `${todayStr}T09:00`,
    endAt: `${todayStr}T11:00`,
    purpose: 'Guest Lecture: Distributed Systems',
    requesterName: 'Prof. Alan Turing',
    requesterRole: 'Faculty',
    status: 'APPROVED',
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'b-104',
    bookingId: 'b-104',
    venueId: 'v2',
    venueName: 'Seminar Hall 1',
    eventDate: todayStr,
    startTime: '13:00',
    endTime: '15:00',
    startAt: `${todayStr}T13:00`,
    endAt: `${todayStr}T15:00`,
    purpose: 'Department Academic Council Meet',
    requesterName: 'Dean Henderson',
    requesterRole: 'Employee',
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'b-105',
    bookingId: 'b-105',
    venueId: 'v3',
    venueName: 'Advanced Computing Lab',
    eventDate: tomorrowStr,
    startTime: '11:00',
    endTime: '13:00',
    startAt: `${tomorrowStr}T11:00`,
    endAt: `${tomorrowStr}T13:00`,
    purpose: 'Operating Systems Scheduling Lab',
    requesterName: 'Maya Lin',
    requesterRole: 'Student',
    status: 'APPROVED',
    createdAt: new Date().toISOString(),
  },
];

// In-memory store attached to globalThis to survive Next.js HMR reloads in dev mode
const globalStore = globalThis as unknown as {
  __venueBookingsData?: {
    venues: Venue[];
    bookings: Booking[];
  };
};

if (!globalStore.__venueBookingsData) {
  globalStore.__venueBookingsData = {
    venues: initialVenues,
    bookings: initialBookings,
  };
}

export const store = globalStore.__venueBookingsData;

// Convert "HH:mm" to minutes since 00:00
export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.trim().split(':');
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  return hours * 60 + minutes;
}

// Convert minutes since 00:00 back to "HH:mm"
export function minutesToTime(mins: number): string {
  const hours = Math.floor(mins / 60);
  const minutes = mins % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

// Overlap detection condition from README & Master Plan:
// Conflict <=> (S_exist < E_req) AND (E_exist > S_req)
export function checkIntervalOverlap(
  startReq: string,
  endReq: string,
  startExist: string,
  endExist: string
): boolean {
  const reqS = timeToMinutes(startReq);
  const reqE = timeToMinutes(endReq);
  const existS = timeToMinutes(startExist);
  const existE = timeToMinutes(endExist);

  return existS < reqE && existE > reqS;
}

// Calculate occupied and available slots for a venue on a given date (08:00 to 20:00)
export function calculateAvailability(venueId: string, date: string): AvailabilityResponse {
  const venue = store.venues.find(
    (v) => v.venueId === venueId || v._id === venueId || v.name === venueId
  );
  const venueKey = venue?.venueId || venue?._id || venueId;
  const venueName = venue?.name || venueId;

  // Filter bookings for this venue and date with status in ('PENDING', 'APPROVED')
  const activeBookings = store.bookings.filter(
    (b) =>
      (b.venueId === venueKey || b.venueName === venueName || b.venueId === venueId) &&
      b.eventDate === date &&
      (b.status === 'PENDING' || b.status === 'APPROVED')
  );

  // Sort occupied intervals chronologically by start time
  const occupiedSlots: TimeSlotInterval[] = activeBookings
    .map((b) => ({
      startTime: b.startTime,
      endTime: b.endTime,
      status: b.status,
      purpose: b.purpose,
      bookingId: b.bookingId,
    }))
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  // Timeline boundary: 08:00 (480 mins) to 20:00 (1200 mins)
  const TIMELINE_START = 8 * 60;  // 480 mins
  const TIMELINE_END = 20 * 60;   // 1200 mins

  // Merge contiguous/overlapping occupied intervals for available slots computation
  const mergedOccupied: Array<{ start: number; end: number }> = [];
  for (const slot of occupiedSlots) {
    const s = Math.max(TIMELINE_START, timeToMinutes(slot.startTime));
    const e = Math.min(TIMELINE_END, timeToMinutes(slot.endTime));
    if (s >= e) continue;

    if (mergedOccupied.length === 0) {
      mergedOccupied.push({ start: s, end: e });
    } else {
      const prev = mergedOccupied[mergedOccupied.length - 1];
      if (s <= prev.end) {
        prev.end = Math.max(prev.end, e);
      } else {
        mergedOccupied.push({ start: s, end: e });
      }
    }
  }

  // Derive available free slots
  const availableSlots: TimeSlotInterval[] = [];
  let currentPointer = TIMELINE_START;

  for (const occ of mergedOccupied) {
    if (occ.start > currentPointer) {
      availableSlots.push({
        startTime: minutesToTime(currentPointer),
        endTime: minutesToTime(occ.start),
        status: 'AVAILABLE',
      });
    }
    currentPointer = Math.max(currentPointer, occ.end);
  }

  if (currentPointer < TIMELINE_END) {
    availableSlots.push({
      startTime: minutesToTime(currentPointer),
      endTime: minutesToTime(TIMELINE_END),
      status: 'AVAILABLE',
    });
  }

  return {
    venueId,
    venueName,
    date,
    operatingHours: {
      start: '08:00',
      end: '20:00',
    },
    occupiedSlots,
    availableSlots,
    bookings: activeBookings,
  };
}
