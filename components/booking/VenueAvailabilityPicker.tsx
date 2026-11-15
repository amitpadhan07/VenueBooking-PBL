'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Calendar,
  ShieldAlert,
  Info,
} from 'lucide-react';

export interface TimeSlotInterval {
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
  status?: 'PENDING' | 'APPROVED' | 'AVAILABLE' | 'REJECTED' | 'CANCELLED';
  purpose?: string;
  bookingId?: string;
}

export interface AvailabilityData {
  venueId: string;
  venueName?: string;
  date: string;
  operatingHours?: {
    start: string;
    end: string;
  };
  occupiedSlots?: TimeSlotInterval[];
  availableSlots?: TimeSlotInterval[];
  bookings?: any[];
}

export interface VenueAvailabilityPickerProps {
  selectedVenueId: string;
  eventDate: string;
  selectedStartTime?: string;
  selectedEndTime?: string;
  onSlotSelect?: (startTime: string, endTime: string, isAvailable: boolean) => void;
  className?: string;
}

// Convert "HH:mm" to minutes since midnight
function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.trim().split(':').map((v) => parseInt(v, 10) || 0);
  return h * 60 + m;
}

// Convert minutes since midnight to "HH:mm"
function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// Standard 12-hour timeline blocks: 08:00 to 20:00 (12 hourly intervals)
const TIMELINE_SLOTS = [
  { start: '08:00', end: '09:00', label: '08:00 - 09:00' },
  { start: '09:00', end: '10:00', label: '09:00 - 10:00' },
  { start: '10:00', end: '11:00', label: '10:00 - 11:00' },
  { start: '11:00', end: '12:00', label: '11:00 - 12:00' },
  { start: '12:00', end: '13:00', label: '12:00 - 13:00' },
  { start: '13:00', end: '14:00', label: '13:00 - 14:00' },
  { start: '14:00', end: '15:00', label: '14:00 - 15:00' },
  { start: '15:00', end: '16:00', label: '15:00 - 16:00' },
  { start: '16:00', end: '17:00', label: '16:00 - 17:00' },
  { start: '17:00', end: '18:00', label: '17:00 - 18:00' },
  { start: '18:00', end: '19:00', label: '18:00 - 19:00' },
  { start: '19:00', end: '20:00', label: '19:00 - 20:00' },
];

export function VenueAvailabilityPicker({
  selectedVenueId,
  eventDate,
  selectedStartTime = '',
  selectedEndTime = '',
  onSlotSelect,
  className = '',
}: VenueAvailabilityPickerProps) {
  const [data, setData] = useState<AvailabilityData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attemptedConflict, setAttemptedConflict] = useState<{
    startTime: string;
    endTime: string;
    purpose?: string;
    status?: string;
  } | null>(null);

  // Fetch real-time availability whenever selectedVenueId or eventDate changes
  const fetchAvailability = useCallback(async (venueId: string, date: string, signal?: AbortSignal) => {
    if (!venueId || !date) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setAttemptedConflict(null);

    try {
      const res = await fetch(
        `/api/bookings/availability?venueId=${encodeURIComponent(venueId)}&date=${encodeURIComponent(date)}`,
        { signal, cache: 'no-store' }
      );

      if (!res.ok) {
        const errPayload = await res.json().catch(() => ({}));
        throw new Error(errPayload.error || `Server responded with status ${res.status}`);
      }

      const json: AvailabilityData = await res.json();
      setData(json);
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      setError(err?.message || 'Failed to load slot availability.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchAvailability(selectedVenueId, eventDate, controller.signal);

    return () => {
      controller.abort();
    };
  }, [selectedVenueId, eventDate, fetchAvailability]);

  // Extract occupied slots safely from API response (supporting various response shapes)
  const occupiedIntervals: TimeSlotInterval[] = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data.occupiedSlots)) return data.occupiedSlots;
    if (Array.isArray(data.bookings)) {
      return data.bookings
        .filter((b) => b.status === 'PENDING' || b.status === 'APPROVED')
        .map((b) => ({
          startTime: b.startTime,
          endTime: b.endTime,
          status: b.status,
          purpose: b.purpose,
          bookingId: b.bookingId || b._id,
        }));
    }
    return [];
  }, [data]);

  // Check whether an interval [start, end) conflicts with any occupied slot
  // Overlap condition: existStart < reqEnd AND existEnd > reqStart
  const findConflict = useCallback(
    (reqStart: string, reqEnd: string): TimeSlotInterval | undefined => {
      const reqS = timeToMinutes(reqStart);
      const reqE = timeToMinutes(reqEnd);

      return occupiedIntervals.find((occ) => {
        const occS = timeToMinutes(occ.startTime);
        const occE = timeToMinutes(occ.endTime);
        return occS < reqE && occE > reqS;
      });
    },
    [occupiedIntervals]
  );

  // Status for currently selected slot range
  const currentSelectionStatus = useMemo(() => {
    if (attemptedConflict) {
      return 'OCCUPIED';
    }

    if (!selectedStartTime || !selectedEndTime) {
      return 'NONE';
    }

    const conflict = findConflict(selectedStartTime, selectedEndTime);
    if (conflict) {
      return 'OCCUPIED';
    }

    return 'AVAILABLE';
  }, [selectedStartTime, selectedEndTime, findConflict, attemptedConflict]);

  // Handle slot click
  const handleSlotClick = (slotStart: string, slotEnd: string) => {
    const conflict = findConflict(slotStart, slotEnd);

    if (conflict) {
      // Prevent selection of occupied interval
      setAttemptedConflict({
        startTime: conflict.startTime,
        endTime: conflict.endTime,
        purpose: conflict.purpose,
        status: conflict.status,
      });
      if (onSlotSelect) {
        onSlotSelect(slotStart, slotEnd, false);
      }
      return;
    }

    // Available slot selected
    setAttemptedConflict(null);
    if (onSlotSelect) {
      onSlotSelect(slotStart, slotEnd, true);
    }
  };

  // Check if a specific timeline slot is occupied
  const getSlotState = (start: string, end: string) => {
    const conflict = findConflict(start, end);
    const isSelected =
      selectedStartTime &&
      selectedEndTime &&
      timeToMinutes(start) >= timeToMinutes(selectedStartTime) &&
      timeToMinutes(end) <= timeToMinutes(selectedEndTime);

    return {
      isOccupied: Boolean(conflict),
      conflictBooking: conflict,
      isSelected: Boolean(isSelected),
    };
  };

  return (
    <div
      className={`rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-sm transition-all ${className}`}
    >
      {/* Header with Title and Live Status Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="rounded-xl bg-primary/10 p-2 text-primary">
            <Clock className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold tracking-tight text-foreground">
              Slot Availability Timeline
            </h3>
            <p className="text-xs text-muted-foreground">
              12-Hour Operational Window: 08:00 – 20:00
            </p>
          </div>
        </div>

        {/* Live Status Badge */}
        <div>
          {currentSelectionStatus === 'AVAILABLE' && (
            <span
              data-testid="status-badge-available"
              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 animate-in fade-in duration-200"
            >
              <CheckCircle2 className="size-4" />
              Slot Available
            </span>
          )}

          {currentSelectionStatus === 'OCCUPIED' && (
            <span
              data-testid="status-badge-occupied"
              className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/15 px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 animate-in shake duration-200"
            >
              <ShieldAlert className="size-4" />
              Slot Occupied - Double Booking Prevented
            </span>
          )}

          {currentSelectionStatus === 'NONE' && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-3 py-1 text-xs text-muted-foreground">
              <Info className="size-3.5" />
              Click any green slot to reserve
            </span>
          )}
        </div>
      </div>

      {/* Details Bar: Venue & Date context */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-medium text-foreground">
            <Calendar className="size-3.5 text-primary" />
            {eventDate || 'No date chosen'}
          </span>
          {data?.venueName && (
            <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground">
              {data.venueName}
            </span>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-[11px]">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-emerald-500"></span>
            Available
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-red-500"></span>
            Occupied (Pending / Approved)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-full ring-2 ring-primary ring-offset-1 bg-primary"></span>
            Selected
          </span>
        </div>
      </div>

      {/* Main Content Area: Loading, Error, Empty, or Timeline */}
      <div className="mt-5">
        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 py-10 text-center">
            <RefreshCw className="size-6 animate-spin text-primary" />
            <p className="mt-3 text-sm font-medium text-foreground">
              Checking real-time slot availability...
            </p>
            <p className="text-xs text-muted-foreground">
              Verifying active and pending reservations
            </p>
          </div>
        )}

        {/* API Error State */}
        {!loading && error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-sm font-semibold text-destructive">
              <AlertCircle className="size-4" />
              Failed to load availability
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{error}</p>
            <button
              onClick={() => fetchAvailability(selectedVenueId, eventDate)}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              <RefreshCw className="size-3" />
              Retry Query
            </button>
          </div>
        )}

        {/* No Venue or Date Selected State */}
        {!loading && !error && (!selectedVenueId || !eventDate) && (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center">
            <Calendar className="mx-auto size-8 text-muted-foreground/60" />
            <p className="mt-2 text-sm font-medium text-foreground">
              Select Venue & Event Date
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Choose a venue and date above to load the live 12-hour timeline.
            </p>
          </div>
        )}

        {/* Interactive 12-Hour Timeline Display */}
        {!loading && !error && selectedVenueId && eventDate && (
          <div className="space-y-4">
            {/* Warning when user attempts to click an occupied slot */}
            {attemptedConflict && (
              <div className="flex items-start gap-3 rounded-xl border border-red-500/40 bg-red-500/10 p-3.5 text-xs text-red-700 dark:text-red-400 animate-in fade-in">
                <AlertTriangle className="size-4 shrink-0 mt-0.5 text-red-600" />
                <div className="flex-1">
                  <strong className="font-semibold block">
                    Double Booking Prevented
                  </strong>
                  <span>
                    The interval {attemptedConflict.startTime} – {attemptedConflict.endTime} is already reserved
                    {attemptedConflict.purpose ? ` for "${attemptedConflict.purpose}"` : ''}
                    {attemptedConflict.status ? ` (${attemptedConflict.status})` : ''}. Please select an available green slot.
                  </span>
                </div>
              </div>
            )}

            {/* Continuous Visual Timeline Bar (08:00 to 20:00) */}
            <div className="rounded-xl border border-border/80 bg-muted/30 p-3">
              <div className="mb-2 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>08:00 AM</span>
                <span>12:00 PM</span>
                <span>16:00 PM</span>
                <span>20:00 PM</span>
              </div>

              <div className="relative flex h-8 w-full overflow-hidden rounded-lg bg-emerald-500/20 border border-emerald-500/30">
                {/* Visual Occupied Intervals Placed Proportionally */}
                {occupiedIntervals.map((occ, idx) => {
                  const TIMELINE_MINS = 12 * 60; // 720 mins from 08:00 to 20:00
                  const START_OFFSET = 8 * 60;   // 480 mins

                  const occStart = Math.max(START_OFFSET, timeToMinutes(occ.startTime));
                  const occEnd = Math.min(START_OFFSET + TIMELINE_MINS, timeToMinutes(occ.endTime));
                  if (occStart >= occEnd) return null;

                  const leftPct = ((occStart - START_OFFSET) / TIMELINE_MINS) * 100;
                  const widthPct = ((occEnd - occStart) / TIMELINE_MINS) * 100;

                  return (
                    <div
                      key={occ.bookingId || idx}
                      style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                      className="absolute top-0 bottom-0 bg-red-500/80 border-x border-red-700 text-white flex items-center justify-center text-[10px] font-medium tracking-tight overflow-hidden px-1 group cursor-not-allowed"
                      title={`Booked: ${occ.startTime} - ${occ.endTime} (${occ.status})\n${occ.purpose || ''}`}
                    >
                      <span className="truncate">
                        {occ.startTime}-{occ.endTime} ({occ.status})
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Interactive Grid of 12 Individual Hourly Slots (08:00 to 20:00) */}
            <div>
              <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Select Time Slot (Click to pick)
              </p>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {TIMELINE_SLOTS.map((slot) => {
                  const { isOccupied, conflictBooking, isSelected } = getSlotState(
                    slot.start,
                    slot.end
                  );

                  return (
                    <button
                      key={slot.start}
                      type="button"
                      onClick={() => handleSlotClick(slot.start, slot.end)}
                      className={`group relative flex flex-col items-center justify-between rounded-xl border p-2.5 text-center transition-all duration-150 ${
                        isOccupied
                          ? 'border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-400 hover:bg-red-500/20 cursor-not-allowed'
                          : isSelected
                          ? 'border-primary bg-primary text-primary-foreground shadow-md ring-2 ring-primary/40'
                          : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-500/60'
                      }`}
                    >
                      {/* Slot Time Label */}
                      <span className="text-xs font-bold tracking-tight">
                        {slot.start}
                      </span>
                      <span className="text-[10px] opacity-75">to {slot.end}</span>

                      {/* Indicator pill */}
                      <div className="mt-2 flex items-center gap-1 text-[10px] font-semibold">
                        {isOccupied ? (
                          <>
                            <span className="size-1.5 rounded-full bg-red-600 dark:bg-red-400"></span>
                            <span className="truncate max-w-[70px]">
                              {conflictBooking?.status || 'Occupied'}
                            </span>
                          </>
                        ) : isSelected ? (
                          <>
                            <CheckCircle2 className="size-3" />
                            <span>Selected</span>
                          </>
                        ) : (
                          <>
                            <span className="size-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400"></span>
                            <span>Available</span>
                          </>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Empty result indicator if 0 bookings exist for the day */}
            {occupiedIntervals.length === 0 && (
              <p className="text-center text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                ✨ All 12 hours from 08:00 to 20:00 are completely free for this venue on {eventDate}!
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default VenueAvailabilityPicker;
