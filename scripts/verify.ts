import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("Checking tables in database...")
  console.log("-------------------------------------")
  console.log("users table count:", await prisma.user.count())
  console.log("venues table count:", await prisma.venue.count())
  console.log("employees table count:", await prisma.employee.count())
  console.log("venue_authority table count:", await prisma.venueAuthority.count())
  console.log("bookings table count:", await prisma.booking.count())
  console.log("approvals table count:", await prisma.approval.count())
  console.log("notifications table count:", await prisma.notification.count())
  console.log("audit_logs table count:", await prisma.auditLog.count())
  console.log("-------------------------------------")

  const users = await prisma.user.findMany({ select: { email: true, role: true } })
  console.log("Seeded Users:", users)

  const venues = await prisma.venue.findMany({ select: { venue_name: true, capacity: true } })
  console.log("Seeded Venues:", venues)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
