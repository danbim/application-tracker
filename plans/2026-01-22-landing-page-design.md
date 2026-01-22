# Landing Page Design

A simple landing page for the Job Tracker tool, published on GitHub Pages with automated screenshot generation.

## Overview

- **Purpose:** Showcase the tool's features with descriptions and screenshots
- **Hosting:** GitHub Pages served from `/docs` folder
- **Screenshots:** Automated via Playwright tests running against PGLite

## Project Structure Changes

### Move Plans Directory

Plans move from `docs/plans/` to `plans/` at project root:

```
plans/                    # Design and implementation plans
├── 2026-01-19-job-tracker-design.md
├── ...

docs/                     # GitHub Pages content
├── index.html
├── styles.css
└── screenshots/
    ├── job-list.png
    ├── status-tracking.png
    ├── job-form.png
    ├── scoring-formulas.png
    └── filters.png
```

### CLAUDE.md Update

Add to CLAUDE.md:
```markdown
## Project Conventions

Plans and design documents should be saved to `plans/` (not `docs/`).
The `docs/` folder is reserved for GitHub Pages content.
```

## Landing Page

### Technology

- Plain HTML + CSS
- No build step or frameworks
- Minimal/clean visual style
- Tailwind CDN optional for utility classes

### Structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Job Tracker - Rank and track your job applications</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <header>
    <h1>Job Tracker</h1>
    <p>A simple, open-source tool to rank and track job applications</p>
    <a href="https://github.com/USER/job-tracker">View on GitHub</a>
  </header>

  <main>
    <section class="hero">
      <img src="screenshots/job-list.png" alt="Job list with scoring">
      <p>Rank job openings with customizable scoring formulas</p>
    </section>

    <section class="feature">
      <h2>Track Application Status</h2>
      <p>Follow each application from initial interest through offer...</p>
      <img src="screenshots/status-tracking.png" alt="Status tabs and badges">
    </section>

    <section class="feature">
      <h2>Customizable Scoring</h2>
      <p>Create formulas that weight what matters to you...</p>
      <img src="screenshots/scoring-formulas.png" alt="Scoring formula editor">
    </section>

    <section class="feature">
      <h2>Comprehensive Job Details</h2>
      <p>Track compensation, work location, and rate each opportunity...</p>
      <img src="screenshots/job-form.png" alt="Job form with ratings">
    </section>

    <section class="feature">
      <h2>Filter and Sort</h2>
      <p>Find jobs by country, track, or filter to wow-factor opportunities...</p>
      <img src="screenshots/filters.png" alt="Filter controls">
    </section>
  </main>

  <footer>
    <p>Open Source · MIT License · <a href="https://github.com/USER/job-tracker">GitHub</a></p>
  </footer>
</body>
</html>
```

### Features to Showcase

1. **Job listing with scoring** - Main table showing jobs ranked by customizable scores
2. **Application status tracking** - Status tabs and status badge dropdown
3. **Scoring formulas** - Create/manage formulas to prioritize what matters
4. **Job details form** - Comprehensive form with ratings, compensation, work location
5. **Filtering & sorting** - Filter by country, track, wow factor

## E2E Testing Setup

### Dependencies

```json
{
  "devDependencies": {
    "@electric-sql/pglite": "^0.2.x",
    "@playwright/test": "^1.x"
  }
}
```

### File Structure

```
e2e/
├── test-db.ts           # PGLite setup + test data helpers
├── fixtures.ts          # Reusable test data (jobs, formulas)
├── screenshots.spec.ts  # Screenshot capture tests
└── playwright.config.ts
```

### Configurable Database Connection

Update `app/db/db.server.ts` to support both Postgres and PGLite:

```typescript
import { drizzle as drizzlePg } from 'drizzle-orm/postgres-js'
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite'
import postgres from 'postgres'
import * as schema from './schema'

let db: ReturnType<typeof drizzlePg> | ReturnType<typeof drizzlePglite>

if (process.env.TEST_PGLITE) {
  // PGLite instance injected by test setup
  const { getPgliteInstance } = await import('../../e2e/test-db')
  db = drizzlePglite(getPgliteInstance(), { schema })
} else {
  const client = postgres(process.env.DATABASE_URL!)
  db = drizzlePg(client, { schema })
}

export { db }
```

### Test Fixtures

```typescript
// e2e/fixtures.ts
export const testJobs = [
  { title: 'Senior Engineer', company: 'Acme Corp', status: 'applied', country: 'DE', ... },
  { title: 'Tech Lead', company: 'StartupX', status: 'interviewing', wow: true, ... },
  { title: 'Staff Engineer', company: 'BigTech', status: 'offer', ... },
  { title: 'Backend Dev', company: 'Agency', status: 'rejected', ... },
  { title: 'Platform Engineer', company: 'Startup', status: 'not_applied', ... },
  // ~10-15 jobs covering all statuses, countries, tracks
]

export const testFormulas = [
  { name: 'Work-Life Balance', weights: { location: 5, stress: -3, ... } },
  { name: 'Career Growth', weights: { growth: 5, role: 4, ... } },
]
```

### Screenshot Tests

```typescript
// e2e/screenshots.spec.ts
import { test } from '@playwright/test'

test.describe('Landing page screenshots', () => {
  test.beforeEach(async () => {
    await setupTestDb()  // Fresh PGLite + insert fixtures
  })

  test('job list', async ({ page }) => {
    await page.goto('/')
    await page.screenshot({ path: 'docs/screenshots/job-list.png', fullPage: true })
  })

  test('status tabs', async ({ page }) => {
    await page.goto('/?status=interviewing')
    await page.screenshot({ path: 'docs/screenshots/status-tracking.png' })
  })

  test('scoring formulas', async ({ page }) => {
    await page.goto('/formulas')
    await page.screenshot({ path: 'docs/screenshots/scoring-formulas.png' })
  })

  test('job form', async ({ page }) => {
    await page.goto('/jobs/new')
    await page.screenshot({ path: 'docs/screenshots/job-form.png', fullPage: true })
  })

  test('filters', async ({ page }) => {
    await page.goto('/')
    // Ensure filters are visible
    await page.screenshot({ path: 'docs/screenshots/filters.png' })
  })
})
```

## GitHub Actions Workflow

```yaml
# .github/workflows/screenshots.yml
name: Update Screenshots

on:
  push:
    branches: [main]
    paths:
      - 'app/**'
      - 'e2e/**'
  workflow_dispatch:  # Manual trigger

jobs:
  screenshots:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v1

      - run: bun install

      - run: bunx playwright install --with-deps chromium

      - name: Run screenshot tests
        run: bun run test:e2e
        env:
          TEST_PGLITE: true

      - name: Commit updated screenshots
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add docs/screenshots/
          git diff --staged --quiet || git commit -m "chore: update screenshots"
          git push
```

## GitHub Pages Setup

1. Go to repository Settings → Pages
2. Source: "Deploy from a branch"
3. Branch: main
4. Folder: /docs
5. Save

## Summary

| Aspect | Decision |
|--------|----------|
| Landing page tech | Plain HTML + CSS |
| Location | `/docs` folder (GitHub Pages) |
| Plans location | `plans/` at project root |
| Screenshot automation | Playwright tests |
| Test database | PGLite (WASM Postgres) |
| Test data | Fixtures defined in test files |
| CI workflow | GitHub Actions, auto-commits screenshots |
