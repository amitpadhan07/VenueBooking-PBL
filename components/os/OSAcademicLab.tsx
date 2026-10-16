'use client'

import { useState } from 'react'
import ProcessSchedulerSimulator from '@/components/os/ProcessSchedulerSimulator'
import DeadlockSimulator from '@/components/os/DeadlockSimulator'
import BankersAlgorithmSimulator from '@/components/os/BankersAlgorithmSimulator'
import {
  CalendarClock,
  AlertOctagon,
  ShieldCheck,
  MonitorCog,
} from 'lucide-react'

export type OSTab = 'scheduling' | 'deadlock' | 'bankers'

export default function OSAcademicLab() {
  const [activeTab, setActiveTab] = useState<OSTab>('scheduling')

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-4">
        <button
          onClick={() => setActiveTab('scheduling')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
            activeTab === 'scheduling'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <CalendarClock className="size-4" />
          <span>CPU Process Scheduling & Gantt</span>
        </button>

        <button
          onClick={() => setActiveTab('deadlock')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
            activeTab === 'deadlock'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <AlertOctagon className="size-4" />
          <span>Deadlock Theory & RAG Cycles</span>
        </button>

        <button
          onClick={() => setActiveTab('bankers')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
            activeTab === 'bankers'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <ShieldCheck className="size-4" />
          <span>Banker’s Algorithm & Safety</span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'scheduling' && <ProcessSchedulerSimulator />}
      {activeTab === 'deadlock' && <DeadlockSimulator />}
      {activeTab === 'bankers' && <BankersAlgorithmSimulator />}
    </div>
  )
}
