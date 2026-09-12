import { PrismaClient, Role, VenueStatus, AuthorityStatus } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Starting database seeding...")

  // Common password hash for test accounts
  const passwordHash = await bcrypt.hash("Password@123", 10)

  // 1. Seed Admin
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@college.edu" },
    update: {},
    create: {
      name: "System Administrator",
      email: "admin@college.edu",
      password_hash: passwordHash,
      role: Role.ADMIN,
      department: "Administration",
      phone: "+91-9876543210",
    },
  })
  console.log(`✅ Admin created: ${adminUser.email}`)

  // 2. Seed Employees & their User accounts
  const empAudUser = await prisma.user.upsert({
    where: { email: "emp_auditorium@college.edu" },
    update: {},
    create: {
      name: "Auditorium Manager",
      email: "emp_auditorium@college.edu",
      password_hash: passwordHash,
      role: Role.EMPLOYEE,
      department: "Events & Facilities",
      phone: "+91-9876543211",
    },
  })

  const empAuditorium = await prisma.employee.upsert({
    where: { user_id: empAudUser.user_id },
    update: {},
    create: {
      user_id: empAudUser.user_id,
      employee_code: "EMP_AUD",
      designation: "Auditorium Manager",
      department: "Events & Facilities",
      status: "ACTIVE",
    },
  })

  const empSemUser = await prisma.user.upsert({
    where: { email: "emp_seminar@college.edu" },
    update: {},
    create: {
      name: "Seminar Coordinator",
      email: "emp_seminar@college.edu",
      password_hash: passwordHash,
      role: Role.EMPLOYEE,
      department: "Academic Affairs",
      phone: "+91-9876543212",
    },
  })

  const empSeminar = await prisma.employee.upsert({
    where: { user_id: empSemUser.user_id },
    update: {},
    create: {
      user_id: empSemUser.user_id,
      employee_code: "EMP_SEM",
      designation: "Seminar Coordinator",
      department: "Academic Affairs",
      status: "ACTIVE",
    },
  })

  const empHodUser = await prisma.user.upsert({
    where: { email: "emp_hod@college.edu" },
    update: {},
    create: {
      name: "HOD Computer Science",
      email: "emp_hod@college.edu",
      password_hash: passwordHash,
      role: Role.EMPLOYEE,
      department: "Computer Science",
      phone: "+91-9876543213",
    },
  })

  await prisma.employee.upsert({
    where: { user_id: empHodUser.user_id },
    update: {},
    create: {
      user_id: empHodUser.user_id,
      employee_code: "EMP_HOD_CS",
      designation: "Head of Department",
      department: "Computer Science",
      status: "ACTIVE",
    },
  })
  console.log("✅ 3 Employees created")

  // 3. Seed Students
  await prisma.user.upsert({
    where: { email: "student1@college.edu" },
    update: {},
    create: {
      name: "Rahul Sharma",
      email: "student1@college.edu",
      password_hash: passwordHash,
      role: Role.STUDENT,
      department: "Computer Science",
      phone: "+91-9876543214",
    },
  })

  await prisma.user.upsert({
    where: { email: "student2@college.edu" },
    update: {},
    create: {
      name: "Priya Patel",
      email: "student2@college.edu",
      password_hash: passwordHash,
      role: Role.STUDENT,
      department: "Electrical Engineering",
      phone: "+91-9876543215",
    },
  })
  console.log("✅ 2 Students created")

  // 4. Seed Faculty
  await prisma.user.upsert({
    where: { email: "faculty1@college.edu" },
    update: {},
    create: {
      name: "Dr. Anish Verma",
      email: "faculty1@college.edu",
      password_hash: passwordHash,
      role: Role.FACULTY,
      department: "Computer Science",
      phone: "+91-9876543216",
    },
  })
  console.log("✅ 1 Faculty created")

  // 5. Seed 4 Venues
  const mainAuditorium = await prisma.venue.upsert({
    where: { venue_name: "Main Auditorium" },
    update: {},
    create: {
      venue_name: "Main Auditorium",
      location: "Main Campus - Block A",
      capacity: 800,
      venue_type: "Auditorium",
      description: "Grand Auditorium with full audio-visual stage setup",
      status: VenueStatus.ACTIVE,
    },
  })

  const apjSeminarHall = await prisma.venue.upsert({
    where: { venue_name: "APJ Abdul Kalam Seminar Hall" },
    update: {},
    create: {
      venue_name: "APJ Abdul Kalam Seminar Hall",
      location: "Academic Block - 1st Floor",
      capacity: 250,
      venue_type: "Seminar Hall",
      description: "Air-conditioned seminar hall with dual projectors and surround sound",
      status: VenueStatus.ACTIVE,
    },
  })

  await prisma.venue.upsert({
    where: { venue_name: "CS Department Lab 1" },
    update: {},
    create: {
      venue_name: "CS Department Lab 1",
      location: "CS Block - 2nd Floor",
      capacity: 75,
      venue_type: "Lab",
      description: "High-performance computer laboratory with LAN connectivity",
      status: VenueStatus.ACTIVE,
    },
  })

  await prisma.venue.upsert({
    where: { venue_name: "Executive Conference Room" },
    update: {},
    create: {
      venue_name: "Executive Conference Room",
      location: "Admin Block - 3rd Floor",
      capacity: 40,
      venue_type: "Conference Room",
      description: "Executive boardroom with video conferencing system",
      status: VenueStatus.ACTIVE,
    },
  })
  console.log("✅ 4 Venues created")

  // 6. Seed Venue Authorities
  await prisma.venueAuthority.upsert({
    where: {
      employee_id_venue_id: {
        employee_id: empAuditorium.employee_id,
        venue_id: mainAuditorium.venue_id,
      },
    },
    update: {},
    create: {
      employee_id: empAuditorium.employee_id,
      venue_id: mainAuditorium.venue_id,
      assigned_by: adminUser.user_id,
      status: AuthorityStatus.ACTIVE,
    },
  })

  await prisma.venueAuthority.upsert({
    where: {
      employee_id_venue_id: {
        employee_id: empSeminar.employee_id,
        venue_id: apjSeminarHall.venue_id,
      },
    },
    update: {},
    create: {
      employee_id: empSeminar.employee_id,
      venue_id: apjSeminarHall.venue_id,
      assigned_by: adminUser.user_id,
      status: AuthorityStatus.ACTIVE,
    },
  })
  console.log("✅ Venue Authorities assigned")

  console.log("🎉 Database seeding completed successfully!")
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
