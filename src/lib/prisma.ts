import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = global as unknown as { prisma: PrismaClient; pool: Pool }

// Lazy initialization — avoids crashing during next build when DATABASE_URL
// is unavailable (build workers import this module to collect page data)
function createPrismaClient(): PrismaClient {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set. Make sure .env file exists and contains DATABASE_URL.')
  }

  const pool = globalForPrisma.pool || new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    idleTimeoutMillis: 20000,
    connectionTimeoutMillis: 5000,
  })
  const adapter = new PrismaPg(pool)
  const client = new PrismaClient({ adapter })

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = client
    globalForPrisma.pool = pool
  }

  return client
}

// Use a getter so the client is created on first access, not on import.
// This prevents build failures when DATABASE_URL is unavailable.
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop: string | symbol) {
    const client = globalForPrisma.prisma || (globalForPrisma.prisma = createPrismaClient())
    return Reflect.get(client, prop)
  },
})