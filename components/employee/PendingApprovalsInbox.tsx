'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, XCircle, AlertCircle, RefreshCw, Clock, UserCheck, ShieldAlert } from 'lucide-react'

export default function PendingApprovalsInbox({ role, onActionSuccess }: { role: string; onActionSuccess?: () => void }) {
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusMessage, setStatusMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [processingId, setProcessingId] = useState<string | null>(null)

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

  const handleAction = async (bookingId: string, action: 'APPROVED' | 'REJECTED') => {
    setStatusMessage('')
    setErrorMessage('')
    setProcessingId(bookingId)

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
          remarks: `Decision by ${role} via administrative inbox.`,
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
        setStatusMessage(`Booking successfully ${action.toLowerCase()}! Notification dispatched and audit log created.`)
        fetchPending()
        if (onActionSuccess) onActionSuccess()
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error processing decision')
    } finally {
      setProcessingId(null)
    }
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
          In this workflow, an approver submits an authorization decision. The backend executes a relational lookup on 
          <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-xs">venue_authority</code>. 
          If an employee attempts to approve a venue outside their designated jurisdiction, the server terminates with 
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
            <p className="text-xs text-muted-foreground">Awaiting designated authority decision ({bookings.length} requests)</p>
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
          <div className="p-8 text-center text-xs text-muted-foreground animate-pulse">Loading pending reservations…</div>
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
                  <th className="p-4">Event Purpose</th>
                  <th className="p-4">Facility Requested</th>
                  <th className="p-4">Student Requester</th>
                  <th className="p-4">Department</th>
                  <th className="p-4">Scheduled Slot</th>
                  <th className="p-4">Attendees</th>
                  <th className="p-4 text-right">Decisions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {bookings.map((booking) => (
                  <tr key={booking.bookingId} className="hover:bg-muted/20">
                    <td className="p-4 font-semibold text-foreground">{booking.eventName}</td>
                    <td className="p-4">
                      <span className="font-medium text-primary">{booking.venueName}</span>
                      <span className="block text-[10px] text-muted-foreground">Cap: {booking.venueCapacity}</span>
                    </td>
                    <td className="p-4 text-foreground/80">{booking.requesterName}</td>
                    <td className="p-4 text-muted-foreground">{booking.department}</td>
                    <td className="p-4 font-mono text-[11px] text-muted-foreground">
                      {booking.eventDate} ({booking.startTime} - {booking.endTime})
                    </td>
                    <td className="p-4 text-muted-foreground">{booking.expectedAttendees}</td>
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
                        onClick={() => handleAction(booking.bookingId, 'REJECTED')}
                        className="inline-flex items-center gap-1 rounded-lg border border-destructive/30 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-50 transition-colors"
                      >
                        <XCircle className="size-3.5" />
                        <span>Reject</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
