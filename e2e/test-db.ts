import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { migrate } from 'drizzle-orm/pglite/migrator'
import * as schema from '../app/db/schema'
import { setPgliteInstance } from './pglite-instance'
import { testFormulas, testJobs } from './fixtures'

let db: ReturnType<typeof drizzle<typeof schema>>
let pglite: PGlite

export async function setupTestDb() {
  // Create fresh PGLite instance
  pglite = new PGlite()
  setPgliteInstance(pglite)

  db = drizzle(pglite, { schema })

  // Run migrations
  await migrate(db, { migrationsFolder: './app/db/migrations' })

  // Insert test data
  await db.insert(schema.scoringFormulas).values(testFormulas)
  await db.insert(schema.jobOpenings).values(testJobs)

  return db
}

export async function teardownTestDb() {
  if (pglite) {
    await pglite.close()
  }
}

export { db }
