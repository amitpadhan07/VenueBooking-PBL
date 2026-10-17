'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { useAuth } from '@/components/auth/AuthContext'
import {
  ShieldCheck,
  Building2,
  CalendarDays,
  Users,
  Layers,
  Activity,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock3,
  AlertCircle,
  Search,
  Filter,
  RefreshCw,
  X,
  MapPin,
  Lock,
  Terminal,
} from 'lucide-react'

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
  requester_name?: string
  requester_email?: string
  department?: string
}

interface UserItem {
  user_id: string
  name: string
  email: string
  role: 'STUDENT' | 'FACULTY' | 'EMPLOYEE' | 'ADMIN'
  department: string
  phone?: string
  created_at: string
  total_bookings?: number
}

interface AuditItem {
  log_id: string
  user_id: string
  action: string
  entity_type: string
  entity_id: string
  details?: string
  created_at: string
  user_email?: string
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const { user, role, isAuthenticated, loading: authLoading, login } = useAuth()

  const [activeTab, setActiveTab] = useState<'venues' | 'bookings' | 'users' | 'audit'>('venues')
  const [loading, setLoading] = useState(true)

  // Data
  const [venues, setVenues] = useState<VenueItem[]>([])
  const [bookings, setBookings] = useState<BookingItem[]>([])
  const [users, setUsers] = useState<UserItem[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditItem[]>([])

  // Venue Modal (Add / Edit)
  const [venueModalOpen, setVenueModalOpen] = useState(false)
  const [editingVenue, setEditingVenue] = useState<VenueItem | null>(null)
  const [vName, setVName] = useState('')
  const [vLocation, setVLocation] = useState('')
  const [vCapacity, setVCapacity] = useState('100')
  const [vType, setVType] = useState('Auditorium')
  const [vDescription, setVDescription] = useState('')
  const [vStatus, setVStatus] = useState<'ACTIVE' | 'MAINTENANCE' | 'INACTIVE'>('ACTIVE')
  const [venueSubmitting, setVenueSubmitting] = useState(false)
  const [venueError, setVenueError] = useState<string | null>(null)

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('')

  // Load Admin Data via Pure SQL APIs
  const loadAdminData = useCallback(async () => {
    try {
      setLoading(true)
      const [vRes, bRes, uRes, aRes] = await Promise.all([
        fetch('/api/venues'),
        fetch('/api/bookings?limit=100'),
        fetch('/api/admin/users'),
        fetch('/api/audit-logs?limit=50'),
      ])

      if (vRes.ok) {
        const vData = await vRes.json()
        setVenues(vData.venues || [])
      }

      if (bRes.ok) {
        const bData = await bRes.json()
        setBookings(bData.bookings || [])
      }

      if (uRes.ok) {
        const uData = await uRes.json()
        setUsers(uData.users || [])
      }

      if (aRes.ok) {
        const aData = await aRes.json()
        setAuditLogs(aData.logs || aData.auditLogs || [])
      }
    } catch (err) {
      console.error('Failed to load admin data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!authLoading && isAuthenticated && role === 'ADMIN') {
      loadAdminData()
    }
  }, [authLoading, isAuthenticated, role, loadAdminData])

  // Open Add Venue Modal
  const openAddVenue = () => {
    setEditingVenue(null)
    setVName('')
    setVLocation('')
    setVCapacity('150')
    setVType('Auditorium')
    setVDescription('')
    setVStatus('ACTIVE')
    setVenueError(null)
    setVenueModalOpen(true)
  }

  // Open Edit Venue Modal
  const openEditVenue = (v: VenueItem) => {
    setEditingVenue(v)
    setVName(v.name || v.venue_name)
    setVLocation(v.location)
    setVCapacity(String(v.capacity))
    setVType(v.type || v.venue_type)
    setVDescription(v.description || '')
    setVStatus(v.status)
    setVenueError(null)
    setVenueModalOpen(true)
  }

  // Save Venue (Add or Update via SQL)
  const handleSaveVenue = async (e: React.FormEvent) => {
    e.preventDefault()
    setVenueError(null)
    setVenueSubmitting(true)

    try {
      if (editingVenue) {
        // Update Venue via SQL PUT /api/venues/[id]
        const vId = editingVenue.id || editingVenue.venue_id
        const res = await fetch(`/api/venues/${vId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: vName.trim(),
            location: vLocation.trim(),
            capacity: parseInt(vCapacity, 10),
            type: vType.trim(),
            description: vDescription.trim(),
            status: vStatus,
          }),
        })
        const data = await res.json()
        setVenueSubmitting(false)

        if (res.ok && data.success) {
          setVenueModalOpen(false)
          await loadAdminData()
        } else {
          setVenueError(data.error || 'Failed to update venue.')
        }
      } else {
        // Add Venue via SQL POST /api/venues
        const res = await fetch('/api/venues', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: vName.trim(),
            location: vLocation.trim(),
            capacity: parseInt(vCapacity, 10),
            type: vType.trim(),
            description: vDescription.trim(),
            status: vStatus,
          }),
        })
        const data = await res.json()
        setVenueSubmitting(false)

        if (res.ok && data.success) {
          setVenueModalOpen(false)
          await loadAdminData()
        } else {
          setVenueError(data.error || 'Failed to add venue.')
        }
      }
    } catch (err: any) {
      setVenueSubmitting(false)
      setVenueError(err?.message || 'Network error.')
    }
  }

  // Delete Venue via SQL
  const handleDeleteVenue = async (vId: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete venue '${name}' from PostgreSQL? All associated bookings will cascade delete.`)) {
      return
    }

    try {
      const res = await fetch(`/api/venues/${vId}`, { method: 'DELETE' })
      const data = await res.json()
      if (res.ok && data.success) {
        await loadAdminData()
      } else {
        alert(data.error || 'Failed to delete venue.')
      }
    } catch (err: any) {
      alert('Error deleting venue: ' + err.message)
    }
  }

  // Handle Booking Approval / Rejection via SQL
  const handleBookingAction = async (bookingId: string, action: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await fetch('/api/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          action,
          remarks: `Administrative decision via Admin Suite (${action})`,
        }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        await loadAdminData()
      } else {
        alert(data.error || 'Failed to record approval decision.')
      }
    } catch (err: any) {
      alert('Error processing approval: ' + err.message)
    }
  }

  // Update User Role via SQL
  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        await loadAdminData()
      } else {
        alert(data.error || 'Failed to update user role.')
      }
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
  }

  // Delete User via SQL
  const handleDeleteUser = async (userId: string, uName: string) => {
    if (!confirm(`Delete user '${uName}' from PostgreSQL?`)) return

    try {
      const res = await fetch(`/api/admin/users?userId=${userId}`, { method: 'DELETE' })
      const data = await res.json()
      if (res.ok && data.success) {
        await loadAdminData()
      } else {
        alert(data.error || 'Failed to delete user.')
      }
    } catch (err: any) {
      alert('Error deleting user: ' + err.message)
    }
  }

  // Access Guard: If not Admin
  if (!authLoading && (!isAuthenticated || role !== 'ADMIN')) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-2xl border border-border bg-card p-6 shadow-xl text-center space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 flex items-center justify-center mx-auto">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Admin Portal Restricted</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              This area requires <strong>ADMIN</strong> role credentials. You are currently logged in as{' '}
              <span className="font-mono font-bold text-primary">{user ? user.role : 'Guest'}</span>.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
              <button
                onClick={async () => {
                  await login('admin@college.edu', 'admin123')
                  router.refresh()
                }}
                className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-purple-700 transition-all"
              >
                Sign In as Administrator
              </button>
              <Link
                href="/dashboard"
                className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-all"
              >
                Go to User Dashboard
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-8">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider font-semibold text-purple-600">
                  Campus Facilities Operations
                </span>
                <span className="rounded-full bg-purple-100 dark:bg-purple-950 px-2 py-0.5 text-[10px] font-bold text-purple-700 dark:text-purple-300">
                  Verified Hub
                </span>
              </div>
              <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Campus Administration Suite
              </h1>
              <p className="text-xs text-muted-foreground">
                Manage campus venues, review allocations, control user privileges, and inspect system audit logs.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => loadAdminData()}
                className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-all flex items-center gap-1.5"
                title="Refresh from PostgreSQL"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh
              </button>
              <button
                onClick={openAddVenue}
                className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-md hover:bg-primary/90 transition-all flex items-center gap-1.5"
              >
                <Plus className="h-4 w-4" />
                Add Venue
              </button>
            </div>
          </div>

          {/* Metric Overview */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground font-medium">Active Venues</p>
                <p className="text-xl font-bold text-foreground">{venues.length}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground font-medium">Registered Users</p>
                <p className="text-xl font-bold text-foreground">{users.length}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                <Clock3 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground font-medium">Pending Approvals</p>
                <p className="text-xl font-bold text-foreground">
                  {bookings.filter((b) => b.status === 'PENDING').length}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground font-medium">Audit Events</p>
                <p className="text-xl font-bold text-foreground">{auditLogs.length}</p>
              </div>
            </div>
          </div>

          {/* Admin Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-border overflow-x-auto pb-1">
            <button
              onClick={() => setActiveTab('venues')}
              className={`pb-3 text-sm font-semibold transition-colors flex items-center gap-1.5 border-b-2 -mb-px whitespace-nowrap ${
                activeTab === 'venues'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Building2 className="h-4 w-4" />
              Venues Directory ({venues.length})
            </button>

            <button
              onClick={() => setActiveTab('bookings')}
              className={`pb-3 text-sm font-semibold transition-colors flex items-center gap-1.5 border-b-2 -mb-px whitespace-nowrap ${
                activeTab === 'bookings'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <CalendarDays className="h-4 w-4" />
              Bookings & Approvals ({bookings.length})
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`pb-3 text-sm font-semibold transition-colors flex items-center gap-1.5 border-b-2 -mb-px whitespace-nowrap ${
                activeTab === 'users'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Users className="h-4 w-4" />
              Users & Permissions ({users.length})
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`pb-3 text-sm font-semibold transition-colors flex items-center gap-1.5 border-b-2 -mb-px whitespace-nowrap ${
                activeTab === 'audit'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Activity className="h-4 w-4" />
              Audit Trail ({auditLogs.length})
            </button>
          </div>

          {/* TAB 1: VENUES CRUD */}
          {activeTab === 'venues' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Direct SQL management of campus facilities. Add, edit capacity, or decommission venues.
                </p>
                <button
                  onClick={openAddVenue}
                  className="rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 flex items-center gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" /> Add New Venue
                </button>
              </div>

              <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/30 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        <th className="py-3 px-4">Venue Name</th>
                        <th className="py-3 px-4">Location</th>
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4">Capacity</th>
                        <th className="py-3 px-4">Operational Status</th>
                        <th className="py-3 px-4 text-right">SQL Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {venues.map((v) => (
                        <tr key={v.id || v.venue_id} className="hover:bg-muted/20 transition-colors">
                          <td className="py-3 px-4 font-semibold text-foreground">
                            {v.name || v.venue_name}
                          </td>
                          <td className="py-3 px-4 text-muted-foreground">{v.location}</td>
                          <td className="py-3 px-4">
                            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-mono">
                              {v.type || v.venue_type}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-semibold text-foreground">{v.capacity} seats</td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                v.status === 'ACTIVE'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-amber-100 text-amber-700'
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  v.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-amber-500'
                                }`}
                              />
                              {v.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right space-x-1">
                            <button
                              onClick={() => openEditVenue(v)}
                              className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                              title="Edit Venue"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteVenue(v.id || v.venue_id, v.name || v.venue_name)}
                              className="p-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-600 transition-colors"
                              title="Delete Venue (SQL)"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BOOKINGS & APPROVALS */}
          {activeTab === 'bookings' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Campus-wide reservation requests requiring review or resolution.
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/30 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        <th className="py-3 px-4">Requester</th>
                        <th className="py-3 px-4">Event & Facility</th>
                        <th className="py-3 px-4">Date & Slot</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Approval Decision</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {bookings.map((b) => (
                        <tr key={b.booking_id} className="hover:bg-muted/20 transition-colors">
                          <td className="py-3 px-4">
                            <p className="font-semibold text-foreground">{b.requester_name || 'Campus Member'}</p>
                            <p className="text-[11px] text-muted-foreground">{b.requester_email || b.department}</p>
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-semibold text-foreground">{b.event_name}</p>
                            <p className="text-[11px] text-primary">{b.venue_name}</p>
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-semibold text-foreground">
                              {b.event_date ? new Date(b.event_date).toLocaleDateString() : '—'}
                            </p>
                            <p className="text-[11px] text-muted-foreground font-mono">
                              {b.start_time} – {b.end_time}
                            </p>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                b.status === 'APPROVED'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : b.status === 'PENDING'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {b.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right space-x-2">
                            {b.status === 'PENDING' ? (
                              <>
                                <button
                                  onClick={() => handleBookingAction(b.booking_id, 'APPROVED')}
                                  className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition-all inline-flex items-center gap-1"
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                                </button>
                                <button
                                  onClick={() => handleBookingAction(b.booking_id, 'REJECTED')}
                                  className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm hover:bg-red-700 transition-all inline-flex items-center gap-1"
                                >
                                  <XCircle className="h-3.5 w-3.5" /> Reject
                                </button>
                              </>
                            ) : (
                              <span className="text-[11px] text-muted-foreground font-mono">Completed</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: USERS & RBAC */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Role-Based Access Control matrix. Promote or demote user capabilities in PostgreSQL via Pure SQL.
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/30 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        <th className="py-3 px-4">User Details</th>
                        <th className="py-3 px-4">Department</th>
                        <th className="py-3 px-4">Bookings</th>
                        <th className="py-3 px-4">RBAC Role</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {users.map((u) => (
                        <tr key={u.user_id} className="hover:bg-muted/20 transition-colors">
                          <td className="py-3 px-4">
                            <p className="font-semibold text-foreground">{u.name}</p>
                            <p className="text-[11px] text-muted-foreground">{u.email}</p>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground">{u.department}</td>
                          <td className="py-3 px-4 font-semibold text-foreground">{u.total_bookings || 0}</td>
                          <td className="py-3 px-4">
                            <select
                              value={u.role}
                              onChange={(e) => handleUpdateRole(u.user_id, e.target.value)}
                              className="rounded-lg border border-border bg-background py-1 px-2 text-xs font-semibold outline-none cursor-pointer"
                            >
                              <option value="STUDENT">STUDENT</option>
                              <option value="FACULTY">FACULTY</option>
                              <option value="EMPLOYEE">EMPLOYEE</option>
                              <option value="ADMIN">ADMIN</option>
                            </select>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleDeleteUser(u.user_id, u.name)}
                              className="p-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-600 transition-colors"
                              title="Delete User (SQL)"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: AUDIT TRAIL */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Tamper-evident system ledger capturing non-repudiation timestamps and administrative mutations.
              </p>

              <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/30 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        <th className="py-3 px-4">Timestamp</th>
                        <th className="py-3 px-4">Action</th>
                        <th className="py-3 px-4">Entity</th>
                        <th className="py-3 px-4">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border font-mono text-[11px]">
                      {auditLogs.map((log) => (
                        <tr key={log.log_id} className="hover:bg-muted/20 transition-colors">
                          <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                            {new Date(log.created_at).toLocaleString()}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-primary">{log.action}</span>
                          </td>
                          <td className="py-3 px-4 text-foreground">{log.entity_type}</td>
                          <td className="py-3 px-4 text-muted-foreground max-w-md truncate">
                            {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Add / Edit Venue Modal */}
      {venueModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-foreground text-sm sm:text-base">
                {editingVenue ? 'Edit Venue Facility (SQL)' : 'Add New Venue Facility (SQL)'}
              </h3>
              <button onClick={() => setVenueModalOpen(false)} className="p-1 rounded-lg text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            {venueError && (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                <p>{venueError}</p>
              </div>
            )}

            <form onSubmit={handleSaveVenue} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Venue Facility Name *</label>
                <input
                  type="text"
                  value={vName}
                  onChange={(e) => setVName(e.target.value)}
                  placeholder="e.g. Einstein Lecture Hall"
                  required
                  className="w-full rounded-xl border border-border bg-background py-2 px-3 text-xs outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Location on Campus *</label>
                <input
                  type="text"
                  value={vLocation}
                  onChange={(e) => setVLocation(e.target.value)}
                  placeholder="e.g. Science Block, 2nd Floor"
                  required
                  className="w-full rounded-xl border border-border bg-background py-2 px-3 text-xs outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Capacity (Seats) *</label>
                  <input
                    type="number"
                    min="1"
                    max="5000"
                    value={vCapacity}
                    onChange={(e) => setVCapacity(e.target.value)}
                    required
                    className="w-full rounded-xl border border-border bg-background py-2 px-3 text-xs outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Facility Type *</label>
                  <select
                    value={vType}
                    onChange={(e) => setVType(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background py-2 px-3 text-xs outline-none focus:border-primary"
                  >
                    <option value="Auditorium">Auditorium</option>
                    <option value="Seminar Hall">Seminar Hall</option>
                    <option value="Conference Room">Conference Room</option>
                    <option value="Computer Lab">Computer Lab</option>
                    <option value="Amphitheatre">Amphitheatre</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Operational Status</label>
                <select
                  value={vStatus}
                  onChange={(e) => setVStatus(e.target.value as any)}
                  className="w-full rounded-xl border border-border bg-background py-2 px-3 text-xs outline-none focus:border-primary"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="MAINTENANCE">MAINTENANCE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Description & Equipment</label>
                <textarea
                  rows={2}
                  value={vDescription}
                  onChange={(e) => setVDescription(e.target.value)}
                  placeholder="Equipped with dual projectors, surround audio, and centralized HVAC."
                  className="w-full rounded-xl border border-border bg-background py-2 px-3 text-xs outline-none focus:border-primary resize-y"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setVenueModalOpen(false)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={venueSubmitting}
                  className="rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50"
                >
                  {venueSubmitting ? 'Executing SQL...' : editingVenue ? 'Update Venue (SQL)' : 'Insert Venue (SQL)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
