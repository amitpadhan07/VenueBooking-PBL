# 📋 Master Pending Tasks & Implementation Roadmap
## Smart Venue Booking & Management System
**Subtitle:** *An OS and DBMS Based Approach for Concurrent Venue Allocation and Approval*  
**Phase Target:** Phase 2 Completion (70%–80% Functional Implementation)  
**Database:** PostgreSQL (SQL / Normalized Relational Schema)  
**Stack:** Next.js 15+ (App Router), TypeScript, Tailwind CSS, shadcn/ui, Prisma / PostgreSQL Client  

---

## 📑 Table of Contents
1. [Project Status & Target Completion Overview](#1-project-status--target-completion-overview)
2. [Phase A: Tech Stack Cleanup & PostgreSQL Database Foundation](#2-phase-a-tech-stack-cleanup--postgresql-database-foundation)
3. [Phase B: Authentication, Users & Role-Based Access Control (RBAC)](#3-phase-b-authentication-users--role-based-access-control-rbac)
4. [Phase C: Venue Management & Venue-Specific Authority Matrix](#4-phase-c-venue-management--venue-specific-authority-matrix)
5. [Phase D: Booking Engine & Overlap Conflict Detection](#5-phase-d-booking-engine--overlap-conflict-detection)
6. [Phase E: PostgreSQL Concurrency Control & ACID Transactions](#6-phase-e-postgresql-concurrency-control--acid-transactions)
7. [Phase F: Approval Workflow, In-App Notifications & Audit Trail](#7-phase-f-approval-workflow-in-app-notifications--audit-trail)
8. [Phase G: Operating Systems (OS) Concepts Lab & Interactive Simulators](#8-phase-g-operating-systems-os-concepts-lab--interactive-simulators)
9. [Phase H: Database Management Systems (DBMS) Academic Lab](#9-phase-h-database-management-systems-dbms-academic-lab)
10. [Phase I: Role-Specific User Interfaces & Dashboards](#10-phase-i-role-specific-user-interfaces--dashboards)
11. [Phase J: Analytics, Reports & Audit Logging](#11-phase-j-analytics-reports--audit-logging)
12. [Phase K: Testing Suite & Verification Harness](#12-phase-k-testing-suite--verification-harness)
13. [Phase L: Live Demonstration Checklist for Phase 2 Defense](#13-phase-l-live-demonstration-checklist-for-phase-2-defense)

---

## 1. Project Status & Target Completion Overview

### 🎯 Target Completion Breakdown
| Module | Target % | Current % | Status |
| :--- | :---: | :---: | :--- |
| **Authentication & RBAC** | 100% | 100% | 🟢 Completed (bcrypt 10 rounds, JWT sessions, role boundaries) |
| **User & Employee Management** | 100% | 80% | 🟢 Substantially Complete (Prisma users & employees linked) |
| **Venue Management** | 100% | 60% | 🟡 In Progress (Prisma inventory active & authority mapping) |
| **Venue Authority Matrix** | 100% | 100% | 🟢 Completed (Relational delegation API, composite uniqueness) |
| **Booking & Conflict Engine** | 100% | 100% | 🟢 Completed (Universal interval overlap theorem, capacity & temporal bounds) |
| **Approval Workflow** | 100% | 85% | 🟢 Substantially Complete (Venue authority verified approvals, 403 enforcement) |
| **PostgreSQL Database & Schema** | 90% | 100% | 🟢 Completed (Prisma ORM & PostgreSQL schema live on Render) |
| **PostgreSQL Transactions & ACID** | 80% | 100% | 🟢 Completed (Row-level locking & ACID transactions live) |
| **Concurrency Control & Row Locks** | 80% | 100% | 🟢 Completed (Pessimistic FOR UPDATE locking active) |
| **OS Scheduling Simulators (FCFS/Priority/RR)** | 70% | 100% | 🟢 Completed (Interactive FCFS, Priority, RR + Gantt chart) |
| **Critical Section & Synchronization Demo** | 80% | 75% | 🟢 Substantially Complete (Row-lock mapping to critical section demonstrated) |
| **Deadlock Simulator (Circular Wait)** | 70% | 100% | 🟢 Completed (4 Coffman conditions, RAG bipartite graph, DFS cycle detection) |
| **Banker's Algorithm Simulator** | 70% | 100% | 🟢 Completed (Need matrix, Safety algorithm with Work/Finish, Safe sequence, Request tester) |
| **DBMS Academic Concepts & SQL Lab** | 80% | 100% | 🟢 Completed (Live SQL query playground, 3NF schema, ACID breakdown, WAL visualizer) |
| **In-App Notifications** | 70% | 85% | 🟢 Substantially Complete (Transactional notification triggers live) |
| **Analytics & Reports** | 60% | 60% | 🟡 In Progress (Live aggregations in DBMS Lab & Audit viewer) |
| **Testing Suite & Concurrency Test** | 60% | 90% | 🟢 Substantially Complete (12/12 automated defense tests + Promise.all race test) |
| **Frontend Polish & Responsive UI** | 90% | 90% | 🟢 Substantially Complete (Responsive workspace with live academic labs) |

---

## 2. Phase A: Tech Stack Cleanup & PostgreSQL Database Foundation

### 🔨 Tasks:
- [x] **Package Cleanup**:
  - Remove `mongodb` from `package.json` (`pnpm remove mongodb`).
  - Install core backend and database dependencies:
    - `prisma` & `@prisma/client` (or `pg` + `drizzle-orm`)
    - `bcryptjs` + `@types/bcryptjs`
    - `jsonwebtoken` + `@types/jsonwebtoken`
    - `zod` (Input validation)
    - `date-fns` (Date calculations)
- [x] **Environment Configuration (`.env`)**:
  - Set `DATABASE_URL="postgresql://lavanya:DrwDoqIAuVkLwhuC6MNMUHZdeOi2a0Q0@dpg-daijr66k1f9s738ghmb0-a.oregon-postgres.render.com/venuebooking"`
  - Set `JWT_SECRET="super-secret-jwt-key"`
  - Set `NEXTAUTH_SECRET` / App secrets
- [x] **Create 8 Core Normalized Relational Tables**:
  - [x] `users`:
    - `user_id` (UUID / Serial, PK)
    - `name` (VARCHAR(100), NOT NULL)
    - `email` (VARCHAR(150), UNIQUE, NOT NULL)
    - `password_hash` (TEXT, NOT NULL)
    - `role` (ENUM: `'STUDENT'`, `'FACULTY'`, `'ADMIN'`, `'EMPLOYEE'`, NOT NULL)
    - `department` (VARCHAR(100), NOT NULL)
    - `phone` (VARCHAR(20))
    - `created_at` (TIMESTAMP DEFAULT NOW())
    - `updated_at` (TIMESTAMP DEFAULT NOW())
  - [x] `venues`:
    - `venue_id` (UUID / Serial, PK)
    - `venue_name` (VARCHAR(100), UNIQUE, NOT NULL)
    - `location` (VARCHAR(200), NOT NULL)
    - `capacity` (INT, CHECK (capacity > 0), NOT NULL)
    - `venue_type` (VARCHAR(50), NOT NULL)
    - `description` (TEXT)
    - `status` (ENUM: `'ACTIVE'`, `'MAINTENANCE'`, `'INACTIVE'`, DEFAULT `'ACTIVE'`)
    - `created_at` & `updated_at`
  - [x] `employees`:
    - `employee_id` (UUID / Serial, PK)
    - `user_id` (FK → `users.user_id`, UNIQUE, NOT NULL)
    - `employee_code` (VARCHAR(50), UNIQUE, NOT NULL)
    - `designation` (VARCHAR(100), NOT NULL)
    - `department` (VARCHAR(100), NOT NULL)
    - `status` (VARCHAR(20), DEFAULT `'ACTIVE'`)
    - `created_at` (TIMESTAMP DEFAULT NOW())
  - [x] `venue_authority`:
    - `authority_id` (UUID / Serial, PK)
    - `employee_id` (FK → `employees.employee_id`, NOT NULL)
    - `venue_id` (FK → `venues.venue_id`, NOT NULL)
    - `assigned_by` (FK → `users.user_id`, NOT NULL)
    - `assigned_at` (TIMESTAMP DEFAULT NOW())
    - `status` (ENUM: `'ACTIVE'`, `'REVOKED'`, DEFAULT `'ACTIVE'`)
    - **Constraint:** `UNIQUE (employee_id, venue_id)`
  - [x] `bookings`:
    - `booking_id` (UUID / Serial, PK)
    - `user_id` (FK → `users.user_id`, NOT NULL)
    - `venue_id` (FK → `venues.venue_id`, NOT NULL)
    - `event_name` (VARCHAR(150), NOT NULL)
    - `event_description` (TEXT)
    - `event_date` (DATE, NOT NULL)
    - `start_time` (TIME, NOT NULL)
    - `end_time` (TIME, NOT NULL)
    - `expected_attendees` (INT, CHECK (expected_attendees > 0), NOT NULL)
    - `status` (ENUM: `'PENDING'`, `'APPROVED'`, `'REJECTED'`, `'CANCELLED'`, `'COMPLETED'`, DEFAULT `'PENDING'`)
    - `created_at` & `updated_at`
  - [x] `approvals`:
    - `approval_id` (UUID / Serial, PK)
    - `booking_id` (FK → `bookings.booking_id`, NOT NULL)
    - `employee_id` (FK → `employees.employee_id`, NOT NULL)
    - `action` (ENUM: `'APPROVED'`, `'REJECTED'`, NOT NULL)
    - `remarks` (TEXT)
    - `action_at` (TIMESTAMP DEFAULT NOW())
  - [x] `notifications`:
    - `notification_id` (UUID / Serial, PK)
    - `user_id` (FK → `users.user_id`, NOT NULL)
    - `booking_id` (FK → `bookings.booking_id`, NULLABLE)
    - `title` (VARCHAR(150), NOT NULL)
    - `message` (TEXT, NOT NULL)
    - `notification_type` (VARCHAR(50), NOT NULL)
    - `is_read` (BOOLEAN DEFAULT FALSE)
    - `created_at` (TIMESTAMP DEFAULT NOW())
  - [x] `audit_logs`:
    - `log_id` (UUID / Serial, PK)
    - `user_id` (FK → `users.user_id`, NULLABLE)
    - `action` (VARCHAR(100), NOT NULL)
    - `entity_type` (VARCHAR(50), NOT NULL)
    - `entity_id` (VARCHAR(100), NOT NULL)
    - `details` (JSONB / TEXT)
    - `created_at` (TIMESTAMP DEFAULT NOW())
- [x] **Performance Indexes**:
  - `CREATE INDEX idx_bookings_lookup ON bookings(venue_id, event_date, status, start_time, end_time);`
  - `CREATE INDEX idx_user_bookings ON bookings(user_id, status);`
  - `CREATE INDEX idx_venue_authority ON venue_authority(employee_id, venue_id, status);`
  - `CREATE INDEX idx_approvals_booking ON approvals(booking_id);`
  - `CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);`
- [x] **Database Seeder (`prisma/seed.ts` or `scripts/seed.sql`)**:
  - Seed 1 Admin (`admin@college.edu`)
  - Seed 3 Employees (`emp_auditorium@college.edu`, `emp_seminar@college.edu`, `emp_hod@college.edu`)
  - Seed 2 Students (`student1@college.edu`, `student2@college.edu`)
  - Seed 1 Faculty (`faculty1@college.edu`)
  - Seed 4 Venues:
    - *Main Auditorium* (Capacity: 800)
    - *APJ Abdul Kalam Seminar Hall* (Capacity: 250)
    - *CS Department Lab 1* (Capacity: 75)
    - *Executive Conference Room* (Capacity: 40)
  - Seed Authorities:
    - `emp_auditorium` $\rightarrow$ Authorized for *Main Auditorium* only
    - `emp_seminar` $\rightarrow$ Authorized for *APJ Seminar Hall* only

---

## 3. Phase B: Authentication, Users & Role-Based Access Control (RBAC)

### 🔨 Tasks:
- [x] **Password Security**:
  - `bcrypt.hash(password, 10)` on registration/password set (`lib/auth.ts`, `app/api/auth/register/route.ts`).
  - `bcrypt.compare(password, hash)` on login (`app/api/auth/login/route.ts`).
- [x] **Token / Session Management**:
  - JWT generation on login payload with: `{ userId, email, role, name, iat, exp }`.
  - HTTP-only cookie (`auth_token`) + Bearer token header handling.
- [x] **API Endpoints**:
  - `POST /api/auth/register`: Create Student/Faculty user with department & phone, hashed password & JWT cookie.
  - `POST /api/auth/login`: Authenticate email/password via bcrypt and return JWT with audit logging.
  - `POST /api/auth/logout`: Clear session/cookie with audit log record.
  - `GET /api/auth/me`: Return current user profile with role permissions & active assigned venue authorities.
- [x] **Server-Side Authorization Middleware**:
  - Route guard `getAuthUser(request)` extracting credentials from Bearer header or HTTP-only cookies.
  - Reject unauthorized requests with `401 Unauthorized` or `403 Forbidden`.

---

## 4. Phase C: Venue Management & Venue-Specific Authority Matrix

### 🔨 Key Business Rule:
> **An Employee/Faculty/Approver can approve a booking ONLY if an Admin has assigned that employee authority for that PARTICULAR venue.**  
> *(e.g., Employee A authorized for Auditorium CANNOT approve Seminar Hall bookings).*

### 🔨 Tasks:
- [x] **Venue Management Backend**:
  - `GET /api/venues`: List all active venues (with optional filters: min capacity, venue type, search).
  - Seeded 4 default venues (Main Auditorium, APJ Seminar Hall, CS Lab 1, Executive Conference Room).
- [x] **Employee Profile Management**:
  - `employees` table mapped 1:1 with users via FK, tracking designation, code, and department.
- [x] **Venue Authority Matrix Engine**:
  - `GET /api/admin/authorities`: View complete matrix of `(Employee, Venue, Status)`.
  - `POST /api/admin/authorities`: Admin assigns an employee authority over a specific venue with notification and audit logging.
  - `DELETE /api/admin/authorities?id=[id]`: Admin revokes authority with notification and audit trail.
  - Composite unique constraint `@@unique([employee_id, venue_id])` prevents duplicate assignment.

---

## 5. Phase D: Booking Engine & Overlap Conflict Detection

### 🔨 Overlap Detection Logic:
A requested time interval $[S_{\text{req}}, E_{\text{req}}]$ conflicts with an existing interval $[S_{\text{exist}}, E_{\text{exist}}]$ on the same date and venue if:
$$\text{Conflict} \iff (S_{\text{exist}} < E_{\text{req}}) \land (E_{\text{exist}} > S_{\text{req}})$$
*(Considering only active bookings where $\text{status} \in \{\text{'PENDING'}, \text{'APPROVED'}\}$).*

### 🔨 Tasks:
- [x] **Backend Validation Rules**:
  - `start_time < end_time` (Strict temporal constraint)
  - `event_date >= CURRENT_DATE` (Horizon past-date guard)
  - `expected_attendees <= venue.capacity` (Capacity rule violation prevention)
  - `expected_attendees > 0` (Positive integer domain constraint)
  - Venue `status === 'ACTIVE'`
- [x] **Slot Availability Query**:
  ```sql
  SELECT * FROM bookings
  WHERE venue_id = $1
    AND event_date = $2
    AND status IN ('PENDING', 'APPROVED')
    AND start_time < $4
    AND end_time > $3;
  ```
- [x] **API Endpoints**:
  - `GET /api/bookings?venueId=...&status=...&date=...`: Returns booked time slots and records with B-Tree composite index lookup.
  - `POST /api/bookings`: Submits a new booking request in `PENDING` state with full interval collision validation.
  - `POST /api/bookings/concurrent-safe`: Concurrency-safe reservations utilizing row-level locks (`SELECT FOR UPDATE`).
  - `GET /api/dashboard`: Returns current user's role workspace, booking list, and live status badges.

---

## 6. Phase E: PostgreSQL Concurrency Control & ACID Transactions

### 🔨 The Concurrency Challenge:
When **Student A** and **Student B** submit requests for the same venue and time slot simultaneously, a naive system will execute two read checks that both return "Available", creating a double booking.

### 🔨 PostgreSQL Concurrency Strategy Tasks:
- [x] **Transactional Booking Implementation (`POST /api/bookings/concurrent-safe`)**:
  - Use `BEGIN TRANSACTION` with appropriate isolation (`READ COMMITTED` with Row Locking, or `SERIALIZABLE`).
  - Use PostgreSQL pessimistic row locking:
    ```sql
    -- Lock the venue record to serialize concurrent bookings on this specific venue
    SELECT venue_id FROM venues WHERE venue_id = $1 FOR UPDATE;
    ```
  - Re-verify availability inside the transaction block.
  - If conflicting booking exists: `ROLLBACK` and return HTTP `409 Conflict` with error message `"Time slot has just been reserved by another user."`
  - If clear: `INSERT INTO bookings (...) VALUES (...)` $\rightarrow$ `COMMIT`.
- [x] **ACID Verification Logging**:
  - **Atomicity**: Either booking + notification + audit log all commit, or nothing commits on error.
  - **Consistency**: Database constraints (capacity check, valid status transitions) are never violated.
  - **Isolation**: Concurrent transactions cannot read intermediate uncommitted states.
  - **Durability**: Committed bookings are safely written to WAL and PostgreSQL tables.
- [x] **Live Interactive Concurrency Demo Route (`/api/demo/concurrency-test`)**:
  - Fires two concurrent asynchronous requests ($Request_A$ and $Request_B$) targeting the exact same venue and time slot via `Promise.all()`.
  - Captures timestamps, transaction IDs, locking delays, and shows that exactly **one succeeds** with HTTP 201 and the **other is rejected** with HTTP 409.

---

## 7. Phase F: Approval Workflow, In-App Notifications & Audit Trail

### 🔨 Tasks:
- [x] **Server-Side Authority Verification**:
  - When employee submits approval/rejection for `booking_id`:
    1. Look up `booking.venue_id`.
    2. Query `venue_authority` table for `employee_id = current_user.employee_id` AND `venue_id = booking.venue_id` AND `status = 'ACTIVE'`.
    3. If no matching record: **Block with 403 Forbidden ("Unauthorized: You do not possess venue authority over this facility")**.
    4. If authorized: Proceed with status update.
- [x] **Status Transitions**:
  - Allowed transitions: `PENDING` $\rightarrow$ `APPROVED`, `PENDING` $\rightarrow$ `REJECTED`, `PENDING` $\rightarrow$ `CANCELLED`.
  - Disallowed transitions: Terminal state protection.
- [x] **Approval APIs**:
  - `GET /api/approvals/pending`: Returns only pending requests for venues the employee is authorized to approve.
  - `POST /api/approvals`: Records approval/rejection action, remarks, and employee ID in `approvals` table, updates `bookings.status`, sends notification, logs audit trail.
- [x] **In-App Notifications**:
  - Event triggers:
    - Booking Created $\rightarrow$ Notifications dispatched inside transaction.
    - Booking Approved $\rightarrow$ Requester notified with remarks.
    - Booking Rejected $\rightarrow$ Requester notified with remarks.
    - Authority Assigned $\rightarrow$ Employee notified of assigned venue.
- [x] **Audit Logging Subsystem**:
  - Auto-record critical events to `audit_logs` table (`LOGIN`, `BOOKING_CREATED_TRANSACTIONAL`, `BOOKING_APPROVED`, `BOOKING_REJECTED`, `VENUE_AUTHORITY_ASSIGNED`, `VENUE_AUTHORITY_REVOKED`, `UNAUTHORIZED_APPROVAL_ATTEMPT`).
  - `GET /api/audit-logs` endpoint with action filter and pagination.
  - `AuditTrailViewer.tsx` component in dashboard for non-repudiation inspection.

---

## 8. Phase G: Operating Systems (OS) Concepts Lab & Interactive Simulators

### 🔨 Tasks:

### A. Process Scheduling Simulator (`/os-lab/scheduling`)
- [x] **Process Queue Input Builder**:
  - Allows user to add, edit, remove processes (Process ID $P_i$, Arrival Time $AT$, Burst Time $BT$, Priority).
  - Pre-loaded test cases (Standard textbook scenarios).
- [x] **3 Algorithm Implementations**:
  1. **FCFS (First-Come, First-Served)**: Order of arrival.
  2. **Priority Scheduling (Non-Preemptive & Preemptive)**: Order of highest priority.
  3. **Round Robin (RR)**: Configurable Time Quantum ($TQ = 2, 3, 4\dots$).
- [x] **Output Calculation**:
  - Completion Time ($CT$)
  - Turnaround Time ($TAT = CT - AT$)
  - Waiting Time ($WT = TAT - BT$)
  - Response Time ($RT$)
  - Average Waiting Time & Average Turnaround Time.
- [x] **Interactive Visual Gantt Chart**:
  - Horizontal timeline representation with colored process blocks and time tick markers.

### B. Critical Section & Synchronization Module (`/os-lab/synchronization`)
- [x] **Critical Section Concept Visualizer**:
  - Identify the 3-step critical section in Venue Booking:
    1. *Read Availability*
    2. *Allocate Venue*
    3. *Update Database State*
  - Live Concurrency Race Test (`/api/demo/concurrency-test`) demonstrating row-level locking.
- [x] **Synchronization Primitives Demo**:
  - Connection to PostgreSQL `SELECT ... FOR UPDATE` row-level locks.

### C. Deadlock Simulator (`/os-lab/deadlock`)
- [x] **Four Necessary Conditions Demonstration**:
  1. Mutual Exclusion
  2. Hold and Wait
  3. No Preemption
  4. Circular Wait
- [x] **Resource Allocation Graph (RAG) Visualizer**:
  - Process $P_1$ holds Resource $R_1$ (Auditorium) and requests $R_2$ (Seminar Hall).
  - Process $P_2$ holds Resource $R_2$ (Seminar Hall) and requests $R_1$ (Auditorium).
  - Visual circular wait cycle detection $\rightarrow$ Deadlock state.
  - Action buttons to eliminate Coffman conditions (Break Circular Wait, Break Hold & Wait).

### D. Banker's Algorithm Simulator (`/os-lab/bankers`)
- [x] **Interactive Matrix Inputs**:
  - Number of Processes ($n$) and Resources ($m$, Auditorium, Seminar Hall, CS Lab).
  - **Allocation Matrix** $[n \times m]$
  - **Max Matrix** $[n \times m]$
  - **Available Vector** $[1 \times m]$
- [x] **Algorithm Execution**:
  - Auto-compute **Need Matrix**: $\text{Need}[i][j] = \text{Max}[i][j] - \text{Allocation}[i][j]$.
  - Execute Safety Algorithm step-by-step with `Work` and `Finish` vectors.
  - Display whether the system is in a **Safe State** or **Unsafe State**.
  - Output the **Safe Sequence** (e.g., $\langle P_1 \to P_0 \to P_2 \rangle$).
  - **Resource Request Algorithm**: Test if an incoming request from $P_i$ can be safely granted.

---

## 9. Phase H: Database Management Systems (DBMS) Academic Lab

### 🔨 Tasks (`/dbms-lab`):
- [x] **Interactive ER Diagram & Relational Schema**:
  - Visual representation of Entities: `User`, `Venue`, `Employee`, `VenueAuthority`, `Booking`, `Approval`, `Notification`, `AuditLog`.
  - Cardinality indicators: $1:N$, $N:M$ (resolved via associative tables).
- [x] **Normalization Walkthrough**:
  - Step-by-step breakdown: Unnormalized Form (UNF) $\to$ 1NF $\to$ 2NF $\to$ 3NF / BCNF.
  - Justification of why `venue_authority` is separated from `employees` and `venues`.
- [x] **Live SQL Query Playground**:
  - Interactive SQL executor with sample pre-built queries:
    - **Query 1 (JOIN)**: Join `users + bookings + venues` to list all bookings with student names and venue details.
    - **Query 2 (Authority JOIN)**: Join `employees + venue_authority + venues` to show who can approve which venue.
    - **Query 3 (Aggregations & GROUP BY)**: Count total bookings per venue grouped by status.
    - **Query 4 (Departmental Utilization)**: Total hours booked per department.
    - **Query 5 (Subquery & Overlap)**: Find venues with no bookings on a selected date.
- [x] **ACID Properties Visualizer**:
  - Interactive walkthrough of a booking transaction explaining Atomicity, Consistency, Isolation, and Durability.
  - PostgreSQL transaction lifecycle: `BEGIN` $\to$ Query $\to$ Lock $\to$ `COMMIT` / `ROLLBACK`.

---

## 10. Phase I: Role-Specific User Interfaces & Dashboards

### 🔨 Tasks:

### A. Student & Faculty Dashboard (`/dashboard/student`)
- [ ] **Venue Directory & Search**:
  - Filter by capacity, venue type (Auditorium, Seminar Hall, Lab), and location.
  - Real-time availability indicator.
- [ ] **Interactive Booking Modal / Wizard**:
  - Step 1: Select Venue & Date.
  - Step 2: Select Start Time & End Time (with visual calendar/slot picker).
  - Step 3: Enter Event Name, Description, Expected Attendees.
  - Step 4: Submit request $\rightarrow$ Immediate confirmation with `PENDING` status.
- [ ] **My Bookings Tab**:
  - Tabs for `All`, `Pending`, `Approved`, `Rejected`, `Cancelled`.
  - Action to cancel a pending booking.
- [ ] **Notification Center**:
  - Unread badge counter, slide-out notification drawer.

### B. Employee / Approver Dashboard (`/dashboard/employee`)
- [ ] **Assigned Venues Overview**:
  - Displays list of venues the current employee is authorized to manage.
- [ ] **Pending Approvals Inbox**:
  - Table of pending booking requests restricted to authorized venues.
  - Detailed modal view: Requester details, department, purpose, attendees vs capacity.
  - Actions: **Approve** or **Reject** with mandatory/optional remarks.
- [ ] **Approval History Tab**:
  - History of all past decisions made by this employee.

### C. Admin Dashboard (`/dashboard/admin`)
- [ ] **System Overview Metrics**:
  - Total Venues, Total Bookings, Active Authorities, Today's Scheduled Events.
- [ ] **Venue Management Panel**:
  - Add new venue, edit capacity/details, toggle active status.
- [ ] **Authority Assignment Matrix**:
  - Interactive matrix: Rows = Employees, Columns = Venues.
  - Toggle switch or checkbox to grant/revoke authority in 1 click.
- [ ] **All Bookings Master View**:
  - Searchable, filterable table of all system bookings.
- [ ] **System Audit Log Explorer**:
  - Filter logs by action type, user, date range.

---

## 11. Phase J: Analytics, Reports & Audit Logging

### 🔨 Tasks (`/dashboard/reports`):
- [ ] **Analytics Engine (SQL Aggregation Backend)**:
  - `GET /api/reports/summary`: Total counts (Venues, Bookings, Approved, Pending, Rejected, Cancelled).
  - `GET /api/reports/venue-utilization`: % occupancy and booking hours per venue.
  - `GET /api/reports/department-stats`: Booking distribution across Academic Departments (CS, Mechanical, Electrical, Management).
  - `GET /api/reports/peak-hours`: Most requested time slots of the day.
- [ ] **Visual Charts & Data Tables**:
  - Bar charts and donut charts for venue utilization and status breakdowns.
  - Export report summary table to CSV / Print view.

---

## 12. Phase K: Testing Suite & Verification Harness

### 🔨 Tasks:
- [x] **Automated / Reproducible Test Scripts**:
  1. `test-login-valid`: Test successful authentication and JWT issuance (`scripts/test-phase2-defense.ts`).
  2. `test-login-invalid`: Test rejection of bad passwords with bcrypt (`scripts/test-phase2-defense.ts`).
  3. `test-booking-valid`: Create a valid booking in empty time slot (`scripts/test-samridhi-defense.ts`).
  4. `test-booking-overlap`: Attempt to create overlapping booking $\rightarrow$ Expect 409 conflict error (`scripts/test-samridhi-defense.ts`).
  5. `test-booking-adjacent`: Book $[10:00 - 12:00]$ and $[12:00 - 14:00]$ on same venue $\rightarrow$ Expect success (No conflict) (`scripts/test-samridhi-defense.ts`).
  6. `test-concurrent-booking`: Send 2 parallel HTTP POST requests with exact same parameters $\rightarrow$ Expect 1 success, 1 failure (`/api/demo/concurrency-test`).
  7. `test-unauthorized-approval`: Employee attempts to approve venue they are NOT authorized for $\rightarrow$ Expect 403 Forbidden.
  8. `test-authorized-approval`: Employee approves venue they ARE authorized for $\rightarrow$ Expect 200 OK & Status = APPROVED.
  9. `test-booking-cancel`: User cancels pending booking $\rightarrow$ Expect status = CANCELLED.
  10. `test-capacity-validation`: Request booking with attendees > venue capacity $\rightarrow$ Expect validation error (`scripts/test-samridhi-defense.ts`).
  11. `test-scheduling-fcfs`: Verify FCFS math (CT, TAT, WT) (`lib/os/scheduler.ts`).
  12. `test-scheduling-rr`: Verify Round Robin Gantt chart and quantum preemption (`lib/os/scheduler.ts`).
  13. `test-bankers-safe`: Verify Banker's Algorithm produces correct safe sequence (`scripts/test-phase2-defense.ts`).
  14. `test-bankers-unsafe`: Verify Banker's Algorithm flags unsafe deadlock scenario (`scripts/test-phase2-defense.ts`).
  15. `test-audit-trail`: Verify audit log entry is written upon booking approval (`app/api/approvals/route.ts`).

---

## 13. Phase L: Live Demonstration Checklist for Phase 2 Defense

### 👩‍💻 Samridhi Thapa – Frontend & Booking Engine Defense:
*Test Suite: `pnpm exec tsx scripts/test-samridhi-defense.ts` (15/15 Passed)*
- [x] **DEMO S1: Conflict-Free Booking Allocation**
  - Open Bookings tab $\to$ Select venue $\to$ Fill event details with valid attendees $\le$ capacity $\to$ Submit request $\to$ Instant insertion with yellow `PENDING` badge.
- [x] **DEMO S2: Universal Interval Overlap Collision Prevention**
  - Click **"Simulate Conflict Test"** $\to$ Attempts to reserve an active slot $[S_{\text{req}}, E_{\text{req}}]$ colliding with $[S_{\text{exist}}, E_{\text{exist}}]$ $\to$ Detected via $(S_{\text{exist}} < E_{\text{req}}) \land (E_{\text{exist}} > S_{\text{req}})$ $\to$ Red HTTP 409 Conflict rejection banner.
- [x] **DEMO S3: Multi-Level Constraint Enforcement**
  - Attempts attendance $>$ capacity $\to$ Capacity rule violation.
  - Attempts start time $\ge$ end time $\to$ Temporal constraint violation.
  - Attempts historical date booking $\to$ Horizon past date guard rejection.
- [x] **DEMO S4: B-Tree Index Optimization**
  - Demonstrates $O(\log N)$ index seek using composite index `idx_bookings_lookup (venue_id, event_date, status, start_time, end_time)`.

### 👨‍💻 Akshat Dobhal – Auth, Concurrency & Academic Simulators Defense:
*Test Suite: `pnpm exec tsx scripts/test-phase2-defense.ts` (12/12 Passed)*
- [x] **DEMO A1: Bcrypt Cryptography & Stateless JWT Sessions**
  - 10-round salted bcrypt hashing, tamper-proof HMAC SHA-256 JWT payload inspection in `AuthDefenseWidget`.
- [x] **DEMO A2: Authority Matrix Isolation & Scoped Approvals**
  - Admin delegates venue authority $\to$ Approvals strictly restricted to authorized facilities (unauthorized blocked with HTTP 403).
- [x] **DEMO A3: Pessimistic Row Locking Concurrency Test**
  - Live Promise.all race condition test on `/api/demo/concurrency-test` $\to$ PostgreSQL `SELECT FOR UPDATE` serializes concurrent transactions.
- [x] **DEMO A4: Operating Systems Academic Simulators**
  - CPU Scheduling (FCFS / Priority / RR) Gantt charts, Bipartite RAG cycle deadlock detection, and Dijkstra's Banker's algorithm safe sequence discovery.
- [x] **DEMO A5: DBMS Academic Lab**
  - 3NF relational normalization schema visualizer, live read-only SQL query sandbox, and ARIES/WAL crash recovery lifecycle.

---

## 📌 Implementation Sequence & Roadmap
```
┌────────────────────────────────────────────────────────┐
│ Phase 1: Setup PostgreSQL DB, Schema, Seed & Auth API  │
└──────────────────────────┬─────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│ Phase 2: Venue Management & Venue Authority Matrix     │
└──────────────────────────┬─────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│ Phase 3: Booking Engine, Overlap Checks & Concurrency  │
└──────────────────────────┬─────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│ Phase 4: Approval Subsystem, Notifications & Auditing  │
└──────────────────────────┬─────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│ Phase 5: OS Lab (FCFS/RR/Priority/Deadlock/Banker's)   │
└──────────────────────────┬─────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│ Phase 6: DBMS Lab (ER, Normalization, Live SQL, ACID)  │
└──────────────────────────┬─────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│ Phase 7: Polish Dashboards, Reports & Test Suite       │
└────────────────────────────────────────────────────────┘
```
