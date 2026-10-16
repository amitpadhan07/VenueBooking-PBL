'use client'

import { useState, useMemo } from 'react'
import {
  BankersState,
  PRESET_BANKERS_SCENARIOS,
  runBankersSafety,
  evaluateResourceRequest,
  RequestEvaluationResult,
} from '@/lib/os/bankers'
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Layers,
  HelpCircle,
} from 'lucide-react'

export default function BankersAlgorithmSimulator() {
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0)
  const [state, setState] = useState<BankersState>(PRESET_BANKERS_SCENARIOS[0].state)

  // Resource Request Testing State
  const [selectedProcessIdx, setSelectedProcessIdx] = useState(1) // Default to P1
  const [requestInput, setRequestInput] = useState<number[]>([1, 0, 0])
  const [requestResult, setRequestResult] = useState<RequestEvaluationResult | null>(null)

  const activePreset = PRESET_BANKERS_SCENARIOS[selectedPresetIndex]

  const safetyResult = useMemo(() => {
    return runBankersSafety(state)
  }, [state])

  const handleSelectPreset = (idx: number) => {
    setSelectedPresetIndex(idx)
    const preset = PRESET_BANKERS_SCENARIOS[idx]
    setState(preset.state)
    setRequestInput(new Array(preset.state.resourceNames.length).fill(0))
    setRequestResult(null)
  }

  const handleTestRequest = () => {
    const result = evaluateResourceRequest(state, selectedProcessIdx, requestInput)
    setRequestResult(result)
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
        <div className="flex items-center gap-2 text-primary font-semibold">
          <ShieldCheck className="size-5" />
          <span>Dijkstra’s Banker’s Algorithm: Deadlock Avoidance & Safety Verification</span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Banker’s Algorithm tests for safety by simulating the allocation of predetermined maximum possible resources 
          before deciding whether an incoming venue reservation request can be granted without leading to deadlock.
        </p>
      </div>

      {/* Preset Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap gap-2">
          {PRESET_BANKERS_SCENARIOS.map((preset, idx) => (
            <button
              key={preset.id}
              onClick={() => handleSelectPreset(idx)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                selectedPresetIndex === idx
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {preset.title}
            </button>
          ))}
        </div>
        <button
          onClick={() => handleSelectPreset(selectedPresetIndex)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
        >
          <RotateCcw className="size-3.5" />
          <span>Reset Matrix</span>
        </button>
      </div>

      {/* Core Matrices: Allocation, Max, Need, Available */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Allocation Matrix */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3 border-b border-border pb-2">
            <span className="font-semibold text-xs uppercase tracking-wider text-primary">Allocation Matrix</span>
            <span className="text-[10px] text-muted-foreground">[n × m]</span>
          </div>
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="pb-1.5">Proc</th>
                {state.resourceNames.map((r, j) => (
                  <th key={j} className="pb-1.5 text-center">{r.split(':')[0]}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {state.allocation.map((row, i) => (
                <tr key={i} className="hover:bg-muted/30">
                  <td className="py-1.5 font-bold text-foreground">{state.processNames[i].split(':')[0]}</td>
                  {row.map((val, j) => (
                    <td key={j} className="py-1.5 text-center text-muted-foreground">{val}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Max Matrix */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3 border-b border-border pb-2">
            <span className="font-semibold text-xs uppercase tracking-wider text-primary">Max Matrix</span>
            <span className="text-[10px] text-muted-foreground">[n × m]</span>
          </div>
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="pb-1.5">Proc</th>
                {state.resourceNames.map((r, j) => (
                  <th key={j} className="pb-1.5 text-center">{r.split(':')[0]}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {state.max.map((row, i) => (
                <tr key={i} className="hover:bg-muted/30">
                  <td className="py-1.5 font-bold text-foreground">{state.processNames[i].split(':')[0]}</td>
                  {row.map((val, j) => (
                    <td key={j} className="py-1.5 text-center text-muted-foreground">{val}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Need Matrix (Calculated) */}
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3 border-b border-primary/20 pb-2">
            <span className="font-semibold text-xs uppercase tracking-wider text-primary">Need Matrix (Max - Alloc)</span>
            <span className="text-[10px] text-primary font-bold">Auto</span>
          </div>
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-primary/20 text-muted-foreground">
                <th className="pb-1.5">Proc</th>
                {state.resourceNames.map((r, j) => (
                  <th key={j} className="pb-1.5 text-center">{r.split(':')[0]}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/10">
              {safetyResult.needMatrix.map((row, i) => (
                <tr key={i} className="hover:bg-primary/10">
                  <td className="py-1.5 font-bold text-foreground">{state.processNames[i].split(':')[0]}</td>
                  {row.map((val, j) => (
                    <td key={j} className="py-1.5 text-center font-bold text-primary">{val}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Available Vector & Totals */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-border pb-2">
              <span className="font-semibold text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Available Vector
              </span>
              <span className="text-[10px] text-muted-foreground">[1 × m]</span>
            </div>
            <div className="space-y-2">
              {state.resourceNames.map((res, j) => (
                <div key={j} className="flex items-center justify-between text-xs p-1.5 rounded bg-muted/40 font-mono">
                  <span className="font-semibold text-foreground">{res}</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                    {state.available[j]} <span className="text-[10px] text-muted-foreground font-normal">/ {state.totalResources[j]}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-2 border-t border-border text-[11px] text-muted-foreground">
            $\text{Available}[j] = \text{Total}[j] - \sum \text{Alloc}[i][j]$
          </div>
        </div>
      </div>

      {/* Safety Execution Log & Sequence */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Step-by-Step Execution */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
            <div>
              <h3 className="font-semibold text-base">Safety Algorithm Step-by-Step Walkthrough</h3>
              <p className="text-xs text-muted-foreground">Simulating resource release as processes safely complete</p>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                safetyResult.isSafe
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
              }`}
            >
              {safetyResult.isSafe ? (
                <>
                  <CheckCircle2 className="size-3.5" />
                  <span>SAFE STATE</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="size-3.5" />
                  <span>UNSAFE STATE</span>
                </>
              )}
            </span>
          </div>

          <div className="space-y-3">
            {safetyResult.steps.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                No process can be satisfied with the currently available vector. System deadlocks immediately.
              </div>
            ) : (
              safetyResult.steps.map((st) => (
                <div key={st.step} className="rounded-xl border border-border bg-muted/20 p-3.5 text-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-primary flex items-center gap-1.5">
                      <span className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px]">
                        {st.step}
                      </span>
                      <span>Process {st.processName} can finish</span>
                    </span>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      Work: [{st.workBefore.join(', ')}] ➔ [{st.workAfter.join(', ')}]
                    </span>
                  </div>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">{st.description}</p>
                </div>
              ))
            )}
          </div>

          {/* Safe Sequence Banner */}
          {safetyResult.isSafe && (
            <div className="mt-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
              <p className="text-[11px] uppercase font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                Computed Safe Execution Sequence:
              </p>
              <div className="flex flex-wrap items-center gap-2 font-mono font-bold text-sm text-foreground">
                {safetyResult.safeSequence.map((seq, idx) => (
                  <span key={idx} className="flex items-center gap-2">
                    <span className="rounded-lg bg-background px-3 py-1 border border-border shadow-sm text-primary">
                      {seq}
                    </span>
                    {idx < safetyResult.safeSequence.length - 1 && (
                      <ArrowRight className="size-4 text-muted-foreground" />
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Resource Request Simulator */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div className="border-b border-border pb-3">
            <h3 className="font-semibold text-base">Test Incoming Resource Request</h3>
            <p className="text-xs text-muted-foreground">Simulate Banker’s Algorithm deciding on a live booking request</p>
          </div>

          <div>
            <label className="text-xs font-medium block text-muted-foreground mb-1">Requesting Process / Event</label>
            <select
              value={selectedProcessIdx}
              onChange={(e) => {
                setSelectedProcessIdx(parseInt(e.target.value, 10))
                setRequestResult(null)
              }}
              className="w-full rounded-xl border border-input bg-background p-2.5 text-xs focus:ring-2 focus:ring-primary outline-none"
            >
              {state.processNames.map((name, i) => (
                <option key={i} value={i}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium block text-muted-foreground mb-1">
              Resource Request Vector ({state.resourceNames.map((r) => r.split(':')[0]).join(', ')})
            </label>
            <div className="grid grid-cols-3 gap-2">
              {state.resourceNames.map((res, j) => (
                <div key={j} className="text-center">
                  <span className="block text-[10px] text-muted-foreground mb-1 font-mono">{res.split(':')[0]}</span>
                  <input
                    type="number"
                    min="0"
                    value={requestInput[j] || 0}
                    onChange={(e) => {
                      const val = parseInt(e.target.value || '0', 10)
                      const next = [...requestInput]
                      next[j] = isNaN(val) ? 0 : val
                      setRequestInput(next)
                      setRequestResult(null)
                    }}
                    className="w-full rounded-lg border border-input bg-background p-2 text-center text-xs font-mono font-bold"
                  />
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleTestRequest}
            className="w-full rounded-xl bg-primary py-2.5 text-xs font-medium text-primary-foreground shadow hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <Play className="size-3.5" />
            <span>Evaluate Request with Banker's</span>
          </button>

          {requestResult && (
            <div
              className={`rounded-xl border p-4 text-xs transition-all ${
                requestResult.canGrant
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100'
                  : 'border-rose-500/40 bg-rose-500/10 text-rose-950 dark:text-rose-100'
              }`}
            >
              <div className="flex items-center gap-2 font-bold mb-1">
                {requestResult.canGrant ? (
                  <>
                    <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                    <span>REQUEST CAN BE SAFELY GRANTED</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="size-4 text-rose-600 dark:text-rose-400" />
                    <span>REQUEST REJECTED / MUST WAIT</span>
                  </>
                )}
              </div>
              <p className="text-[11px] leading-relaxed opacity-90">{requestResult.reason}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
