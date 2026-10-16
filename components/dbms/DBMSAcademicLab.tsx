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
  BookOpen,
  Code2,
  Cpu,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  FileCode,
  ArrowRight,
  Lock,
} from 'lucide-react'

const VIVA_QUESTIONS = [
  {
    q: 'Q1: Why do we need a row lock (SELECT FOR UPDATE) instead of just a simple SELECT?',
    a: 'A simple SELECT performs a non-locking snapshot read. If two users check availability at the same time (t0), both see that the venue is free. Both will proceed to insert a booking (t1), causing a double-booking (Race Condition / Lost Update). By using SELECT ... FOR UPDATE, the first transaction acquires a pessimistic lock on the venue row; the second transaction is forced to wait until the first commits, ensuring serializability and mutual exclusion.',
  },
  {
    q: 'Q2: Why is venue_authority a separate table instead of storing assigned_employee_id inside venues?',
    a: 'In our campus model, authority assignment is a Many-to-Many (N:M) relationship. An auditorium might have two authorized managers, or one senior manager might oversee multiple seminar halls. If we put employee_id inside venues, we would violate 1NF/2NF by storing multi-valued attributes or creating duplicate venue rows. The associative table venue_authority with a composite unique constraint (employee_id, venue_id) resolves this in 3NF / BCNF.',
  },
  {
    q: 'Q3: How is Atomicity preserved if the server crashes while creating a booking?',
    a: "We execute all database writes inside Prisma's interactive transaction (prisma.$transaction). In PostgreSQL, a transaction is an all-or-nothing boundary. If a crash happens after creating the booking but before logging or creating the notification, PostgreSQL issues an automatic ROLLBACK, discarding all intermediate writes so the database never enters an inconsistent state.",
  },
  {
    q: 'Q4: What is the relationship between an OS Mutex and a Database Lock?',
    a: 'Both solve the Mutual Exclusion problem of the Critical Section. An OS Mutex synchronizes threads sharing physical RAM within a single process. A Database Row Lock (FOR UPDATE) synchronizes distributed transactions sharing persistent data across multiple web server instances and worker processes.',
  },
  {
    q: 'Q5: What database are we using and where is it hosted?',
    a: 'We are running PostgreSQL 16 hosted in the cloud on Render (database name: venuedesk), connected securely over SSL via Prisma ORM.',
  },
]

export default function DBMSAcademicLab() {
  const [selectedQueryId, setSelectedQueryId] = useState<string>(PRESET_QUERIES[0].id)
  const [customSql, setCustomSql] = useState<string>(PRESET_QUERIES[0].sql)
  const [isRunning, setIsRunning] = useState<boolean>(false)
  const [queryResult, setQueryResult] = useState<any | null>(null)
  const [queryError, setQueryError] = useState<string>('')

  // Concurrency test state
  const [concurrencyRunning, setConcurrencyRunning] = useState<boolean>(false)
  const [concurrencyResult, setConcurrencyResult] = useState<any | null>(null)

  // Viva accordion state
  const [expandedViva, setExpandedViva] = useState<number | null>(0)

  // Script step highlight
  const [activeStep, setActiveStep] = useState<number>(1)

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
      setActiveStep(3)
    } catch (err: any) {
      setConcurrencyResult({ error: err.message })
    } finally {
      setConcurrencyRunning(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Lavanya Joshi Defense Header */}
      <div className="rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-primary/20 px-2.5 py-0.5 text-xs font-bold text-primary tracking-wide uppercase">
                Phase 2 Defense · PBL Theme
              </span>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-mono text-muted-foreground">
                PostgreSQL 16 (Render: venuedesk)
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
              Lavanya Joshi – Database & Backend Developer Defense Lab
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              <strong>PBL Theme:</strong> <em>An OS and DBMS Based Approach for Concurrent Venue Allocation and Approval</em>.
              Demonstrates 8-table ER architecture, 3NF normalization, PostgreSQL ACID transactions, and pessimistic row locking (<code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">SELECT ... FOR UPDATE</code>) eliminating race conditions.
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5 text-xs text-muted-foreground font-mono">
            <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" /> Live Remote DB Connected
            </span>
            <span>Target: 70%–80% Functional Implementation</span>
          </div>
        </div>

        {/* Live Code Ownership Badges */}
        <div className="mt-4 pt-4 border-t border-border/60 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-muted-foreground font-semibold uppercase tracking-wider text-[11px]">Owned Files:</span>
          <span className="rounded-md bg-background px-2 py-1 font-mono border border-border">prisma/schema.prisma</span>
          <span className="rounded-md bg-background px-2 py-1 font-mono border border-border">app/api/bookings/concurrent-safe/route.ts</span>
          <span className="rounded-md bg-background px-2 py-1 font-mono border border-border">components/dbms/DBMSAcademicLab.tsx</span>
          <span className="rounded-md bg-background px-2 py-1 font-mono border border-border">app/api/dbms/query/route.ts</span>
          <span className="rounded-md bg-background px-2 py-1 font-mono border border-border">app/api/demo/concurrency-test/route.ts</span>
        </div>
      </div>

      {/* Step-by-Step Live Defense Script Card */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="size-5 text-primary" />
            <h2 className="text-lg font-semibold">Step-by-Step Live Defense Script for Evaluators</h2>
          </div>
          <span className="text-xs text-muted-foreground font-mono">Presenter: Lavanya Joshi</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <button
            onClick={() => setActiveStep(1)}
            className={`text-left p-3 rounded-xl border transition-all ${
              activeStep === 1
                ? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary'
                : 'border-border bg-muted/20 hover:bg-muted/40'
            }`}
          >
            <div className="font-bold text-foreground flex items-center gap-1.5">
              <span className="size-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px]">1</span>
              <span>Open DBMS Concepts</span>
            </div>
            <p className="text-muted-foreground mt-1">Navigate to DBMS Concepts tab from the sidebar to initialize the PostgreSQL workspace.</p>
          </button>

          <button
            onClick={() => setActiveStep(2)}
            className={`text-left p-3 rounded-xl border transition-all ${
              activeStep === 2
                ? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary'
                : 'border-border bg-muted/20 hover:bg-muted/40'
            }`}
          >
            <div className="font-bold text-foreground flex items-center gap-1.5">
              <span className="size-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px]">2</span>
              <span>Explain 3NF Schema</span>
            </div>
            <p className="text-muted-foreground mt-1">Explain how 8 normalized tables eliminate Insertion, Deletion, and Update anomalies.</p>
          </button>

          <button
            onClick={() => setActiveStep(3)}
            className={`text-left p-3 rounded-xl border transition-all ${
              activeStep === 3
                ? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary'
                : 'border-border bg-muted/20 hover:bg-muted/40'
            }`}
          >
            <div className="font-bold text-foreground flex items-center gap-1.5">
              <span className="size-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px]">3</span>
              <span>Run Concurrency Test</span>
            </div>
            <p className="text-muted-foreground mt-1">Click &apos;Fire 2 Concurrent Requests&apos; to demonstrate row-lock serialization and HTTP 409 prevention.</p>
          </button>

          <button
            onClick={() => setActiveStep(4)}
            className={`text-left p-3 rounded-xl border transition-all ${
              activeStep === 4
                ? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary'
                : 'border-border bg-muted/20 hover:bg-muted/40'
            }`}
          >
            <div className="font-bold text-foreground flex items-center gap-1.5">
              <span className="size-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px]">4</span>
              <span>Execute Real SQL Queries</span>
            </div>
            <p className="text-muted-foreground mt-1">Execute the Multi-Table INNER JOIN playground query to show live PostgreSQL query plans and latency.</p>
          </button>
        </div>
      </div>

      {/* OS Bridge: Critical Section Problem & Mutex Mapping */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-2 border-b border-border pb-4 mb-5">
          <Cpu className="size-5 text-primary" />
          <div>
            <h2 className="text-lg font-semibold">OS Concept: Critical Section & The Lost Update Problem</h2>
            <p className="text-xs text-muted-foreground">
              Mapping Operating Systems synchronization theory directly to PostgreSQL Pessimistic Row Locking.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Critical Section Visualizer */}
          <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Lock className="size-4 text-amber-500" /> The 3-Step Critical Section in Venue Allocation
            </h3>
            <p className="text-xs text-muted-foreground">
              A shared physical venue slot must not be interleaved concurrently by multiple transaction threads.
            </p>

            <div className="space-y-2 text-xs font-mono">
              <div className="rounded-lg bg-background p-2.5 border border-amber-500/30 text-amber-600 dark:text-amber-400">
                <strong>1. ENTRY SECTION:</strong> tx.$queryRaw`SELECT ... FOR UPDATE` (Acquires Row Mutex)
              </div>
              <div className="rounded-lg bg-primary/10 p-3 border border-primary/30 text-foreground space-y-1">
                <div className="font-bold text-primary">CRITICAL SECTION (Protected)</div>
                <div>↳ Step 1: Read current venue slot status</div>
                <div>↳ Step 2: Check interval overlap: (S_exist &lt; E_req) ∧ (E_exist &gt; S_req)</div>
                <div>↳ Step 3: Insert booking record into `bookings` table</div>
              </div>
              <div className="rounded-lg bg-background p-2.5 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                <strong>2. EXIT SECTION:</strong> Transaction COMMIT / ROLLBACK (Releases Lock)
              </div>
            </div>
          </div>

          {/* OS Mutex vs Database Lock Comparison */}
          <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Zap className="size-4 text-primary" /> OS Mutex vs PostgreSQL Row Lock
            </h3>
            <div className="space-y-2 text-xs">
              <div className="rounded-lg bg-card p-3 border border-border">
                <strong className="text-foreground block">OS Mutex (Mutual Exclusion Lock)</strong>
                <p className="text-muted-foreground mt-0.5">
                  Protects shared physical RAM within a single process. Threads attempting to acquire a held mutex are suspended in a kernel wait queue.
                </p>
              </div>
              <div className="rounded-lg bg-card p-3 border border-border">
                <strong className="text-foreground block">PostgreSQL Row Lock (SELECT ... FOR UPDATE)</strong>
                <p className="text-muted-foreground mt-0.5">
                  The relational equivalent of a binary mutex on a specific tuple in persistent storage. Synchronizes distributed transactions across multiple web server instances and node workers.
                </p>
              </div>
              <div className="rounded-lg bg-primary/5 p-2.5 border border-primary/20 text-[11px] font-mono text-muted-foreground">
                Code: <code>app/api/bookings/concurrent-safe/route.ts#L42-L50</code>
              </div>
            </div>
          </div>
        </div>
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
              Simulates Student A and Student B firing booking requests for the exact same venue slot at the exact same millisecond.
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

            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs text-muted-foreground space-y-1">
              <strong className="text-primary block font-semibold">Evaluation Defense Explanation:</strong>
              <p>
                {concurrencyResult.explanation ||
                  'Pessimistic row-locking (SELECT ... FOR UPDATE) ensured that the two simultaneous transactions were serialized in PostgreSQL. One transaction committed successfully (201 Created), and the second transaction detected the overlap and aborted with a 409 Conflict.'}
              </p>
            </div>
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
          <span className="text-xs text-muted-foreground font-mono">Dialect: PostgreSQL 16+ · Real DB Execution</span>
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

        {/* Relational Algebra Formula Card */}
        {selectedQueryId === 'join-bookings-users-venues' && (
          <div className="mb-4 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs">
            <span className="font-semibold text-primary block">Relational Algebra Representation:</span>
            <code className="font-mono text-xs text-foreground mt-1 block">
              Π_(event, student, venue) (bookings ⋈ users ⋈ venues)
            </code>
          </div>
        )}

        {selectedQueryId === 'authority-matrix-join' && (
          <div className="mb-4 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs">
            <span className="font-semibold text-primary block">Relational Algebra Representation:</span>
            <code className="font-mono text-xs text-foreground mt-1 block">
              Π_(emp_code, name, designation, venue) (venue_authority ⋈ employees ⋈ users ⋈ venues)
            </code>
          </div>
        )}

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

      {/* Section 3: Relational Architecture, 3NF Normalization & Anomaly Elimination */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <GitBranch className="size-5 text-primary" />
            <h3 className="font-semibold text-lg">3NF Normalized Relational Schema</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            The schema comprises 8 strictly normalized tables adhering to Boyce-Codd Normal Form (BCNF):
          </p>
          <ul className="space-y-2.5 text-xs text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>users:</strong> Master directory (<code className="font-mono">user_id PK</code>, roles: STUDENT, EMPLOYEE, ADMIN, FACULTY).</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>venues:</strong> Campus facilities (<code className="font-mono">venue_id PK</code>, capacity &gt; 0, status).</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>employees:</strong> Extends users 1:1 via <code className="font-mono">user_id UNIQUE FK</code>.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>venue_authority:</strong> Resolves $N:M$ relationship between staff and venues with composite unique constraint <code className="font-mono">(employee_id, venue_id)</code>.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>bookings:</strong> Event reservations with B-Tree lookup index on <code className="font-mono">(venue_id, event_date, status, start_time, end_time)</code>.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>approvals, notifications, audit_logs:</strong> Complete tamper-evident audit ledger and workflow tracking.</span>
            </li>
          </ul>

          <div className="mt-4 pt-4 border-t border-border">
            <h4 className="font-semibold text-xs text-foreground mb-2">Relational Cardinalities:</h4>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-muted-foreground">
              <div className="p-2 rounded-lg bg-muted/30">1:1 users ↔ employees</div>
              <div className="p-2 rounded-lg bg-muted/30">1:N venues ↔ bookings</div>
              <div className="p-2 rounded-lg bg-muted/30">1:N users ↔ bookings</div>
              <div className="p-2 rounded-lg bg-muted/30">N:M employees ↔ venues</div>
            </div>
          </div>
        </div>

        {/* Anomaly Elimination Card */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="size-5 text-emerald-500" />
            <h3 className="font-semibold text-lg">Elimination of Relational Anomalies (3NF)</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            How 3NF decomposition prevents data anomalies in campus operations:
          </p>

          <div className="space-y-3 text-xs">
            <div className="rounded-xl border border-border bg-muted/20 p-3">
              <strong className="text-primary block font-semibold">1. Insertion Anomaly Eliminated</strong>
              <span className="text-muted-foreground">
                You can add a new venue to the <code className="font-mono">venues</code> table immediately without needing to assign an employee approver yet, because authorities are separated into <code className="font-mono">venue_authority</code>.
              </span>
            </div>
            <div className="rounded-xl border border-border bg-muted/20 p-3">
              <strong className="text-primary block font-semibold">2. Deletion Anomaly Eliminated</strong>
              <span className="text-muted-foreground">
                Removing or retiring an employee profile does not accidentally wipe out the venue record or historical bookings. Foreign key cascades handle cleanup gracefully.
              </span>
            </div>
            <div className="rounded-xl border border-border bg-muted/20 p-3">
              <strong className="text-primary block font-semibold">3. Update Anomaly Eliminated</strong>
              <span className="text-muted-foreground">
                Modifying a venue&apos;s seating capacity or physical location requires updating exactly <strong>1 single row</strong> in <code className="font-mono">venues</code>, avoiding inconsistent duplicate copies across booking records.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 4: ACID Transactions & Concurrency Contract */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-2 border-b border-border pb-4 mb-4">
          <ShieldCheck className="size-5 text-primary" />
          <h2 className="text-lg font-semibold">PostgreSQL ACID Transaction Contract</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="rounded-xl border border-border bg-muted/20 p-4">
            <strong className="text-primary block font-semibold text-sm">Atomicity</strong>
            <p className="text-muted-foreground mt-1">
              <code className="font-mono">prisma.$transaction()</code> wraps booking creation, notification insertion, and audit logging into a single boundary. If any step fails, all operations rollback cleanly.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-muted/20 p-4">
            <strong className="text-primary block font-semibold text-sm">Consistency</strong>
            <p className="text-muted-foreground mt-1">
              Check constraints (<code className="font-mono">capacity &gt; 0</code>), foreign key cascades, time order (<code className="font-mono">start_time &lt; end_time</code>), and non-overlap queries guarantee no invalid state ever commits.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-muted/20 p-4">
            <strong className="text-primary block font-semibold text-sm">Isolation</strong>
            <p className="text-muted-foreground mt-1">
              Pessimistic row locking (<code className="font-mono">SELECT ... FOR UPDATE</code>) serializes concurrent transactions on the same venue row, eliminating dirty reads and lost updates.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-muted/20 p-4">
            <strong className="text-primary block font-semibold text-sm">Durability</strong>
            <p className="text-muted-foreground mt-1">
              PostgreSQL Write-Ahead Logging (WAL) ensures every committed transaction is flushed to persistent disk before acknowledging HTTP 201 to the client.
            </p>
          </div>
        </div>
      </div>

      {/* Section 5: Expected Viva Questions & Model Answers */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
          <div className="flex items-center gap-2">
            <HelpCircle className="size-5 text-primary" />
            <h2 className="text-lg font-semibold">Expected Viva Questions & Model Answers (Defense Guide)</h2>
          </div>
          <span className="text-xs text-muted-foreground font-mono">Quick Reference for Examiners</span>
        </div>

        <div className="space-y-3">
          {VIVA_QUESTIONS.map((item, idx) => {
            const isOpen = expandedViva === idx
            return (
              <div
                key={idx}
                className="rounded-xl border border-border bg-muted/20 overflow-hidden transition-all"
              >
                <button
                  onClick={() => setExpandedViva(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between p-4 text-left text-xs font-semibold hover:bg-muted/40 transition-colors"
                >
                  <span className="text-foreground">{item.q}</span>
                  {isOpen ? <ChevronDown className="size-4 shrink-0 text-primary" /> : <ChevronRight className="size-4 shrink-0 text-muted-foreground" />}
                </button>
                {isOpen && (
                  <div className="p-4 pt-0 text-xs text-muted-foreground leading-relaxed border-t border-border/40 bg-card/50">
                    <strong className="text-primary block mb-1">Model Answer:</strong>
                    {item.a}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Section 6: PostgreSQL Crash Recovery & Write-Ahead Logging (WAL / ARIES) */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-primary" />
              <h3 className="font-semibold text-lg">PostgreSQL Crash Recovery & Write-Ahead Logging (WAL)</h3>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              <strong>WAL Protocol:</strong> No database page is written to persistent disk until the corresponding log record is flushed.
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
      </div>
    </div>
  )
}
