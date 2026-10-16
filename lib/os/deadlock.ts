export interface RAGNode {
  id: string
  name: string
  type: 'PROCESS' | 'RESOURCE'
  instances?: number
}

export interface RAGEdge {
  id: string
  from: string // Node ID
  to: string   // Node ID
  type: 'ASSIGNMENT' | 'REQUEST' // ASSIGNMENT: Resource -> Process; REQUEST: Process -> Resource
}

export interface RAGGraph {
  processes: RAGNode[]
  resources: RAGNode[]
  edges: RAGEdge[]
}

export interface CycleDetectionResult {
  hasDeadlock: boolean
  hasCycle: boolean
  cycleNodes: string[]
  cycleEdges: string[]
  explanation: string
}

/**
 * Detect cycles in Resource Allocation Graph using Depth-First Search (DFS)
 * For single-instance resources, Cycle <=> Deadlock
 */
export function detectRAGDeadlock(graph: RAGGraph): CycleDetectionResult {
  const adj = new Map<string, string[]>()
  const allNodeIds = [
    ...graph.processes.map((p) => p.id),
    ...graph.resources.map((r) => r.id),
  ]

  allNodeIds.forEach((id) => adj.set(id, []))

  graph.edges.forEach((edge) => {
    const list = adj.get(edge.from) || []
    list.push(edge.to)
    adj.set(edge.from, list)
  })

  // DFS cycle detection with state tracking (0: unvisited, 1: visiting, 2: visited)
  const state = new Map<string, number>()
  const parent = new Map<string, string | null>()
  allNodeIds.forEach((id) => state.set(id, 0))

  let cycleFound: string[] = []

  function dfs(u: string, path: string[]): boolean {
    state.set(u, 1)
    const neighbors = adj.get(u) || []

    for (const v of neighbors) {
      if (state.get(v) === 1) {
        // Cycle detected
        const cycleStartIndex = path.indexOf(v)
        if (cycleStartIndex !== -1) {
          cycleFound = [...path.slice(cycleStartIndex), v]
        } else {
          cycleFound = [v, u, v]
        }
        return true
      }
      if (state.get(v) === 0) {
        parent.set(v, u)
        if (dfs(v, [...path, v])) return true
      }
    }

    state.set(u, 2)
    return false
  }

  for (const nodeId of allNodeIds) {
    if (state.get(nodeId) === 0) {
      if (dfs(nodeId, [nodeId])) break
    }
  }

  if (cycleFound.length > 0) {
    const cycleEdges: string[] = []
    for (let i = 0; i < cycleFound.length - 1; i++) {
      const u = cycleFound[i]
      const v = cycleFound[i + 1]
      const edge = graph.edges.find((e) => e.from === u && e.to === v)
      if (edge) cycleEdges.push(edge.id)
    }

    const processNames = cycleFound
      .map((id) => {
        const p = graph.processes.find((x) => x.id === id)
        const r = graph.resources.find((x) => x.id === id)
        return p?.name || r?.name || id
      })
      .join(' ➔ ')

    return {
      hasDeadlock: true,
      hasCycle: true,
      cycleNodes: cycleFound,
      cycleEdges,
      explanation: `Deadlock Detected! Circular wait loop found across single-instance resources: ${processNames}. System is permanently frozen.`,
    }
  }

  return {
    hasDeadlock: false,
    hasCycle: false,
    cycleNodes: [],
    cycleEdges: [],
    explanation: 'No circular wait cycles detected in Resource Allocation Graph. The system is operating in a deadlock-free state.',
  }
}

export const PRESET_DEADLOCK_SCENARIOS = [
  {
    id: 'circular-wait-deadlock',
    label: 'Akshat Defense Guide: 2 Events Circular Wait Deadlock',
    description: 'Event 1 holds Auditorium and requests Seminar Hall. Event 2 holds Seminar Hall and requests Auditorium.',
    graph: {
      processes: [
        { id: 'P1', name: 'Event 1 (Tech Fest)', type: 'PROCESS' as const },
        { id: 'P2', name: 'Event 2 (Cultural Fest)', type: 'PROCESS' as const },
      ],
      resources: [
        { id: 'R1', name: 'Main Auditorium', type: 'RESOURCE' as const, instances: 1 },
        { id: 'R2', name: 'APJ Seminar Hall', type: 'RESOURCE' as const, instances: 1 },
      ],
      edges: [
        { id: 'e1', from: 'R1', to: 'P1', type: 'ASSIGNMENT' as const }, // Auditorium assigned to Tech Fest
        { id: 'e2', from: 'P1', to: 'R2', type: 'REQUEST' as const },    // Tech Fest requests Seminar Hall
        { id: 'e3', from: 'R2', to: 'P2', type: 'ASSIGNMENT' as const }, // Seminar Hall assigned to Cultural Fest
        { id: 'e4', from: 'P2', to: 'R1', type: 'REQUEST' as const },    // Cultural Fest requests Auditorium
      ],
    },
  },
  {
    id: 'three-process-deadlock',
    label: '3-Process Multi-Facility Deadlock Loop',
    description: 'Tech Fest holds Auditorium requests Seminar Hall; Robotics holds Seminar Hall requests CS Lab; Hackathon holds CS Lab requests Auditorium.',
    graph: {
      processes: [
        { id: 'P1', name: 'Tech Fest (CS)', type: 'PROCESS' as const },
        { id: 'P2', name: 'Robotics Workshop (EE)', type: 'PROCESS' as const },
        { id: 'P3', name: 'ACM Hackathon', type: 'PROCESS' as const },
      ],
      resources: [
        { id: 'R1', name: 'Main Auditorium', type: 'RESOURCE' as const, instances: 1 },
        { id: 'R2', name: 'APJ Seminar Hall', type: 'RESOURCE' as const, instances: 1 },
        { id: 'R3', name: 'CS Dept Lab 1', type: 'RESOURCE' as const, instances: 1 },
      ],
      edges: [
        { id: 'e1', from: 'R1', to: 'P1', type: 'ASSIGNMENT' as const },
        { id: 'e2', from: 'P1', to: 'R2', type: 'REQUEST' as const },
        { id: 'e3', from: 'R2', to: 'P2', type: 'ASSIGNMENT' as const },
        { id: 'e4', from: 'P2', to: 'R3', type: 'REQUEST' as const },
        { id: 'e5', from: 'R3', to: 'P3', type: 'ASSIGNMENT' as const },
        { id: 'e6', from: 'P3', to: 'R1', type: 'REQUEST' as const },
      ],
    },
  },
  {
    id: 'safe-allocation-cycle-free',
    label: 'Safe Sequential Allocation (No Circular Wait)',
    description: 'Tech Fest finishes using Auditorium, then releases it for Cultural Fest. No closed dependency cycle.',
    graph: {
      processes: [
        { id: 'P1', name: 'Event 1 (Tech Fest)', type: 'PROCESS' as const },
        { id: 'P2', name: 'Event 2 (Cultural Fest)', type: 'PROCESS' as const },
      ],
      resources: [
        { id: 'R1', name: 'Main Auditorium', type: 'RESOURCE' as const, instances: 1 },
        { id: 'R2', name: 'APJ Seminar Hall', type: 'RESOURCE' as const, instances: 1 },
      ],
      edges: [
        { id: 'e1', from: 'R1', to: 'P1', type: 'ASSIGNMENT' as const },
        { id: 'e2', from: 'R2', to: 'P2', type: 'ASSIGNMENT' as const },
      ],
    },
  },
]
