// Prisma Client singleton
// Centraliza la conexión a la base de datos mediante Prisma para que se reutilice a lo largo del backend.
const { PrismaClient } = require('@prisma/client')
const { PgAdapter } = require('@prisma/adapter-pg')
const { Pool } = require('pg')

// Soporte para DATABASE_PUBLIC_URL (Railway) o DATABASE_URL
const databaseUrl = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL
if (!databaseUrl) {
  console.warn('[Prisma] No DATABASE_PUBLIC_URL/DATABASE_URL found. Set it in .env')
}

// Prisma 7: usar adapter-pg para conexión directa
const pool = databaseUrl ? new Pool({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } }) : undefined
const adapter = pool ? new PgAdapter(pool) : undefined

// Nota: usar un singleton evita crear múltiples conexiones en hot-reload (nodemon)
const globalForPrisma = globalThis

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient(
    adapter ? { adapter } : undefined
  )

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

module.exports = prisma
