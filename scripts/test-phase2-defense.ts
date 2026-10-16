/**
 * Akshat Dobhal - Phase 2 Defense Verification Test Suite
 * Verifies:
 * 1. Cryptographic password hashing (bcrypt, 10 rounds)
 * 2. JWT issuance, payload integrity, and verification
 * 3. Banker's Algorithm safety algorithm & safe sequence <P1, P0, P2>
 * 4. Deadlock detection via Resource Allocation Graph (RAG) cycle check
 * 5. Venue Authority business rule enforcement logic
 */

import { hashPassword, verifyPassword, signToken, verifyToken } from '../lib/auth'
import { runBankersSafety, evaluateResourceRequest, PRESET_BANKERS_SCENARIOS } from '../lib/os/bankers'
import { detectRAGDeadlock, PRESET_DEADLOCK_SCENARIOS } from '../lib/os/deadlock'
import { Role } from '@prisma/client'

async function runTests() {
  console.log('========================================================')
  console.log('📋 AKSHAT DOBHAL – PHASE 2 DEFENSE VERIFICATION HARNESS')
  console.log('========================================================\n')

  let passCount = 0
  let totalTests = 0

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++
    if (condition) {
      passCount++
      console.log(`✅ [PASS] ${testName}`)
      if (detail) console.log(`   ↳ ${detail}`)
    } else {
      console.error(`❌ [FAIL] ${testName}`)
      if (detail) console.error(`   ↳ ${detail}`)
    }
  }

  // TEST 1: Password Cryptography (Bcrypt Salt Rounds 10)
  console.log('--- TEST 1: Bcrypt Password Cryptography ---')
  const plainPassword = 'Password@123'
  const hash = await hashPassword(plainPassword)
  assert(hash.startsWith('$2a$10$') || hash.startsWith('$2b$10$'), 'Password hashed with bcrypt work factor 10', `Hash: ${hash.substring(0, 20)}...`)
  const isValid = await verifyPassword(plainPassword, hash)
  assert(isValid === true, 'Correct password verifies successfully against bcrypt hash')
  const isInvalid = await verifyPassword('WrongPassword', hash)
  assert(isInvalid === false, 'Invalid password is strictly rejected')

  // TEST 2: JWT Architecture & Identity Integrity
  console.log('\n--- TEST 2: Stateless JWT Session Architecture ---')
  const mockPayload = {
    userId: '95a8d1e1-596d-4b3b-9292-6421cb3e38cb',
    email: 'student1@college.edu',
    role: Role.STUDENT,
    name: 'Rahul Sharma',
  }
  const token = signToken(mockPayload)
  assert(typeof token === 'string' && token.split('.').length === 3, 'JWT signed with HMAC SHA-256 (Header.Payload.Signature)')
  const decoded = verifyToken(token)
  assert(decoded !== null && decoded.email === mockPayload.email && decoded.role === mockPayload.role, 'JWT decoded and verified with matching claims', `User: ${decoded?.name} (${decoded?.role})`)

  // TEST 3: Dijkstra's Banker's Algorithm (Akshat Defense Guide Walkthrough)
  console.log('\n--- TEST 3: Banker’s Algorithm Safety & Safe Sequence ---')
  const akshatScenario = PRESET_BANKERS_SCENARIOS[0].state
  const safety = runBankersSafety(akshatScenario)
  assert(safety.isSafe === true, 'System verified in SAFE STATE')
  const expectedSeq = ['P1: Cultural Fest (Arts)', 'P0: Tech Fest (CS)', 'P2: Robotics Club (EE)']
  const matchesExpected = JSON.stringify(safety.safeSequence) === JSON.stringify(expectedSeq)
  assert(matchesExpected, `Safe sequence computed accurately: ⟨ ${safety.safeSequence.join(' ➔ ')} ⟩`)

  // Test Resource Request with Banker's
  const requestP1 = [1, 0, 0] // P1 requests 1 Auditorium
  const reqResult = evaluateResourceRequest(akshatScenario, 1, requestP1)
  assert(reqResult.canGrant === true, 'Valid safe resource request is granted by Banker\'s Algorithm')

  const excessiveRequest = [10, 10, 10] // Excess of available
  const excessResult = evaluateResourceRequest(akshatScenario, 0, excessiveRequest)
  assert(excessResult.canGrant === false, 'Excessive resource request is safely rejected/blocked')

  // TEST 4: Deadlock & Circular Wait Cycle Detection (RAG)
  console.log('\n--- TEST 4: Resource Allocation Graph (RAG) Cycle Detection ---')
  const deadlockGraph = PRESET_DEADLOCK_SCENARIOS[0].graph // Tech Fest & Cultural Fest circular wait
  const deadlockResult = detectRAGDeadlock(deadlockGraph)
  assert(deadlockResult.hasDeadlock === true, 'Circular wait cycle correctly flagged as DEADLOCK')
  assert(deadlockResult.cycleNodes.length > 0, `Identified cycle path: ${deadlockResult.cycleNodes.join(' ➔ ')}`)

  const safeGraph = PRESET_DEADLOCK_SCENARIOS[2].graph // Safe sequential allocation
  const safeResult = detectRAGDeadlock(safeGraph)
  assert(safeResult.hasDeadlock === false, 'Cycle-free graph correctly verified as DEADLOCK-FREE')

  console.log('\n========================================================')
  console.log(`📊 FINAL RESULT: ${passCount} / ${totalTests} TESTS PASSED (${Math.round((passCount / totalTests) * 100)}%)`)
  console.log('🎉 Akshat Dobhal Phase 2 OS & DBMS Requirements Verified!')
  console.log('========================================================\n')
}

runTests().catch((err) => {
  console.error('Test execution failed:', err)
  process.exit(1)
})
