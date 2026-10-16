'use client'

import { useState, useEffect } from 'react'
import { ShieldCheck, Plus, Trash2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react'

export default function VenueAuthorityPanel({ role }: { role: string }) {
  const [matrix, setMatrix] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [venues, setVenues] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    employeeId: '',
    venueId: '',
  })

  const fetchMatrix = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/authorities')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to fetch matrix')
      setMatrix(data.matrix || [])
      setEmployees(data.employees || [])
      setVenues(data.venues || [])
      if (data.employees?.length > 0 && !form.employeeId) {
        setForm((prev) => ({ ...prev, employeeId: data.employees[0].employeeId }))
      }
      if (data.venues?.length > 0 && !form.venueId) {
        setForm((prev) => ({ ...prev, venueId: data.venues[0].venueId }))
      }
    } catch (err: any) {
      setError(err.message || 'Error loading authority matrix')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMatrix()
  }, [])

  const handleAssign = async () => {
    setMessage('')
    setError('')
    if (!form.employeeId || !form.venueId) {
      setError('Please select both an employee and a venue.')
      return
    }

    try {
      const res = await fetch('/api/admin/authorities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to assign authority')
      } else {
        setMessage(data.message || 'Authority assigned successfully!')
        fetchMatrix()
      }
    } catch (err: any) {
      setError(err.message || 'Network error')
    }
  }

  const handleRevoke = async (authorityId: string) => {
    setMessage('')
    setError('')
    try {
      const res = await fetch(`/api/admin/authorities?id=${authorityId}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to revoke authority')
      } else {
        setMessage(data.message || 'Authority revoked successfully.')
        fetchMatrix()
      }
    } catch (err: any) {
      setError(err.message || 'Network error')
    }
  }

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
        <div className="flex items-center gap-2 text-primary font-semibold">
          <ShieldCheck className="size-5" />
          <span>Venue Authority Matrix & Fine-Grained Access Control</span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          <strong>Key Academic Principle:</strong> In VenueDesk, an employee cannot approve requests across arbitrary campus facilities.
          Approval rights are strictly constrained by the associative table <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-xs">venue_authority</code> with composite uniqueness.
        </p>
      </div>

      {message && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-sm text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Admin Delegation Form */}
      {role === 'Admin' && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h3 className="text-base font-semibold mb-3">Delegate Venue Administrative Authority</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Target Employee</label>
              <select
                value={form.employeeId}
                onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                className="w-full rounded-xl border border-input bg-background p-2.5 text-xs outline-none focus:ring-2 focus:ring-primary"
              >
                {employees.map((emp) => (
                  <option key={emp.employeeId} value={emp.employeeId}>
                    {emp.name} ({emp.employeeCode} - {emp.department})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Target Campus Facility</label>
              <select
                value={form.venueId}
                onChange={(e) => setForm({ ...form, venueId: e.target.value })}
                className="w-full rounded-xl border border-input bg-background p-2.5 text-xs outline-none focus:ring-2 focus:ring-primary"
              >
                {venues.map((v) => (
                  <option key={v.venueId} value={v.venueId}>
                    {v.venueName} (Cap: {v.capacity})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleAssign}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-medium text-primary-foreground shadow hover:opacity-90 transition-opacity"
            >
              <Plus className="size-4" />
              <span>Grant Authority</span>
            </button>
          </div>
        </div>
      )}

      {/* Matrix Table */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-border p-5">
          <div>
            <h3 className="font-semibold text-base">Current Venue Authority Delegations</h3>
            <p className="text-xs text-muted-foreground">PostgreSQL relational records ({matrix.length} active mappings)</p>
          </div>
          <button
            onClick={fetchMatrix}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
          >
            <RefreshCw className="size-3.5" />
            <span>Refresh</span>
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-muted-foreground animate-pulse">Loading authority matrix…</div>
        ) : matrix.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">No authority delegations found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-muted/30 text-muted-foreground uppercase font-semibold">
                <tr>
                  <th className="p-4">Employee</th>
                  <th className="p-4">Staff Code</th>
                  <th className="p-4">Department</th>
                  <th className="p-4">Authorized Facility</th>
                  <th className="p-4">Capacity</th>
                  <th className="p-4">Status</th>
                  {role === 'Admin' && <th className="p-4 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {matrix.map((row) => (
                  <tr key={row.authorityId} className="hover:bg-muted/20">
                    <td className="p-4 font-semibold text-foreground">{row.employeeName}</td>
                    <td className="p-4 font-mono text-muted-foreground">{row.employeeCode}</td>
                    <td className="p-4 text-muted-foreground">{row.department}</td>
                    <td className="p-4 font-medium text-primary">{row.venueName}</td>
                    <td className="p-4 text-muted-foreground">{row.capacity} seats</td>
                    <td className="p-4">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          row.status === 'ACTIVE'
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    {role === 'Admin' && (
                      <td className="p-4 text-right">
                        {row.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleRevoke(row.authorityId)}
                            className="inline-flex items-center gap-1 rounded-lg border border-destructive/30 px-2.5 py-1 text-[11px] text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 className="size-3" />
                            <span>Revoke</span>
                          </button>
                        )}
                      </td>
                    )}
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
