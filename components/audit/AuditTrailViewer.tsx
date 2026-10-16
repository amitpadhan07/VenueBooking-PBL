'use client'

import { useState, useEffect } from 'react'
import { Activity, RefreshCw, Filter, ShieldCheck, Clock, User, FileText } from 'lucide-react'

export default function AuditTrailViewer() {
  const [logs, setLogs] = useState<any[]>([])
  const [totalCount, setTotalCount] = useState<number>(0)
  const [selectedAction, setSelectedAction] = useState<string>('ALL')
  const [loading, setLoading] = useState(true)

  const actionOptions = [
    { label: 'All Actions', value: 'ALL' },
    { label: 'User Logins', value: 'LOGIN' },
    { label: 'Transactional Bookings', value: 'BOOKING_CREATED_TRANSACTIONAL' },
    { label: 'Booking Approvals', value: 'BOOKING_APPROVED' },
    { label: 'Booking Rejections', value: 'BOOKING_REJECTED' },
    { label: 'Authority Delegations', value: 'VENUE_AUTHORITY_ASSIGNED' },
    { label: 'Authority Revocations', value: 'VENUE_AUTHORITY_REVOKED' },
    { label: 'Unauthorized Attempts', value: 'UNAUTHORIZED_APPROVAL_ATTEMPT' },
  ]

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const url = `/api/audit-logs?action=${selectedAction}&limit=50`
      const res = await fetch(url)
      const data = await res.json()
      if (res.ok) {
        setLogs(data.logs || [])
        setTotalCount(data.totalCount || 0)
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [selectedAction])

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'LOGIN':
        return 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20'
      case 'BOOKING_CREATED_TRANSACTIONAL':
        return 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
      case 'BOOKING_APPROVED':
        return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
      case 'BOOKING_REJECTED':
      case 'UNAUTHORIZED_APPROVAL_ATTEMPT':
        return 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20'
      case 'VENUE_AUTHORITY_ASSIGNED':
        return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20'
      default:
        return 'bg-muted text-muted-foreground border border-border'
    }
  }

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
        <div className="flex items-center gap-2 text-primary font-semibold">
          <ShieldCheck className="size-5" />
          <span>Audit Trail & Tamper-Evident Security Log</span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Every security-critical operation (authentications, transactional allocations, authority assignments, and approval decisions) 
          is immutably persisted into the <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-xs">audit_logs</code> table 
          to enforce <strong>non-repudiation</strong> and enterprise compliance.
        </p>
      </div>

      {/* Filter and Stats Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2">
          <Filter className="size-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">Filter Action:</span>
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-medium outline-none focus:ring-2 focus:ring-primary"
          >
            {actionOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground font-mono">
            Total Logged Events: <strong>{totalCount}</strong>
          </span>
          <button
            onClick={fetchLogs}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
          >
            <RefreshCw className="size-3.5" />
            <span>Refresh Logs</span>
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-xs text-muted-foreground animate-pulse">Loading audit records…</div>
        ) : logs.length === 0 ? (
          <div className="p-10 text-center text-xs text-muted-foreground">No audit entries matching filter criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-muted/30 text-muted-foreground uppercase font-semibold">
                <tr>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Action Event</th>
                  <th className="p-4">Actor / User</th>
                  <th className="p-4">Entity Type</th>
                  <th className="p-4">Metadata & Audit Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map((log) => (
                  <tr key={log.logId} className="hover:bg-muted/20">
                    <td className="p-4 font-mono text-muted-foreground whitespace-nowrap text-[11px]">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-mono font-bold ${getActionBadgeColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-foreground">{log.userName}</p>
                      <span className="text-[10px] text-muted-foreground">{log.userRole} · {log.userEmail}</span>
                    </td>
                    <td className="p-4 font-mono text-muted-foreground uppercase text-[10px]">{log.entityType}</td>
                    <td className="p-4">
                      {log.details ? (
                        <pre className="max-w-md overflow-x-auto rounded bg-muted/40 p-2 font-mono text-[10px] text-muted-foreground border border-border">
                          {typeof log.details === 'object' ? JSON.stringify(log.details, null, 2) : log.details}
                        </pre>
                      ) : (
                        <span className="text-muted-foreground italic text-[11px]">No metadata attached</span>
                      )}
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
