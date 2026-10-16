'use client'

import { useState, useMemo } from 'react'
import {
  Process,
  ScheduleResult,
  PRESET_SCENARIOS,
  runFCFS,
  runPriority,
  runRoundRobin,
} from '@/lib/os/scheduler'
import {
  Play,
  RotateCcw,
  Plus,
  Trash2,
  Clock,
  Layers,
  ArrowRight,
  Sparkles,
  BarChart2,
  Info,
} from 'lucide-react'

const PROCESS_COLORS: Record<string, string> = {
  P1: 'bg-blue-500/80 border-blue-600 text-white',
  P2: 'bg-emerald-500/80 border-emerald-600 text-white',
  P3: 'bg-purple-500/80 border-purple-600 text-white',
  P4: 'bg-amber-500/80 border-amber-600 text-white',
  P5: 'bg-rose-500/80 border-rose-600 text-white',
  P6: 'bg-teal-500/80 border-teal-600 text-white',
  IDLE: 'bg-muted border-border text-muted-foreground dashed',
}

export default function ProcessSchedulerSimulator() {
  const [processes, setProcesses] = useState<Process[]>(PRESET_SCENARIOS[0].processes)
  const [algorithm, setAlgorithm] = useState<'FCFS' | 'Priority' | 'Round Robin'>('FCFS')
  const [timeQuantum, setTimeQuantum] = useState<number>(3)
  const [newProcess, setNewProcess] = useState({ name: '', arrivalTime: 0, burstTime: 3, priority: 2 })

  // Compute schedule automatically based on algorithm and inputs
  const result: ScheduleResult = useMemo(() => {
    if (!processes.length) {
      return {
        algorithm,
        gantt: [],
        metrics: [],
        avgWaitingTime: 0,
        avgTurnaroundTime: 0,
        avgResponseTime: 0,
        totalExecutionTime: 0,
      }
    }
    if (algorithm === 'FCFS') return runFCFS(processes)
    if (algorithm === 'Priority') return runPriority(processes)
    return runRoundRobin(processes, timeQuantum)
  }, [processes, algorithm, timeQuantum])

  const loadPreset = (index: number) => {
    setProcesses(PRESET_SCENARIOS[index].processes)
  }

  const addProcess = () => {
    if (!newProcess.name.trim()) return
    const id = `P${processes.length + 1}`
    setProcesses([
      ...processes,
      {
        id,
        name: newProcess.name.trim(),
        arrivalTime: Number(newProcess.arrivalTime) || 0,
        burstTime: Math.max(1, Number(newProcess.burstTime) || 1),
        priority: Math.max(1, Number(newProcess.priority) || 1),
      },
    ])
    setNewProcess({ name: '', arrivalTime: 0, burstTime: 3, priority: 2 })
  }

  const removeProcess = (id: string) => {
    setProcesses(processes.filter((p) => p.id !== id))
  }

  return (
    <div className="space-y-6">
      {/* Header with PBL Conceptual Link */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
        <div className="flex items-center gap-2 text-primary font-semibold">
          <Sparkles className="size-5" />
          <span>OS Process Management ↔ Campus Venue Scheduling Link</span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          In this PBL project, competing campus venue booking requests are modeled as <strong>OS processes</strong> entering a 
          ready queue. The scheduler resolves resource conflicts using CPU scheduling policies: <strong>FCFS</strong> (chronological booking), 
          <strong>Priority Scheduling</strong> (VIP/Dean events preempting club activities), and <strong>Round Robin</strong> (fair time-sharing of slots).
        </p>
      </div>

      {/* Preset Scenarios Selector */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mr-1">
          Preset Scenarios:
        </span>
        {PRESET_SCENARIOS.map((preset, idx) => (
          <button
            key={preset.label}
            onClick={() => loadPreset(idx)}
            className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-medium hover:border-primary hover:text-primary transition-colors"
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Control Bar: Algorithm selection & parameters */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">Algorithm:</span>
          {(['FCFS', 'Priority', 'Round Robin'] as const).map((algo) => (
            <button
              key={algo}
              onClick={() => setAlgorithm(algo)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                algorithm === algo
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {algo}
            </button>
          ))}
        </div>

        {algorithm === 'Round Robin' && (
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Time Quantum ($TQ$):</span>
            <input
              type="number"
              min="1"
              max="10"
              value={timeQuantum}
              onChange={(e) => setTimeQuantum(Math.max(1, Number(e.target.value) || 1))}
              className="w-16 rounded-xl border border-input bg-background p-2 text-center text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        )}
      </div>

      {/* Visual Gantt Chart */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart2 className="size-5 text-primary" />
            <h3 className="font-semibold text-lg">Execution Gantt Chart</h3>
          </div>
          <span className="text-xs text-muted-foreground">
            Makespan: <strong>{result.totalExecutionTime} units</strong>
          </span>
        </div>

        {result.gantt.length === 0 ? (
          <p className="text-sm text-muted-foreground">No processes to schedule.</p>
        ) : (
          <div className="space-y-2">
            {/* Horizontal Timeline Bar */}
            <div className="flex w-full overflow-x-auto rounded-xl border border-border bg-muted/30 p-1 min-h-[64px]">
              {result.gantt.map((slice, i) => {
                const duration = slice.endTime - slice.startTime
                const flexBasis = Math.max(duration * 28, 48)
                const colorClass = PROCESS_COLORS[slice.processId] || 'bg-slate-700 text-white'

                return (
                  <div
                    key={`${slice.processId}-${slice.startTime}-${i}`}
                    style={{ flexGrow: duration, minWidth: `${flexBasis}px` }}
                    className={`flex flex-col items-center justify-center rounded-lg border p-2 text-center transition-transform hover:scale-[1.02] ${colorClass}`}
                    title={`${slice.name} (${slice.processId}): ${slice.startTime} -> ${slice.endTime}`}
                  >
                    <span className="text-xs font-bold leading-tight truncate w-full">
                      {slice.processId}
                    </span>
                    <span className="text-[10px] opacity-85 leading-tight truncate w-full">
                      {slice.name}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Time Ticks */}
            <div className="flex w-full justify-between px-1 text-[11px] text-muted-foreground font-mono">
              <span>0</span>
              {result.gantt.map((slice, i) => (
                <span key={`tick-${i}`}>{slice.endTime}</span>
              ))}
            </div>
          </div>
        )}

        {/* Aggregate Performance Metrics */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-border bg-muted/40 p-3 text-center">
            <p className="text-xs text-muted-foreground">Avg Waiting Time</p>
            <p className="text-xl font-bold text-primary mt-0.5">{result.avgWaitingTime} <span className="text-xs font-normal">units</span></p>
          </div>
          <div className="rounded-xl border border-border bg-muted/40 p-3 text-center">
            <p className="text-xs text-muted-foreground">Avg Turnaround Time</p>
            <p className="text-xl font-bold text-primary mt-0.5">{result.avgTurnaroundTime} <span className="text-xs font-normal">units</span></p>
          </div>
          <div className="rounded-xl border border-border bg-muted/40 p-3 text-center">
            <p className="text-xs text-muted-foreground">Avg Response Time</p>
            <p className="text-xl font-bold text-primary mt-0.5">{result.avgResponseTime} <span className="text-xs font-normal">units</span></p>
          </div>
          <div className="rounded-xl border border-border bg-muted/40 p-3 text-center">
            <p className="text-xs text-muted-foreground">Throughput</p>
            <p className="text-xl font-bold text-primary mt-0.5">
              {result.totalExecutionTime > 0
                ? (processes.length / result.totalExecutionTime).toFixed(2)
                : '0.00'}{' '}
              <span className="text-xs font-normal">jobs/unit</span>
            </p>
          </div>
        </div>
      </div>

      {/* Process Metrics Detailed Table */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h3 className="font-semibold text-lg mb-4">Detailed Process Schedule Metrics</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
              <tr>
                <th className="p-3">PID</th>
                <th className="p-3">Event / Process Name</th>
                <th className="p-3">Arrival ($AT$)</th>
                <th className="p-3">Burst ($BT$)</th>
                <th className="p-3">Priority</th>
                <th className="p-3">Completion ($CT$)</th>
                <th className="p-3">Turnaround ($TAT$)</th>
                <th className="p-3">Waiting ($WT$)</th>
                <th className="p-3">Response ($RT$)</th>
              </tr>
            </thead>
            <tbody>
              {result.metrics.map((m) => (
                <tr key={m.id} className="border-b border-border/70 hover:bg-muted/30">
                  <td className="p-3 font-bold font-mono text-primary">{m.id}</td>
                  <td className="p-3 font-medium">{m.name}</td>
                  <td className="p-3">{m.arrivalTime}</td>
                  <td className="p-3">{m.burstTime}</td>
                  <td className="p-3">
                    <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-semibold">
                      {m.priority}
                    </span>
                  </td>
                  <td className="p-3 font-semibold">{m.completionTime}</td>
                  <td className="p-3 font-semibold">{m.turnaroundTime}</td>
                  <td className="p-3 text-amber-600 dark:text-amber-400 font-semibold">{m.waitingTime}</td>
                  <td className="p-3">{m.responseTime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Input Builder: Add New Custom Process */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h3 className="font-semibold text-lg mb-3">Add Custom Process to Queue</h3>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          <input
            placeholder="Event Name (e.g. Dean Meeting)"
            value={newProcess.name}
            onChange={(e) => setNewProcess({ ...newProcess, name: e.target.value })}
            className="sm:col-span-2 rounded-xl border border-input bg-background p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            type="number"
            placeholder="Arrival Time"
            value={newProcess.arrivalTime}
            onChange={(e) => setNewProcess({ ...newProcess, arrivalTime: Number(e.target.value) })}
            className="rounded-xl border border-input bg-background p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            type="number"
            placeholder="Burst Time"
            min="1"
            value={newProcess.burstTime}
            onChange={(e) => setNewProcess({ ...newProcess, burstTime: Number(e.target.value) })}
            className="rounded-xl border border-input bg-background p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            type="number"
            placeholder="Priority (1=High)"
            min="1"
            value={newProcess.priority}
            onChange={(e) => setNewProcess({ ...newProcess, priority: Number(e.target.value) })}
            className="rounded-xl border border-input bg-background p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={addProcess}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:opacity-90"
          >
            <Plus className="size-4" /> Add Process
          </button>
        </div>
      </div>
    </div>
  )
}
