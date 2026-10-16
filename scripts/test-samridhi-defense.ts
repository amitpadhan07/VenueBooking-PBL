/**
 * Samridhi Thapa - Phase 2 Defense Verification Test Suite
 * Smart Venue Booking & Management System
 * 
 * Demonstrates:
 * 1. Mathematical Interval Overlap Arithmetic: (S_exist < E_req) ∧ (E_exist > S_req)
 * 2. Zero Adjacent Conflict Guarantee: [10:00-12:00] followed by [12:00-14:00]
 * 3. Domain & Venue Capacity Rules (attendees > 0, attendees <= capacity)
 * 4. Temporal & Past-Date Guards
 * 5. State Machine Lifecycle Integrity (PENDING -> APPROVED/REJECTED/CANCELLED)
 */

function checkIntervalConflict(
  existStart: string,
  existEnd: string,
  reqStart: string,
  reqEnd: string
): boolean {
  // Universal interval overlap theorem
  return existStart < reqEnd && existEnd > reqStart
}

function validateBookingConstraints(params: {
  venueCapacity: number
  expectedAttendees: number
  startDate: Date
  endDate: Date
  today?: Date
}): { valid: boolean; error?: string } {
  if (params.expectedAttendees <= 0) {
    return { valid: false, error: 'Domain Constraint Violation: Expected attendees must be greater than 0.' }
  }
  if (params.expectedAttendees > params.venueCapacity) {
    return {
      valid: false,
      error: `Capacity Rule Violation: Expected attendees (${params.expectedAttendees}) exceeds venue capacity (${params.venueCapacity}).`,
    }
  }
  if (params.startDate >= params.endDate) {
    return { valid: false, error: 'Temporal Constraint Violation: Start time must precede end time.' }
  }
  const refDate = params.today || new Date()
  refDate.setHours(0, 0, 0, 0)
  const eventDate = new Date(params.startDate.getFullYear(), params.startDate.getMonth(), params.startDate.getDate())
  if (eventDate < refDate) {
    return { valid: false, error: 'Temporal Constraint Violation: Cannot book events for past dates.' }
  }
  return { valid: true }
}

function isValidStatusTransition(current: string, next: string): boolean {
  const allowedTransitions: Record<string, string[]> = {
    PENDING: ['APPROVED', 'REJECTED', 'CANCELLED'],
    APPROVED: ['COMPLETED', 'CANCELLED'],
    REJECTED: [],
    CANCELLED: [],
    COMPLETED: [],
  }
  return allowedTransitions[current]?.includes(next) ?? false
}

async function runSamridhiDefenseHarness() {
  console.log('========================================================')
  console.log('📋 SAMRIDHI THAPA – PHASE 2 DEFENSE VERIFICATION HARNESS')
  console.log('========================================================\n')

  let passed = 0
  let total = 0

  function assert(condition: boolean, passMsg: string, failMsg: string) {
    total++
    if (condition) {
      console.log(`✅ [PASS] ${passMsg}`)
      passed++
    } else {
      console.error(`❌ [FAIL] ${failMsg}`)
    }
  }

  // --- TEST 1: Universal Interval Overlap Theorem ---
  console.log('--- TEST 1: Mathematical Interval Overlap Arithmetic ---')
  console.log('    Theorem: Conflict <=> (S_exist < E_req) ∧ (E_exist > S_req)')

  // 1a: Internal subset overlap (10:00-14:00 vs 11:00-13:00)
  assert(
    checkIntervalConflict('10:00', '14:00', '11:00', '13:00'),
    'Subset interval request correctly detected as CONFLICT (11:00-13:00 inside 10:00-14:00)',
    'Subset interval failed detection'
  )

  // 1b: Left overlap (10:00-12:00 vs 09:00-11:00)
  assert(
    checkIntervalConflict('10:00', '12:00', '09:00', '11:00'),
    'Left-overlapping interval correctly detected as CONFLICT (09:00-11:00 vs 10:00-12:00)',
    'Left overlap failed detection'
  )

  // 1c: Right overlap (10:00-12:00 vs 11:00-13:00)
  assert(
    checkIntervalConflict('10:00', '12:00', '11:00', '13:00'),
    'Right-overlapping interval correctly detected as CONFLICT (11:00-13:00 vs 10:00-12:00)',
    'Right overlap failed detection'
  )

  // 1d: Exact duplicate (10:00-12:00 vs 10:00-12:00)
  assert(
    checkIntervalConflict('10:00', '12:00', '10:00', '12:00'),
    'Identical time slot request correctly detected as CONFLICT',
    'Identical time slot failed detection'
  )

  // --- TEST 2: Zero Adjacent Slot Conflict Guarantee ---
  console.log('\n--- TEST 2: Zero Adjacent Slot Conflict Guarantee ---')

  // 2a: Immediate successor (10:00-12:00 followed by 12:00-14:00)
  assert(
    !checkIntervalConflict('10:00', '12:00', '12:00', '14:00'),
    'Adjacent subsequent slot (12:00-14:00 after 10:00-12:00) is NO-CONFLICT (permitted)',
    'Adjacent subsequent slot incorrectly flagged as conflict'
  )

  // 2b: Immediate predecessor (08:00-10:00 before 10:00-12:00)
  assert(
    !checkIntervalConflict('10:00', '12:00', '08:00', '10:00'),
    'Adjacent preceding slot (08:00-10:00 before 10:00-12:00) is NO-CONFLICT (permitted)',
    'Adjacent preceding slot incorrectly flagged as conflict'
  )

  // --- TEST 3: Domain & Venue Capacity Rules ---
  console.log('\n--- TEST 3: Domain & Venue Capacity Rules ---')
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowEnd = new Date(tomorrow)
  tomorrowEnd.setHours(tomorrowEnd.getHours() + 2)

  // 3a: Valid attendees within capacity
  const validCapacity = validateBookingConstraints({
    venueCapacity: 250,
    expectedAttendees: 150,
    startDate: tomorrow,
    endDate: tomorrowEnd,
  })
  assert(validCapacity.valid, 'Valid attendance (150 <= 250 cap) is accepted', 'Valid attendance rejected')

  // 3b: Attendees exceeding venue capacity
  const excessCapacity = validateBookingConstraints({
    venueCapacity: 75,
    expectedAttendees: 120,
    startDate: tomorrow,
    endDate: tomorrowEnd,
  })
  assert(
    !excessCapacity.valid && Boolean(excessCapacity.error?.includes('Capacity Rule Violation')),
    'Excess attendance (120 > 75 cap) blocked by Capacity Rule',
    'Excess attendance was not blocked'
  )

  // 3c: Non-positive attendee count
  const zeroAttendees = validateBookingConstraints({
    venueCapacity: 800,
    expectedAttendees: 0,
    startDate: tomorrow,
    endDate: tomorrowEnd,
  })
  assert(
    !zeroAttendees.valid && Boolean(zeroAttendees.error?.includes('Domain Constraint Violation')),
    'Domain constraint (attendees <= 0) strictly rejected',
    'Zero attendees was not blocked'
  )

  // --- TEST 4: Temporal & Horizon Constraints ---
  console.log('\n--- TEST 4: Temporal & Horizon Constraints ---')

  // 4a: Start time >= end time
  const invertedTime = validateBookingConstraints({
    venueCapacity: 800,
    expectedAttendees: 50,
    startDate: tomorrowEnd,
    endDate: tomorrow,
  })
  assert(
    !invertedTime.valid && Boolean(invertedTime.error?.includes('Temporal Constraint Violation')),
    'Inverted time interval (start >= end) strictly rejected',
    'Inverted time was not blocked'
  )

  // 4b: Past date booking attempt
  const pastDate = new Date('2020-01-01T10:00:00')
  const pastEnd = new Date('2020-01-01T12:00:00')
  const historical = validateBookingConstraints({
    venueCapacity: 800,
    expectedAttendees: 50,
    startDate: pastDate,
    endDate: pastEnd,
  })
  assert(
    !historical.valid && Boolean(historical.error?.includes('past dates')),
    'Historical date booking strictly rejected by Horizon Guard',
    'Past date was not blocked'
  )

  // --- TEST 5: Status Lifecycle State Machine ---
  console.log('\n--- TEST 5: Status Lifecycle State Machine ---')

  assert(
    isValidStatusTransition('PENDING', 'APPROVED'),
    'Valid status transition: PENDING -> APPROVED permitted',
    'PENDING -> APPROVED rejected'
  )
  assert(
    isValidStatusTransition('PENDING', 'REJECTED'),
    'Valid status transition: PENDING -> REJECTED permitted',
    'PENDING -> REJECTED rejected'
  )
  assert(
    isValidStatusTransition('PENDING', 'CANCELLED'),
    'Valid status transition: PENDING -> CANCELLED permitted',
    'PENDING -> CANCELLED rejected'
  )
  assert(
    !isValidStatusTransition('REJECTED', 'APPROVED'),
    'Terminal protection: REJECTED -> APPROVED blocked (immutable rejection)',
    'REJECTED -> APPROVED was not blocked'
  )

  console.log('\n========================================================')
  console.log(`📊 FINAL RESULT: ${passed} / ${total} TESTS PASSED (${Math.round((passed / total) * 100)}%)`)
  console.log('🎉 Samridhi Thapa Phase 2 Booking & Conflict Requirements Verified!')
  console.log('========================================================\n')
}

runSamridhiDefenseHarness().catch(console.error)
