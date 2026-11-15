'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Database,
  GraduationCap,
  LayoutDashboard,
  Menu,
  MonitorCog,
  Plus,
  RefreshCw,
  Search,
  Server,
  ShieldCheck,
  Sparkles,
  Users,
  X,
  AlertTriangle,
  Clock,
  Calendar,
} from 'lucide-react';
import { VenueAvailabilityPicker } from '@/components/booking/VenueAvailabilityPicker';

export type Role = 'Student' | 'Employee' | 'Admin';
export type Section = 'overview' | 'bookings' | 'venues' | 'reports' | 'os' | 'dbms';

export type Data = {
  identity: { role: Role; name: string };
  bookings: Array<Record<string, any>>;
  venues: Array<Record<string, any>>;
  notifications: Array<Record<string, any>>;
  metrics: {
    total: number;
    approved: number;
    pending: number;
    utilization: number;
  };
};

const sections: Array<{ id: Section; label: string; icon: typeof LayoutDashboard; roles: Role[] }> = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, roles: ['Student', 'Employee', 'Admin'] },
  { id: 'bookings', label: 'Bookings', icon: CalendarDays, roles: ['Student', 'Employee', 'Admin'] },
  { id: 'venues', label: 'Venues', icon: Server, roles: ['Student', 'Employee', 'Admin'] },
  { id: 'reports', label: 'Reports', icon: BarChart3, roles: ['Employee', 'Admin'] },
  { id: 'os', label: 'OS Simulator', icon: MonitorCog, roles: ['Student', 'Employee', 'Admin'] },
  { id: 'dbms', label: 'DBMS Concepts', icon: Database, roles: ['Student', 'Employee', 'Admin'] },
];

function Empty({
  title = 'No records yet',
  text = 'Connect activity to this workspace and it will appear here.',
}: {
  title?: string;
  text?: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-10 text-center">
      <p className="font-semibold text-foreground">{title}</p>
      <p className="mt-2 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

function Metric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: typeof Activity;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <Icon className="mb-4 size-5 text-primary" />
      <p className="text-sm text-muted-foreground">{label}</p>
      <strong className="mt-1 block text-3xl tracking-tight text-foreground">{value}</strong>
    </div>
  );
}

function BookingRows({ bookings }: { bookings: Array<Record<string, any>> }) {
  if (!bookings.length) return <Empty title="No bookings found" />;
  return (
    <div className="overflow-auto">
      <table className="w-full min-w-[620px] text-left text-sm">
        <thead className="border-b border-border text-muted-foreground">
          <tr>
            <th className="p-4 font-semibold uppercase text-xs tracking-wider">Purpose</th>
            <th className="p-4 font-semibold uppercase text-xs tracking-wider">Venue</th>
            <th className="p-4 font-semibold uppercase text-xs tracking-wider">Time Slot</th>
            <th className="p-4 font-semibold uppercase text-xs tracking-wider">Requester</th>
            <th className="p-4 font-semibold uppercase text-xs tracking-wider">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {bookings.map((booking) => {
            const timeLabel =
              booking.startTime && booking.endTime
                ? `${booking.eventDate || ''} (${booking.startTime} - ${booking.endTime})`
                : booking.startAt
                ? new Date(booking.startAt).toLocaleString()
                : '—';

            return (
              <tr className="hover:bg-muted/30 transition-colors" key={booking._id || booking.bookingId}>
                <td className="p-4 font-medium text-foreground">{booking.purpose}</td>
                <td className="p-4 text-muted-foreground">
                  {booking.venueName ?? booking.venueId}
                </td>
                <td className="p-4 text-xs text-muted-foreground">{timeLabel}</td>
                <td className="p-4 text-muted-foreground">
                  {booking.requesterName ?? booking.requesterId ?? 'Student'}
                </td>
                <td className="p-4">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      booking.status === 'APPROVED'
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        : booking.status === 'PENDING'
                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {booking.status}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Overview({ data, role, go }: { data: Data; role: Role; go: (section: Section) => void }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            {role} workspace
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-foreground">
            Good morning, {data.identity.name}.
          </h1>
          <p className="mt-2 text-muted-foreground">
            Campus Venue Allocation & Real-Time Availability Engine.
          </p>
        </div>
        {role !== 'Employee' && (
          <button
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-sm"
            onClick={() => go('bookings')}
          >
            <Plus className="size-4" /> New booking
          </button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Visible bookings" value={data.metrics.total} icon={CalendarDays} />
        <Metric label="Approved" value={data.metrics.approved} icon={CheckCircle2} />
        <Metric label="Pending review" value={data.metrics.pending} icon={Clock3} />
        <Metric label="Venue availability" value={`${data.metrics.utilization}%`} icon={Server} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        <section className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border p-5">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-semibold">
                Operational view
              </p>
              <h2 className="mt-1 text-xl font-semibold text-foreground">Recent bookings</h2>
            </div>
            <button
              className="text-sm font-semibold text-primary hover:underline"
              onClick={() => go('bookings')}
            >
              View all
            </button>
          </div>
          <BookingRows bookings={data.bookings.slice(0, 6)} />
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-semibold">
            Notifications
          </p>
          <h2 className="mt-1 text-xl font-semibold text-foreground">Action center</h2>
          <div className="mt-5 space-y-4">
            {data.notifications.length ? (
              data.notifications.map((note) => (
                <div className="border-l-2 border-primary pl-3 py-1" key={note._id}>
                  <p className="font-medium text-foreground text-sm">{note.title ?? 'Workspace update'}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {note.message ?? 'A new notification is available.'}
                  </p>
                </div>
              ))
            ) : (
              <Empty title="All caught up" text="Unread notifications will appear here." />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function Bookings({ data, role, refresh }: { data: Data; role: Role; refresh: () => void }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Default venue from data
  const defaultVenueId = data.venues[0]?.venueId || data.venues[0]?._id || 'v1';

  // Booking Modal State Variables
  const [selectedVenueId, setSelectedVenueId] = useState(defaultVenueId);
  const [eventDate, setEventDate] = useState(getTodayString());
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('09:00');
  const [purpose, setPurpose] = useState('');
  const [slotAvailable, setSlotAvailable] = useState<boolean | null>(true);

  // Keep venueId synced if venues load
  useEffect(() => {
    if (!selectedVenueId && data.venues.length > 0) {
      setSelectedVenueId(data.venues[0].venueId || data.venues[0]._id || 'v1');
    }
  }, [data.venues, selectedVenueId]);

  // Callback when a slot is clicked in the interactive availability picker
  const handleSlotSelect = (newStart: string, newEnd: string, isAvailable: boolean) => {
    setSlotAvailable(isAvailable);
    if (isAvailable) {
      setStartTime(newStart);
      setEndTime(newEnd);
      setMessage('');
    } else {
      setMessage(`Slot ${newStart} – ${newEnd} is already occupied. Double booking prevented.`);
    }
  };

  async function submit() {
    setMessage('');

    if (!selectedVenueId) {
      setMessage('Please select a venue.');
      return;
    }
    if (!eventDate) {
      setMessage('Please select an event date.');
      return;
    }
    if (!purpose.trim()) {
      setMessage('Please enter an event purpose.');
      return;
    }
    if (!startTime || !endTime) {
      setMessage('Please specify both start and end time.');
      return;
    }
    if (startTime >= endTime) {
      setMessage('Start time must be strictly before end time.');
      return;
    }
    if (slotAvailable === false) {
      setMessage('Cannot book an occupied slot. Please pick an available green interval.');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-demo-role': role,
        },
        body: JSON.stringify({
          venueId: selectedVenueId,
          purpose,
          eventDate,
          startTime,
          endTime,
          startAt: `${eventDate}T${startTime}`,
          endAt: `${eventDate}T${endTime}`,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        setMessage(payload.error || 'Failed to submit booking request.');
        setSlotAvailable(false);
        return;
      }

      // Success
      setOpen(false);
      setPurpose('');
      setMessage('');
      refresh();
    } catch (err: any) {
      setMessage(err?.message || 'Network error while submitting booking request.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Resource management
          </p>
          <h1 className="mt-2 text-4xl font-semibold text-foreground">Bookings</h1>
          <p className="mt-2 text-muted-foreground">
            {role === 'Employee'
              ? 'Review and manage venue reservation requests.'
              : 'Reserve venues with real-time overlap detection and double booking prevention.'}
          </p>
        </div>
        {role !== 'Employee' && (
          <button
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-sm"
            onClick={() => {
              setOpen(!open);
              setMessage('');
            }}
          >
            <Plus className="size-4" /> {open ? 'Close booking form' : 'Create booking'}
          </button>
        )}
      </div>

      {/* Interactive Booking Modal / Drawer */}
      {open && (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-md space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                Reserve Venue Slot
              </h2>
              <p className="text-xs text-muted-foreground">
                Pick a venue, event date, and available time interval.
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Form Fields: Venue Selector, Date Picker, Purpose */}
          <div className="grid gap-4 md:grid-cols-3">
            {/* Venue Selector */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Target Venue
              </label>
              <select
                className="mt-2 w-full rounded-xl border border-input bg-background p-3 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                value={selectedVenueId}
                onChange={(e) => {
                  setSelectedVenueId(e.target.value);
                  setSlotAvailable(null);
                  setMessage('');
                }}
              >
                {data.venues.map((v) => (
                  <option key={v.venueId || v._id} value={v.venueId || v._id}>
                    {v.name} ({v.type} - Cap: {v.capacity})
                  </option>
                ))}
              </select>
            </div>

            {/* Event Date Picker */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Event Date
              </label>
              <input
                type="date"
                className="mt-2 w-full rounded-xl border border-input bg-background p-3 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                value={eventDate}
                onChange={(e) => {
                  setEventDate(e.target.value);
                  setSlotAvailable(null);
                  setMessage('');
                }}
              />
            </div>

            {/* Purpose */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Event Purpose
              </label>
              <input
                type="text"
                placeholder="e.g. AI Symposium / Hackathon"
                className="mt-2 w-full rounded-xl border border-input bg-background p-3 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
              />
            </div>
          </div>

          {/* REAL-TIME INTERACTIVE SLOT AVAILABILITY PICKER (TASK 1) */}
          <VenueAvailabilityPicker
            selectedVenueId={selectedVenueId}
            eventDate={eventDate}
            selectedStartTime={startTime}
            selectedEndTime={endTime}
            onSlotSelect={handleSlotSelect}
          />

          {/* Selected Slot Time Inputs (Automatically Updated & Editable) */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Start Time (HH:mm)
              </label>
              <input
                type="time"
                className="mt-2 w-full rounded-xl border border-input bg-background p-3 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                value={startTime}
                onChange={(e) => {
                  setStartTime(e.target.value);
                  setSlotAvailable(null);
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                End Time (HH:mm)
              </label>
              <input
                type="time"
                className="mt-2 w-full rounded-xl border border-input bg-background p-3 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                value={endTime}
                onChange={(e) => {
                  setEndTime(e.target.value);
                  setSlotAvailable(null);
                }}
              />
            </div>
          </div>

          {/* Error / Conflict Alert Message */}
          {message && (
            <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertTriangle className="size-4 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted"
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={submitting}
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all shadow-sm flex items-center gap-2"
              onClick={submit}
            >
              {submitting ? (
                <>
                  <RefreshCw className="size-4 animate-spin" />
                  Reserving...
                </>
              ) : (
                'Confirm & Submit Request'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Existing Bookings Table */}
      <section className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex items-center gap-3 border-b border-border p-5">
          <Search className="size-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground font-medium">
            Active and Scheduled Venue Bookings
          </span>
        </div>
        <BookingRows bookings={data.bookings} />
      </section>
    </div>
  );
}

function SimpleSection({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
        <h1 className="mt-2 text-4xl font-semibold text-foreground">{title}</h1>
      </div>
      {children}
    </div>
  );
}

export function DashboardContent() {
  const [role, setRole] = useState<Role>('Admin');
  const [section, setSection] = useState<Section>('overview');
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState('');
  const [mobile, setMobile] = useState(false);

  const refresh = () =>
    fetch(`/api/dashboard?role=${role}`)
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'Failed to fetch dashboard');
        setData(payload);
        setError('');
      })
      .catch((reason) => setError(reason.message));

  useEffect(() => {
    setData(null);
    refresh();
  }, [role]);

  const allowed = useMemo(() => sections.filter((item) => item.roles.includes(role)), [role]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-20 w-72 border-r border-border bg-card p-5 transition-transform lg:translate-x-0 ${
          mobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary p-2 text-primary-foreground">
              <Sparkles className="size-4" />
            </div>
            <div>
              <strong className="text-sm font-bold text-foreground">CampusFlow</strong>
              <span className="block text-xs text-muted-foreground">Smart Venue Booking</span>
            </div>
          </div>
          <button className="lg:hidden" onClick={() => setMobile(false)}>
            <X className="size-5" />
          </button>
        </div>

        <div className="mt-8 flex items-center gap-3 rounded-xl bg-muted p-3">
          <GraduationCap className="size-5 text-primary" />
          <div>
            <strong className="text-sm text-foreground">Role Dashboard</strong>
            <span className="block text-xs text-muted-foreground">{role} Access</span>
          </div>
        </div>

        <nav className="mt-6 space-y-1">
          {allowed.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                section === id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
              onClick={() => {
                setSection(id);
                setMobile(false);
              }}
            >
              <Icon className="size-4" />
              {label}
            </button>
          ))}
        </nav>

        <div className="mt-10 rounded-xl border border-border p-3 text-sm">
          <ShieldCheck className="mb-2 size-4 text-primary" />
          <p className="font-semibold text-xs text-foreground">Role Hierarchy</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Switch between Student, Employee, and Admin views using the top-right switcher.
          </p>
        </div>
      </aside>

      {/* Main Content Area */}
      <section className="lg:pl-72">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-background/90 px-5 backdrop-blur md:px-8">
          <button className="lg:hidden" onClick={() => setMobile(true)}>
            <Menu className="size-5" />
          </button>
          <div className="hidden items-center gap-2 text-sm text-muted-foreground md:flex">
            <span>Workspace</span>
            <span>/</span>
            <strong className="text-foreground">
              {sections.find((item) => item.id === section)?.label}
            </strong>
          </div>
          <label className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm shadow-sm">
            <Users className="size-4 text-primary" />
            <select
              value={role}
              onChange={(event) => setRole(event.target.value as Role)}
              className="bg-transparent font-medium text-foreground outline-none cursor-pointer"
            >
              <option value="Student">Student</option>
              <option value="Employee">Employee</option>
              <option value="Admin">Admin</option>
            </select>
          </label>
        </header>

        <div className="mx-auto max-w-7xl p-5 md:p-8">
          {error ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6">
              <p className="font-semibold text-destructive">Connection issue</p>
              <p className="mt-2 text-sm text-muted-foreground">{error}</p>
              <button
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                onClick={refresh}
              >
                <RefreshCw className="size-4" /> Retry
              </button>
            </div>
          ) : !data ? (
            <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">
              <RefreshCw className="mx-auto size-6 animate-spin text-primary mb-3" />
              Loading workspace data…
            </div>
          ) : section === 'overview' ? (
            <Overview data={data} role={role} go={setSection} />
          ) : section === 'bookings' ? (
            <Bookings data={data} role={role} refresh={refresh} />
          ) : section === 'venues' ? (
            <SimpleSection title="Venues" eyebrow="Campus inventory">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {data.venues.length ? (
                  data.venues.map((venue) => (
                    <div
                      className="rounded-2xl border border-border bg-card p-5 shadow-sm"
                      key={venue._id || venue.venueId}
                    >
                      <Server className="mb-5 size-5 text-primary" />
                      <h2 className="font-semibold text-foreground">{venue.name}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {venue.type ?? 'Campus venue'} · Capacity {venue.capacity ?? '—'}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {venue.location ?? 'Campus grounds'}
                      </p>
                      <span className="mt-5 inline-block rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        {venue.status ?? 'ACTIVE'}
                      </span>
                    </div>
                  ))
                ) : (
                  <Empty
                    title="No venues configured"
                    text="Venues will appear here once registered."
                  />
                )}
              </div>
            </SimpleSection>
          ) : section === 'reports' ? (
            <SimpleSection title="Reports" eyebrow="Insights">
              <div className="grid gap-4 sm:grid-cols-3">
                <Metric label="Bookings" value={data.metrics.total} icon={BarChart3} />
                <Metric label="Approved" value={data.metrics.approved} icon={CheckCircle2} />
                <Metric label="Pending" value={data.metrics.pending} icon={Clock3} />
              </div>
              <Empty
                title="Aggregation Engine Active"
                text="Live aggregation reports based on allocated venue intervals."
              />
            </SimpleSection>
          ) : section === 'os' ? (
            <SimpleSection title="OS Simulator" eyebrow="Operating systems lab">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <MonitorCog className="mb-4 size-6 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">Scheduling & Concurrency Workspace</h2>
                <p className="mt-2 text-muted-foreground">
                  Interactive simulator for FCFS, Priority Scheduling, Round Robin, and Critical Section Mutual Exclusion.
                </p>
              </div>
            </SimpleSection>
          ) : (
            <SimpleSection title="DBMS Concepts" eyebrow="Data systems lab">
              <div className="grid gap-4 md:grid-cols-3">
                <Metric label="Atomicity" value="ACID" icon={Database} />
                <Metric label="Concurrency" value="Locks" icon={ShieldCheck} />
                <Metric label="Recovery" value="WAL" icon={RefreshCw} />
              </div>
            </SimpleSection>
          )}
        </div>
      </section>
    </main>
  );
}

export default function DashboardPage() {
  return <DashboardContent />;
}
