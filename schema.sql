-- ==============================================================================
-- 📋 SMART VENUE BOOKING & MANAGEMENT SYSTEM (VenueDesk)
-- PBL Theme: An OS and DBMS Based Approach for Concurrent Venue Allocation and Approval
-- Lead Database Developer: Lavanya Joshi
-- Database: PostgreSQL 16+ (Render Cloud: venuedesk)
-- Dialect: Standard PostgreSQL DDL
-- ==============================================================================

-- Enable UUID extension for cryptographically secure identifier generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. ENUMERATION TYPES (DOMAIN INTEGRITY)
-- ==============================================================================

DO $$ BEGIN
    CREATE TYPE "Role" AS ENUM ('STUDENT', 'FACULTY', 'ADMIN', 'EMPLOYEE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "VenueStatus" AS ENUM ('ACTIVE', 'MAINTENANCE', 'INACTIVE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "AuthorityStatus" AS ENUM ('ACTIVE', 'REVOKED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ApprovalAction" AS ENUM ('APPROVED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==============================================================================
-- 2. CORE RELATIONAL TABLES (3NF NORMALIZED SCHEMA)
-- ==============================================================================

-- TABLE 1: users (Master directory of students, staff, faculty, and administrators)
CREATE TABLE IF NOT EXISTS "users" (
    "user_id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "department" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(20),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id"),
    CONSTRAINT "users_email_key" UNIQUE ("email"),
    CONSTRAINT "users_email_check" CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- TABLE 2: venues (Campus physical facilities inventory)
CREATE TABLE IF NOT EXISTS "venues" (
    "venue_id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "venue_name" VARCHAR(100) NOT NULL,
    "location" VARCHAR(200) NOT NULL,
    "capacity" INTEGER NOT NULL,
    "venue_type" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "status" "VenueStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "venues_pkey" PRIMARY KEY ("venue_id"),
    CONSTRAINT "venues_venue_name_key" UNIQUE ("venue_name"),
    CONSTRAINT "venues_capacity_check" CHECK (capacity > 0)
);

-- TABLE 3: employees (Extends users 1:1 for campus staff and venue approvers)
CREATE TABLE IF NOT EXISTS "employees" (
    "employee_id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "user_id" TEXT NOT NULL,
    "employee_code" VARCHAR(50) NOT NULL,
    "designation" VARCHAR(100) NOT NULL,
    "department" VARCHAR(100) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("employee_id"),
    CONSTRAINT "employees_user_id_key" UNIQUE ("user_id"),
    CONSTRAINT "employees_employee_code_key" UNIQUE ("employee_code"),
    CONSTRAINT "employees_user_id_fkey" FOREIGN KEY ("user_id") 
        REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- TABLE 4: venue_authority (Associative table resolving N:M delegation between employees and venues)
CREATE TABLE IF NOT EXISTS "venue_authority" (
    "authority_id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "employee_id" TEXT NOT NULL,
    "venue_id" TEXT NOT NULL,
    "assigned_by" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "AuthorityStatus" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "venue_authority_pkey" PRIMARY KEY ("authority_id"),
    CONSTRAINT "venue_authority_employee_id_venue_id_key" UNIQUE ("employee_id", "venue_id"),
    CONSTRAINT "venue_authority_employee_id_fkey" FOREIGN KEY ("employee_id") 
        REFERENCES "employees"("employee_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "venue_authority_venue_id_fkey" FOREIGN KEY ("venue_id") 
        REFERENCES "venues"("venue_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "venue_authority_assigned_by_fkey" FOREIGN KEY ("assigned_by") 
        REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- TABLE 5: bookings (Transactional table storing venue calendar slots)
CREATE TABLE IF NOT EXISTS "bookings" (
    "booking_id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "user_id" TEXT NOT NULL,
    "venue_id" TEXT NOT NULL,
    "event_name" VARCHAR(150) NOT NULL,
    "event_description" TEXT,
    "event_date" DATE NOT NULL,
    "start_time" VARCHAR(10) NOT NULL,
    "end_time" VARCHAR(10) NOT NULL,
    "expected_attendees" INTEGER NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("booking_id"),
    CONSTRAINT "bookings_attendees_check" CHECK (expected_attendees > 0),
    CONSTRAINT "bookings_time_order_check" CHECK (start_time < end_time),
    CONSTRAINT "bookings_user_id_fkey" FOREIGN KEY ("user_id") 
        REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "bookings_venue_id_fkey" FOREIGN KEY ("venue_id") 
        REFERENCES "venues"("venue_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- TABLE 6: approvals (Audit ledger of employee decisions on booking requests)
CREATE TABLE IF NOT EXISTS "approvals" (
    "approval_id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "booking_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "action" "ApprovalAction" NOT NULL,
    "remarks" TEXT,
    "action_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "approvals_pkey" PRIMARY KEY ("approval_id"),
    CONSTRAINT "approvals_booking_id_fkey" FOREIGN KEY ("booking_id") 
        REFERENCES "bookings"("booking_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "approvals_employee_id_fkey" FOREIGN KEY ("employee_id") 
        REFERENCES "employees"("employee_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- TABLE 7: notifications (Event-driven asynchronous alert records)
CREATE TABLE IF NOT EXISTS "notifications" (
    "notification_id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "user_id" TEXT NOT NULL,
    "booking_id" TEXT,
    "title" VARCHAR(150) NOT NULL,
    "message" TEXT NOT NULL,
    "notification_type" VARCHAR(50) NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("notification_id"),
    CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") 
        REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "notifications_booking_id_fkey" FOREIGN KEY ("booking_id") 
        REFERENCES "bookings"("booking_id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- TABLE 8: audit_logs (Tamper-evident system ledger capturing state mutations)
CREATE TABLE IF NOT EXISTS "audit_logs" (
    "log_id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "user_id" TEXT,
    "action" VARCHAR(100) NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" VARCHAR(100) NOT NULL,
    "details" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("log_id"),
    CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") 
        REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- ==============================================================================
-- 3. PERFORMANCE B-TREE INDEXES
-- ==============================================================================

-- Composite index for high-speed slot conflict lookup: (S_exist < E_req) AND (E_exist > S_req)
CREATE INDEX IF NOT EXISTS "idx_bookings_lookup" 
    ON "bookings"("venue_id", "event_date", "status", "start_time", "end_time");

-- Index for retrieving user personal booking history
CREATE INDEX IF NOT EXISTS "idx_user_bookings" 
    ON "bookings"("user_id", "status");

-- Index for rapid authority matrix verification: (employee_id, venue_id, status)
CREATE INDEX IF NOT EXISTS "idx_venue_authority" 
    ON "venue_authority"("employee_id", "venue_id", "status");

-- Index for booking approval history lookup
CREATE INDEX IF NOT EXISTS "idx_approvals_booking" 
    ON "approvals"("booking_id");

-- Index for user unread notification polling
CREATE INDEX IF NOT EXISTS "idx_notifications_user" 
    ON "notifications"("user_id", "is_read");

-- ==============================================================================
-- 4. INITIAL ACADEMIC SEED DATA (IN PURE SQL)
-- ==============================================================================

-- 4.1 Seed Users
INSERT INTO "users" ("user_id", "name", "email", "password_hash", "role", "department", "phone")
VALUES 
    ('u-admin-01', 'System Administrator', 'admin@college.edu', '$2b$10$dN1gqMZWD2gha...ePZ1eGjO3qS', 'ADMIN', 'Administration', '+91-9876543210'),
    ('u-emp-aud', 'Auditorium Manager', 'emp_auditorium@college.edu', '$2b$10$dN1gqMZWD2gha...ePZ1eGjO3qS', 'EMPLOYEE', 'Events & Facilities', '+91-9876543211'),
    ('u-emp-sem', 'Seminar Coordinator', 'emp_seminar@college.edu', '$2b$10$dN1gqMZWD2gha...ePZ1eGjO3qS', 'EMPLOYEE', 'Academic Affairs', '+91-9876543212'),
    ('u-emp-hod', 'CS Dept HOD', 'emp_hod@college.edu', '$2b$10$dN1gqMZWD2gha...ePZ1eGjO3qS', 'EMPLOYEE', 'Computer Science', '+91-9876543213'),
    ('u-std-01', 'Rahul Sharma', 'student1@college.edu', '$2b$10$dN1gqMZWD2gha...ePZ1eGjO3qS', 'STUDENT', 'Computer Science', '+91-9876543214'),
    ('u-std-02', 'Priya Patel', 'student2@college.edu', '$2b$10$dN1gqMZWD2gha...ePZ1eGjO3qS', 'STUDENT', 'Information Technology', '+91-9876543215'),
    ('u-fac-01', 'Dr. Anand Verma', 'faculty1@college.edu', '$2b$10$dN1gqMZWD2gha...ePZ1eGjO3qS', 'FACULTY', 'Computer Science', '+91-9876543216')
ON CONFLICT ("email") DO NOTHING;

-- 4.2 Seed Venues
INSERT INTO "venues" ("venue_id", "venue_name", "location", "capacity", "venue_type", "description", "status")
VALUES
    ('v-aud-01', 'Main Auditorium', 'Central Block, Ground Floor', 800, 'AUDITORIUM', 'Flagship university auditorium with tiered theater seating and professional AV/lighting.', 'ACTIVE'),
    ('v-sem-01', 'APJ Abdul Kalam Seminar Hall', 'Academic Block A, 2nd Floor', 250, 'SEMINAR_HALL', 'Air-conditioned multimedia seminar hall designed for academic symposiums and lectures.', 'ACTIVE'),
    ('v-lab-01', 'CS Department Lab 1', 'Engineering Block, 1st Floor', 75, 'COMPUTER_LAB', 'High-performance computing laboratory equipped with 75 networked Linux workstations.', 'ACTIVE'),
    ('v-cr-01', 'Executive Conference Room', 'Admin Tower, 4th Floor', 40, 'CONFERENCE_ROOM', 'Boardroom facility with video conferencing equipment and round-table seating.', 'ACTIVE')
ON CONFLICT ("venue_name") DO NOTHING;

-- 4.3 Seed Employees (1:1 with users)
INSERT INTO "employees" ("employee_id", "user_id", "employee_code", "designation", "department", "status")
VALUES
    ('e-aud-01', (SELECT "user_id" FROM "users" WHERE "email" = 'emp_auditorium@college.edu'), 'EMP_AUD', 'Auditorium Manager', 'Events & Facilities', 'ACTIVE'),
    ('e-sem-01', (SELECT "user_id" FROM "users" WHERE "email" = 'emp_seminar@college.edu'), 'EMP_SEM', 'Seminar Coordinator', 'Academic Affairs', 'ACTIVE'),
    ('e-hod-01', (SELECT "user_id" FROM "users" WHERE "email" = 'emp_hod@college.edu'), 'EMP_HOD', 'Head of Department', 'Computer Science', 'ACTIVE')
ON CONFLICT ("employee_code") DO NOTHING;

-- 4.4 Seed Venue Authority Matrix (Delegation)
INSERT INTO "venue_authority" ("authority_id", "employee_id", "venue_id", "assigned_by", "status")
VALUES
    ('auth-01', 
        (SELECT "employee_id" FROM "employees" WHERE "employee_code" = 'EMP_AUD'),
        (SELECT "venue_id" FROM "venues" WHERE "venue_name" = 'Main Auditorium'),
        (SELECT "user_id" FROM "users" WHERE "email" = 'admin@college.edu'),
        'ACTIVE'),
    ('auth-02', 
        (SELECT "employee_id" FROM "employees" WHERE "employee_code" = 'EMP_SEM'),
        (SELECT "venue_id" FROM "venues" WHERE "venue_name" = 'APJ Abdul Kalam Seminar Hall'),
        (SELECT "user_id" FROM "users" WHERE "email" = 'admin@college.edu'),
        'ACTIVE')
ON CONFLICT ("employee_id", "venue_id") DO NOTHING;

-- ==============================================================================
-- 5. ACID TRANSACTION WITH PESSIMISTIC ROW LOCKING (CONCURRENT-SAFE RESERVATION)
-- ==============================================================================
-- Lavanya Joshi's core algorithm executed in app/api/bookings/concurrent-safe/route.ts:
--
-- BEGIN;
--   -- Step 1: Acquire Pessimistic Row-Level Lock on the venue record (Mutex)
--   SELECT venue_id, venue_name, capacity, status 
--   FROM venues 
--   WHERE venue_id = $1 
--   FOR UPDATE;
--
--   -- Step 2: Critical Section - Check interval overlap with active bookings
--   SELECT booking_id, start_time, end_time 
--   FROM bookings 
--   WHERE venue_id = $1 
--     AND event_date = $2 
--     AND status IN ('PENDING', 'APPROVED')
--     AND start_time < $4 
--     AND end_time > $3;
--
--   -- Step 3: If no collision, commit reservation
--   INSERT INTO bookings (user_id, venue_id, event_name, event_date, start_time, end_time, expected_attendees, status)
--   VALUES ($user_id, $venue_id, $event_name, $date, $start, $end, $attendees, 'PENDING');
--
--   -- Step 4: Write Audit Log & Notification records (Atomicity)
--   INSERT INTO notifications ...;
--   INSERT INTO audit_logs ...;
-- COMMIT;
