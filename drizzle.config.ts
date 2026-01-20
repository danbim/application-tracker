import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './app/db/schema.ts',
  out: './app/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    // biome-ignore lint/style/noNonNullAssertion: OK to let it fail if used incorrectly
    url: process.env.DATABASE_URL!,
  },
})
