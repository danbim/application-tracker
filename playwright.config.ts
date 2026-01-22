import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5175',
    trace: 'on-first-retry',
    screenshot: 'off',
  },
  webServer: {
    command: 'bun run dev --port 5175',
    url: 'http://localhost:5175',
    reuseExistingServer: false,
    env: {
      TEST_PGLITE: 'true',
    },
  },
})
