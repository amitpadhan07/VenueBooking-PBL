# 📋 Lavanya Joshi – PBL Phase 2 Responsibilities & Defense Guide
**Project:** Smart Venue Booking & Management System  
**PBL Theme:** *An OS and DBMS Based Approach for Concurrent Venue Allocation and Approval*  
**Team Member:** Lavanya Joshi  
**Designated Role:** Database & Backend Developer  
**Phase Target:** Phase 2 Defense (60%–80% Functional Implementation)  
**Database:** PostgreSQL (Render Cloud Hosted: `venuedesk`)  

---

## 📑 Table of Contents
1. [Role Overview & Responsibilities](#1-role-overview--responsibilities)
2. [Operating Systems (OS) Domain](#2-operating-systems-os-domain)
   - [The Critical Section Problem in Venue Allocation](#the-critical-section-problem-in-venue-allocation)
   - [Race Condition & The Lost Update Problem](#race-condition--the-lost-update-problem)
   - [Synchronization Primitives & Mutex Mapping](#synchronization-primitives--mutex-mapping)
3. [Database Management Systems (DBMS) Domain](#3-database-management-systems-dbms-domain)
   - [Entity-Relationship (ER) Architecture & 8 Tables](#entity-relationship-er-architecture--8-tables)
   - [Normalization Walkthrough (1NF → 2NF → 3NF / BCNF)](#normalization-walkthrough-1nf--2nf--3nf--bcnf)
   - [Elimination of Relational Anomalies](#elimination-of-relational-anomalies)
   - [ACID Transactions & PostgreSQL Concurrency Control](#acid-transactions--postgresql-concurrency-control)
   - [Complex SQL Queries & Relational Algebra](#complex-sql-queries--relational-algebra)
4. [Live Code Files Owned by Lavanya](#4-live-code-files-owned-by-lavanya)
5. [Step-by-Step Live Defense Script for Evaluators](#5-step-by-step-live-defense-script-for-evaluators)
6. [Expected Viva Questions & Model Answers](#6-expected-viva-questions--model-answers)
7. [Automated Defense Test Suite](#7-automated-defense-test-suite)

---

## 1. Role Overview & Responsibilities

| Responsibility Area | Specific Tasks / Topics | Deliverable in Codebase |
| :--- | :--- | :--- |
| **Main Development** | Database Schema, Backend Transaction Logic, Relational Integrity | [`prisma/schema.prisma`](file:///c:/projects/VenueBooking-PBL/prisma/schema.prisma), [`app/api/bookings/concurrent-safe/route.ts`](file:///c:/projects/VenueBooking-PBL/app/api/bookings/concurrent-safe/route.ts), [`app/api/bookings/route.ts`](file:///c:/projects/VenueBooking-PBL/app/api/bookings/route.ts) |
| **OS Concept** | Synchronization, Critical Section, Locking, Race Conditions | Pessimistic Row Locking (`FOR UPDATE`), Thread Interleaving, [`app/api/demo/concurrency-test/route.ts`](file:///c:/projects/VenueBooking-PBL/app/api/demo/concurrency-test/route.ts) |
| **DBMS Concept** | 8-Table ER Model, 3NF Normalization, Complex SQL, ACID Properties | [`components/dbms/DBMSAcademicLab.tsx`](file:///c:/projects/VenueBooking-PBL/components/dbms/DBMSAcademicLab.tsx), [`app/api/dbms/query/route.ts`](file:///c:/projects/VenueBooking-PBL/app/api/dbms/query/route.ts) |

---

## 2. Operating Systems (OS) Domain

### The Critical Section Problem in Venue Allocation
In OS theory, a **Critical Section** is a code segment that accesses shared resources (in this case, physical venue calendar slots) that must not be accessed concurrently by more than one thread/process.

In VenueDesk, the Critical Section consists of 3 continuous steps:
```
           ┌────────────────────────────────────────┐
           │        ENTRY SECTION (Acquire Lock)    │
           │  tx.$queryRaw`SELECT ... FOR UPDATE`   │
           └───────────────────┬────────────────────┘
                               │
                               ▼
   ┌────────────────────────────────────────────────────────┐
   │                   CRITICAL SECTION                     │
   │  Step 1: Read current slot status (SELECT)             │
   │  Step 2: Check for interval overlap (Conflict Logic)   │
   │  Step 3: Allocate & commit reservation (INSERT/UPDATE) │
   └───────────────────────────┬────────────────────────────┘
                               │
                               ▼
           ┌────────────────────────────────────────┐
           │        EXIT SECTION (Release Lock)     │
           │        Transaction COMMIT / ROLLBACK   │
           └────────────────────────────────────────┘
```

---

### Race Condition & The Lost Update Problem
When two students ($Student_A$ and $Student_B$) request the same venue at the exact same millisecond:

#### ❌ Unsynchronized Execution (Causes Double-Booking):
```
Time   Student A (Thread 1)                  Student B (Thread 2)
 t0    Read: "Auditorium 10:00-12:00 FREE"    .
 t1    .                                     Read: "Auditorium 10:00-12:00 FREE"
 t2    Writes: "Booked by Student A"         .
 t3    .                                     Writes: "Booked by Student B" (Overwrites!)
 ── Result: Both students believe they booked the venue. Physical collision occurs.
```

#### ✅ Synchronized Execution with Row Lock (Mutual Exclusion):
```
Time   Student A (Thread 1)                  Student B (Thread 2)
 t0    Acquire Row Lock (FOR UPDATE)          Attempts to acquire Lock -> BLOCKED (Wait Queue)
 t1    Check conflict -> None                 (Waiting...)
 t2    Write booking -> COMMIT                (Waiting...)
 t3    Release Lock                           Lock Granted to Student B
 t4    .                                      Check conflict -> Collides with Student A!
 t5    .                                      ABORT -> HTTP 409 Conflict returned
 ── Result: Exact Mutual Exclusion. Double-booking mathematically prevented.
```

---

### Synchronization Primitives & Mutex Mapping
Lavanya explains the direct bridge between OS theory and Database implementation:
- **OS Mutex (Mutual Exclusion Lock):** Only one process holds the lock; others block until release. Synchronizes threads sharing physical RAM within a single process.
- **PostgreSQL Row-Level Lock (`SELECT ... FOR UPDATE`):** The relational equivalent of a binary mutex on a specific tuple in persistent storage. Synchronizes distributed transactions across multiple web server instances and worker processes.
- **Code Reference:** [`app/api/bookings/concurrent-safe/route.ts`](file:///c:/projects/VenueBooking-PBL/app/api/bookings/concurrent-safe/route.ts#L42-L50)
  ```ts
  // Step 1: Acquire Pessimistic Row Lock on the venue row
  const lockedVenues = await tx.$queryRaw`
    SELECT venue_id, venue_name, capacity, status 
    FROM venues 
    WHERE venue_id = ${venueId} FOR UPDATE
  `
  ```

---

## 3. Database Management Systems (DBMS) Domain

### Entity-Relationship (ER) Architecture & 8 Tables
The schema in [`prisma/schema.prisma`](file:///c:/projects/VenueBooking-PBL/prisma/schema.prisma) consists of 8 normalized relational tables:

1. **`users`**: Master user directory storing authentication hashes and system roles (`STUDENT`, `EMPLOYEE`, `ADMIN`, `FACULTY`).
2. **`venues`**: Campus venues with capacity limits, types, and operational states (`ACTIVE`, `MAINTENANCE`, `INACTIVE`).
3. **`employees`**: Extends `users` with staff metadata (employee code, designation, department).
4. **`venue_authority`**: Associative table resolving many-to-many relationships between employees and venues.
5. **`bookings`**: Core transactional table with event schedules, status lifecycle (`PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`), and attendee counts.
6. **`approvals`**: Audit trail of decisions made by authorized employees on booking requests.
7. **`notifications`**: Event-driven alert records sent to students and approvers.
8. **`audit_logs`**: Tamper-evident ledger capturing all state-altering operations.

#### Relational Cardinalities:
- **$1:1$:** `users` $\longleftrightarrow$ `employees` (Every employee is a user profile via `user_id UNIQUE`).
- **$1:N$:** `venues` $\longleftrightarrow$ `bookings` (A venue can host multiple events over time).
- **$1:N$:** `users` $\longleftrightarrow$ `bookings` (A user can place multiple booking requests).
- **$N:M$:** `employees` $\longleftrightarrow$ `venues` (Resolved via `venue_authority` with composite unique constraint `(employee_id, venue_id)`).

---

### Normalization Walkthrough (1NF → 2NF → 3NF / BCNF)
Lavanya justifies the schema design:

#### 1. First Normal Form (1NF)
- **Rule:** Atomic values, no repeating groups, unique primary key for every entity.
- **Implementation:** Every column holds scalar values; time intervals split into separate `start_time` and `end_time` columns.

#### 2. Second Normal Form (2NF)
- **Rule:** Must be in 1NF and have **no partial functional dependencies** (every non-key attribute must depend on the whole primary key).
- **Implementation:** In `venue_authority`, the PK is `authority_id` (or composite `(employee_id, venue_id)`). Venue details (`capacity`, `location`) are stored in `venues`, not inside `venue_authority`.

#### 3. Third Normal Form (3NF) & BCNF
- **Rule:** Must be in 2NF and have **no transitive functional dependencies** ($X \to Y$ and $Y \to Z$).
- **Implementation:** 
  - Employee designation does not live in `bookings` or `venue_authority`.
  - User department lives in `users` and cascades via Foreign Key.

---

### Elimination of Relational Anomalies
- **Insertion Anomaly Eliminated:** You can add a new venue to `venues` immediately without having to assign an employee yet.
- **Deletion Anomaly Eliminated:** Removing a staff member from `employees` or `users` does not accidentally wipe out the venue record or historical bookings.
- **Update Anomaly Eliminated:** Modifying a venue's capacity or name requires updating only **1 single row** in `venues`.

---

### ACID Transactions & PostgreSQL Concurrency Control
How the database guarantees the ACID contract:

| ACID Property | Theoretical Definition | How VenueDesk Implements It in PostgreSQL |
| :--- | :--- | :--- |
| **Atomicity** | All operations in a transaction succeed or all rollback. | `prisma.$transaction()` wraps booking creation, notification insertion, and audit logging into a single unit. If any check fails, everything rolls back. |
| **Consistency** | The database transitions from one valid state to another, satisfying all constraints. | Schema checks (`capacity > 0`, foreign key cascading, `start_time < end_time`, non-overlap check) ensure invalid states never commit. |
| **Isolation** | Concurrent transactions execute without cross-interference. | Pessimistic locking (`FOR UPDATE`) serializes access to the same venue row, eliminating dirty reads and lost updates. |
| **Durability** | Committed data is permanent, even after hardware or server crashes. | PostgreSQL Write-Ahead Logging (WAL) ensures every committed transaction is flushed to disk before acknowledging HTTP 201 to the client. |

---

### Complex SQL Queries & Relational Algebra
Real multi-table queries from [`app/api/dbms/query/route.ts`](file:///c:/projects/VenueBooking-PBL/app/api/dbms/query/route.ts):

#### 1. Multi-Table Relational JOIN:
$$\Pi_{\text{event}, \text{student}, \text{venue}} (\text{bookings} \bowtie \text{users} \bowtie \text{venues})$$
```sql
SELECT 
  b.booking_id, b.event_name, u.name AS requester, 
  v.venue_name, v.capacity, b.event_date::text, b.start_time, b.end_time, b.status
FROM bookings b
JOIN users u ON b.user_id = u.user_id
JOIN venues v ON b.venue_id = v.venue_id
ORDER BY b.created_at DESC LIMIT 10;
```

#### 2. Venue Authority Matrix Verification:
$$\Pi_{\text{emp\_code}, \text{name}, \text{designation}, \text{venue}} (\text{venue\_authority} \bowtie \text{employees} \bowtie \text{users} \bowtie \text{venues})$$
```sql
SELECT 
  va.authority_id, e.employee_code, u.name AS employee_name, 
  e.designation, v.venue_name, v.location, va.status
FROM venue_authority va
JOIN employees e ON va.employee_id = e.employee_id
JOIN users u ON e.user_id = u.user_id
JOIN venues v ON va.venue_id = v.venue_id;
```

---

## 4. Live Code Files Owned by Lavanya

1. **[`prisma/schema.prisma`](file:///c:/projects/VenueBooking-PBL/prisma/schema.prisma)** — Complete 8-table relational schema with indexes, relations, and enums.
2. **[`app/api/bookings/concurrent-safe/route.ts`](file:///c:/projects/VenueBooking-PBL/app/api/bookings/concurrent-safe/route.ts)** — ACID interactive transaction with PostgreSQL row-level lock (`FOR UPDATE`).
3. **[`components/dbms/DBMSAcademicLab.tsx`](file:///c:/projects/VenueBooking-PBL/components/dbms/DBMSAcademicLab.tsx)** — Interactive SQL Query Playground, 3NF schema breakdown, and ACID visualizer.
4. **[`app/api/dbms/query/route.ts`](file:///c:/projects/VenueBooking-PBL/app/api/dbms/query/route.ts)** — Live backend SQL executor for relational queries.
5. **[`app/api/demo/concurrency-test/route.ts`](file:///c:/projects/VenueBooking-PBL/app/api/demo/concurrency-test/route.ts)** — Asynchronous `Promise.all` race test route proving double-booking prevention.
6. **[`scripts/test-lavanya-defense.ts`](file:///c:/projects/VenueBooking-PBL/scripts/test-lavanya-defense.ts)** — Automated test suite verifying all 7 DBMS & OS concurrency requirements (15/15 passing).

---

## 5. Step-by-Step Live Defense Script for Evaluators

When the examiners ask Lavanya to present her work:

1. **Open the Web App:** Go to `http://localhost:3000` and click on **DBMS Concepts** in the sidebar.
2. **Explain the Normalized Schema:** Point to the *3NF Normalized Relational Schema* card and explain why the 8 tables prevent insertion/deletion/update anomalies.
3. **Run the Live Concurrency Test:**
   - Click the orange **"Fire 2 Concurrent Requests"** button.
   - Show the result:
     > *"As you can see, two simultaneous requests were sent at the exact same millisecond. Request 1 acquired the PostgreSQL row-level lock and returned HTTP 201 Created. Request 2 was serialized, detected the occupied slot, and was safely rejected with HTTP 409 Conflict. This proves our system completely prevents the Lost Update problem."*
4. **Execute Real SQL Queries:**
   - Under the *Live PostgreSQL SQL Query Playground*, click on **"Multi-Table INNER JOIN"** and hit **Execute SQL**.
   - Show the live returned rows, execution time in milliseconds, and explain how the join links `bookings`, `users`, and `venues`.

---

## 6. Expected Viva Questions & Model Answers

### Q1: Why do we need a row lock (`SELECT FOR UPDATE`) instead of just a simple SELECT?
> **Answer:** A simple `SELECT` performs a non-locking snapshot read. If two users check availability at the same time ($t_0$), both see that the venue is free. Both will proceed to insert a booking ($t_1$), causing a double-booking (Race Condition / Lost Update). By using `SELECT ... FOR UPDATE`, the first transaction locks the venue row; the second transaction is forced to wait until the first commits, ensuring serializability.

### Q2: Why is `venue_authority` a separate table instead of storing `assigned_employee_id` inside `venues`?
> **Answer:** In our campus model, authority assignment is a **Many-to-Many ($N:M$) relationship**. An auditorium might have two authorized managers, or one senior manager might oversee multiple seminar halls. If we put `employee_id` inside `venues`, we would violate 1NF/2NF by storing multi-valued attributes or creating duplicate venue rows. The associative table `venue_authority` with a composite unique constraint `(employee_id, venue_id)` resolves this in 3NF / BCNF.

### Q3: How is Atomicity preserved if the server crashes while creating a booking?
> **Answer:** We execute all database writes inside Prisma's interactive transaction (`prisma.$transaction`). In PostgreSQL, a transaction is an all-or-nothing boundary. If a crash happens after creating the booking but before logging or creating the notification, PostgreSQL issues an automatic `ROLLBACK`, discarding all intermediate writes so the database never enters an inconsistent state.

### Q4: What is the relationship between an OS Mutex and a Database Lock?
> **Answer:** Both solve the **Mutual Exclusion** problem of the Critical Section. An OS Mutex synchronizes threads sharing physical RAM within a single process. A Database Row Lock (`FOR UPDATE`) synchronizes distributed transactions sharing persistent data across multiple web server instances and worker processes.

### Q5: What database are we using and where is it hosted?
> **Answer:** We are running **PostgreSQL 16** hosted in the cloud on **Render** (database name: `venuedesk`), connected securely over SSL via Prisma ORM.

---

## 7. Automated Defense Test Suite

To run Lavanya's automated defense verification harness:
```bash
pnpm exec tsx scripts/test-lavanya-defense.ts
```
Expected Output:
```
===================================================================
📊 FINAL RESULT: 15 / 15 TESTS PASSED (100%)
🎉 Lavanya Joshi Phase 2 DBMS & OS Concurrency Requirements Verified!
===================================================================
```
