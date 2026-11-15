'use client'

import { useState, useEffect } from 'react'
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Clock,
  UserCheck,
  ShieldAlert,
  X,
  MessageSquare,
  Wrench,
  Sparkles,
} from 'lucide-react'

export default function PendingApprovalsInbox({
  role,
  onActionSuccess,
}: {
  role: string
  onActionSuccess?: () => void
}) {
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusMessage, setStatusMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [processingId, setProcessingId] = useState<string | null>(null)

  // Rejection Modal State
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null)
  const [rejectionRemarks, setRejectionRemarks] = useState('')
  const [rejectionError, setRejectionError] = useState<string | null>(null)

  // Preset Remarks for quick selection
  const presetRemarks = [
    'Electrical maintenance in progress — please reschedule.',
    'Auditorium booked for Annual Convocation setup',
    'Emergency facility maintenance in progress',
    'Exceeds allowed capacity limits for safe occupancy',
  ]

  const fetchPending = async () => {
    setLoading(true)
    setErrorMessage('')
    try {
      const res = await fetch('/api/approvals/pending', {
        headers: { 'x-demo-role': role },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to fetch pending approvals')
      setBookings(data.bookings || [])
    } catch (err: any) {
      setErrorMessage(err.message || 'Error loading pending bookings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPending()
  }, [role])

  const handleAction = async (
    bookingId: string,
    action: 'APPROVED' | 'REJECTED',
    customRemarks?: string
  ) => {
    setStatusMessage('')
    setErrorMessage('')
    setProcessingId(bookingId)

    const remarks =
      customRemarks ||
      (action === 'APPROVED'
        ? `Decision by ${role} via administrative inbox.`
        : 'Declined by designated authority.')

    try {
      const res = await fetch('/api/approvals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-demo-role': role,
        },
        body: JSON.stringify({
          bookingId,
          action,
          remarks,
        }),
      })

      const data = await res.json()

      if (res.status === 403) {
        // Highlighted Defense Scenario: 403 Forbidden Authority Violation
        setErrorMessage(
          `403 Forbidden: ${data.error || 'Unauthorized: You do not possess venue authority over this facility'}`
        )
      } else if (!res.ok) {
        setErrorMessage(data.error || `Failed to process ${action.toLowerCase()}`)
      } else {
        setStatusMessage(
          `Booking successfully ${action.toLowerCase()}! Notification dispatched and audit log created.`
        )
        fetchPending()
        if (onActionSuccess) onActionSuccess()
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error processing decision')
    } finally {
      setProcessingId(null)
    }
  }

  const openRejectModal = (booking: any) => {
    setSelectedBooking(booking)
    setRejectionRemarks('')
    setRejectionError(null)
    setRejectModalOpen(true)
  }

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBooking) return

    if (!rejectionRemarks.trim()) {
      setRejectionError('Please provide a justification or remark for rejecting this booking.')
      return
    }

    const bId = selectedBooking.bookingId
    const remarks = rejectionRemarks.trim()
    setRejectModalOpen(false)
    setSelectedBooking(null)
    await handleAction(bId, 'REJECTED', remarks)
  }

  // Parse equipment list from description
  const parseEquipment = (description?: string | null): string[] => {
    if (!description) return []
    const match = description.match(/\[Equipment(?:\s*Requisition)?:\s*([^\]]+)\]/i)
    if (match && match[1]) {
      return match[1].split(',').map((s) => s.trim()).filter(Boolean)
    }
    return []
  }

  const getCleanDescription = (description?: string | null): string => {
    if (!description) return ''
    return description.replace(/\[Equipment(?:\s*Requisition)?:\s*[^\]]+\]/i, '').trim()
  }

  const getEquipmentIcon = (item: string) => {
    if (item.toLowerCase().includes('mic')) return '🎤'
    if (item.toLowerCase().includes('projector')) return '📽️'
    if (item.toLowerCase().includes('air conditioning') || item.toLowerCase().includes('hvac')) return '❄️'
    if (item.toLowerCase().includes('lighting') || item.toLowerCase().includes('sound')) return '💡'
    if (item.toLowerCase().includes('conferencing') || item.toLowerCase().includes('video')) return '📹'
    return '⚙️'
  }

  return (
    <div className="space-y-6">
      {/* Informative Banner */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
        <div className="flex items-center gap-2 text-primary font-semibold">
          <UserCheck className="size-5" />
          <span>Pending Approvals Inbox & Server-Side Jurisdiction Verification</span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          In this workflow, an approver submits an authorization decision. The backend executes a relational lookup on{' '}
          <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-xs">venue_authority</code>.{' '}
          If an employee attempts to approve a venue outside their designated jurisdiction, the server terminates with{' '}
          <strong className="text-destructive font-mono"> HTTP 403 Forbidden</strong>.
        </p>
      </div>

      {statusMessage && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-sm text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="size-5 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-start gap-2.5 rounded-xl bg-destructive/10 border border-destructive/30 p-4 text-sm text-destructive">
          <ShieldAlert className="size-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Authorization Constraint Triggered</p>
            <p className="text-xs opacity-90 mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Inbox Card */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-border p-5">
          <div>
            <h3 className="font-semibold text-base">Pending Reservation Requests</h3>
            <p className="text-xs text-muted-foreground">
              Awaiting designated authority decision ({bookings.length} requests)
            </p>
          </div>
          <button
            onClick={fetchPending}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
          >
            <RefreshCw className="size-3.5" />
            <span>Refresh</span>
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-muted-foreground animate-pulse">
            Loading pending reservations…
          </div>
        ) : bookings.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">
            <Clock className="size-8 mx-auto mb-2 opacity-40 text-primary" />
            <p className="font-semibold text-sm">No Pending Approvals</p>
            <p className="text-xs mt-1">All venue booking requests within your jurisdiction have been reviewed.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-muted/30 text-muted-foreground uppercase font-semibold">
                <tr>
                  <th className="p-4">Event & Requisitions</th>
                  <th className="p-4">Facility Requested</th>
                  <th className="p-4">Student Requester</th>
                  <th className="p-4">Department</th>
                  <th className="p-4">Scheduled Slot</th>
                  <th className="p-4">Attendees</th>
                  <th className="p-4 text-right">Decisions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {bookings.map((booking) => {
                  const equipmentList = parseEquipment(booking.description)
                  const cleanDesc = getCleanDescription(booking.description)

                  return (
                    <tr key={booking.bookingId} className="hover:bg-muted/20">
                      <td className="p-4 font-semibold text-foreground max-w-xs">
                        <p>{booking.eventName}</p>
                        {cleanDesc && (
                          <p className="text-[11px] text-muted-foreground font-normal line-clamp-1 mt-0.5">
                            {cleanDesc}
                          </p>
                        )}
                        {/* Equipment Requisition Checklist Badges */}
                        {equipmentList.length > 0 && (
                          <div className="mt-2 space-y-1">
                            <span className="text-[10px] uppercase font-bold text-primary tracking-wider flex items-center gap-1">
                              <Wrench className="h-3 w-3" /> Requisition Checklist:
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {equipmentList.map((item, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 text-[10px] font-medium"
                                >
                                  <span>{getEquipmentIcon(item)}</span>
                                  <span>{item}</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="font-medium text-primary">{booking.venueName}</span>
                        <span className="block text-[10px] text-muted-foreground">
                          Cap: {booking.venueCapacity}
                        </span>
                      </td>
                      <td className="p-4 text-foreground/80">{booking.requesterName}</td>
                      <td className="p-4 text-muted-foreground">{booking.department}</td>
                      <td className="p-4 font-mono text-[11px] text-muted-foreground">
                        {booking.date} ({booking.startTime} - {booking.endTime})
                      </td>
                      <td className="p-4 text-muted-foreground">{booking.attendees}</td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          disabled={processingId === booking.bookingId}
                          onClick={() => handleAction(booking.bookingId, 'APPROVED')}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                        >
                          <CheckCircle2 className="size-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          disabled={processingId === booking.bookingId}
                          onClick={() => openRejectModal(booking)}
                          className="inline-flex items-center gap-1 rounded-lg border border-destructive/30 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-50 transition-colors"
                        >
                          <XCircle className="size-3.5" />
                          <span>Reject</span>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Interactive Rejection Remarks Modal */}
      {rejectModalOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400">
                  <XCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-sm sm:text-base">
                    Reject Booking Request
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Provide mandatory justification remarks for the student
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRejectModalOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Target Booking Info Card */}
            <div className="rounded-xl border border-border bg-muted/30 p-3 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground">{selectedBooking.eventName}</span>
                <span className="font-semibold text-primary">{selectedBooking.venueName}</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Requested by: <strong className="text-foreground">{selectedBooking.requesterName}</strong> ({selectedBooking.department}) • Scheduled: {selectedBooking.date} ({selectedBooking.startTime}-{selectedBooking.endTime})
              </p>
            </div>

            {rejectionError && (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/40 dark:border-red-800 p-3 text-xs text-red-700 dark:text-red-300">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                <p>{rejectionError}</p>
              </div>
            )}

            <form onSubmit={handleConfirmReject} className="space-y-4">
              
              {/* Presets / Common Justifications */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-primary" />
                  Quick Justification Presets:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {presetRemarks.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setRejectionRemarks(preset)}
                      className={`text-[10px] px-2.5 py-1 rounded-lg border text-left transition-colors ${
                        rejectionRemarks === preset
                          ? 'bg-primary/10 border-primary text-primary font-semibold'
                          : 'border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Remarks Textarea */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                  <MessageSquare className="h-3.5 w-3.5 text-primary" />
                  Rejection Remarks / Justification <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={rejectionRemarks}
                  onChange={(e) => {
                    setRejectionRemarks(e.target.value)
                    setRejectionError(null)
                  }}
                  placeholder="e.g. Electrical maintenance in progress — please reschedule."
                  required
                  className="w-full rounded-xl border border-border bg-background py-2 px-3 text-xs outline-none focus:border-destructive transition-all resize-y"
                />
                <p className="text-[10px] text-muted-foreground">
                  These remarks will be saved to <code className="font-mono">approvals.remarks</code> and dispatched directly to the student via notifications.
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setRejectModalOpen(false)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingId === selectedBooking.bookingId}
                  className="rounded-xl bg-destructive px-5 py-2 text-xs font-semibold text-destructive-foreground shadow hover:bg-destructive/90 disabled:opacity-50 transition-colors flex items-center gap-1.5"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  <span>Confirm Rejection</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  )
}
