import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import * as schema from './schema'

const DATABASE_URL = process.env.DATABASE_URL!

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL IS REQUIRED')
}

const sql = neon(DATABASE_URL)

export const db = drizzle({
  client: sql,
  schema,
  casing: 'snake_case',
})

export { schema }
