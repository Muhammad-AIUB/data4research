import { config } from 'dotenv'
import { resolve } from 'path'

// Always load .env file first (for seed scripts and standalone usage)
config({ path: resolve(process.cwd(), '.env') })

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set. Make sure .env file exists and contains DATABASE_URL.')
}

// Prisma 7.x requires an adapter or accelerateUrl
const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma