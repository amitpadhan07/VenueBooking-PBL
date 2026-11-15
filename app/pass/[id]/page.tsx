'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Building2,
  Calendar,
  Clock3,
  MapPin,
  Users,
  User,
  Printer,
  ArrowLeft,
  QrCode,
  ShieldAlert,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react'

interface VerificationData {
  success: boolean
  verificationStatus: 'VALID' | 'EXPIRED' | 'REJECTED' | 'CANCELLED' | 'PENDING' | 'INVALID'
  statusMessage: string
  bookingId: string
  eventName: string
  eventDescription?: string
  requesterName: string
  department: string
  requesterEmail: string
  requesterPhone?: string
  venueName: string
  venueLocation: string
  venueCapacity: number
  eventDate: string
  startTime: string
  endTime: string
  allottedTimeSlot: string
  expectedAttendees: number
  bookingStatus: string
  approvalDetails?: {
    approvedBy: string
    approverCode: string
    designation: string
    remarks?: string
    actionAt: string
  }
  verifiedAt: string
}

export default function GatePassPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const [data, setData] = useState<VerificationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [verifyUrl, setVerifyUrl] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setVerifyUrl(window.location.href)
    }
  }, [])

  useEffect(() => {
    if (!id) return

    const verifyPass = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(`/api/bookings/${id}/verify`)
        const result = await res.json()

        if (res.ok && result.success) {
          setData(result)
        } else {
          setError(result.error || 'Unable to verify gate pass.')
          if (result.verificationStatus) {
            setData(result)
          }
        }
      } catch (err: any) {
        setError(err?.message || 'Network error verifying gate pass.')
      } finally {
        setLoading(false)
      }
    }

    verifyPass()
  }, [id])

  const copyVerificationLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const getStatusDisplay = (status?: string) => {
    switch (status) {
      case 'VALID':
        return {
          title: 'OFFICIALLY AUTHORIZED',
          badgeClass: 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20',
          icon: <ShieldCheck className="h-5 w-5" />,
          accentColor: 'border-emerald-500',
          sealColor: 'text-emerald-600',
        }
      case 'EXPIRED':
        return {
          title: 'PASS EXPIRED',
          badgeClass: 'bg-amber-600 text-white shadow-md shadow-amber-500/20',
          icon: <Clock className="h-5 w-5" />,
          accentColor: 'border-amber-500',
          sealColor: 'text-amber-600',
        }
      case 'REJECTED':
        return {
          title: 'ENTRY PROHIBITED (REJECTED)',
          badgeClass: 'bg-red-600 text-white shadow-md shadow-red-500/20',
          icon: <XCircle className="h-5 w-5" />,
          accentColor: 'border-red-500',
          sealColor: 'text-red-600',
        }
      case 'CANCELLED':
        return {
          title: 'PASS CANCELLED',
          badgeClass: 'bg-zinc-600 text-white shadow-md shadow-zinc-500/20',
          icon: <XCircle className="h-5 w-5" />,
          accentColor: 'border-zinc-500',
          sealColor: 'text-zinc-600',
        }
      case 'PENDING':
        return {
          title: 'APPROVAL PENDING',
          badgeClass: 'bg-amber-500 text-white shadow-md shadow-amber-500/20',
          icon: <Clock3 className="h-5 w-5" />,
          accentColor: 'border-amber-400',
          sealColor: 'text-amber-500',
        }
      default:
        return {
          title: 'INVALID ENTRY PASS',
          badgeClass: 'bg-destructive text-destructive-foreground',
          icon: <ShieldAlert className="h-5 w-5" />,
          accentColor: 'border-destructive',
          sealColor: 'text-destructive',
        }
    }
  }

  const statusConfig = getStatusDisplay(data?.verificationStatus)
  const qrTarget = verifyUrl || `https://venuedesk.edu/pass/${id}`
  const qrImageSrc = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    qrTarget
  )}`

  return (
    <div className="min-h-screen bg-zinc-950 py-8 px-4 sm:px-6 flex flex-col items-center justify-center font-sans antialiased text-foreground">
      
      {/* Top Controls (Hidden when printing) */}
      <div className="w-full max-w-lg mb-4 flex items-center justify-between print:hidden">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Workspace</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={copyVerificationLink}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? 'Link Copied' : 'Share Pass'}</span>
          </button>
          
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow hover:bg-primary/90 transition-colors"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print Pass</span>
          </button>
        </div>
      </div>

      {/* Main Digital Gate Pass Card */}
      <div className="w-full max-w-lg rounded-3xl border border-zinc-800 bg-zinc-900 shadow-2xl overflow-hidden print:shadow-none print:border-black print:bg-white print:text-black">
        
        {/* Pass Header Banner */}
        <div className="p-6 border-b border-zinc-800/80 bg-gradient-to-b from-zinc-800/60 to-zinc-900/60 flex items-center justify-between print:bg-white print:border-black">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-indigo-600 text-white shadow-lg print:border print:border-black print:bg-white print:text-black">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] tracking-widest uppercase font-bold text-primary print:text-black">
                CAMPUS FACILITY SECURITY & ENTRY
              </p>
              <h1 className="text-lg font-black tracking-tight text-white print:text-black">
                Official Digital Gate Pass
              </h1>
              <p className="text-[11px] text-zinc-400 print:text-zinc-600 font-mono">
                System Pass ID: {id ? id.slice(0, 18) : 'N/A'}
              </p>
            </div>
          </div>

          <div className="hidden sm:block text-right">
            <span className="text-[10px] text-zinc-400 uppercase tracking-widest block font-bold">
              VERIFIED
            </span>
            <span className="text-xs font-mono font-bold text-emerald-400">
              {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Verification Status Banner */}
        <div className="px-6 py-4 bg-zinc-950/60 border-b border-zinc-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:bg-white print:border-black">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">
              Security Verdict
            </span>
            <div className="mt-1">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold tracking-wide ${statusConfig.badgeClass}`}>
                {statusConfig.icon}
                <span>{statusConfig.title}</span>
              </span>
            </div>
          </div>

          {data?.verifiedAt && (
            <div className="text-left sm:text-right">
              <span className="text-[10px] text-zinc-400 uppercase font-bold block">
                Verification Timestamp
              </span>
              <span className="text-xs font-mono text-zinc-300 print:text-black">
                {new Date(data.verifiedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
          )}
        </div>

        {/* Pass Body Content */}
        <div className="p-6 space-y-6">
          {loading ? (
            <div className="py-12 text-center text-xs text-zinc-400 animate-pulse space-y-2">
              <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p>Cryptographically verifying venue allocation record from PostgreSQL...</p>
            </div>
          ) : !data ? (
            <div className="py-10 text-center space-y-3">
              <ShieldAlert className="h-10 w-10 text-red-500 mx-auto" />
              <p className="font-bold text-sm text-white">Invalid Gate Pass Record</p>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                {error || 'This booking identifier does not correspond to any valid campus facility reservation.'}
              </p>
            </div>
          ) : (
            <>
              {/* Event & Purpose Details */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4 space-y-2 print:border-zinc-300 print:bg-zinc-50">
                <span className="text-[10px] uppercase tracking-wider font-bold text-primary print:text-black">
                  Authorized Event Title
                </span>
                <h2 className="text-base font-bold text-white print:text-black leading-snug">
                  {data.eventName}
                </h2>
                {data.eventDescription && (
                  <p className="text-xs text-zinc-400 print:text-zinc-700 leading-relaxed">
                    {data.eventDescription}
                  </p>
                )}
              </div>

              {/* Grid: Facility, Requester, Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                
                {/* Venue Allocation */}
                <div className="rounded-xl border border-zinc-800/80 p-3.5 space-y-1.5 bg-zinc-900/50 print:border-zinc-300">
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold flex items-center gap-1">
                    <Building2 className="h-3 w-3 text-primary" /> Approved Venue
                  </span>
                  <p className="font-bold text-white print:text-black text-sm">{data.venueName}</p>
                  <p className="text-zinc-400 print:text-zinc-600 flex items-center gap-1 text-[11px]">
                    <MapPin className="h-3 w-3 text-zinc-500" /> {data.venueLocation}
                  </p>
                  <p className="text-zinc-400 print:text-zinc-600 flex items-center gap-1 text-[11px]">
                    <Users className="h-3 w-3 text-zinc-500" /> Max Capacity: {data.venueCapacity} seats
                  </p>
                </div>

                {/* Authorized Requester */}
                <div className="rounded-xl border border-zinc-800/80 p-3.5 space-y-1.5 bg-zinc-900/50 print:border-zinc-300">
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold flex items-center gap-1">
                    <User className="h-3 w-3 text-primary" /> Authorized Requester
                  </span>
                  <p className="font-bold text-white print:text-black text-sm">{data.requesterName}</p>
                  <p className="text-zinc-400 print:text-zinc-600 text-[11px] font-medium">
                    Dept: <span className="text-zinc-200 print:text-black font-semibold">{data.department}</span>
                  </p>
                  <p className="text-zinc-400 print:text-zinc-600 text-[11px] truncate">
                    {data.requesterEmail}
                  </p>
                </div>

                {/* Scheduled Date */}
                <div className="rounded-xl border border-zinc-800/80 p-3.5 space-y-1 bg-zinc-900/50 print:border-zinc-300">
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-primary" /> Event Date
                  </span>
                  <p className="font-bold text-white print:text-black text-sm">
                    {data.eventDate}
                  </p>
                </div>

                {/* Allotted Slot */}
                <div className="rounded-xl border border-zinc-800/80 p-3.5 space-y-1 bg-zinc-900/50 print:border-zinc-300">
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold flex items-center gap-1">
                    <Clock3 className="h-3 w-3 text-primary" /> Allotted Time Slot
                  </span>
                  <p className="font-mono font-bold text-white print:text-black text-sm">
                    {data.startTime} – {data.endTime}
                  </p>
                  <span className="text-[10px] text-zinc-500 block">Strict venue access window</span>
                </div>

              </div>

              {/* Security QR Code Verification Section */}
              <div className="rounded-2xl border border-dashed border-zinc-700 p-5 bg-zinc-950 flex flex-col sm:flex-row items-center justify-between gap-5 print:border-zinc-400 print:bg-white">
                <div className="space-y-2 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-bold text-primary print:text-black">
                    <QrCode className="h-4 w-4" />
                    <span>Instant Guard Scan Verification</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 print:text-zinc-700 max-w-xs leading-relaxed">
                    Venue security personnel scan this QR code with any mobile device to immediately authenticate live booking approval and verify requester identity.
                  </p>
                  <div className="pt-1">
                    <span className="text-[10px] font-mono text-zinc-500 print:text-zinc-600 block">
                      Target URL: /pass/{id ? id.slice(0, 12) : ''}...
                    </span>
                  </div>
                </div>

                {/* QR Code Container */}
                <div className="p-2.5 rounded-2xl bg-white shadow-xl shrink-0 flex flex-col items-center">
                  <img
                    src={qrImageSrc}
                    alt="Official Verification QR Code"
                    width={140}
                    height={140}
                    className="rounded-lg object-contain"
                  />
                  <span className="text-[9px] font-mono font-bold text-zinc-700 mt-1 uppercase">
                    Security Scan
                  </span>
                </div>
              </div>

              {/* Approval Authority Note */}
              {data.approvalDetails && (
                <div className="border-t border-zinc-800/80 pt-3 text-[11px] text-zinc-400 flex items-center justify-between print:border-zinc-300 print:text-zinc-600">
                  <span>
                    Authorized By: <strong className="text-zinc-200 print:text-black">{data.approvalDetails.approvedBy}</strong> ({data.approvalDetails.designation})
                  </span>
                  <span className="font-mono text-[10px]">
                    Ref: {data.approvalDetails.approverCode}
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Pass Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950 text-center text-[10px] text-zinc-500 print:border-zinc-300 print:text-zinc-600 font-mono">
          OFFICIAL CAMPUS SECURITY PASS • INTEGRATED POSTGRESQL RBAC AUTHENTICATION • NON-TRANSFERABLE
        </div>

      </div>

    </div>
  )
}
