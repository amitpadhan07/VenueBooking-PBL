export interface BankersState {
  processNames: string[]
  resourceNames: string[]
  totalResources: number[]
  allocation: number[][] // [n x m]
  max: number[][]        // [n x m]
  available: number[]    // [1 x m]
}

export interface StepRecord {
  step: number
  processIndex: number
  processName: string
  need: number[]
  workBefore: number[]
  allocated: number[]
  workAfter: number[]
  isCompleted: boolean
  description: string
}

export interface SafetyResult {
  isSafe: boolean
  safeSequence: string[]
  safeIndices: number[]
  needMatrix: number[][]
  steps: StepRecord[]
  message: string
}

export interface RequestEvaluationResult {
  canGrant: boolean
  reason: string
  isSafe: boolean
  safeSequence?: string[]
  trialNeed?: number[][]
  trialAvailable?: number[]
  trialAllocation?: number[][]
}

/**
 * Computes Need Matrix: Need[i][j] = Max[i][j] - Allocation[i][j]
 */
export function calculateNeedMatrix(max: number[][], allocation: number[][]): number[][] {
  return max.map((row, i) =>
    row.map((val, j) => Math.max(0, val - (allocation[i]?.[j] || 0)))
  )
}

/**
 * Execute Dijkstra's Banker's Safety Algorithm
 */
export function runBankersSafety(state: BankersState): SafetyResult {
  const n = state.processNames.length
  const m = state.resourceNames.length
  const need = calculateNeedMatrix(state.max, state.allocation)

  const work = [...state.available]
  const finish = new Array(n).fill(false)
  const safeSequence: string[] = []
  const safeIndices: number[] = []
  const steps: StepRecord[] = []

  let foundProcessInIteration = true
  let stepCounter = 1

  while (safeSequence.length < n && foundProcessInIteration) {
    foundProcessInIteration = false

    for (let i = 0; i < n; i++) {
      if (!finish[i]) {
        // Check if Need[i] <= Work for all resources
        const canSatisfy = need[i].every((demand, j) => demand <= work[j])

        if (canSatisfy) {
          const workBefore = [...work]
          for (let j = 0; j < m; j++) {
            work[j] += state.allocation[i][j]
          }
          finish[i] = true
          safeSequence.push(state.processNames[i])
          safeIndices.push(i)
          foundProcessInIteration = true

          steps.push({
            step: stepCounter++,
            processIndex: i,
            processName: state.processNames[i],
            need: [...need[i]],
            workBefore,
            allocated: [...state.allocation[i]],
            workAfter: [...work],
            isCompleted: true,
            description: `Need of ${state.processNames[i]} [${need[i].join(', ')}] ≤ Available [${workBefore.join(', ')}]. Granted! Upon release, New Available = [${work.join(', ')}].`,
          })
          break
        }
      }
    }
  }

  const isSafe = safeSequence.length === n

  return {
    isSafe,
    safeSequence,
    safeIndices,
    needMatrix: need,
    steps,
    message: isSafe
      ? `System is in a SAFE STATE! Safe execution sequence found: ⟨ ${safeSequence.join(' ➔ ')} ⟩. Deadlock is strictly avoided.`
      : `System is in an UNSAFE STATE! Available resources cannot satisfy remaining process demands. Deadlock could occur.`,
  }
}

/**
 * Evaluate if an incoming resource request from a process can be safely granted
 */
export function evaluateResourceRequest(
  state: BankersState,
  processIndex: number,
  request: number[]
): RequestEvaluationResult {
  const need = calculateNeedMatrix(state.max, state.allocation)
  const processName = state.processNames[processIndex] || `Process P${processIndex}`

  // Condition 1: Request <= Need
  for (let j = 0; j < request.length; j++) {
    if (request[j] > need[processIndex][j]) {
      return {
        canGrant: false,
        reason: `Error: Process ${processName} requested ${request[j]} of ${state.resourceNames[j]}, which exceeds its declared maximum need (${need[processIndex][j]}).`,
        isSafe: false,
      }
    }
  }

  // Condition 2: Request <= Available
  for (let j = 0; j < request.length; j++) {
    if (request[j] > state.available[j]) {
      return {
        canGrant: false,
        reason: `Wait: Process ${processName} requested ${request[j]} of ${state.resourceNames[j]}, but only ${state.available[j]} are currently available. Process must wait.`,
        isSafe: false,
      }
    }
  }

  // Speculative Allocation (Hypothetical State)
  const trialAvailable = state.available.map((val, j) => val - request[j])
  const trialAllocation = state.allocation.map((row, i) =>
    i === processIndex ? row.map((val, j) => val + request[j]) : [...row]
  )

  const trialState: BankersState = {
    ...state,
    available: trialAvailable,
    allocation: trialAllocation,
  }

  const safety = runBankersSafety(trialState)

  if (safety.isSafe) {
    return {
      canGrant: true,
      reason: `Request GRANTED! Simulating this allocation preserves a Safe State with safe sequence: ⟨ ${safety.safeSequence.join(' ➔ ')} ⟩.`,
      isSafe: true,
      safeSequence: safety.safeSequence,
      trialNeed: safety.needMatrix,
      trialAvailable,
      trialAllocation,
    }
  } else {
    return {
      canGrant: false,
      reason: `Request REJECTED by Banker's Algorithm! Granting this request would leave the system in an UNSAFE STATE where deadlock could occur. Process must wait.`,
      isSafe: false,
    }
  }
}

export const PRESET_BANKERS_SCENARIOS: {
  id: string
  title: string
  subtitle: string
  state: BankersState
}[] = [
  {
    id: 'akshat-defense-guide',
    title: 'Akshat Defense Guide: 3 Events & 3 Venue Types',
    subtitle: 'Auditorium (10), Seminar Hall (5), CS Lab (7) — Solves to Safe Sequence ⟨ P1, P0, P2 ⟩',
    state: {
      processNames: ['P0: Tech Fest (CS)', 'P1: Cultural Fest (Arts)', 'P2: Robotics Club (EE)'],
      resourceNames: ['A: Auditorium', 'B: Seminar Hall', 'C: CS Lab'],
      totalResources: [10, 5, 7],
      allocation: [
        [0, 1, 0], // P0
        [2, 0, 0], // P1
        [3, 0, 2], // P2
      ],
      max: [
        [7, 5, 3], // P0
        [3, 2, 2], // P1
        [9, 0, 2], // P2
      ],
      available: [5, 4, 5],
    },
  },
  {
    id: 'unsafe-deadlock-imminent',
    title: 'Unsafe System State (Deadlock Avoidance Active)',
    subtitle: 'Demonstrates Banker’s Algorithm flagging an unsafe state when demands exceed available reserves',
    state: {
      processNames: ['P0: Annual Sports Meet', 'P1: Hackathon 2026', 'P2: Alumni Gala'],
      resourceNames: ['A: Auditorium', 'B: Seminar Hall', 'C: CS Lab'],
      totalResources: [10, 5, 7],
      allocation: [
        [4, 2, 1],
        [3, 1, 3],
        [2, 1, 2],
      ],
      max: [
        [9, 5, 4],
        [6, 4, 5],
        [5, 4, 4],
      ],
      available: [1, 1, 1],
    },
  },
  {
    id: 'standard-5-process',
    title: 'Standard Textbook 5-Process Multi-Resource Benchmark',
    subtitle: 'Classic Silberschatz Operating Systems Benchmark with 5 processes and 3 resource types',
    state: {
      processNames: ['P0: Event Alpha', 'P1: Event Beta', 'P2: Event Gamma', 'P3: Event Delta', 'P4: Event Epsilon'],
      resourceNames: ['R1: Audio Gear', 'R2: Projectors', 'R3: Microphones'],
      totalResources: [10, 5, 7],
      allocation: [
        [0, 1, 0],
        [2, 0, 0],
        [3, 0, 2],
        [2, 1, 1],
        [0, 0, 2],
      ],
      max: [
        [7, 5, 3],
        [3, 2, 2],
        [9, 0, 2],
        [2, 2, 2],
        [4, 3, 3],
      ],
      available: [3, 3, 2],
    },
  },
]
