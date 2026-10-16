import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Starting database seeding via pure PostgreSQL SQL...")

  const passwordHash = await bcrypt.hash("Password@123", 10)

  // 1. Seed Users via Raw SQL
  const users = [
    { name: "System Administrator", email: "admin@college.edu", role: "ADMIN", dept: "Administration", phone: "+91-9876543210" },
    { name: "Auditorium Manager", email: "emp_auditorium@college.edu", role: "EMPLOYEE", dept: "Events & Facilities", phone: "+91-9876543211" },
    { name: "Seminar Coordinator", email: "emp_seminar@college.edu", role: "EMPLOYEE", dept: "Academic Affairs", phone: "+91-9876543212" },
    { name: "CS Dept HOD", email: "emp_hod@college.edu", role: "EMPLOYEE", dept: "Computer Science", phone: "+91-9876543213" },
    { name: "Rahul Sharma", email: "student1@college.edu", role: "STUDENT", dept: "Computer Science", phone: "+91-9876543214" },
    { name: "Priya Patel", email: "student2@college.edu", role: "STUDENT", dept: "Information Technology", phone: "+91-9876543215" },
    { name: "Dr. Anand Verma", email: "faculty1@college.edu", role: "FACULTY", dept: "Computer Science", phone: "+91-9876543216" },
  ]

  for (const u of users) {
    await prisma.$executeRaw`
      INSERT INTO users (user_id, name, email, password_hash, role, department, phone, created_at, updated_at)
      VALUES (
        gen_random_uuid(),
        ${u.name},
        ${u.email},
        ${passwordHash},
        ${u.role}::"Role",
        ${u.dept},
        ${u.phone},
        NOW(),
        NOW()
      )
      ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        department = EXCLUDED.department,
        password_hash = EXCLUDED.password_hash;
    `
  }
  console.log(`✅ Users seeded via raw SQL: ${users.length}`)

  // 2. Seed Venues via Raw SQL
  const venues = [
    { name: "Main Auditorium", loc: "Central Block, Ground Floor", cap: 800, type: "Auditorium", desc: "Flagship university auditorium with tiered theater seating and professional AV/lighting." },
    { name: "APJ Abdul Kalam Seminar Hall", loc: "Academic Block A, 2nd Floor", cap: 250, type: "Seminar Hall", desc: "Air-conditioned multimedia seminar hall designed for academic symposiums and lectures." },
    { name: "CS Department Lab 1", loc: "Engineering Block, 1st Floor", cap: 75, type: "Computer Lab", desc: "High-performance computing laboratory equipped with 75 networked Linux workstations." },
    { name: "Executive Conference Room", loc: "Admin Tower, 4th Floor", cap: 40, type: "Conference Room", desc: "Boardroom facility with video conferencing equipment and round-table seating." },
  ]

  for (const v of venues) {
    await prisma.$executeRaw`
      INSERT INTO venues (venue_id, venue_name, location, capacity, venue_type, description, status, created_at, updated_at)
      VALUES (
        gen_random_uuid(),
        ${v.name},
        ${v.loc},
        ${v.cap},
        ${v.type},
        ${v.desc},
        'ACTIVE'::"VenueStatus",
        NOW(),
        NOW()
      )
      ON CONFLICT (venue_name) DO UPDATE SET
        capacity = EXCLUDED.capacity,
        location = EXCLUDED.location;
    `
  }
  console.log(`✅ Venues seeded via raw SQL: ${venues.length}`)

  // 3. Seed Employees (1:1 with users) via Raw SQL
  const employees = [
    { email: "emp_auditorium@college.edu", code: "EMP_AUD", desig: "Auditorium Manager", dept: "Events & Facilities" },
    { email: "emp_seminar@college.edu", code: "EMP_SEM", desig: "Seminar Coordinator", dept: "Academic Affairs" },
    { email: "emp_hod@college.edu", code: "EMP_HOD", desig: "Head of Department", dept: "Computer Science" },
  ]

  for (const e of employees) {
    await prisma.$executeRaw`
      INSERT INTO employees (employee_id, user_id, employee_code, designation, department, status, created_at, updated_at)
      SELECT
        gen_random_uuid(),
        u.user_id,
        ${e.code},
        ${e.desig},
        ${e.dept},
        'ACTIVE',
        NOW(),
        NOW()
      FROM users u
      WHERE u.email = ${e.email}
      ON CONFLICT (user_id) DO UPDATE SET
        employee_code = EXCLUDED.employee_code,
        designation = EXCLUDED.designation;
    `
  }
  console.log(`✅ Employees seeded via raw SQL: ${employees.length}`)

  // 4. Seed Venue Authorities via Raw SQL
  const authorities = [
    { empCode: "EMP_AUD", venueName: "Main Auditorium" },
    { empCode: "EMP_SEM", venueName: "APJ Abdul Kalam Seminar Hall" },
  ]

  for (const a of authorities) {
    await prisma.$executeRaw`
      INSERT INTO venue_authority (authority_id, employee_id, venue_id, assigned_by, status, created_at, updated_at)
      SELECT
        gen_random_uuid(),
        e.employee_id,
        v.venue_id,
        admin.user_id,
        'ACTIVE'::"AuthorityStatus",
        NOW(),
        NOW()
      FROM employees e
      CROSS JOIN venues v
      CROSS JOIN users admin
      WHERE e.employee_code = ${a.empCode}
        AND v.venue_name = ${a.venueName}
        AND admin.email = 'admin@college.edu'
      ON CONFLICT (employee_id, venue_id) DO NOTHING;
    `
  }
  console.log(`✅ Venue Authorities assigned via raw SQL: ${authorities.length}`)
  console.log("🎉 Database seeding completed successfully via pure SQL!")
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
