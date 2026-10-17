'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { useAuth } from '@/components/auth/AuthContext'
import {
  Building2,
  CalendarDays,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  Sparkles,
  MapPin,
  Users,
  Search,
  Filter,
  Activity,
  Layers,
  GraduationCap,
  Clock3,
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

export default function HomePage() {
  const { user, isAuthenticated, role } = useAuth()
  const [venues, setVenues] = useState<VenueItem[]>([])
  const [loadingVenues, setLoadingVenues] = useState(true)
  const [venueSearch, setVenueSearch] = useState('')
  const [selectedType, setSelectedType] = useState('ALL')

  useEffect(() => {
    async function fetchVenues() {
      try {
        const res = await fetch('/api/venues')
        if (res.ok) {
          const data = await res.json()
          setVenues(data.venues || [])
        }
      } catch (err) {
        console.error('Error fetching venues on home page:', err)
      } finally {
        setLoadingVenues(false)
      }
    }
    fetchVenues()
  }, [])

  const filteredVenues = venues.filter((v) => {
    const vType = v.type || v.venue_type || ''
    const vName = v.name || v.venue_name || ''
    const vLoc = v.location || ''
    const q = (venueSearch || '').toLowerCase().trim()
    const matchesType = selectedType === 'ALL' || vType.toLowerCase() === (selectedType || '').toLowerCase()
    const matchesSearch = !q || vName.toLowerCase().includes(q) || vLoc.toLowerCase().includes(q)
    return matchesType && matchesSearch
  })

  const venueTypes = ['ALL', 'Auditorium', 'Seminar Hall', 'Conference Room', 'Computer Lab']

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden py-16 sm:py-24 lg:py-28 border-b border-border bg-gradient-to-b from-card/80 via-background to-background">
          {/* Ambient Lighting Orbs */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/3 right-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-8">
            
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary shadow-sm">
              <Sparkles className="h-4 w-4" />
              <span>Campus Facility & Resource Scheduling Platform</span>
            </div>

            {/* Headline */}
            <div className="max-w-4xl mx-auto space-y-4">
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
                Smart Campus Venue Booking & Operations Portal
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Seamless reservations for auditoriums, seminar halls, and computer laboratories with instant verification and automated conflict prevention.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                href={isAuthenticated ? '/dashboard' : '/register'}
                className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all flex items-center gap-2 group"
              >
                <span>{isAuthenticated ? 'Go to My Dashboard' : 'Get Started & Book Venue'}</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <a
                href="#venues"
                className="rounded-xl border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted transition-all"
              >
                Explore Campus Venues
              </a>

              {isAuthenticated && role === 'ADMIN' && (
                <Link
                  href="/admin"
                  className="rounded-xl bg-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-purple-700 transition-all flex items-center gap-2"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Admin Suite
                </Link>
              )}
            </div>

            {/* Micro Pillars */}
            <div className="pt-8 border-t border-border/60 max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-medium text-muted-foreground">
              <div className="flex items-center justify-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>Zero Double Bookings</span>
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <Clock3 className="h-4 w-4 text-primary" />
                <span>Real-Time Availability</span>
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <Lock className="h-4 w-4 text-indigo-500" />
                <span>Secure Authentication</span>
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <Building2 className="h-4 w-4 text-amber-500" />
                <span>Multi-Facility Directory</span>
              </div>
            </div>

          </div>
        </section>

        {/* METRICS SECTION */}
        <section className="py-12 border-b border-border bg-card/40">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-1">
                <p className="text-3xl font-black text-primary tracking-tight">{venues.length || 4}</p>
                <p className="text-xs font-bold text-foreground">Verified Facilities</p>
                <p className="text-[11px] text-muted-foreground">Auditoriums, Halls & Labs</p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-1">
                <p className="text-3xl font-black text-emerald-600 tracking-tight">1,165+</p>
                <p className="text-xs font-bold text-foreground">Total Campus Capacity</p>
                <p className="text-[11px] text-muted-foreground">Concurrent Seating</p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-1">
                <p className="text-3xl font-black text-indigo-600 tracking-tight">100%</p>
                <p className="text-xs font-bold text-foreground">Conflict-Free Slots</p>
                <p className="text-[11px] text-muted-foreground">Guaranteed Reservations</p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-1">
                <p className="text-3xl font-black text-amber-600 tracking-tight">24/7</p>
                <p className="text-xs font-bold text-foreground">Online Scheduling</p>
                <p className="text-[11px] text-muted-foreground">Instant Request Routing</p>
              </div>
            </div>
          </div>
        </section>

        {/* CAMPUS VENUES DIRECTORY (#venues) */}
        <section id="venues" className="py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
            
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                  Campus Facilities Inventory
                </span>
                <h2 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  Featured Venues & Lecture Halls
                </h2>
                <p className="text-xs text-muted-foreground">
                  Browse capacity, location, and equipment across North and South campus grounds.
                </p>
              </div>

              {/* Search & Type Filter */}
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <div className="relative w-full sm:w-56">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    value={venueSearch}
                    onChange={(e) => setVenueSearch(e.target.value)}
                    placeholder="Search venue name..."
                    className="w-full rounded-xl border border-border bg-background py-1.5 pl-8 pr-3 text-xs outline-none focus:border-primary"
                  />
                </div>

                <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                  {venueTypes.map((t) => (
                    <button
                      key={t}
                      onClick={() => setSelectedType(t)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                        selectedType === t
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Venues Grid */}
            {loadingVenues ? (
              <div className="py-16 text-center text-xs text-muted-foreground">
                Loading campus venues...
              </div>
            ) : filteredVenues.length === 0 ? (
              <div className="py-16 text-center text-xs text-muted-foreground">
                No venues matching your filter criteria.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredVenues.map((v) => (
                  <div
                    key={v.id || v.venue_id}
                    className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:border-primary/50 transition-all flex flex-col justify-between space-y-4 group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary font-mono">
                          {v.type || v.venue_type}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            v.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              v.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}
                          />
                          {v.status}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                          {v.name || v.venue_name}
                        </h3>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                          {v.location}
                        </p>
                      </div>

                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {v.description || 'Full audio-visual infrastructure, central projection system, and high-speed campus Wi-Fi.'}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-border flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        Capacity: {v.capacity}
                      </span>

                      <Link
                        href={isAuthenticated ? '/dashboard' : '/login'}
                        className="rounded-xl bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary hover:bg-primary hover:text-white transition-all flex items-center gap-1"
                      >
                        Book Venue <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        </section>

        {/* HOW IT WORKS (3 STEPS) */}
        <section className="py-16 sm:py-20 border-t border-border bg-card/30">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
            
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">Streamlined Workflow</span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                How Venue Allocation Works
              </h2>
              <p className="text-xs text-muted-foreground">
                From slot selection to real-time verification and departmental authorization
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-3 relative">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-sm">
                  1
                </div>
                <h3 className="text-base font-bold text-foreground">Select Venue & Time Slot</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Choose your venue from the campus directory, specify expected attendees, and select your target reservation window.
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-3 relative">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 font-bold text-sm">
                  2
                </div>
                <h3 className="text-base font-bold text-foreground">Automated Availability Check</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  The system automatically verifies schedule availability in real time to prevent any overlapping bookings.
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-3 relative">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 font-bold text-sm">
                  3
                </div>
                <h3 className="text-base font-bold text-foreground">Department Approval & Pass</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Designated venue authority staff review the request. Once approved, an official digital reservation pass is generated.
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* CTA BANNER */}
        <section className="py-16 sm:py-20 border-t border-border bg-gradient-to-r from-primary/10 via-indigo-500/10 to-primary/10">
          <div className="mx-auto max-w-4xl px-4 text-center space-y-6">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Begin Scheduling Campus Venues Today
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto">
              Empowering campus student organizations, faculty departments, and event coordinators with conflict-free scheduling.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link
                href="/register"
                className="rounded-xl bg-primary px-6 py-2.5 text-xs font-semibold text-primary-foreground shadow-md hover:bg-primary/90 transition-all"
              >
                Create Campus Account
              </Link>
              <Link
                href="/login"
                className="rounded-xl border border-border bg-card px-6 py-2.5 text-xs font-semibold text-foreground hover:bg-muted transition-all"
              >
                Sign In
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
