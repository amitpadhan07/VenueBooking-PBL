# 🏛️ Smart Venue Booking & Management System
> **An OS & DBMS-Driven Approach for Concurrent Venue Allocation, Authority-Based Approvals, and Resource Synchronization**

[![Next.js 16](https://img.shields.io/badge/Next.js-16.3-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-336791?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-6.4-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![Phase 2 Defense](https://img.shields.io/badge/Phase_2_Defense-12%2F12_Passed_(100%25)-emerald?style=for-the-badge)](./scripts/test-phase2-defense.ts)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

---

## 📖 Executive Summary

The **Smart Venue Booking & Management System** is a Project-Based Learning (PBL) system designed for academic institutions, enterprise campuses, and research facilities. It addresses the fundamental challenges of modern campus facility allocation: **unauthorized approvals**, **scheduling overlap conflicts**, and **concurrency race conditions** (double-booking when multiple users attempt to reserve the same slot at the exact same millisecond).

Beyond standard administrative booking tools, the system functions as an **Interactive Academic Laboratory** connecting theoretical **Operating Systems (OS)** and **Database Management Systems (DBMS)** concepts directly to production-grade full-stack engineering:
* **OS Principles**: CPU Process Scheduling (FCFS, Priority, Round Robin), Critical Section Synchronization, Mutexes, Deadlock Circular Wait Detection via Resource Allocation Graphs (RAG), and Banker's Algorithm for Deadlock Avoidance.
* **DBMS Principles**: 3NF/BCNF Relational Normalization, Entity-Relationship (ER) Modeling, Composite Key Constraints, ACID Transactions, Write-Ahead Logging (WAL), and Pessimistic Row-Level Locking (`SELECT ... FOR UPDATE`).

---

## 🌟 Core System Architecture

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             CAMPUS USERS & ROLES                                 │
│  [Student / Faculty]       [Venue Approver / Employee]         [Administrator]   │
└──────────────┬──────────────────────────┬───────────────────────────────┬────────┘
               │                          │                               │
               ▼                          ▼                               ▼
     ┌──────────────────┐       ┌──────────────────┐            ┌──────────────────┐
     │  Request Venue   │       │ Approve / Reject │            │ Manage Venues &  │
     │ & Overlap Check  │       │ Venue Authority  │            │ Authority Matrix │
     └─────────┬────────┘       └─────────┬────────┘            └─────────┬────────┘
               │                          │                               │
               ▼                          ▼                               ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                   CONCURRENCY & TRANSACTION EXECUTION ENGINE                     │
│    • Pessimistic Row-Level Locking (`SELECT FOR UPDATE`)                         │
│    • Interval Conflict Verification: (S_exist < E_req) ∧ (E_exist > S_req)        │
│    • ACID Transaction Boundary (Atomicity, Consistency, Isolation, Durability)   │
│    • Immutable Audit Trail & In-App Notification Triggers                        │
└─────────────────────────────────────────┬────────────────────────────────────────┘
                                          ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                   ACADEMIC SIMULATION & INTERACTIVE LABS                         │
│  [OS Scheduling Lab]    [Deadlock & Banker's Lab]    [DBMS & SQL Query Lab]      │
│   • FCFS / Priority / RR • RAG Circular Wait Graph    • Live SQL Playground      │
│   • Dynamic Gantt Charts • Safe Sequence Discovery   • ACID / WAL Visualizer     │
│   • Interactive Metrics  • Coffman Conditions Demo   • 3NF Schema Inspector      │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Key Modules & Capabilities

### 1. 🔐 Role-Based Access Control (RBAC) & Venue Authority Matrix
* **Fine-Grained Role Hierarchy**: Built-in support for `STUDENT`, `FACULTY`, `EMPLOYEE` (Approver), and `ADMIN`.
* **Venue-Specific Authority Matrix**: Approvals are strictly scoped. An employee assigned to the *Main Auditorium* cannot approve or reject requests for the *Seminar Hall* unless explicitly delegated by an Administrator via the `venue_authority` mapping table.
* **Security & Tokens**: Password hashing with `bcrypt` (work factor 10) and stateless JWT-based session tokens signed with HMAC SHA-256.

### 2. ⚡ Conflict Detection & Overlap Engine
* **Interval Overlap Arithmetic**: Validates incoming intervals $[S_{\text{req}}, E_{\text{req}}]$ against existing active bookings $[S_{\text{exist}}, E_{\text{exist}}]$:
  $$\text{Conflict} \iff (S_{\text{exist}} < E_{\text{req}}) \land (E_{\text{exist}} > S_{\text{req}})$$
* **Zero Adjacent Slot Conflicts**: Correctly allows back-to-back reservations (e.g., 10:00–12:00 followed immediately by 12:00–14:00) without false-positive collisions.
* **Capacity & Horizon Guards**: Enforces attendee thresholds against venue limits and prevents historical date bookings.

### 3. 🔒 Concurrency Control & ACID Transactions
* **Pessimistic Row-Level Locking**: Employs PostgreSQL row locks (`SELECT venue_id FROM venues WHERE venue_id = $1 FOR UPDATE`) during slot checkout.
* **Race Condition Defense**: Prevents simultaneous dual bookings submitted at the exact same millisecond. One transaction acquires the lock and commits; the conflicting transaction rolls back and receives an informative `409 Conflict`.
* **Full Audit Trail**: Real-time alerts and immutable audit log records for every status transition (`PENDING` $\to$ `APPROVED` / `REJECTED` / `CANCELLED`).

---

## 🧪 Interactive Academic Labs

### 💻 Operating Systems (OS) Lab
| Lab Module | Topics Covered | Key Interactive Features |
| :--- | :--- | :--- |
| **CPU Scheduling Simulator** | FCFS, Non-Preemptive & Preemptive Priority, Round Robin (RR) | Dynamic process table builder, custom time quantum ($TQ$), live SVG Gantt chart, instant calculation of Completion Time ($CT$), Turnaround Time ($TAT$), Waiting Time ($WT$), and Response Time ($RT$). |
| **Critical Section Visualizer** | Race conditions, Mutual Exclusion, Semaphores | Visual comparison of interleaved unsynchronized threads vs. Mutex-protected venue checkout (`SELECT FOR UPDATE`). |
| **Deadlock Simulator** | 4 Coffman Conditions, Resource Allocation Graphs (RAG) | Directed bipartite graph $G = (V, E)$, DFS-based circular wait cycle detection, interactive resolution triggers. |
| **Banker's Algorithm Lab** | Deadlock avoidance, Safety check, Resource requests | Dynamic $n \times m$ Allocation, Max, and Available matrices; auto-calculated Need matrix; step-by-step Work/Finish animation; safe sequence generator ($\langle P_1 \to P_0 \to P_2 \rangle$). |

### 🗄️ Database Management Systems (DBMS) Lab
| Lab Module | Topics Covered | Key Interactive Features |
| :--- | :--- | :--- |
| **Interactive Relational Schema** | Entity-Relationship (ER) model, Cardinalities | Visual diagram mapping $1:1$, $1:N$, and $N:M$ associative mappings across 8 tables. |
| **Normalization Studio** | UNF $\to$ 1NF $\to$ 2NF $\to$ 3NF / BCNF | Step-by-step breakdown illustrating how composite functional dependencies are decomposed into normalized tables. |
| **Live SQL Query Playground** | Multi-table JOINs, Aggregations, Subqueries | Pre-loaded academic query suite (utilization by department, peak booking hours, authority lookup) with instant tabular output. |
| **ACID & WAL Lifecycle Visualizer** | Transaction States, Write-Ahead Logging | Interactive lifecycle stepper (`BEGIN` $\to$ Lock Acquisition $\to$ Constraint Validation $\to$ Commit/Rollback). |

---

## 📊 Database Schema Architecture

The database is structured in **3rd Normal Form (3NF)** across 8 core relational entities:

```mermaid
erDiagram
    USERS ||--o{ BOOKINGS : places
    USERS ||--o{ EMPLOYEES : "promoted to"
    USERS ||--o{ NOTIFICATIONS : receives
    USERS ||--o{ AUDIT_LOGS : triggers
    VENUES ||--o{ BOOKINGS : hosts
    VENUES ||--o{ VENUE_AUTHORITY : assigned_to
    EMPLOYEES ||--o{ VENUE_AUTHORITY : holds
    EMPLOYEES ||--o{ APPROVALS : decides
    BOOKINGS ||--o{ APPROVALS : evaluated_in
    BOOKINGS ||--o{ NOTIFICATIONS : references

    USERS {
        uuid user_id PK
        string name
        string email UK
        string password_hash
        string role "STUDENT | FACULTY | EMPLOYEE | ADMIN"
        string department
        string phone
        timestamp created_at
    }

    VENUES {
        uuid venue_id PK
        string venue_name UK
        string location
        int capacity
        string venue_type
        string status "ACTIVE | MAINTENANCE | INACTIVE"
    }

    EMPLOYEES {
        uuid employee_id PK
        uuid user_id FK,UK
        string employee_code UK
        string designation
        string department
    }

    VENUE_AUTHORITY {
        uuid authority_id PK
        uuid employee_id FK
        uuid venue_id FK
        uuid assigned_by FK
        string status "ACTIVE | REVOKED"
    }

    BOOKINGS {
        uuid booking_id PK
        uuid user_id FK
        uuid venue_id FK
        string event_name
        text event_description
        date event_date
        time start_time
        time end_time
        int expected_attendees
        string status "PENDING | APPROVED | REJECTED | CANCELLED"
    }

    APPROVALS {
        uuid approval_id PK
        uuid booking_id FK
        uuid employee_id FK
        string action "APPROVED | REJECTED"
        text remarks
        timestamp action_at
    }

    NOTIFICATIONS {
        uuid notification_id PK
        uuid user_id FK
        uuid booking_id FK
        string title
        text message
        boolean is_read
        timestamp created_at
    }

    AUDIT_LOGS {
        uuid log_id PK
        uuid user_id FK
        string action
        string entity_type
        string entity_id
        jsonb details
        timestamp created_at
    }
```

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | [Next.js 16 (App Router + Turbopack)](https://nextjs.org/) | Server & Client components, ultra-fast Turbopack compilation. |
| **UI Library** | [React 19](https://react.dev/) | Modern state primitives and concurrent rendering. |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) | Curated design system, accessible components, dark/light theme support. |
| **Icons & Visuals** | [Lucide React](https://lucide.dev/) | Consistent icons throughout simulators and dashboards. |
| **Language** | [TypeScript 5.7+](https://www.typescriptlang.org/) | Strict type safety across frontend and API handlers. |
| **Database** | [PostgreSQL 16+](https://www.postgresql.org/) | Robust ACID compliance, relational integrity, row-level locking. |
| **ORM & Migrations** | [Prisma 6.4](https://www.prisma.io/) | Type-safe queries, schema migrations, and connection pooling. |
| **Authentication** | Stateless JWT + `bcryptjs` | Secure password hashing (cost 10) and HMAC SHA-256 session tokens. |

---

## 📂 Project Directory Layout

```
VenueBooking-PBL/
├── app/                                  # Next.js App Router
│   ├── api/                              # REST API Route Handlers
│   │   ├── admin/authorities/            # Authority matrix delegation & revocation
│   │   ├── approvals/                    # Authority-verified booking decisions
│   │   ├── approvals/pending/            # Scoped pending inbox for approvers
│   │   ├── audit-logs/                   # Immutable audit trail & non-repudiation
│   │   ├── auth/                         # login, register, me, logout
│   │   ├── bookings/                     # Standard booking submissions
│   │   ├── bookings/concurrent-safe/     # Concurrency-safe reservations (row locks)
│   │   ├── dashboard/                    # Real-time metrics & session identity
│   │   ├── dbms/query/                   # Live read-only SQL execution sandbox
│   │   └── demo/concurrency-test/        # Live Promise.all race test
│   ├── globals.css                       # CSS variables & Tailwind v4 design system
│   ├── layout.tsx                        # Root layout & providers
│   └── page.tsx                          # Primary interactive SPA & role switcher
├── components/                           # UI Component Library
│   ├── admin/
│   │   └── VenueAuthorityPanel.tsx       # Venue delegation matrix table & modal
│   ├── audit/
│   │   └── AuditTrailViewer.tsx          # Real-time audit log stream & filters
│   ├── auth/
│   │   └── AuthDefenseWidget.tsx         # Bcrypt work factor & JWT session inspector
│   ├── dbms/
│   │   └── DBMSAcademicLab.tsx           # ER Diagram, Normalization, SQL Playground
│   ├── employee/
│   │   └── PendingApprovalsInbox.tsx     # Approver inbox with venue authority check
│   ├── os/
│   │   ├── OSAcademicLab.tsx             # OS Simulator navigation container
│   │   ├── ProcessSchedulerSimulator.tsx # FCFS, Priority, Round Robin Gantt chart
│   │   ├── DeadlockSimulator.tsx         # RAG bipartite graph & cycle detection
│   │   └── BankersAlgorithmSimulator.tsx # Banker's algorithm & safe sequence generator
│   └── ui/                               # Reusable button, card, modal primitives
├── lib/                                  # Server & Client Libraries
│   ├── auth.ts                           # JWT signing, verification & cookie management
│   ├── prisma.ts                         # Global Prisma client singleton
│   ├── utils.ts                          # Class variance authority & string utilities
│   └── os/
│       ├── bankers.ts                    # Banker's safety & request algorithm core
│       ├── deadlock.ts                   # Bipartite graph cycle detection (DFS)
│       └── scheduler.ts                  # FCFS, Priority, Round Robin scheduling engine
├── prisma/
│   ├── schema.prisma                     # 8 normalized PostgreSQL entities & indexes
│   └── seed.ts                           # Demo seed dataset
├── scripts/
│   ├── test-phase2-defense.ts            # 12-point automated academic test harness
│   └── verify.ts                         # Database connectivity & count inspector
├── PENDING_TASKS.md                      # Engineering roadmap & completion matrix
├── package.json                          # Project dependencies & npm scripts
└── README.md                             # Project documentation
```

---

## ⚡ Getting Started & Local Setup

### Prerequisites
* **Node.js**: `v18.18.0` or higher (Node 20+ recommended)
* **Package Manager**: `pnpm` (recommended), `npm`, or `yarn`
* **PostgreSQL Database**: Local PostgreSQL server (v14+) or managed cloud instance (Neon, Render, Supabase, AWS RDS)

### 1. Clone the Repository
```bash
git clone https://github.com/amitpadhan07/VenueBooking-PBL.git
cd VenueBooking-PBL
```

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Configure Environment Variables
Create a `.env` file in the project root:
```env
# PostgreSQL Database Connection
DATABASE_URL="postgresql://username:password@localhost:5432/venuebooking?schema=public"

# Authentication & JWT Secrets
JWT_SECRET="your-super-secure-jwt-secret-key-change-in-production"
NEXTAUTH_SECRET="your-nextauth-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Application URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Database Setup & Migrations
```bash
# Push schema migrations to PostgreSQL
pnpm prisma db push

# (Optional) Seed demo users, venues, and authority matrix
pnpm prisma db seed
```

### 5. Launch the Development Server
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Default Seeded Demo Credentials

| Role | Email | Password | Assigned Venues / Permissions |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@college.edu` | `admin123` | Full system control, venue CRUD, authority delegation matrix |
| **Auditorium Approver** | `emp_auditorium@college.edu` | `emp123` | Approver for *Main Auditorium* only |
| **Seminar Hall Approver** | `emp_seminar@college.edu` | `emp123` | Approver for *APJ Abdul Kalam Seminar Hall* only |
| **HOD / Lab Approver** | `emp_hod@college.edu` | `emp123` | Approver for *CS Department Lab 1* only |
| **Faculty Member** | `faculty1@college.edu` | `faculty123` | Submit bookings, view departmental statistics |
| **Student** | `student1@college.edu` | `student123` | Browse catalog, check availability, place requests |

---

## 📡 REST API Reference

### 🔐 Authentication (`/api/auth`)
* `POST /api/auth/register` — Register a student or faculty account (`bcrypt` cost 10, sets JWT cookie).
* `POST /api/auth/login` — Authenticate credentials, log audit event, and return JWT.
* `GET /api/auth/me` — Return the logged-in user profile, role, and authorized venues.
* `POST /api/auth/logout` — Clear session cookie and record logout audit log.

### 🏢 Venue Authorities (`/api/admin/authorities`)
* `GET /api/admin/authorities` — *(Admin)* Fetch complete matrix of employees and delegated venue rights.
* `POST /api/admin/authorities` — *(Admin)* Delegate approval rights for a venue to an employee.
* `DELETE /api/admin/authorities?id=[authority_id]` — *(Admin)* Revoke assigned authority.

### ✍️ Approvals Workflow (`/api/approvals`)
* `GET /api/approvals/pending` — Fetch pending requests strictly scoped to venues authorized to the approver.
* `POST /api/approvals` — Submit an `APPROVED` or `REJECTED` decision with remarks (enforces 403 if unauthorized).

### 📅 Bookings & Concurrency
* `POST /api/bookings` — Submit a booking request in `PENDING` state with overlap conflict validation.
* `POST /api/bookings/concurrent-safe` — Concurrency-guarded booking using PostgreSQL `SELECT ... FOR UPDATE` row-level locks.
* `GET /api/demo/concurrency-test` — Live race simulation firing concurrent simultaneous reservations.

### 📊 Dashboard & Audits
* `GET /api/dashboard?role=[role]` — Fetch role-specific operational metrics, venue list, bookings, and alerts.
* `GET /api/audit-logs` — Fetch immutable system audit logs with filtering and non-repudiation details.
* `POST /api/dbms/query` — Execute read-only academic SQL queries in the live DBMS playground.

---

## 🎓 Academic Defense & Verification Suite

The repository includes an automated 12-point verification harness validating the core OS & DBMS defense requirements:

```bash
pnpm exec tsx scripts/test-phase2-defense.ts
```

### Defense Test Coverage:
```
========================================================
📋 PHASE 2 DEFENSE VERIFICATION HARNESS
========================================================

--- TEST 1: Bcrypt Password Cryptography ---
✅ [PASS] Password hashed with bcrypt work factor 10
✅ [PASS] Correct password verifies successfully against bcrypt hash
✅ [PASS] Invalid password is strictly rejected

--- TEST 2: Stateless JWT Session Architecture ---
✅ [PASS] JWT signed with HMAC SHA-256 (Header.Payload.Signature)
✅ [PASS] JWT decoded and verified with matching claims

--- TEST 3: Banker’s Algorithm Safety & Safe Sequence ---
✅ [PASS] System verified in SAFE STATE
✅ [PASS] Safe sequence computed accurately: ⟨ P1 ➔ P0 ➔ P2 ⟩
✅ [PASS] Valid safe resource request is granted by Banker's Algorithm
✅ [PASS] Excessive resource request is safely rejected/blocked

--- TEST 4: Resource Allocation Graph (RAG) Cycle Detection ---
✅ [PASS] Circular wait cycle correctly flagged as DEADLOCK
✅ [PASS] Identified cycle path: P1 ➔ R2 ➔ P2 ➔ R1 ➔ P1
✅ [PASS] Cycle-free graph correctly verified as DEADLOCK-FREE

========================================================
📊 FINAL RESULT: 12 / 12 TESTS PASSED (100%)
========================================================
```

---

## 🗺️ Project Implementation Status

| Milestone | Status | Description |
| :--- | :---: | :--- |
| **Phase 1: UI Foundation** | ✅ Completed | Responsive dark/light theme, modern navigation, and workspace layout. |
| **Phase 2: PostgreSQL Schema & RBAC** | ✅ Completed | 8 normalized 3NF tables, Prisma ORM, bcrypt hashing, and JWT sessions. |
| **Phase 3: Authority Matrix** | ✅ Completed | Scoped venue authority delegation, composite unique constraints, 403 guard. |
| **Phase 4: Overlap Conflict Engine** | ✅ Completed | Interval conflict arithmetic $[S_{\text{exist}} < E_{\text{req}}] \land [E_{\text{exist}} > S_{\text{req}}]$ & row locking. |
| **Phase 5: Approvals & Audit Trail** | ✅ Completed | Approver inbox, two-tier state machine, real-time alerts, immutable audit logs. |
| **Phase 6: OS Simulation Suite** | ✅ Completed | FCFS / Priority / RR Gantt charts, RAG Deadlock cycle detection, Banker's Algorithm. |
| **Phase 7: DBMS Academic Suite** | ✅ Completed | ER diagram visualizer, 3NF normalization guide, live SQL sandbox, ACID/WAL stepper. |
| **Phase 8: Automated Test Harness** | ✅ Completed | 12/12 defense test suite and live Promise.all race condition test. |

---

## 📄 License & Attribution

This project is open-source software licensed under the **[MIT License](https://opensource.org/licenses/MIT)**. Developed for coursework, academic demonstrations, and research in **Operating Systems** and **Database Management Systems**.

---

<div align="center">
  <sub>Developed with ❤️ for Academic Excellence in Computer Science & Engineering.</sub>
</div>
