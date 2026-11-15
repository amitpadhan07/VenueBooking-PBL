'use client'

import { useState, useEffect } from 'react'
import {
  BarChart3,
  CheckCircle2,
  Clock3,
  XCircle,
  Building2,
  Users,
  Download,
  Printer,
  RefreshCw,
  TrendingUp,
  Database,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

interface SummaryData {
  totalVenues: number
  activeVenues: number
  totalBookings: number
  approvedBookings: number
  pendingBookings: number
  rejectedBookings: number
  cancelledBookings: number
  totalUsers: number
  totalEmployees: number
  activeAuthorities: number
  totalAuditLogs: number
  approvalRate: number
}

interface VenueUtil {
  venueId: string
  venueName: string
  venueType: string
  capacity: number
  location: string
  status: string
  totalBookings: number
  approvedBookings: number
  pendingBookings: number
  rejectedBookings: number
  totalHours: number
  totalAttendees: number
  utilizationRate: number
}

interface DeptStat {
  department: string
  totalMembers: number
  totalRequests: number
  approvedRequests: number
  pendingRequests: number
  rejectedRequests: number
  cancelledRequests: number
  totalAttendees: number
}

interface PeakHour {
  timeSlot: string
  hour: number
  bookingCount: number
  approvedCount: number
  pendingCount: number
}

export default function AnalyticsReportsView() {
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [utilization, setUtilization] = useState<VenueUtil[]>([])
  const [departments, setDepartments] = useState<DeptStat[]>([])
  const [peakHours, setPeakHours] = useState<PeakHour[]>([])
  const [peakSlot, setPeakSlot] = useState<string>('11:00 - 12:00')
  const [showSqlDetails, setShowSqlDetails] = useState(false)
  const [activeTab, setActiveTab] = useState<'utilization' | 'departments' | 'peak'>('utilization')

  const fetchReports = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/reports')
      const data = await res.json()
      if (data.success) {
        setSummary(data.summary)
        setUtilization(data.utilization || [])
        setDepartments(data.departments || [])
        setPeakHours(data.peakHours || [])
        if (data.peakSlot) setPeakSlot(data.peakSlot)
      }
    } catch (err) {
      console.error('Failed to load analytics reports:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [])

  const exportToCSV = () => {
    if (!utilization.length) return
    const headers = [
      'Venue Name',
      'Venue Type',
      'Capacity',
      'Location',
      'Total Bookings',
      'Approved Bookings',
      'Pending Bookings',
      'Total Hours Booked',
      'Total Attendees',
      'Utilization Rate (%)',
    ]

    const rows = utilization.map((v) => [
      `"${v.venueName}"`,
      `"${v.venueType}"`,
      v.capacity,
      `"${v.location}"`,
      v.totalBookings,
      v.approvedBookings,
      v.pendingBookings,
      v.totalHours,
      v.totalAttendees,
      `${v.utilizationRate}%`,
    ])

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `VenueBooking_Analytics_Report_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const printReport = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="h-3.5 w-3.5" /> Phase J Engine
            </span>
            <span className="text-xs text-muted-foreground">Lead: Lavanya Joshi (DBMS & SQL Aggregations)</span>
          </div>
          <h2 className="mt-1 text-2xl font-bold tracking-tight">System Analytics & Utilization Reports</h2>
          <p className="text-xs text-muted-foreground">
            Live PostgreSQL aggregations of facility density, departmental usage, and peak campus hours.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={fetchReports}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium hover:bg-muted/60 transition disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
          <button
            onClick={exportToCSV}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium hover:bg-muted/60 transition"
          >
            <Download className="h-3.5 w-3.5 text-indigo-500" />
            Export CSV
          </button>
          <button
            onClick={printReport}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:opacity-90 transition"
          >
            <Printer className="h-3.5 w-3.5" />
            Print Report
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Total Bookings</span>
            <BarChart3 className="h-4 w-4 text-blue-500" />
          </div>
          <div className="mt-2 text-2xl font-bold">{summary?.totalBookings ?? 0}</div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {summary?.activeVenues ?? 0} active physical facilities
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Approved Bookings</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {summary?.approvedBookings ?? 0}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {summary?.approvalRate ?? 0}% overall approval rate
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Pending Approvals</span>
            <Clock3 className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">
            {summary?.pendingBookings ?? 0}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">Awaiting venue authority action</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Peak Hour Slot</span>
            <Calendar className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="mt-2 text-xl font-bold text-indigo-600 dark:text-indigo-400">{peakSlot}</div>
          <p className="mt-1 text-[11px] text-muted-foreground">Highest concurrent demand</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('utilization')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-medium transition ${
            activeTab === 'utilization'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Building2 className="h-3.5 w-3.5" />
          Venue Utilization ({utilization.length})
        </button>
        <button
          onClick={() => setActiveTab('departments')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-medium transition ${
            activeTab === 'departments'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          Department Breakdown ({departments.length})
        </button>
        <button
          onClick={() => setActiveTab('peak')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-medium transition ${
            activeTab === 'peak'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Clock3 className="h-3.5 w-3.5" />
          Hourly Demand Profile
        </button>
      </div>

      {/* Tab 1: Venue Utilization */}
      {activeTab === 'utilization' && (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {utilization.map((venue) => (
              <div
                key={venue.venueId}
                className="rounded-xl border border-border bg-card p-4 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-base">{venue.venueName}</h3>
                      <p className="text-xs text-muted-foreground">
                        {venue.venueType} • Capacity: {venue.capacity} seats
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        venue.status === 'ACTIVE'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {venue.status}
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-muted-foreground">{venue.location}</p>

                  <div className="mt-4">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-muted-foreground">Facility Utilization</span>
                      <span className="font-bold text-primary">{venue.utilizationRate}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-500"
                        style={{ width: `${venue.utilizationRate}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-3 text-center text-xs">
                  <div>
                    <div className="font-bold text-foreground">{venue.totalBookings}</div>
                    <div className="text-[10px] text-muted-foreground">Total Events</div>
                  </div>
                  <div>
                    <div className="font-bold text-emerald-600 dark:text-emerald-400">{venue.totalHours} hrs</div>
                    <div className="text-[10px] text-muted-foreground">Booked Hours</div>
                  </div>
                  <div>
                    <div className="font-bold text-foreground">{venue.totalAttendees}</div>
                    <div className="text-[10px] text-muted-foreground">Attendees</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Detailed Table */}
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
            <div className="border-b border-border bg-muted/30 px-4 py-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Detailed Venue Utilization Data Table
              </h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="p-3 font-semibold">Venue</th>
                    <th className="p-3 font-semibold">Type</th>
                    <th className="p-3 font-semibold">Capacity</th>
                    <th className="p-3 font-semibold">Total Requests</th>
                    <th className="p-3 font-semibold">Approved</th>
                    <th className="p-3 font-semibold">Pending</th>
                    <th className="p-3 font-semibold">Booked Hours</th>
                    <th className="p-3 font-semibold">Utilization</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {utilization.map((v) => (
                    <tr key={v.venueId} className="hover:bg-muted/20">
                      <td className="p-3 font-medium text-foreground">{v.venueName}</td>
                      <td className="p-3 text-muted-foreground">{v.venueType}</td>
                      <td className="p-3 text-muted-foreground">{v.capacity}</td>
                      <td className="p-3 font-medium">{v.totalBookings}</td>
                      <td className="p-3 font-medium text-emerald-600 dark:text-emerald-400">
                        {v.approvedBookings}
                      </td>
                      <td className="p-3 font-medium text-amber-600 dark:text-amber-400">{v.pendingBookings}</td>
                      <td className="p-3 text-muted-foreground">{v.totalHours} hrs</td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 font-bold text-primary">
                          {v.utilizationRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Department Stats */}
      {activeTab === 'departments' && (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {departments.map((dept, idx) => (
              <div key={idx} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">{dept.department}</h4>
                  <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {dept.totalMembers} Registered Users
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Total Requests:</span>
                  <span className="font-bold">{dept.totalRequests}</span>
                </div>

                {/* Progress bar breakdown */}
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted flex">
                  {dept.totalRequests > 0 && (
                    <>
                      <div
                        className="bg-emerald-500 h-full"
                        style={{ width: `${(dept.approvedRequests / dept.totalRequests) * 100}%` }}
                        title={`Approved: ${dept.approvedRequests}`}
                      />
                      <div
                        className="bg-amber-500 h-full"
                        style={{ width: `${(dept.pendingRequests / dept.totalRequests) * 100}%` }}
                        title={`Pending: ${dept.pendingRequests}`}
                      />
                      <div
                        className="bg-rose-500 h-full"
                        style={{ width: `${(dept.rejectedRequests / dept.totalRequests) * 100}%` }}
                        title={`Rejected: ${dept.rejectedRequests}`}
                      />
                    </>
                  )}
                </div>

                <div className="mt-3 grid grid-cols-4 gap-1 text-center text-[11px]">
                  <div className="rounded bg-emerald-500/10 p-1 text-emerald-600 dark:text-emerald-400 font-medium">
                    ✓ {dept.approvedRequests} Appr
                  </div>
                  <div className="rounded bg-amber-500/10 p-1 text-amber-600 dark:text-amber-400 font-medium">
                    ⏳ {dept.pendingRequests} Pend
                  </div>
                  <div className="rounded bg-rose-500/10 p-1 text-rose-600 dark:text-rose-400 font-medium">
                    ✕ {dept.rejectedRequests} Rej
                  </div>
                  <div className="rounded bg-muted p-1 text-muted-foreground font-medium">
                    👥 {dept.totalAttendees}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Peak Hours Profile */}
      {activeTab === 'peak' && (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="font-bold text-base">Campus Hourly Booking Pressure (08:00 – 20:00)</h3>
              <p className="text-xs text-muted-foreground">
                Evaluates time-interval overlaps ($S_{'{'}req{'}'} &lt; E_{'{'}slot{'}'} \land E_{'{'}req{'}'} &gt; S_{'{'}slot{'}'}$) across active schedule requests.
              </p>
            </div>
            <div className="rounded-lg bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              Peak Slot: {peakSlot}
            </div>
          </div>

          {/* Visual Bar Chart */}
          <div className="pt-6 pb-2">
            <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 items-end h-40">
              {peakHours.map((slot) => {
                const max = Math.max(...peakHours.map((p) => p.bookingCount), 1)
                const heightPercent = Math.max(10, Math.round((slot.bookingCount / max) * 100))
                const isPeak = slot.bookingCount === max && max > 0

                return (
                  <div key={slot.hour} className="flex flex-col items-center gap-1 h-full justify-end group">
                    <span className="text-[10px] font-bold text-muted-foreground opacity-0 group-hover:opacity-100 transition">
                      {slot.bookingCount}
                    </span>
                    <div className="w-full rounded-t-md overflow-hidden bg-muted flex flex-col justify-end h-full">
                      <div
                        className={`w-full transition-all duration-500 ${
                          isPeak ? 'bg-indigo-500 shadow-md' : 'bg-primary/80'
                        }`}
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>
                    <span className="text-[9px] text-muted-foreground font-mono mt-1">
                      {String(slot.hour).padStart(2, '0')}h
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* DBMS Academic Corner Accordion */}
      <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/5 p-4 transition">
        <button
          onClick={() => setShowSqlDetails(!showSqlDetails)}
          className="flex w-full items-center justify-between text-left font-semibold text-xs text-indigo-700 dark:text-indigo-300"
        >
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <span>Lavanya's DBMS Implementation: Underlying PostgreSQL Aggregation Queries</span>
          </div>
          {showSqlDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {showSqlDetails && (
          <div className="mt-3 space-y-3 text-xs font-mono text-muted-foreground border-t border-indigo-500/20 pt-3">
            <div>
              <p className="font-semibold text-foreground mb-1">1. Summary Scalar Subqueries (CTE):</p>
              <pre className="rounded bg-muted/60 p-2 overflow-x-auto text-[11px]">
{`SELECT
  (SELECT COUNT(*)::int FROM venues) AS total_venues,
  (SELECT COUNT(*)::int FROM bookings WHERE status = 'APPROVED') AS approved_bookings,
  (SELECT COUNT(*)::int FROM bookings WHERE status = 'PENDING') AS pending_bookings;`}
              </pre>
            </div>

            <div>
              <p className="font-semibold text-foreground mb-1">2. Venue Utilization & Temporal Differencing:</p>
              <pre className="rounded bg-muted/60 p-2 overflow-x-auto text-[11px]">
{`SELECT v.venue_name, COUNT(b.booking_id)::int AS total_bookings,
  COALESCE(SUM(CASE WHEN b.status = 'APPROVED' THEN
    EXTRACT(HOUR FROM (b.end_time::time - b.start_time::time)) +
    EXTRACT(MINUTE FROM (b.end_time::time - b.start_time::time)) / 60.0
  ELSE 0 END), 0)::float AS total_hours
FROM venues v LEFT JOIN bookings b ON v.venue_id = b.venue_id
GROUP BY v.venue_id, v.venue_name;`}
              </pre>
            </div>

            <div>
              <p className="font-semibold text-foreground mb-1">3. Peak Hour Interval Overlap Join:</p>
              <pre className="rounded bg-muted/60 p-2 overflow-x-auto text-[11px]">
{`WITH hours AS (SELECT generate_series(8, 19) AS hour_num)
SELECT h.hour_num, COUNT(b.booking_id)::int AS booking_count
FROM hours h
LEFT JOIN bookings b ON (
  b.start_time < LPAD((h.hour_num + 1)::text, 2, '0') || ':00' 
  AND b.end_time > LPAD(h.hour_num::text, 2, '0') || ':00'
  AND b.status IN ('APPROVED', 'PENDING')
)
GROUP BY h.hour_num ORDER BY h.hour_num;`}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
