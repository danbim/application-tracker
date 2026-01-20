import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['app/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', 'build', 'app/services/scoring.service.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['app/**/*.{ts,tsx}'],
      exclude: [
        'app/**/*.test.{ts,tsx}',
        'app/db/**',
        'app/routes.ts',
        'app/root.tsx',
        'app/components/ui/**',
      ],
    },
  },
})
