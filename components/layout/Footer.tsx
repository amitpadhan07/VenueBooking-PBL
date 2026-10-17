import React from 'react'
import Link from 'next/link'
import {
  Building2,
  Shield,
  Mail,
  Phone,
  MapPin,
  Clock,
  CheckCircle2,
} from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card/60 backdrop-blur text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          
          {/* Brand & Mission */}
          <div className="space-y-4 md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-indigo-600 text-white shadow-sm">
                <Building2 className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold tracking-tight">VenueDesk</span>
            </Link>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Official campus venue booking and facility management portal providing reliable reservation services for student clubs, academic departments, and campus administration.
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                <Shield className="h-3 w-3 text-emerald-600" /> Verified Access
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                <Building2 className="h-3 w-3 text-primary" /> Campus Facilities
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Navigation</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/" className="text-muted-foreground hover:text-primary transition-colors">
                  Home Overview
                </Link>
              </li>
              <li>
                <Link href="/#venues" className="text-muted-foreground hover:text-primary transition-colors">
                  Campus Venues Directory
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-muted-foreground hover:text-primary transition-colors">
                  User Dashboard & My Bookings
                </Link>
              </li>
              <li>
                <Link href="/admin" className="text-muted-foreground hover:text-primary transition-colors">
                  Admin Control Suite
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-primary transition-colors">
                  About the Platform
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors">
                  Contact Campus Facilities
                </Link>
              </li>
            </ul>
          </div>

          {/* Key Platform Features */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Platform Features</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Real-Time Availability Check
              </li>
              <li className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Automated Conflict Prevention
              </li>
              <li className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                Departmental Approval Routing
              </li>
              <li className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                Official Digital Event Passes
              </li>
              <li className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                Audit Trail & History Logs
              </li>
            </ul>
          </div>

          {/* Campus Office Details */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Campus Administration</h4>
            <div className="space-y-2.5 text-xs text-muted-foreground">
              <p className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>Facilities Operations Hub, Academic Block 3, North Campus</span>
              </p>
              <p className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary shrink-0" />
                <span>Mon – Sat: 8:00 AM – 6:30 PM</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary shrink-0" />
                <span>venues@college.edu</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary shrink-0" />
                <span>+91 (080) 2844-9000 (Ext. 204)</span>
              </p>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} VenueDesk Campus Facilities Management.</p>
          <div className="flex items-center gap-4">
            <Link href="/about" className="hover:text-primary transition-colors">Policies</Link>
            <span>•</span>
            <Link href="/contact" className="hover:text-primary transition-colors">Support</Link>
            <span>•</span>
            <span className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> All Systems Operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
