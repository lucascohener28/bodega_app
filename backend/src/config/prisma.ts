import 'dotenv/config'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL no está definida')
}

const poolMax = Number(process.env.DB_POOL_MAX || '1')
const pool = new Pool({
  connectionString,
  max: Number.isFinite(poolMax) && poolMax > 0 ? poolMax : 1,
})
const adapter = new PrismaPg(pool)

export const prisma = new PrismaClient({ adapter })
