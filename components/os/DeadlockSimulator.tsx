'use client'

import { useState, useMemo } from 'react'
import {
  detectRAGDeadlock,
  PRESET_DEADLOCK_SCENARIOS,
  RAGGraph,
} from '@/lib/os/deadlock'
import {
  AlertOctagon,
  CheckCircle2,
  Lock,
  RefreshCw,
  ShieldAlert,
  ArrowRight,
  Layers,
  Sparkles,
} from 'lucide-react'

export default function DeadlockSimulator() {
  const [selectedScenarioIndex, setSelectedScenarioIndex] = useState(0)
  const [graph, setGraph] = useState<RAGGraph>(PRESET_DEADLOCK_SCENARIOS[0].graph)

  const activeScenario = PRESET_DEADLOCK_SCENARIOS[selectedScenarioIndex]

  const detection = useMemo(() => {
    return detectRAGDeadlock(graph)
  }, [graph])

  const handleSelectScenario = (idx: number) => {
    setSelectedScenarioIndex(idx)
    setGraph(PRESET_DEADLOCK_SCENARIOS[idx].graph)
  }

  // Resolve deadlock by breaking Circular Wait (revoking request edge e4)
  const breakCircularWait = () => {
    setGraph((prev) => ({
      ...prev,
      edges: prev.edges.filter((e) => e.type !== 'REQUEST' || e.from !== 'P2'),
    }))
  }

  // Resolve deadlock by breaking Hold and Wait (releasing held resource R2 before requesting)
  const breakHoldAndWait = () => {
    setGraph((prev) => ({
      ...prev,
      edges: prev.edges.filter((e) => !(e.from === 'R2' && e.to === 'P2')),
    }))
  }

  const resetCurrentScenario = () => {
    setGraph(PRESET_DEADLOCK_SCENARIOS[selectedScenarioIndex].graph)
  }

  return (
    <div className="space-y-6">
      {/* Top Banner: Academic Summary */}
      <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-5">
        <div className="flex items-center gap-2 text-destructive font-semibold">
          <AlertOctagon className="size-5" />
          <span>Deadlock Theory & The 4 Necessary Coffman Conditions</span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          In operating systems and concurrent venue booking, a <strong>Deadlock</strong> occurs when processes acquire resources 
          and enter a state of indefinite blocking because of mutual cyclic dependencies.
        </p>
      </div>

      {/* The 4 Coffman Conditions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-primary font-semibold text-sm mb-1">
            <Lock className="size-4" />
            <span>1. Mutual Exclusion</span>
          </div>
          <p className="text-xs text-muted-foreground">
            A venue cannot be shared by two conflicting events at the same time slot. Only one process holds the lock.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-primary font-semibold text-sm mb-1">
            <Layers className="size-4" />
            <span>2. Hold and Wait</span>
          </div>
          <p className="text-xs text-muted-foreground">
            A process holds an allocated venue (e.g., Auditorium) while waiting to acquire an additional venue (e.g., Seminar Hall).
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-primary font-semibold text-sm mb-1">
            <ShieldAlert className="size-4" />
            <span>3. No Preemption</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Allocated venue reservations cannot be forcibly taken away; they can only be released voluntarily by the department.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-rose-500 font-semibold text-sm mb-1">
            <AlertOctagon className="size-4" />
            <span>4. Circular Wait</span>
          </div>
          <p className="text-xs text-muted-foreground">
            A closed chain of events exists where $P_1$ holds $R_1$ waiting for $R_2$, while $P_2$ holds $R_2$ waiting for $R_1$.
          </p>
        </div>
      </div>

      {/* Preset Scenario Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap gap-2">
          {PRESET_DEADLOCK_SCENARIOS.map((scenario, idx) => (
            <button
              key={scenario.id}
              onClick={() => handleSelectScenario(idx)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                selectedScenarioIndex === idx
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {scenario.label}
            </button>
          ))}
        </div>
        <button
          onClick={resetCurrentScenario}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
        >
          <RefreshCw className="size-3.5" />
          <span>Reset Scenario</span>
        </button>
      </div>

      {/* Graph Visualizer & State Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visual Graph Representation */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
            <div>
              <h3 className="font-semibold text-base">Resource Allocation Graph (RAG)</h3>
              <p className="text-xs text-muted-foreground">Directed bipartite graph $G = (V, E)$</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                <span className="size-2 rounded-full bg-emerald-500"></span> Assignment Edge (R ➔ P)
              </span>
              <span className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                <span className="size-2 rounded-full bg-amber-500"></span> Request Edge (P ➔ R)
              </span>
            </div>
          </div>

          {/* Graph Nodes Visual Area */}
          <div className="relative min-h-[300px] rounded-xl border border-dashed border-border bg-muted/10 p-6 flex flex-col justify-around gap-8">
            {/* Resources Row */}
            <div>
              <p className="text-[11px] uppercase font-bold tracking-wider text-muted-foreground mb-3">Resource Nodes (Venues)</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {graph.resources.map((res) => {
                  const isCycleMember = detection.cycleNodes.includes(res.id)
                  return (
                    <div
                      key={res.id}
                      className={`rounded-xl border p-4 transition-all shadow-sm ${
                        isCycleMember
                          ? 'border-rose-500/80 bg-rose-500/10 ring-2 ring-rose-500/30'
                          : 'border-border bg-card'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-mono font-bold text-primary">{res.id}</span>
                        <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono">1 Instance</span>
                      </div>
                      <p className="font-semibold text-sm">{res.name}</p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Edge Direction Arrows Preview */}
            <div className="rounded-xl border border-border bg-background/80 p-3">
              <p className="text-[11px] uppercase font-bold tracking-wider text-muted-foreground mb-2">Active Edges in Graph:</p>
              <div className="flex flex-wrap gap-2 text-xs">
                {graph.edges.map((edge) => {
                  const isCycleEdge = detection.cycleEdges.includes(edge.id)
                  const fromNode = [...graph.processes, ...graph.resources].find((n) => n.id === edge.from)
                  const toNode = [...graph.processes, ...graph.resources].find((n) => n.id === edge.to)
                  return (
                    <span
                      key={edge.id}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-mono text-[11px] border ${
                        isCycleEdge
                          ? 'border-rose-500 bg-rose-500/20 text-rose-700 dark:text-rose-300 font-bold animate-pulse'
                          : edge.type === 'ASSIGNMENT'
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      <span>{fromNode?.name || edge.from}</span>
                      <ArrowRight className="size-3" />
                      <span>{toNode?.name || edge.to}</span>
                      <span className="text-[9px] uppercase opacity-70 font-sans">({edge.type})</span>
                    </span>
                  )
                })}
              </div>
            </div>

            {/* Processes Row */}
            <div>
              <p className="text-[11px] uppercase font-bold tracking-wider text-muted-foreground mb-3">Process Nodes (Campus Events)</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {graph.processes.map((proc) => {
                  const isCycleMember = detection.cycleNodes.includes(proc.id)
                  return (
                    <div
                      key={proc.id}
                      className={`rounded-xl border p-4 transition-all shadow-sm ${
                        isCycleMember
                          ? 'border-rose-500/80 bg-rose-500/10 ring-2 ring-rose-500/30'
                          : 'border-border bg-card'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-mono font-bold text-primary">{proc.id}</span>
                        <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono">Process</span>
                      </div>
                      <p className="font-semibold text-sm">{proc.name}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Cycle Detection & Resolution Controls */}
        <div className="space-y-4">
          {/* Status Box */}
          <div
            className={`rounded-2xl border p-5 transition-all ${
              detection.hasDeadlock
                ? 'border-rose-500/40 bg-rose-500/10 text-rose-900 dark:text-rose-100'
                : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100'
            }`}
          >
            <div className="flex items-center gap-2.5 font-bold text-base mb-2">
              {detection.hasDeadlock ? (
                <>
                  <AlertOctagon className="size-5 text-rose-600 dark:text-rose-400" />
                  <span>DEADLOCK DETECTED!</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />
                  <span>NO DEADLOCK (SAFE STATE)</span>
                </>
              )}
            </div>
            <p className="text-xs leading-relaxed opacity-90">{detection.explanation}</p>
          </div>

          {/* Academic Theorem Highlight */}
          <div className="rounded-xl border border-border bg-card p-4 text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-primary">
              <Sparkles className="size-4" />
              <span>Theoretical Theorem</span>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              If the Resource Allocation Graph contains <strong>no cycles</strong>, the system is <strong>not in deadlock</strong>. 
              Because campus venues represent single-instance resources ($W_j = 1$), a directed cycle is both a necessary 
              and <strong>sufficient</strong> condition for deadlock.
            </p>
          </div>

          {/* Deadlock Elimination Actions */}
          {detection.hasDeadlock && (
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <p className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                Eliminate a Coffman Condition:
              </p>
              <button
                onClick={breakCircularWait}
                className="w-full rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground shadow hover:opacity-90 transition-opacity text-left flex items-center justify-between"
              >
                <span>Break Circular Wait</span>
                <span className="text-[10px] opacity-80">(Cancel Event 2 Request)</span>
              </button>
              <button
                onClick={breakHoldAndWait}
                className="w-full rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-muted transition-colors text-left flex items-center justify-between"
              >
                <span>Break Hold and Wait</span>
                <span className="text-[10px] text-muted-foreground">(Release Seminar Hall)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
