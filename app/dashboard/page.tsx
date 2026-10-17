'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { useAuth } from '@/components/auth/AuthContext'
import {
  CalendarDays,
  Clock3,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Building2,
  Plus,
  Search,
  Filter,
  User,
  MapPin,
  Users,
  Calendar,
  Sparkles,
  Ticket,
  X,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react'

interface BookingItem {
  booking_id: string
  event_name: string
  event_description?: string
  event_date: string
  start_time: string
  end_time: string
  expected_attendees: number
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED'
  created_at: string
  venue_id: string
  venue_name: string
  capacity: number
  location: string
  requester_name?: string
  requester_email?: string
}

interface VenueItem {
  id: string
  venue_id: string
  name: string
  venue_name: string
  location: string
  capacity: number
  type: string
  venue_type: string
  description?: string
  status: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE'
}

export default function UserDashboardPage() {
  const router = useRouter()
  const { user, isAuthenticated, loading: authLoading } = useAuth()

  const [activeTab, setActiveTab] = useState<'bookings' | 'venues'>('bookings')
  const [filterStatus, setFilterStatus] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  const [bookings, setBookings] = useState<BookingItem[]>([])
  const [venues, setVenues] = useState<VenueItem[]>([])
  const [loadingData, setLoadingData] = useState(true)

  // Booking Modal State
  const [bookingModalOpen, setBookingModalOpen] = useState(false)
  const [selectedVenueId, setSelectedVenueId] = useState('')
  const [eventName, setEventName] = useState('')
  const [eventDescription, setEventDescription] = useState('')
  const [eventDate, setEventDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d.toISOString().split('T')[0]
  })
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('11:00')
  const [attendees, setAttendees] = useState('50')
  const [bookingSubmitting, setBookingSubmitting] = useState(false)
  const [bookingError, setBookingError] = useState<string | null>(null)
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null)

  // Pass / Ticket Modal
  const [viewTicket, setViewTicket] = useState<BookingItem | null>(null)

  // Fetch Venues & Bookings
  const loadData = useCallback(async () => {
    try {
      setLoadingData(true)
      const [vRes, bRes] = await Promise.all([
        fetch('/api/venues'),
        fetch('/api/bookings/my'),
      ])

      if (vRes.ok) {
        const vData = await vRes.json()
        const fetchedVenues = vData.venues || []
        setVenues(fetchedVenues)
        if (fetchedVenues.length > 0) {
          setSelectedVenueId((prev) => prev || fetchedVenues[0].id || fetchedVenues[0].venue_id || '')
        }
      }

      if (bRes.ok) {
        const bData = await bRes.json()
        setBookings(bData.bookings || [])
      }
    } catch (err) {
      console.error('Failed to load user dashboard data:', err)
    } finally {
      setLoadingData(false)
    }
  }, [])

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
      return
    }
    if (isAuthenticated) {
      loadData()
    }
  }, [authLoading, isAuthenticated, loadData, router])

  // Handle Create Booking
  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    setBookingError(null)
    setBookingSuccess(null)

    if (!selectedVenueId || !eventName || !eventDate || !startTime || !endTime) {
      setBookingError('Please fill in all required booking details.')
      return
    }

    if (startTime >= endTime) {
      setBookingError('End time must be later than start time.')
      return
    }

    const currentVenue = venues.find((v) => (v.id || v.venue_id) === selectedVenueId)
    const attendeesNum = parseInt(attendees, 10) || 1

    if (currentVenue && attendeesNum > currentVenue.capacity) {
      setBookingError(
        `Selected venue capacity is ${currentVenue.capacity} seats. Expected attendees (${attendeesNum}) exceeds venue capacity. For 500+ attendees, please select Main Auditorium (800 seats).`
      )
      return
    }

    setBookingSubmitting(true)

    try {
      const startAt = `${eventDate}T${startTime}:00`
      const endAt = `${eventDate}T${endTime}:00`

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          venueId: selectedVenueId,
          purpose: eventName.trim(),
          eventName: eventName.trim(),
          eventDescription: eventDescription.trim() || undefined,
          description: eventDescription.trim() || undefined,
          startAt,
          endAt,
          eventDate,
          startTime,
          endTime,
          expectedAttendees: attendeesNum,
        }),
      })

      const data = await res.json()
      setBookingSubmitting(false)

      if (res.ok && data.success) {
        setBookingSuccess('Reservation submitted successfully! Your booking is pending review.')
        setEventName('')
        setEventDescription('')
        await loadData()
        setTimeout(() => {
          setBookingModalOpen(false)
          setBookingSuccess(null)
        }, 1200)
      } else {
        setBookingError(data.error || 'Failed to submit booking reservation.')
      }
    } catch (err: any) {
      setBookingSubmitting(false)
      setBookingError(err?.message || 'Network error while creating booking.')
    }
  }

  // Handle Cancel Booking
  const handleCancelBooking = async (bookingId: string) => {
    if (!bookingId) return
    if (!confirm('Are you sure you want to cancel this booking request?')) return

    try {
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'POST',
      })
      const data = await res.json()
      if (res.ok && data.success) {
        await loadData()
      } else {
        alert(data.error || 'Failed to cancel booking.')
      }
    } catch (err: any) {
      alert('Error cancelling booking: ' + (err?.message || 'Network error'))
    }
  }

  // Filter Bookings safely with fallbacks
  const filteredBookings = (bookings || []).filter((b) => {
    if (!b) return false
    const matchesStatus = filterStatus === 'ALL' || (b.status && b.status === filterStatus)
    const eName = String(b.event_name || (b as any).eventName || (b as any).purpose || '').toLowerCase()
    const vName = String(b.venue_name || (b as any).venueName || '').toLowerCase()
    const q = (searchQuery || '').toLowerCase().trim()
    const matchesSearch = !q || eName.includes(q) || vName.includes(q)
    return Boolean(matchesStatus && matchesSearch)
  })

  // Metrics safely with fallbacks
  const totalCount = (bookings || []).length
  const approvedCount = (bookings || []).filter((b) => b?.status === 'APPROVED').length
  const pendingCount = (bookings || []).filter((b) => b?.status === 'PENDING').length
  const cancelledCount = (bookings || []).filter((b) => b?.status === 'CANCELLED' || b?.status === 'REJECTED').length

  const formatDateSafe = (dStr: any) => {
    if (!dStr) return '—'
    try {
      const parts = String(dStr).split('T')[0].split('-')
      if (parts.length === 3) {
        const [y, m, d] = parts.map(Number)
        if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
          return new Date(y, m - 1, d).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })
        }
      }
      const d = new Date(dStr)
      return isNaN(d.getTime()) ? String(dStr) : d.toLocaleDateString()
    } catch {
      return String(dStr)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
            <CheckCircle2 className="h-3 w-3" /> Approved
          </span>
        )
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
            <Clock3 className="h-3 w-3" /> Under Review
          </span>
        )
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-[11px] font-bold text-red-700 dark:bg-red-950/60 dark:text-red-300">
            <XCircle className="h-3 w-3" /> Rejected
          </span>
        )
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-0.5 text-[11px] font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
            Cancelled
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-bold text-muted-foreground">
            {status}
          </span>
        )
    }
  }

  if (authLoading || (!isAuthenticated && !user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-xs text-muted-foreground">Loading workspace session...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-8">
          
          {/* Top Welcome Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider font-semibold text-primary">
                  Student & Faculty Workspace
                </span>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary font-mono">
                  {user?.role}
                </span>
              </div>
              <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Welcome, {user?.name}
              </h1>
              <p className="text-xs text-muted-foreground">
                {user?.department} • {user?.email}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setBookingModalOpen(true)}
                className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-md hover:bg-primary/90 transition-all flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Book a Venue
              </button>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground font-medium">My Bookings</p>
                <p className="text-xl font-bold text-foreground">{totalCount}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground font-medium">Approved</p>
                <p className="text-xl font-bold text-foreground">{approvedCount}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                <Clock3 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground font-medium">Pending Review</p>
                <p className="text-xl font-bold text-foreground">{pendingCount}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-500/10 text-zinc-600">
                <XCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground font-medium">Cancelled / Rejected</p>
                <p className="text-xl font-bold text-foreground">{cancelledCount}</p>
              </div>
            </div>
          </div>

          {/* Tabs: My Bookings vs Campus Venues */}
          <div className="flex items-center gap-3 border-b border-border">
            <button
              onClick={() => setActiveTab('bookings')}
              className={`pb-3 text-sm font-semibold transition-colors flex items-center gap-2 border-b-2 -mb-px ${
                activeTab === 'bookings'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <CalendarDays className="h-4 w-4" />
              My Scheduled Bookings ({bookings.length})
            </button>

            <button
              onClick={() => setActiveTab('venues')}
              className={`pb-3 text-sm font-semibold transition-colors flex items-center gap-2 border-b-2 -mb-px ${
                activeTab === 'venues'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Building2 className="h-4 w-4" />
              Campus Facilities Directory ({venues.length})
            </button>
          </div>

          {/* Tab 1: My Bookings */}
          {activeTab === 'bookings' && (
            <div className="space-y-4">
              
              {/* Filter and Search Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                  {['ALL', 'PENDING', 'APPROVED', 'CANCELLED'].map((s) => (
                    <button
                      key={s}
                      onClick={() => setFilterStatus(s)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        filterStatus === s
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      {s === 'ALL' ? 'All Requests' : s}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by event or venue..."
                    className="w-full rounded-xl border border-border bg-background py-1.5 pl-8 pr-3 text-xs outline-none focus:border-primary transition-all"
                  />
                </div>
              </div>

              {/* Bookings Table */}
              <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                {loadingData ? (
                  <div className="p-12 text-center text-xs text-muted-foreground">
                    Loading your reservations from PostgreSQL...
                  </div>
                ) : filteredBookings.length === 0 ? (
                  <div className="p-12 text-center space-y-3">
                    <CalendarDays className="h-10 w-10 text-muted-foreground mx-auto opacity-50" />
                    <p className="text-sm font-semibold text-foreground">No bookings found</p>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                      You haven't scheduled any campus venues matching this criteria yet.
                    </p>
                    <button
                      onClick={() => setBookingModalOpen(true)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all"
                    >
                      <Plus className="h-3.5 w-3.5" /> Book Your First Venue
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-border bg-muted/30 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          <th className="py-3 px-4">Event & Description</th>
                          <th className="py-3 px-4">Venue & Location</th>
                          <th className="py-3 px-4">Date & Time Slot</th>
                          <th className="py-3 px-4">Attendees</th>
                          <th className="py-3 px-4">Approval Status</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border text-xs">
                        {filteredBookings.map((b) => {
                          const eName = b.event_name || (b as any).eventName || (b as any).purpose || 'Campus Event'
                          const eDesc = b.event_description || (b as any).description || 'No description provided'
                          const vName = b.venue_name || (b as any).venueName || 'Campus Venue'
                          const vLoc = b.location || (b as any).venueLocation || 'Campus Ground'
                          const eDate = b.event_date || (b as any).date
                          const sTime = b.start_time || (b as any).startTime || '—'
                          const eTime = b.end_time || (b as any).endTime || '—'
                          const bId = b.booking_id || (b as any).id
                          const attCount = b.expected_attendees || (b as any).attendees || 0

                          return (
                            <tr key={bId} className="hover:bg-muted/20 transition-colors">
                              <td className="py-3.5 px-4">
                                <p className="font-semibold text-foreground">{eName}</p>
                                <p className="text-[11px] text-muted-foreground line-clamp-1">{eDesc}</p>
                              </td>
                              <td className="py-3.5 px-4">
                                <p className="font-semibold text-foreground flex items-center gap-1">
                                  <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
                                  {vName}
                                </p>
                                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                                  <MapPin className="h-3 w-3 shrink-0" />
                                  {vLoc}
                                </p>
                              </td>
                              <td className="py-3.5 px-4">
                                <p className="font-semibold text-foreground flex items-center gap-1">
                                  <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                  {formatDateSafe(eDate)}
                                </p>
                                <p className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
                                  <Clock3 className="h-3 w-3 shrink-0" />
                                  {sTime} – {eTime}
                                </p>
                              </td>
                              <td className="py-3.5 px-4">
                                <span className="inline-flex items-center gap-1 font-medium text-foreground">
                                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                                  {attCount}
                                </span>
                              </td>
                              <td className="py-3.5 px-4">{getStatusBadge(b.status)}</td>
                              <td className="py-3.5 px-4 text-right space-x-1">
                                <button
                                  onClick={() => setViewTicket(b)}
                                  className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                  title="View Pass"
                                >
                                  <Ticket className="h-3.5 w-3.5" />
                                </button>

                                {b.status === 'PENDING' && (
                                  <button
                                    onClick={() => handleCancelBooking(bId)}
                                    className="p-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-600 transition-colors"
                                    title="Cancel Booking"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Campus Venues Explorer */}
          {activeTab === 'venues' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {venues.map((venue) => (
                <div
                  key={venue.id || venue.venue_id}
                  className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4 hover:border-primary/50 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary font-mono">
                        {venue.type || venue.venue_type}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          venue.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            venue.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-amber-500'
                          }`}
                        />
                        {venue.status}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-foreground">{venue.name || venue.venue_name}</h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                        {venue.location}
                      </p>
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {venue.description || 'Modern campus venue equipped with presentation screens, podium, and acoustics.'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-border flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      Capacity: {venue.capacity}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedVenueId(venue.id || venue.venue_id)
                        setBookingModalOpen(true)
                      }}
                      className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary hover:text-white transition-all"
                    >
                      Reserve Slot
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </main>

      {/* Booking Reservation Modal */}
      {bookingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <h3 className="font-bold text-foreground text-sm sm:text-base">
                  Reserve Campus Venue
                </h3>
              </div>
              <button
                onClick={() => setBookingModalOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {bookingError && (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                <p>{bookingError}</p>
              </div>
            )}

            {bookingSuccess && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <p>{bookingSuccess}</p>
              </div>
            )}

            <form onSubmit={handleCreateBooking} className="space-y-3.5">
              
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Select Venue Facility *</label>
                <select
                  value={selectedVenueId}
                  onChange={(e) => setSelectedVenueId(e.target.value)}
                  required
                  className="w-full rounded-xl border border-border bg-background py-2 px-3 text-xs outline-none focus:border-primary"
                >
                  {venues.map((v) => (
                    <option key={v.id || v.venue_id} value={v.id || v.venue_id}>
                      {v.name || v.venue_name} ({v.location} - Cap: {v.capacity})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Event / Purpose Title *</label>
                <input
                  type="text"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="e.g. ACM Student Chapter Technical Hackathon"
                  required
                  className="w-full rounded-xl border border-border bg-background py-2 px-3 text-xs outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Date *</label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    required
                    className="w-full rounded-xl border border-border bg-background py-2 px-3 text-xs outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Start Time *</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                    className="w-full rounded-xl border border-border bg-background py-2 px-3 text-xs outline-none focus:border-primary font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">End Time *</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                    className="w-full rounded-xl border border-border bg-background py-2 px-3 text-xs outline-none focus:border-primary font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground">Expected Attendees *</label>
                  {(() => {
                    const cv = venues.find(v => (v.id || v.venue_id) === selectedVenueId)
                    return cv ? (
                      <span className="text-[11px] text-muted-foreground">
                        Max Seating: <strong className="text-foreground">{cv.capacity} seats</strong>
                      </span>
                    ) : null
                  })()}
                </div>
                <input
                  type="number"
                  min="1"
                  max="2000"
                  value={attendees}
                  onChange={(e) => setAttendees(e.target.value)}
                  required
                  className="w-full rounded-xl border border-border bg-background py-2 px-3 text-xs outline-none focus:border-primary"
                />
                {(() => {
                  const cv = venues.find(v => (v.id || v.venue_id) === selectedVenueId)
                  if (cv && parseInt(attendees, 10) > cv.capacity) {
                    return (
                      <p className="text-[11px] text-amber-600 font-medium">
                        ⚠️ Attendees exceed this venue's capacity ({cv.capacity} seats). For 500+ attendees, consider selecting the Main Auditorium (800 seats).
                      </p>
                    )
                  }
                  return null
                })()}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Event Notes & Requirements</label>
                <textarea
                  rows={2}
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  placeholder="Need mic, HDMI projector connection, podium setup..."
                  className="w-full rounded-xl border border-border bg-background py-2 px-3 text-xs outline-none focus:border-primary resize-y"
                />
              </div>

              <div className="rounded-xl border border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-950/20 p-3 text-[11px] text-muted-foreground flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  Automated Slot Verification: Your requested time slot is verified in real time to prevent any scheduling overlaps.
                </span>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setBookingModalOpen(false)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bookingSubmitting}
                  className="rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50"
                >
                  {bookingSubmitting ? 'Submitting Reservation...' : 'Submit Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ticket / Pass Viewer Modal */}
      {viewTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Ticket className="h-5 w-5 text-primary" />
                <h3 className="font-bold text-foreground">Official Venue Allocation Pass</h3>
              </div>
              <button onClick={() => setViewTicket(null)} className="p-1 rounded-lg text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-2xl border border-dashed border-border p-4 bg-muted/10 space-y-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-primary tracking-wider">Event Name</span>
                <p className="text-base font-bold text-foreground">
                  {viewTicket.event_name || (viewTicket as any).eventName || (viewTicket as any).purpose || 'Campus Event'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-muted-foreground block">Facility</span>
                  <span className="font-semibold text-foreground">
                    {viewTicket.venue_name || (viewTicket as any).venueName || 'Campus Venue'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Location</span>
                  <span className="font-semibold text-foreground">
                    {viewTicket.location || (viewTicket as any).venueLocation || 'Campus Ground'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Date</span>
                  <span className="font-semibold text-foreground">
                    {formatDateSafe(viewTicket.event_date || (viewTicket as any).date)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Time Slot</span>
                  <span className="font-mono font-semibold text-foreground">
                    {(viewTicket.start_time || (viewTicket as any).startTime || '—')} – {(viewTicket.end_time || (viewTicket as any).endTime || '—')}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-muted-foreground block">Status</span>
                  {getStatusBadge(viewTicket.status)}
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-muted-foreground block">Booking ID</span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {(viewTicket.booking_id || (viewTicket as any).id || '').slice(0, 12)}...
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => window.print()}
                className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Print Official Pass
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
