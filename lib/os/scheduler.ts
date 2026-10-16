export type Process = {
  id: string
  name: string
  arrivalTime: number
  burstTime: number
  priority: number // Lower number = Higher priority (1 is highest)
}

export type GanttSlice = {
  processId: string
  name: string
  startTime: number
  endTime: number
}

export type ProcessMetric = {
  id: string
  name: string
  arrivalTime: number
  burstTime: number
  priority: number
  completionTime: number
  turnaroundTime: number
  waitingTime: number
  responseTime: number
}

export type ScheduleResult = {
  algorithm: 'FCFS' | 'Priority' | 'Round Robin'
  timeQuantum?: number
  gantt: GanttSlice[]
  metrics: ProcessMetric[]
  avgWaitingTime: number
  avgTurnaroundTime: number
  avgResponseTime: number
  totalExecutionTime: number
}

export const PRESET_SCENARIOS: { label: string; description: string; processes: Process[] }[] = [
  {
    label: 'Campus Venue Request Queue',
    description: 'Real-world scenario of department bookings arriving at the scheduling portal.',
    processes: [
      { id: 'P1', name: 'Annual Convocation (Admin)', arrivalTime: 0, burstTime: 8, priority: 1 },
      { id: 'P2', name: 'ACM Hackathon (CS Dept)', arrivalTime: 1, burstTime: 4, priority: 2 },
      { id: 'P3', name: 'Faculty Senate Meet', arrivalTime: 2, burstTime: 2, priority: 1 },
      { id: 'P4', name: 'Robotics Workshop', arrivalTime: 3, burstTime: 5, priority: 3 },
      { id: 'P5', name: 'Student Club Rehearsal', arrivalTime: 4, burstTime: 3, priority: 4 },
    ],
  },
  {
    label: 'Convoy Effect Demonstration',
    description: 'A long process arrives first, forcing short processes to wait excessively under FCFS.',
    processes: [
      { id: 'P1', name: 'Mega Sports Fest', arrivalTime: 0, burstTime: 18, priority: 3 },
      { id: 'P2', name: 'Quick Guest Lecture', arrivalTime: 1, burstTime: 2, priority: 2 },
      { id: 'P3', name: 'Class Presentation', arrivalTime: 2, burstTime: 1, priority: 2 },
      { id: 'P4', name: 'Lab Practical Slot', arrivalTime: 3, burstTime: 2, priority: 1 },
    ],
  },
  {
    label: 'Standard Silberschatz Benchmark',
    description: 'Classic OS textbook exercise with varying arrivals and priorities.',
    processes: [
      { id: 'P1', name: 'Process 1', arrivalTime: 0, burstTime: 10, priority: 3 },
      { id: 'P2', name: 'Process 2', arrivalTime: 1, burstTime: 1, priority: 1 },
      { id: 'P3', name: 'Process 3', arrivalTime: 2, burstTime: 2, priority: 4 },
      { id: 'P4', name: 'Process 4', arrivalTime: 3, burstTime: 1, priority: 2 },
      { id: 'P5', name: 'Process 5', arrivalTime: 4, burstTime: 5, priority: 2 },
    ],
  },
]

// 1. First-Come, First-Served (FCFS)
export function runFCFS(inputProcesses: Process[]): ScheduleResult {
  const processes = [...inputProcesses].sort((a, b) => a.arrivalTime - b.arrivalTime)
  let currentTime = 0
  const gantt: GanttSlice[] = []
  const metricsMap = new Map<string, ProcessMetric>()

  for (const p of processes) {
    if (currentTime < p.arrivalTime) {
      // CPU/Venue Idle
      gantt.push({
        processId: 'IDLE',
        name: 'Idle Slot',
        startTime: currentTime,
        endTime: p.arrivalTime,
      })
      currentTime = p.arrivalTime
    }

    const startTime = currentTime
    const completionTime = startTime + p.burstTime
    currentTime = completionTime

    gantt.push({
      processId: p.id,
      name: p.name,
      startTime,
      endTime: completionTime,
    })

    const turnaroundTime = completionTime - p.arrivalTime
    const waitingTime = turnaroundTime - p.burstTime
    const responseTime = startTime - p.arrivalTime

    metricsMap.set(p.id, {
      ...p,
      completionTime,
      turnaroundTime,
      waitingTime,
      responseTime,
    })
  }

  const metrics = processes.map((p) => metricsMap.get(p.id)!)
  return aggregateMetrics('FCFS', gantt, metrics)
}

// 2. Non-Preemptive Priority Scheduling
export function runPriority(inputProcesses: Process[]): ScheduleResult {
  const remaining = [...inputProcesses]
  let currentTime = 0
  const gantt: GanttSlice[] = []
  const metrics: ProcessMetric[] = []

  while (remaining.length > 0) {
    const available = remaining.filter((p) => p.arrivalTime <= currentTime)

    if (available.length === 0) {
      // Find the next arriving process
      const nextArrival = Math.min(...remaining.map((p) => p.arrivalTime))
      gantt.push({
        processId: 'IDLE',
        name: 'Idle Slot',
        startTime: currentTime,
        endTime: nextArrival,
      })
      currentTime = nextArrival
      continue
    }

    // Pick highest priority (lowest numerical value)
    available.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority
      return a.arrivalTime - b.arrivalTime
    })

    const selected = available[0]
    const idx = remaining.findIndex((p) => p.id === selected.id)
    remaining.splice(idx, 1)

    const startTime = currentTime
    const completionTime = startTime + selected.burstTime
    currentTime = completionTime

    gantt.push({
      processId: selected.id,
      name: selected.name,
      startTime,
      endTime: completionTime,
    })

    const turnaroundTime = completionTime - selected.arrivalTime
    const waitingTime = turnaroundTime - selected.burstTime
    const responseTime = startTime - selected.arrivalTime

    metrics.push({
      ...selected,
      completionTime,
      turnaroundTime,
      waitingTime,
      responseTime,
    })
  }

  return aggregateMetrics('Priority', gantt, metrics)
}

// 3. Round Robin (RR)
export function runRoundRobin(inputProcesses: Process[], timeQuantum: number = 3): ScheduleResult {
  const processes = [...inputProcesses]
  const n = processes.length
  const remainingBurst = new Map<string, number>()
  const firstResponse = new Map<string, number>()
  const completionMap = new Map<string, number>()

  for (const p of processes) {
    remainingBurst.set(p.id, p.burstTime)
  }

  let currentTime = 0
  const gantt: GanttSlice[] = []
  const readyQueue: string[] = []
  const arrived = new Set<string>()

  // Helper to push arriving processes to ready queue
  const checkArrivals = (time: number) => {
    for (const p of processes) {
      if (p.arrivalTime <= time && !arrived.has(p.id)) {
        readyQueue.push(p.id)
        arrived.add(p.id)
      }
    }
  }

  checkArrivals(currentTime)

  while (readyQueue.length > 0 || arrived.size < n) {
    if (readyQueue.length === 0) {
      const unarrived = processes.filter((p) => !arrived.has(p.id))
      const nextArrival = Math.min(...unarrived.map((p) => p.arrivalTime))
      gantt.push({
        processId: 'IDLE',
        name: 'Idle Slot',
        startTime: currentTime,
        endTime: nextArrival,
      })
      currentTime = nextArrival
      checkArrivals(currentTime)
      continue
    }

    const currentId = readyQueue.shift()!
    const proc = processes.find((p) => p.id === currentId)!
    const currentRem = remainingBurst.get(currentId)!

    if (!firstResponse.has(currentId)) {
      firstResponse.set(currentId, currentTime - proc.arrivalTime)
    }

    const execTime = Math.min(timeQuantum, currentRem)
    const startTime = currentTime
    const endTime = startTime + execTime
    currentTime = endTime

    gantt.push({
      processId: proc.id,
      name: proc.name,
      startTime,
      endTime,
    })

    const newRem = currentRem - execTime
    remainingBurst.set(currentId, newRem)

    // Check for arrivals during this time slice
    checkArrivals(currentTime)

    if (newRem > 0) {
      readyQueue.push(currentId)
    } else {
      completionMap.set(currentId, currentTime)
    }
  }

  // Merge consecutive Gantt slices of the same process if applicable
  const compressedGantt: GanttSlice[] = []
  for (const slice of gantt) {
    const last = compressedGantt[compressedGantt.length - 1]
    if (last && last.processId === slice.processId) {
      last.endTime = slice.endTime
    } else {
      compressedGantt.push({ ...slice })
    }
  }

  const metrics: ProcessMetric[] = processes.map((p) => {
    const completionTime = completionMap.get(p.id) ?? 0
    const turnaroundTime = completionTime - p.arrivalTime
    const waitingTime = turnaroundTime - p.burstTime
    const responseTime = firstResponse.get(p.id) ?? 0
    return {
      ...p,
      completionTime,
      turnaroundTime,
      waitingTime,
      responseTime,
    }
  })

  return aggregateMetrics('Round Robin', compressedGantt, metrics, timeQuantum)
}

function aggregateMetrics(
  algorithm: 'FCFS' | 'Priority' | 'Round Robin',
  gantt: GanttSlice[],
  metrics: ProcessMetric[],
  timeQuantum?: number
): ScheduleResult {
  const n = metrics.length || 1
  const avgWaitingTime = Math.round((metrics.reduce((acc, m) => acc + m.waitingTime, 0) / n) * 100) / 100
  const avgTurnaroundTime = Math.round((metrics.reduce((acc, m) => acc + m.turnaroundTime, 0) / n) * 100) / 100
  const avgResponseTime = Math.round((metrics.reduce((acc, m) => acc + m.responseTime, 0) / n) * 100) / 100
  const totalExecutionTime = gantt.length ? gantt[gantt.length - 1].endTime : 0

  return {
    algorithm,
    timeQuantum,
    gantt,
    metrics,
    avgWaitingTime,
    avgTurnaroundTime,
    avgResponseTime,
    totalExecutionTime,
  }
}
