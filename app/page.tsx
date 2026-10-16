'use client'

import { useEffect, useMemo, useState } from 'react'
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
  AlertCircle,
  UserCheck,
} from 'lucide-react'
import OSAcademicLab from '@/components/os/OSAcademicLab'
import DBMSAcademicLab from '@/components/dbms/DBMSAcademicLab'
import VenueAuthorityPanel from '@/components/admin/VenueAuthorityPanel'
import PendingApprovalsInbox from '@/components/employee/PendingApprovalsInbox'
import AuditTrailViewer from '@/components/audit/AuditTrailViewer'
import AuthDefenseWidget from '@/components/auth/AuthDefenseWidget'

type Role = 'Student' | 'Employee' | 'Admin'
type Section = 'overview' | 'bookings' | 'approvals' | 'venues' | 'authorities' | 'reports' | 'os' | 'dbms' | 'audit'

type VenueItem = {
  _id: string
  id: string
  name: string
  type: string
  capacity: number
  location: string
  status: string
}

type BookingItem = {
  _id: string
  id: string
  purpose: string
  venueName: string
  venueId: string
  requesterName: string
  requesterId: string
  status: string
  date?: string
  startTime?: string
  endTime?: string
}

type NotificationItem = {
  _id: string
  id: string
  title: string
  message: string
  type: string
}

type Data = {
  identity: { role: Role; name: string }
  bookings: BookingItem[]
  venues: VenueItem[]
  notifications: NotificationItem[]
  metrics: { total: number; approved: number; pending: number; utilization: number }
}

const sections: Array<{ id: Section; label: string; icon: typeof LayoutDashboard; roles: Role[] }> = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, roles: ['Student', 'Employee', 'Admin'] },
  { id: 'bookings', label: 'Bookings', icon: CalendarDays, roles: ['Student', 'Employee', 'Admin'] },
  { id: 'approvals', label: 'Approvals Inbox', icon: UserCheck, roles: ['Employee', 'Admin'] },
  { id: 'venues', label: 'Venues', icon: Server, roles: ['Student', 'Employee', 'Admin'] },
  { id: 'authorities', label: 'Venue Authorities', icon: ShieldCheck, roles: ['Employee', 'Admin'] },
  { id: 'reports', label: 'Reports', icon: BarChart3, roles: ['Employee', 'Admin'] },
  { id: 'os', label: 'OS Simulator Suite', icon: MonitorCog, roles: ['Student', 'Employee', 'Admin'] },
  { id: 'dbms', label: 'DBMS Concepts', icon: Database, roles: ['Student', 'Employee', 'Admin'] },
  { id: 'audit', label: 'Audit Trail', icon: Activity, roles: ['Employee', 'Admin'] },
]

function Empty({
  title = 'No records yet',
  text = 'Connect activity to this workspace and it will appear here.',
}: {
  title?: string
  text?: string
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-10 text-center">
      <p className="font-semibold">{title}</p>
      <p className="mt-2 text-sm text-muted-foreground">{text}</p>
    </div>
  )
}

function Metric({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string | number
  icon: typeof Activity
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <Icon className="mb-4 size-5 text-primary" />
      <p className="text-sm text-muted-foreground">{label}</p>
      <strong className="mt-1 block text-3xl tracking-tight">{value}</strong>
    </div>
  )
}

function BookingRows({ bookings }: { bookings: BookingItem[] }) {
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL')
  const [searchTerm, setSearchTerm] = useState('')

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const matchesFilter = filter === 'ALL' || b.status?.toUpperCase() === filter
      const matchesSearch =
        !searchTerm ||
        b.purpose?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.venueName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.requesterName?.toLowerCase().includes(searchTerm.toLowerCase())
      return matchesFilter && matchesSearch
    })
  }, [bookings, filter, searchTerm])

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'APPROVED':
        return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
      case 'REJECTED':
      case 'CANCELLED':
        return 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20'
      case 'PENDING':
      default:
        return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20'
    }
  }

  return (
    <div className="space-y-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2">
        <div className="flex items-center gap-1.5 rounded-xl bg-muted/40 p-1 border border-border">
          {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`rounded-lg px-3 py-1 text-xs font-medium transition-all ${
                filter === tab
                  ? 'bg-background text-foreground shadow-sm font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'ALL' ? 'All Records' : tab}
            </button>
          ))}
        </div>
        <div className="relative min-w-[200px]">
          <Search className="absolute left-3 top-2.5 size-3.5 text-muted-foreground" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search event or venue..."
            className="w-full rounded-xl border border-input bg-background pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {!filteredBookings.length ? (
        <Empty title="No bookings found" text="No records match your selected filter." />
      ) : (
        <div className="overflow-auto rounded-xl border border-border/60">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="border-b border-border bg-muted/20 text-xs text-muted-foreground font-semibold">
              <tr>
                <th className="p-3.5">Purpose / Event</th>
                <th className="p-3.5">Venue Facility</th>
                <th className="p-3.5">Requester</th>
                <th className="p-3.5">Scheduled Slot</th>
                <th className="p-3.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((booking) => (
                <tr className="border-b border-border/70 hover:bg-muted/40 transition-colors" key={booking._id || booking.id}>
                  <td className="p-3.5 font-medium">{booking.purpose}</td>
                  <td className="p-3.5 text-foreground/80">{booking.venueName || booking.venueId}</td>
                  <td className="p-3.5 text-muted-foreground">{booking.requesterName || booking.requesterId}</td>
                  <td className="p-3.5 text-xs text-muted-foreground">
                    {booking.date ? `${booking.date} (${booking.startTime || ''}-${booking.endTime || ''})` : 'Scheduled'}
                  </td>
                  <td className="p-3.5">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadge(booking.status)}`}>
                      {booking.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function Overview({ data, role, go }: { data: Data; role: Role; go: (section: Section) => void }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{role} workspace</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">Good morning, {data.identity.name}.</h1>
          <p className="mt-2 text-muted-foreground">Connected to PostgreSQL via Prisma ORM.</p>
        </div>
        {role !== 'Employee' && (
          <button
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-primary-foreground font-medium shadow hover:opacity-90 transition-opacity"
            onClick={() => go('bookings')}
          >
            <Plus className="size-4" /> New booking
          </button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Total Bookings" value={data.metrics.total} icon={CalendarDays} />
        <Metric label="Approved" value={data.metrics.approved} icon={CheckCircle2} />
        <Metric label="Pending Review" value={data.metrics.pending} icon={Clock3} />
        <Metric label="Venue Active Rate" value={`${data.metrics.utilization}%`} icon={Server} />
      </div>

      {/* Akshat Defense - Live JWT & RBAC Session Status */}
      <AuthDefenseWidget currentRole={role} currentName={data.identity.name} />

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        <section className="rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border p-5">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Operational view</p>
              <h2 className="mt-1 text-xl font-semibold">Recent Bookings</h2>
            </div>
            <button className="text-sm text-primary font-medium hover:underline" onClick={() => go('bookings')}>
              View all
            </button>
          </div>
          <BookingRows bookings={data.bookings.slice(0, 6)} />
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Notifications</p>
          <h2 className="mt-1 text-xl font-semibold">Action Center</h2>
          <div className="mt-5 space-y-4">
            {data.notifications.length ? (
              data.notifications.map((note) => (
                <div className="border-l-2 border-primary pl-3 py-1" key={note._id || note.id}>
                  <p className="font-medium text-sm">{note.title ?? 'Workspace update'}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{note.message ?? 'A new notification is available.'}</p>
                </div>
              ))
            ) : (
              <Empty title="All caught up" text="Unread notifications will appear here." />
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

function Bookings({ data, role, refresh }: { data: Data; role: Role; refresh: () => void }) {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [isConflict, setIsConflict] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [form, setForm] = useState({
    venueId: data.venues[0]?._id || data.venues[0]?.id || '',
    purpose: '',
    startAt: '',
    endAt: '',
    expectedAttendees: 50,
  })

  // Synchronize default venueId if empty
  useEffect(() => {
    if (!form.venueId && data.venues.length > 0) {
      setForm((prev) => ({ ...prev, venueId: data.venues[0]._id || data.venues[0].id }))
    }
  }, [data.venues, form.venueId])

  const selectedVenue = useMemo(() => {
    return data.venues.find((v) => (v._id || v.id) === form.venueId) || data.venues[0]
  }, [data.venues, form.venueId])

  // Helper for Samridhi's viva demonstration: pre-fills an active slot to demonstrate 409 Conflict
  const triggerConflictDemo = () => {
    const existing = data.bookings.find((b) => b.status === 'PENDING' || b.status === 'APPROVED')
    if (existing && existing.date && existing.startTime && existing.endTime) {
      const targetVenue = data.venues.find((v) => v.name === existing.venueName) || data.venues[0]
      if (targetVenue) {
        setForm({
          venueId: targetVenue._id || targetVenue.id,
          purpose: 'Viva Overlap Test: Annual Tech Symposium',
          startAt: `${existing.date}T${existing.startTime}:00`,
          endAt: `${existing.date}T${existing.endTime}:00`,
          expectedAttendees: Math.min(50, targetVenue.capacity),
        })
        setOpen(true)
        setMessage('Pre-filled with an active occupied slot. Click "Submit request" to demonstrate the HTTP 409 Conflict rejection!')
        setIsConflict(false)
        return
      }
    }

    // Fallback tomorrow slot
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dateStr = tomorrow.toISOString().split('T')[0]
    setForm({
      venueId: data.venues[0]?._id || data.venues[0]?.id || '',
      purpose: 'Simulated Overlap Event',
      startAt: `${dateStr}T10:00:00`,
      endAt: `${dateStr}T12:00:00`,
      expectedAttendees: 50,
    })
    setOpen(true)
  }

  async function submit() {
    setMessage('')
    setIsConflict(false)
    if (!form.venueId) {
      setMessage('Please select a venue.')
      return
    }
    if (!form.purpose) {
      setMessage('Please enter event purpose.')
      return
    }
    if (!form.startAt || !form.endAt) {
      setMessage('Please enter both start and end date/time.')
      return
    }
    if (selectedVenue && form.expectedAttendees > selectedVenue.capacity) {
      setMessage(`Capacity Rule Violation: Expected attendees (${form.expectedAttendees}) exceeds venue capacity (${selectedVenue.capacity}).`)
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-demo-role': role },
        body: JSON.stringify(form),
      })
      const payload = await response.json().catch(() => ({ error: 'Invalid response from server' }))
      if (!response.ok) {
        if (response.status === 409) {
          setIsConflict(true)
        }
        setMessage(payload.error || 'Failed to submit booking')
        return
      }
      setOpen(false)
      setForm({
        venueId: data.venues[0]?._id || data.venues[0]?.id || '',
        purpose: '',
        startAt: '',
        endAt: '',
        expectedAttendees: 50,
      })
      refresh()
    } catch (err: any) {
      setMessage(err.message || 'Network error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Resource management</p>
          <h1 className="mt-2 text-4xl font-semibold">Bookings</h1>
          <p className="mt-2 text-muted-foreground">
            {role === 'Employee'
              ? 'Review and manage bookings assigned to your venues.'
              : 'Create and track bookings directly stored in PostgreSQL.'}
          </p>
        </div>
        {role !== 'Employee' && (
          <div className="flex items-center gap-2">
            <button
              className="inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-3.5 py-2.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
              onClick={triggerConflictDemo}
              title="Pre-fill an overlapping slot to test 409 conflict detection"
            >
              <Sparkles className="size-3.5" />
              <span>Simulate Conflict Test</span>
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-primary-foreground font-medium shadow hover:opacity-90 transition-opacity"
              onClick={() => {
                setOpen(!open)
                setMessage('')
                setIsConflict(false)
              }}
            >
              <Plus className="size-4" /> Create booking
            </button>
          </div>
        )}
      </div>

      {/* Samridhi Defense - Mathematical Interval Overlap Engine Banner */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">Samridhi Defense: Mathematical Interval Overlap Engine</span>
            <span className="rounded-full bg-primary/15 px-2 py-0.5 font-mono text-[10px] text-primary font-bold">
              PostgreSQL B-Tree Seek
            </span>
          </div>
          <p className="text-muted-foreground">
            Collision Theorem: <code className="font-mono text-primary font-medium">{"(S_exist < E_req) ∧ (E_exist > S_req)"}</code> enforced on <code className="font-mono">idx_bookings_lookup</code>.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] text-muted-foreground">Capacity bounds & temporal guards active</span>
        </div>
      </div>

      {open && (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-lg font-semibold">Request Venue Allocation</h3>
            {selectedVenue && (
              <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground font-mono">
                Capacity: {selectedVenue.capacity} seats ({selectedVenue.type})
              </span>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium">
              Venue
              <select
                className="mt-2 w-full rounded-xl border border-input bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                value={form.venueId}
                onChange={(event) => setForm({ ...form, venueId: event.target.value })}
              >
                {data.venues.map((v) => (
                  <option key={v._id || v.id} value={v._id || v.id}>
                    {v.name} ({v.type} - Max Cap: {v.capacity})
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-medium">
              Purpose / Event Name
              <input
                className="mt-2 w-full rounded-xl border border-input bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g. ACM Guest Lecture"
                value={form.purpose}
                onChange={(event) => setForm({ ...form, purpose: event.target.value })}
              />
            </label>

            <label className="text-sm font-medium">
              Start Date & Time
              <input
                type="datetime-local"
                className="mt-2 w-full rounded-xl border border-input bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                value={form.startAt}
                onChange={(event) => setForm({ ...form, startAt: event.target.value })}
              />
            </label>

            <label className="text-sm font-medium">
              End Date & Time
              <input
                type="datetime-local"
                className="mt-2 w-full rounded-xl border border-input bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                value={form.endAt}
                onChange={(event) => setForm({ ...form, endAt: event.target.value })}
              />
            </label>

            <label className="text-sm font-medium md:col-span-2">
              <div className="flex items-center justify-between">
                <span>Expected Attendees</span>
                {selectedVenue && (
                  <span className={`text-xs ${form.expectedAttendees > selectedVenue.capacity ? 'text-destructive font-bold' : 'text-muted-foreground'}`}>
                    Venue Limit: {selectedVenue.capacity}
                  </span>
                )}
              </div>
              <input
                type="number"
                min="1"
                max={selectedVenue?.capacity || 1000}
                className="mt-2 w-full rounded-xl border border-input bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g. 50"
                value={form.expectedAttendees}
                onChange={(event) => setForm({ ...form, expectedAttendees: Number(event.target.value) })}
              />
            </label>
          </div>

          {message && (
            <div
              className={`flex items-start gap-2.5 rounded-xl p-3.5 text-sm border ${
                isConflict
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
                  : 'bg-destructive/10 border-destructive/20 text-destructive'
              }`}
            >
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">{isConflict ? 'HTTP 409 Conflict Detected' : 'Validation Error'}</p>
                <p className="text-xs leading-relaxed">{message}</p>
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-end gap-3 pt-2 border-t border-border">
            <button
              className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>
            <button
              disabled={isSubmitting}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
              onClick={submit}
            >
              {isSubmitting ? 'Submitting...' : 'Submit request'}
            </button>
          </div>
        </div>
      )}

      <section className="rounded-2xl border border-border bg-card">
        <div className="flex items-center gap-3 border-b border-border p-5">
          <Search className="size-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">PostgreSQL-backed booking records ({data.bookings.length} entries)</span>
        </div>
        <BookingRows bookings={data.bookings} />
      </section>
    </div>
  )
}

function SimpleSection({ title, eyebrow, children }: { title: string; eyebrow: string; children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
        <h1 className="mt-2 text-4xl font-semibold">{title}</h1>
      </div>
      {children}
    </div>
  )
}

function App() {
  const [role, setRole] = useState<Role>('Admin')
  const [section, setSection] = useState<Section>('overview')
  const [data, setData] = useState<Data | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [mobile, setMobile] = useState(false)

  const refresh = () => {
    setLoading(true)
    fetch(`/api/dashboard?role=${role}`)
      .then(async (response) => {
        const payload = await response.json().catch(() => ({
          error: `Server responded with status ${response.status} (${response.statusText})`,
        }))
        if (!response.ok) throw new Error(payload.error || 'Failed to fetch dashboard data')
        setData(payload)
        setError('')
      })
      .catch((reason) => setError(reason.message || 'Unknown network error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    refresh()
  }, [role])

  const allowed = useMemo(() => sections.filter((item) => item.roles.includes(role)), [role])

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
              <strong>CampusFlow</strong>
              <span className="block text-xs text-muted-foreground">PostgreSQL workspace</span>
            </div>
          </div>
          <button className="lg:hidden" onClick={() => setMobile(false)}>
            <X />
          </button>
        </div>

        <div className="mt-8 flex items-center gap-3 rounded-xl bg-muted p-3">
          <GraduationCap className="size-5 text-primary" />
          <div>
            <strong className="text-sm">Role dashboard</strong>
            <span className="block text-xs text-muted-foreground">{role} access</span>
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
                setSection(id)
                setMobile(false)
              }}
            >
              <Icon className="size-4" />
              {label}
            </button>
          ))}
        </nav>

        <div className="mt-10 rounded-xl border border-border p-3 text-sm">
          <ShieldCheck className="mb-2 size-4 text-primary" />
          <p className="font-medium">Identity & RBAC Boundary</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Role switching demonstrates permissions across Students, Employees, and Admins.
          </p>
        </div>
      </aside>

      {/* Main Content Area */}
      <section className="lg:pl-72">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-background/90 px-5 backdrop-blur md:px-8">
          <button className="lg:hidden" onClick={() => setMobile(true)}>
            <Menu />
          </button>
          <div className="hidden items-center gap-2 text-sm text-muted-foreground md:flex">
            <span>Workspace</span>
            <span>/</span>
            <strong className="text-foreground">{sections.find((item) => item.id === section)?.label}</strong>
          </div>
          <label className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm shadow-sm">
            <Users className="size-4 text-muted-foreground" />
            <select
              value={role}
              onChange={(event) => setRole(event.target.value as Role)}
              className="bg-transparent outline-none cursor-pointer font-medium"
            >
              <option value="Student">Student</option>
              <option value="Employee">Employee</option>
              <option value="Admin">Admin</option>
            </select>
          </label>
        </header>

        <div className="mx-auto max-w-7xl p-5 md:p-8">
          {error ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-foreground">
              <div className="flex items-center gap-3">
                <AlertCircle className="size-6 text-destructive" />
                <p className="text-lg font-semibold text-destructive">Database Connection Unavailable</p>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{error}</p>
              <button
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
                onClick={refresh}
              >
                <RefreshCw className="size-4" /> Retry
              </button>
            </div>
          ) : loading && !data ? (
            <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground animate-pulse">
              Loading PostgreSQL workspace data…
            </div>
          ) : !data ? null : section === 'overview' ? (
            <Overview data={data} role={role} go={setSection} />
          ) : section === 'bookings' ? (
            <Bookings data={data} role={role} refresh={refresh} />
          ) : section === 'approvals' ? (
            <SimpleSection title="Pending Approvals Inbox" eyebrow="Authority Enforcement">
              <PendingApprovalsInbox role={role} onActionSuccess={refresh} />
            </SimpleSection>
          ) : section === 'venues' ? (
            <SimpleSection title="Venues" eyebrow="Campus inventory">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {data.venues.length ? (
                  data.venues.map((venue) => (
                    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm" key={venue._id || venue.id}>
                      <Server className="mb-4 size-5 text-primary" />
                      <h2 className="font-semibold text-lg">{venue.name}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {venue.type ?? 'Campus venue'} · Capacity {venue.capacity ?? '—'}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">{venue.location}</p>
                      <span className="mt-4 inline-block rounded-full bg-emerald-500/15 border border-emerald-500/20 px-3 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 capitalize">
                        {venue.status ?? 'active'}
                      </span>
                    </div>
                  ))
                ) : (
                  <Empty title="No venues configured" text="Database contains no venue entries." />
                )}
              </div>
            </SimpleSection>
          ) : section === 'authorities' ? (
            <SimpleSection title="Venue Authority Matrix" eyebrow="Administrative Delegation">
              <VenueAuthorityPanel role={role} />
            </SimpleSection>
          ) : section === 'reports' ? (
            <SimpleSection title="Reports" eyebrow="Insights">
              <div className="grid gap-4 sm:grid-cols-3">
                <Metric label="Bookings" value={data.metrics.total} icon={BarChart3} />
                <Metric label="Approved" value={data.metrics.approved} icon={CheckCircle2} />
                <Metric label="Pending" value={data.metrics.pending} icon={Clock3} />
              </div>
              <Empty
                title="PostgreSQL Aggregation Engine"
                text="As requests are submitted and approved, relational data and SQL metrics will update live here."
              />
            </SimpleSection>
          ) : section === 'os' ? (
            <SimpleSection title="Operating Systems Academic Lab" eyebrow="OS Simulation Suite">
              <OSAcademicLab />
            </SimpleSection>
          ) : section === 'audit' ? (
            <SimpleSection title="System Audit Trail" eyebrow="Non-Repudiation & Security Log">
              <AuditTrailViewer />
            </SimpleSection>
          ) : (
            <SimpleSection title="DBMS Concepts & SQL Lab" eyebrow="Data Systems Lab">
              <DBMSAcademicLab />
            </SimpleSection>
          )}
        </div>
      </section>
    </main>
  )
}

export default function Page() {
  return <App />
}
