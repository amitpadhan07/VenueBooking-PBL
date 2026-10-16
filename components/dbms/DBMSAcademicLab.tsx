'use client'

import { useState } from 'react'
import { PRESET_QUERIES } from '@/app/api/dbms/query/route'
import {
  Database,
  Terminal,
  Play,
  ShieldCheck,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  Sparkles,
  GitBranch,
} from 'lucide-react'

export default function DBMSAcademicLab() {
  const [selectedQueryId, setSelectedQueryId] = useState<string>(PRESET_QUERIES[0].id)
  const [customSql, setCustomSql] = useState<string>(PRESET_QUERIES[0].sql)
  const [isRunning, setIsRunning] = useState<boolean>(false)
  const [queryResult, setQueryResult] = useState<any | null>(null)
  const [queryError, setQueryError] = useState<string>('')

  // Concurrency test state
  const [concurrencyRunning, setConcurrencyRunning] = useState<boolean>(false)
  const [concurrencyResult, setConcurrencyResult] = useState<any | null>(null)

  const handleSelectPreset = (id: string) => {
    setSelectedQueryId(id)
    const preset = PRESET_QUERIES.find((q) => q.id === id)
    if (preset) {
      setCustomSql(preset.sql)
      setQueryResult(null)
      setQueryError('')
    }
  }

  const runQuery = async () => {
    setIsRunning(true)
    setQueryError('')
    setQueryResult(null)
    try {
      const res = await fetch('/api/dbms/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customSql }),
      })
      const data = await res.json()
      if (!res.ok) {
        setQueryError(data.error || 'Failed to execute query.')
      } else {
        setQueryResult(data)
      }
    } catch (err: any) {
      setQueryError(err.message || 'Network error.')
    } finally {
      setIsRunning(false)
    }
  }

  const runConcurrencyTest = async () => {
    setConcurrencyRunning(true)
    setConcurrencyResult(null)
    try {
      const res = await fetch('/api/demo/concurrency-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      setConcurrencyResult(data)
    } catch (err: any) {
      setConcurrencyResult({ error: err.message })
    } finally {
      setConcurrencyRunning(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Conceptual Header */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
        <div className="flex items-center gap-2 text-primary font-semibold">
          <Database className="size-5" />
          <span>DBMS Academic Foundation: Normalized Schema, SQL Integration & ACID Concurrency</span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          This lab presents the relational database architecture of VenueDesk running on <strong>PostgreSQL</strong>.
          Explore the 3NF normalized schema, execute live multi-table SQL JOINs directly against the database, and observe 
          pessimistic row-level locking (<code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">SELECT ... FOR UPDATE</code>) preventing race conditions.
        </p>
      </div>

      {/* Section 1: Live Interactive Concurrency & ACID Race Condition Test */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Zap className="size-5 text-amber-500" />
              <h2 className="text-lg font-semibold">Live PostgreSQL ACID Concurrency Race Condition Test</h2>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Simulates two concurrent users attempting to book the exact same venue slot at the same millisecond.
            </p>
          </div>
          <button
            onClick={runConcurrencyTest}
            disabled={concurrencyRunning}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 text-sm font-semibold shadow transition-all disabled:opacity-50"
          >
            {concurrencyRunning ? (
              <>Running Race Test...</>
            ) : (
              <>
                <Play className="size-4 fill-current" /> Fire 2 Concurrent Requests
              </>
            )}
          </button>
        </div>

        {concurrencyResult && (
          <div className="mt-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted/40 p-4 border border-border">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Venue & Target Slot</p>
                <p className="font-semibold text-sm mt-0.5">{concurrencyResult.targetVenue} · {concurrencyResult.targetSlot}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-emerald-500/15 border border-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  Allocations: {concurrencyResult.resultSummary?.successfulAllocations}
                </span>
                <span className="rounded-full bg-rose-500/15 border border-rose-500/20 px-3 py-1 text-xs font-semibold text-rose-600 dark:text-rose-400">
                  Conflicts Blocked: {concurrencyResult.resultSummary?.conflictsPrevented}
                </span>
                <span className="rounded-full bg-primary/15 border border-primary/20 px-3 py-1 text-xs font-semibold text-primary">
                  Double Booking Prevented: {concurrencyResult.resultSummary?.doubleBookingPrevented ? 'YES' : 'NO'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {concurrencyResult.requests?.map((req: any, i: number) => (
                <div
                  key={i}
                  className={`rounded-xl border p-4 ${
                    req.success
                      ? 'border-emerald-500/30 bg-emerald-500/5'
                      : 'border-rose-500/30 bg-rose-500/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm">{req.clientId}</span>
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                        req.success ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                      }`}
                    >
                      HTTP {req.status} {req.success ? 'Created' : 'Conflict'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Execution Latency: <strong>{req.durationMs} ms</strong>
                  </p>
                  <pre className="mt-3 overflow-x-auto rounded-lg bg-background p-3 text-[11px] font-mono text-muted-foreground">
                    {JSON.stringify(req.payload, null, 2)}
                  </pre>
                </div>
              ))}
            </div>

            <p className="text-xs text-muted-foreground bg-muted/20 p-3 rounded-xl border border-dashed border-border">
              <strong>Evaluation Proof:</strong> {concurrencyResult.explanation}
            </p>
          </div>
        )}
      </div>

      {/* Section 2: Live SQL Query Playground */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
          <div className="flex items-center gap-2">
            <Terminal className="size-5 text-primary" />
            <h2 className="text-lg font-semibold">Live PostgreSQL SQL Query Playground</h2>
          </div>
          <span className="text-xs text-muted-foreground font-mono">Dialect: PostgreSQL 16+</span>
        </div>

        {/* Preset Query Chips */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs font-semibold uppercase text-muted-foreground mr-1">Predefined Queries:</span>
          {PRESET_QUERIES.map((q) => (
            <button
              key={q.id}
              onClick={() => handleSelectPreset(q.id)}
              className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
                selectedQueryId === q.id
                  ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                  : 'border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {q.title.split('(')[0].trim()}
            </button>
          ))}
        </div>

        {/* SQL Code Editor Area */}
        <div className="space-y-3">
          <textarea
            rows={7}
            value={customSql}
            onChange={(e) => setCustomSql(e.target.value)}
            className="w-full rounded-xl border border-input bg-muted/20 p-3 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Type your SELECT query here..."
          />
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">
              {PRESET_QUERIES.find((q) => q.id === selectedQueryId)?.description}
            </p>
            <button
              onClick={runQuery}
              disabled={isRunning}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow hover:opacity-90 disabled:opacity-50"
            >
              <Play className="size-4 fill-current" />
              {isRunning ? 'Executing SQL...' : 'Execute SQL'}
            </button>
          </div>
        </div>

        {/* Query Error Output */}
        {queryError && (
          <div className="mt-4 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-destructive text-sm">
            <p className="font-semibold">SQL Execution Error</p>
            <p className="mt-1 font-mono text-xs">{queryError}</p>
          </div>
        )}

        {/* Query Result Table */}
        {queryResult && (
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Returned <strong>{queryResult.rowCount} rows</strong> in <strong>{queryResult.durationMs} ms</strong>
              </span>
              <span className="font-mono">Live Render PostgreSQL Result</span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted text-muted-foreground uppercase font-semibold border-b border-border">
                  <tr>
                    {queryResult.columns?.map((col: string) => (
                      <th key={col} className="p-3">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {queryResult.rows?.length === 0 ? (
                    <tr>
                      <td colSpan={queryResult.columns.length || 1} className="p-6 text-center text-muted-foreground">
                        Query returned zero rows.
                      </td>
                    </tr>
                  ) : (
                    queryResult.rows?.map((row: any, rIdx: number) => (
                      <tr key={rIdx} className="hover:bg-muted/30">
                        {queryResult.columns?.map((col: string) => (
                          <td key={col} className="p-3 font-mono">
                            {row[col] !== null && row[col] !== undefined ? String(row[col]) : <em className="text-muted-foreground">NULL</em>}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Section 3: Relational Architecture & Normalization Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <GitBranch className="size-5 text-primary" />
            <h3 className="font-semibold text-lg">3NF Normalized Relational Schema</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            The database comprises 8 strictly normalized tables adhering to Boyce-Codd Normal Form (BCNF):
          </p>
          <ul className="space-y-2.5 text-xs text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>users:</strong> Core credentials, roles (<code className="font-mono">STUDENT, EMPLOYEE, ADMIN, FACULTY</code>), department.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>venues:</strong> Physical spaces, capacity checks, operational status.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>employees:</strong> Linked 1:1 with users via FK, tracks staff designation & code.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>venue_authority:</strong> Resolves $N:M$ relationship between approvers and venues with composite unique constraint <code className="font-mono">(employee_id, venue_id)</code>.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>bookings:</strong> Event reservations with B-Tree lookup index on <code className="font-mono">(venue_id, event_date, status, start_time, end_time)</code>.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>approvals, notifications, audit_logs:</strong> Enforce complete traceability and audit history.</span>
            </li>
          </ul>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="size-5 text-primary" />
            <h3 className="font-semibold text-lg">PostgreSQL ACID Transaction Model</h3>
          </div>
          <div className="space-y-3 text-xs">
            <div className="rounded-xl border border-border bg-muted/20 p-3">
              <strong className="text-primary block font-semibold">Atomicity</strong>
              <span className="text-muted-foreground">
                All booking records, notifications, and audit log entries commit collectively or rollback on failure.
              </span>
            </div>
            <div className="rounded-xl border border-border bg-muted/20 p-3">
              <strong className="text-primary block font-semibold">Consistency</strong>
              <span className="text-muted-foreground">
                Time interval overlap rules and capacity check constraints prevent illegal state transitions.
              </span>
            </div>
            <div className="rounded-xl border border-border bg-muted/20 p-3">
              <strong className="text-primary block font-semibold">Isolation</strong>
              <span className="text-muted-foreground">
                Pessimistic row locking (<code className="font-mono">SELECT ... FOR UPDATE</code>) serializes concurrent allocations.
              </span>
            </div>
            <div className="rounded-xl border border-border bg-muted/20 p-3">
              <strong className="text-primary block font-semibold">Durability</strong>
              <span className="text-muted-foreground">
                Transactions are guaranteed written to PostgreSQL Write-Ahead Logging (WAL) on disk.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 4: Akshat's Defense Focus - Write-Ahead Logging (WAL) & Crash Recovery (ARIES) */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-primary" />
              <h3 className="font-semibold text-lg">PostgreSQL Crash Recovery & Write-Ahead Logging (WAL)</h3>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              <strong>WAL Protocol:</strong> No database block is written to disk until the corresponding log record is flushed to persistent storage.
            </p>
          </div>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            ARIES Recovery Algorithm
          </span>
        </div>

        <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <div className="flex items-center gap-2 text-primary font-semibold text-sm mb-2">
              <span className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span>
              <span>Analysis Phase</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Scans forward from the last Checkpoint in the WAL. Identifies all <strong>dirty pages</strong> in the buffer pool and constructs the <strong>Transaction Table</strong> of all transactions that were active at the instant of crash.
            </p>
            <div className="mt-3 rounded-lg bg-background p-2.5 font-mono text-[11px] border border-border text-muted-foreground">
              Checkpoint → Scan Forward → Identify Active T_uncommitted
            </div>
          </div>

          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <div className="flex items-center gap-2 text-emerald-500 font-semibold text-sm mb-2">
              <span className="flex size-6 items-center justify-center rounded-full bg-emerald-500 text-white text-xs font-bold">2</span>
              <span>Redo Phase (Durability)</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Repeats all operations logged in WAL up to the crash point, including those of uncommitted transactions (Repeating History). Ensures all committed updates are physically restored to table pages.
            </p>
            <div className="mt-3 rounded-lg bg-background p-2.5 font-mono text-[11px] border border-border text-emerald-600 dark:text-emerald-400">
              Redo all logged updates → Enforces Durability
            </div>
          </div>

          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <div className="flex items-center gap-2 text-rose-500 font-semibold text-sm mb-2">
              <span className="flex size-6 items-center justify-center rounded-full bg-rose-500 text-white text-xs font-bold">3</span>
              <span>Undo Phase (Atomicity)</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Scans backward through the WAL and reverses the modifications of all transactions that were uncommitted when the system crashed. Writes Compensating Log Records (CLR) so restarts never fail.
            </p>
            <div className="mt-3 rounded-lg bg-background p-2.5 font-mono text-[11px] border border-border text-rose-600 dark:text-rose-400">
              Scan Backward → Rollback active uncommitted → Enforces Atomicity
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="size-5 text-primary shrink-0" />
            <p className="text-xs text-muted-foreground">
              In VenueDesk, every <code className="font-mono bg-background px-1 py-0.5 rounded">POST /api/bookings/concurrent-safe</code> commits its booking, notification, and audit trail records sequentially to the WAL before acknowledging HTTP 201 to the client.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
