import { config } from 'dotenv'
import { defineConfig } from 'drizzle-kit'

// Neon connection strings live in .env.local (Next.js convention).
config({ path: '.env.local' })

// Migrations/DDL should run over a direct (unpooled) connection.
const migrationUrl =
  process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL

if (!migrationUrl) {
  throw new Error(
    'DATABASE_URL_UNPOOLED (or DATABASE_URL) is not set in .env.local',
  )
}

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './src/lib/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: migrationUrl,
  },
  casing: 'snake_case',
  verbose: true,
  strict: true,
})
