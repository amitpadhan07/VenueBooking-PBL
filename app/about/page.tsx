'use client'

import React from 'react'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import {
  Building2,
  CalendarCheck,
  Shield,
  Clock,
  CheckCircle2,
  Users,
  ArrowRight,
  MapPin,
  Sparkles,
} from 'lucide-react'

export default function AboutPage() {
  const features = [
    {
      icon: CalendarCheck,
      title: 'Automated Slot Allocation',
      badge: 'Real-Time Verification',
      description:
        'Our system automatically verifies venue availability in real time across all campus blocks to prevent any scheduling overlaps or double bookings.',
    },
    {
      icon: Shield,
      title: 'Role-Based Permissions',
      badge: 'Campus Security',
      description:
        'Clear separation of capabilities for Students, Faculty Members, Venue In-Charges, and Campus Administrators to streamline the review and approval chain.',
    },
    {
      icon: Building2,
      title: 'Comprehensive Facilities Inventory',
      badge: 'Campus-Wide',
      description:
        'Complete directory of campus spaces including the Main Auditorium, APJ Abdul Kalam Seminar Hall, CS Department Labs, and Executive Conference Rooms.',
    },
    {
      icon: Clock,
      title: 'Rapid Request Processing',
      badge: 'Direct Routing',
      description:
        'Reservation requests are routed directly to designated departmental authorities for fast turnaround, notifications, and official digital passes.',
    },
  ]

  const stats = [
    { value: '4+', label: 'Campus Facilities', desc: 'Auditoriums, Halls & Labs' },
    { value: '1,165+', label: 'Total Seating', desc: 'Combined campus capacity' },
    { value: '100%', label: 'Conflict-Free', desc: 'Verified reservation slots' },
    { value: '24/7', label: 'Online Access', desc: 'Self-service reservation portal' },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-16 sm:py-24 border-b border-border bg-gradient-to-b from-card/60 to-background">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Campus Facilities & Venue Management
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
                Modernizing Campus Venue Operations & Scheduling
              </h1>
              <p className="text-base text-muted-foreground leading-relaxed">
                VenueDesk is the official campus resource allocation portal, designed to make finding, booking, and managing physical facilities seamless for students, faculty, and administration.
              </p>
            </div>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="py-12 border-b border-border bg-card/40">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((s, idx) => (
                <div key={idx} className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-1">
                  <div className="text-3xl font-black text-primary tracking-tight">{s.value}</div>
                  <div className="text-xs font-bold text-foreground">{s.label}</div>
                  <div className="text-[11px] text-muted-foreground">{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Core Capabilities */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Engineered for Campus Efficiency
              </h2>
              <p className="text-xs text-muted-foreground">
                Eliminating manual paper forms and overlapping reservations with an intuitive digital workflow.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {features.map((f, idx) => {
                const Icon = f.icon
                return (
                  <div
                    key={idx}
                    className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:border-primary/50 transition-all space-y-3 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:scale-105 transition-transform">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        {f.badge}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-foreground">{f.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{f.description}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Campus Community Guidelines */}
        <section className="py-16 border-t border-border bg-card/30">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="max-w-2xl space-y-2">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">Facility Policies</span>
              <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Booking Guidelines & Best Practices
              </h2>
              <p className="text-xs text-muted-foreground">
                Standards ensuring fair and responsible access to all campus facilities.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
              <div className="rounded-2xl border border-border bg-card p-5 space-y-2 shadow-sm">
                <div className="flex items-center gap-2 font-bold text-foreground">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Advance Booking
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Submit requests at least 24 hours prior to event commencement to ensure ample time for departmental authorization and AV facility preparation.
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5 space-y-2 shadow-sm">
                <div className="flex items-center gap-2 font-bold text-foreground">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Capacity Adherence
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Expected attendees should not exceed maximum hall seating capacity to comply with campus fire and emergency safety regulations.
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5 space-y-2 shadow-sm">
                <div className="flex items-center gap-2 font-bold text-foreground">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Timely Cancellations
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  If your event is postponed or cancelled, cancel the reservation promptly through your dashboard so the slot can be released to other student clubs and departments.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-4xl px-4 text-center space-y-6">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Ready to Reserve a Venue for Your Campus Event?
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Sign in or create an account to start scheduling auditoriums, labs, and seminar halls.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link
                href="/register"
                className="rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-md hover:bg-primary/90 transition-all flex items-center gap-1.5"
              >
                Create Account <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="rounded-xl border border-border bg-card px-5 py-2.5 text-xs font-semibold text-foreground hover:bg-muted transition-all"
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
