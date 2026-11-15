'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { useAuth } from '@/components/auth/AuthContext'
import {
  BarChart3,
  TrendingUp,
  Download,
  Printer,
  Building2,
  CalendarDays,
  Users,
  CheckCircle2,
  Clock,
  PieChart,
  Layers,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react'

interface SummaryStats {
  totalVenues: number
  activeVenues: number
  totalBookings: number
  pendingBookings: number
  approvedBookings: number
  rejectedBookings: number
  cancelledBookings: number
  completedBookings: number
  totalUsers: number
  approvalRate: number
}

interface VenueUtil {
  venue_id: string
  venue_name: string
  capacity: number
  venue_type: string
  location: string
  status: string
  total_bookings: number
  approved_bookings: number
  total_hours_booked: number
  utilization_rate: number
}

interface DeptStat {
  department: string
  total_bookings: number
  approved_bookings: number
  total_attendees: number
}

interface PeakHour {
  slot: string
  bookings_count: number
}

export default function ReportsDashboardPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)

  const [summary, setSummary] = useState<SummaryStats | null>(null)
  const [utilization, setUtilization] = useState<VenueUtil[]>([])
  const [deptStats, setDeptStats] = useState<DeptStat[]>([])
  const [peakHours, setPeakHours] = useState<PeakHour[]>([])

  const fetchReports = async () => {
    try {
      setLoading(true)
      const [sumRes, utilRes, deptRes, peakRes] = await Promise.all([
        fetch('/api/reports/summary'),
        fetch('/api/reports/venue-utilization'),
        fetch('/api/reports/department-stats'),
        fetch('/api/reports/peak-hours'),
      ])

      if (sumRes.ok) {
        const data = await sumRes.json()
        setSummary(data.summary)
      }
      if (utilRes.ok) {
        const data = await utilRes.json()
        setUtilization(data.utilization || [])
      }
      if (deptRes.ok) {
        const data = await deptRes.json()
        setDeptStats(data.departmentStats || [])
      }
      if (peakRes.ok) {
        const data = await peakRes.json()
        setPeakHours(data.peakHours || [])
      }
    } catch (err) {
      console.error('Failed to load reports:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [])

  const exportCSV = () => {
    if (!utilization.length) return
    const headers = ['Venue Name', 'Capacity', 'Type', 'Location', 'Total Bookings', 'Approved Bookings', 'Total Hours', 'Utilization %']
    const rows = utilization.map((v) => [
      `"${v.venue_name}"`,
      v.capacity,
      `"${v.venue_type}"`,
      `"${v.location}"`,
      v.total_bookings,
      v.approved_bookings,
      v.total_hours_booked,
      `${v.utilization_rate}%`,
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `venue_utilization_report_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Top Header & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="size-3.5" />
                Back to Dashboard
              </Link>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
              <BarChart3 className="size-7 text-primary" />
              Campus Venue Analytics & Reports
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Statistical breakdown of campus facility occupancy, departmental event distribution, and peak hours.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchReports}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold hover:bg-muted transition-colors"
            >
              <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={exportCSV}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold hover:bg-muted transition-colors"
            >
              <Download className="size-3.5 text-primary" />
              Export CSV
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
            >
              <Printer className="size-3.5" />
              Print Report
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Total Bookings</span>
              <div className="rounded-xl bg-primary/10 p-2 text-primary">
                <CalendarDays className="size-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-bold text-foreground">
                {summary?.totalBookings ?? '—'}
              </span>
              <span className="ml-2 text-xs text-muted-foreground">across all venues</span>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Approval Rate</span>
              <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="size-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-bold text-foreground">
                {summary ? `${summary.approvalRate}%` : '—'}
              </span>
              <span className="ml-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                {summary?.approvedBookings ?? 0} approved
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Active Facilities</span>
              <div className="rounded-xl bg-blue-500/10 p-2 text-blue-600 dark:text-blue-400">
                <Building2 className="size-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-bold text-foreground">
                {summary?.activeVenues ?? '—'}
              </span>
              <span className="ml-2 text-xs text-muted-foreground">
                / {summary?.totalVenues ?? 0} total venues
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Pending Decisions</span>
              <div className="rounded-xl bg-amber-500/10 p-2 text-amber-600 dark:text-amber-400">
                <Clock className="size-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-bold text-foreground">
                {summary?.pendingBookings ?? '—'}
              </span>
              <span className="ml-2 text-xs text-amber-600 dark:text-amber-400 font-semibold">awaiting approver</span>
            </div>
          </div>
        </div>

        {/* Section 1: Venue Utilization Rates */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Building2 className="size-4 text-primary" />
                Facility Utilization & Reserved Hours
              </h2>
              <p className="text-xs text-muted-foreground">
                Occupancy percentage calculated against standard campus operational calendar.
              </p>
            </div>
            <span className="text-xs font-mono text-muted-foreground">PostgreSQL Aggregation</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 border-b border-border font-semibold text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Facility Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Capacity</th>
                  <th className="px-4 py-3">Approved Events</th>
                  <th className="px-4 py-3">Reserved Hours</th>
                  <th className="px-4 py-3">Utilization Bar</th>
                  <th className="px-4 py-3 text-right">Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {utilization.map((v) => (
                  <tr key={v.venue_id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-semibold text-foreground">
                      {v.venue_name}
                      <span className="block text-[10px] text-muted-foreground font-normal">{v.location}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{v.venue_type}</td>
                    <td className="px-4 py-3 font-mono font-medium">{v.capacity} pax</td>
                    <td className="px-4 py-3 font-semibold text-foreground">{v.approved_bookings}</td>
                    <td className="px-4 py-3 font-mono text-muted-foreground">{v.total_hours_booked} hrs</td>
                    <td className="px-4 py-3 w-48">
                      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(5, v.utilization_rate)}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-primary font-mono">
                      {v.utilization_rate}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 2: Department Stats & Peak Hours Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Department Breakdown */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Users className="size-4 text-primary" />
                  Academic Department Distribution
                </h3>
                <p className="text-xs text-muted-foreground">Volume of reservations and attendees per faculty department.</p>
              </div>
            </div>

            <div className="space-y-3">
              {deptStats.map((d) => (
                <div key={d.department} className="rounded-xl border border-border bg-muted/20 p-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-foreground block">{d.department}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {d.approved_bookings} approved / {d.total_bookings} total requests
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-primary font-mono block">
                      {d.total_attendees} attendees
                    </span>
                    <span className="text-[10px] text-muted-foreground">cumulative footfall</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Peak Hours Breakdown */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Clock className="size-4 text-primary" />
                  Peak Booking Windows
                </h3>
                <p className="text-xs text-muted-foreground">Most demanded time intervals across academic semesters.</p>
              </div>
            </div>

            <div className="space-y-3">
              {peakHours.map((slot) => {
                const maxCount = Math.max(...peakHours.map((s) => s.bookings_count), 1)
                const percentage = Math.round((slot.bookings_count / maxCount) * 100)

                return (
                  <div key={slot.slot} className="rounded-xl border border-border bg-muted/20 p-3 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-semibold text-foreground">{slot.slot}</span>
                      <span className="font-bold text-foreground font-mono">
                        {slot.bookings_count} bookings
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(4, percentage)}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

