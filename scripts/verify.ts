import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function countTable(tableName: string): Promise<number> {
  const res = await prisma.$queryRawUnsafe<Array<{ count: string | number | bigint }>>(
    `SELECT COUNT(*) AS count FROM ${tableName};`
  )
  return Number(res[0]?.count ?? 0)
}

async function main() {
  console.log("Checking tables in database via PostgreSQL Raw SQL...")
  console.log("-----------------------------------------------------")
  console.log("users table count:", await countTable("users"))
  console.log("venues table count:", await countTable("venues"))
  console.log("employees table count:", await countTable("employees"))
  console.log("venue_authority table count:", await countTable("venue_authority"))
  console.log("bookings table count:", await countTable("bookings"))
  console.log("approvals table count:", await countTable("approvals"))
  console.log("notifications table count:", await countTable("notifications"))
  console.log("audit_logs table count:", await countTable("audit_logs"))
  console.log("-----------------------------------------------------")

  const users = await prisma.$queryRaw<Array<{ email: string; role: string }>>`
    SELECT email, role FROM users ORDER BY created_at ASC;
  `
  console.log("Seeded Users (Raw SQL):", users)

  const venues = await prisma.$queryRaw<Array<{ venue_name: string; capacity: number }>>`
    SELECT venue_name, capacity FROM venues ORDER BY venue_name ASC;
  `
  console.log("Seeded Venues (Raw SQL):", venues)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

