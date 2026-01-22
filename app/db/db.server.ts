import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

export const db = await (async () => {
  if (process.env.TEST_PGLITE) {
    const { drizzle: drizzlePglite } = await import('drizzle-orm/pglite')
    const { getPgliteInstance } = await import('../../e2e/pglite-instance')
    return drizzlePglite(getPgliteInstance(), { schema })
  }

  // biome-ignore lint/style/noNonNullAssertion: OK to let it fail if used incorrectly
  const connectionString = process.env.DATABASE_URL!
  const client = postgres(connectionString)
  return drizzle(client, { schema })
})()
