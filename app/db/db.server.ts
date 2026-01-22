import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

export const db = await (async () => {
  if (process.env.TEST_PGLITE) {
    const { PGlite } = await import('@electric-sql/pglite')
    const { drizzle: drizzlePglite } = await import('drizzle-orm/pglite')
    const { migrate } = await import('drizzle-orm/pglite/migrator')

    // Create fresh PGLite instance with in-memory storage
    const pglite = new PGlite()
    const db = drizzlePglite(pglite, { schema })

    // Run migrations
    await migrate(db, { migrationsFolder: './app/db/migrations' })

    // Load and insert test data
    const { testFormulas, testJobs } = await import('../../e2e/fixtures')
    await db.insert(schema.scoringFormulas).values(testFormulas)
    await db.insert(schema.jobOpenings).values(testJobs)

    console.log('[PGLite] Initialized with test data')
    return db
  }

  // biome-ignore lint/style/noNonNullAssertion: OK to let it fail if used incorrectly
  const connectionString = process.env.DATABASE_URL!
  const client = postgres(connectionString)
  return drizzle(client, { schema })
})()
