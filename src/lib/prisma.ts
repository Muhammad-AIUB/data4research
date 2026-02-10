import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env') })

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = global as unknown as { prisma: PrismaClient; pool: Pool }

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set. Make sure .env file exists and contains DATABASE_URL.')
}

// Reuse connection pool across hot reloads in development
const pool = globalForPrisma.pool || new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,                  // limit connections for serverless
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
})
const adapter = new PrismaPg(pool)

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
  globalForPrisma.pool = pool
}