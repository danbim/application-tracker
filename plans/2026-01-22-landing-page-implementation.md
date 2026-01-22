# Landing Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a landing page for GitHub Pages with automated Playwright screenshot generation using PGLite.

**Architecture:** Static HTML/CSS landing page in `/docs`, Playwright E2E tests that capture screenshots against a PGLite database with test fixtures. GitHub Actions workflow auto-updates screenshots on app changes.

**Tech Stack:** HTML, CSS, Playwright, PGLite, drizzle-orm/pglite, GitHub Actions

---

## Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install Playwright and PGLite**

Run:
```bash
bun add -d @playwright/test @electric-sql/pglite drizzle-orm
```

Note: drizzle-orm is already installed but we need to ensure pglite driver support.

**Step 2: Install Playwright browsers**

Run:
```bash
bunx playwright install chromium
```

**Step 3: Add test:e2e script to package.json**

Add to scripts section:
```json
"test:e2e": "playwright test"
```

**Step 4: Verify installation**

Run:
```bash
bun run test:e2e --help
```
Expected: Playwright help output

**Step 5: Commit**

```bash
git add package.json bun.lock
git commit -m "feat: add Playwright and PGLite dependencies"
```

---

## Task 2: Create Playwright Configuration

**Files:**
- Create: `playwright.config.ts`

**Step 1: Create Playwright config**

Create `playwright.config.ts`:

```typescript
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'off',
  },
  webServer: {
    command: 'bun run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    env: {
      TEST_PGLITE: 'true',
    },
  },
})
```

**Step 2: Create e2e directory**

Run:
```bash
mkdir -p e2e
```

**Step 3: Commit**

```bash
git add playwright.config.ts
git commit -m "feat: add Playwright configuration"
```

---

## Task 3: Update Database Connection for PGLite Support

**Files:**
- Modify: `app/db/db.server.ts`
- Create: `e2e/pglite-instance.ts`

**Step 1: Create PGLite instance holder**

Create `e2e/pglite-instance.ts`:

```typescript
import type { PGlite } from '@electric-sql/pglite'

let pgliteInstance: PGlite | null = null

export function setPgliteInstance(instance: PGlite) {
  pgliteInstance = instance
}

export function getPgliteInstance(): PGlite {
  if (!pgliteInstance) {
    throw new Error('PGLite instance not initialized. Call setPgliteInstance first.')
  }
  return pgliteInstance
}
```

**Step 2: Update db.server.ts**

Replace `app/db/db.server.ts` with:

```typescript
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
```

**Step 3: Commit**

```bash
git add app/db/db.server.ts e2e/pglite-instance.ts
git commit -m "feat: add PGLite support for E2E tests"
```

---

## Task 4: Create Test Fixtures

**Files:**
- Create: `e2e/fixtures.ts`

**Step 1: Create fixtures file**

Create `e2e/fixtures.ts`:

```typescript
import type { NewJobOpening, NewScoringFormula } from '~/db/schema'

export const testFormulas: NewScoringFormula[] = [
  {
    name: 'Work-Life Balance',
    weights: {
      impact: 2,
      compensation: 3,
      role: 2,
      tech: 2,
      location: 5,
      industry: 1,
      culture: 4,
      growth: 2,
      profileMatch: 3,
      companySize: 1,
      stress: -4,
      jobSecurity: 3,
      wowBoost: 5,
    },
  },
  {
    name: 'Career Growth',
    weights: {
      impact: 4,
      compensation: 2,
      role: 5,
      tech: 4,
      location: 1,
      industry: 3,
      culture: 3,
      growth: 5,
      profileMatch: 4,
      companySize: 2,
      stress: -1,
      jobSecurity: 2,
      wowBoost: 8,
    },
  },
]

export const testJobs: NewJobOpening[] = [
  {
    title: 'Senior Software Engineer',
    company: 'TechCorp GmbH',
    description: 'Join our team building scalable cloud infrastructure. Work with Kubernetes, Go, and distributed systems.',
    jobLocation: 'Berlin, Germany',
    country: 'DE',
    status: 'applied',
    appliedAt: new Date('2026-01-10'),
    wow: true,
    track: 'engineering',
    salaryMin: 85000,
    salaryMax: 105000,
    salaryCurrency: 'EUR',
    vacationDays: 30,
    workLocation: 'hybrid',
    wfhDaysPerWeek: 3,
    ratingImpact: 1,
    ratingCompensation: 1,
    ratingRole: 1,
    ratingTech: 1,
    ratingLocation: 0,
    ratingCulture: 1,
    ratingGrowth: 1,
    ratingProfileMatch: 1,
  },
  {
    title: 'Engineering Manager',
    company: 'StartupX',
    description: 'Lead a team of 8 engineers building our core product. Shape engineering culture and delivery practices.',
    jobLocation: 'Amsterdam, Netherlands',
    country: 'NL',
    status: 'interviewing',
    interviewingAt: new Date('2026-01-15'),
    wow: true,
    track: 'management',
    salaryMin: 95000,
    salaryMax: 120000,
    salaryCurrency: 'EUR',
    vacationDays: 25,
    workLocation: 'hybrid',
    wfhDaysPerWeek: 2,
    ratingImpact: 1,
    ratingCompensation: 1,
    ratingRole: 1,
    ratingTech: 0,
    ratingGrowth: 1,
    ratingProfileMatch: 1,
  },
  {
    title: 'Staff Engineer',
    company: 'BigTech Inc',
    description: 'Drive technical strategy across multiple teams. Mentor senior engineers and influence architecture decisions.',
    jobLocation: 'London, UK',
    country: 'GB',
    status: 'offer',
    offerAt: new Date('2026-01-18'),
    track: 'engineering',
    salaryMin: 130000,
    salaryMax: 160000,
    salaryCurrency: 'GBP',
    vacationDays: 28,
    workLocation: 'office',
    officeDistanceKm: 15,
    ratingImpact: 1,
    ratingCompensation: 1,
    ratingRole: 1,
    ratingTech: 1,
    ratingCulture: 0,
    ratingGrowth: 1,
    ratingStress: -1,
  },
  {
    title: 'Backend Developer',
    company: 'Digital Agency',
    description: 'Build web applications for various clients. Tech stack includes Node.js, PostgreSQL, and React.',
    jobLocation: 'Munich, Germany',
    country: 'DE',
    status: 'rejected',
    rejectedAt: new Date('2026-01-12'),
    track: 'engineering',
    salaryMin: 60000,
    salaryMax: 75000,
    salaryCurrency: 'EUR',
    vacationDays: 28,
    workLocation: 'office',
    officeDistanceKm: 25,
    ratingCompensation: 0,
    ratingRole: 0,
    ratingTech: 0,
  },
  {
    title: 'Platform Engineer',
    company: 'CloudScale',
    description: 'Build and maintain our internal developer platform. Focus on CI/CD, observability, and infrastructure as code.',
    jobLocation: 'Remote (EU)',
    country: 'DE',
    status: 'not_applied',
    track: 'engineering',
    salaryMin: 80000,
    salaryMax: 100000,
    salaryCurrency: 'EUR',
    vacationDays: 30,
    workLocation: 'remote',
    ratingImpact: 1,
    ratingTech: 1,
    ratingLocation: 1,
    ratingCulture: 1,
  },
  {
    title: 'Tech Lead',
    company: 'FinanceApp',
    description: 'Lead development of our mobile banking platform. Ensure security, compliance, and great user experience.',
    jobLocation: 'Frankfurt, Germany',
    country: 'DE',
    status: 'not_applied',
    track: 'engineering',
    salaryMin: 90000,
    salaryMax: 115000,
    salaryCurrency: 'EUR',
    vacationDays: 30,
    workLocation: 'hybrid',
    wfhDaysPerWeek: 2,
    ratingIndustry: -1,
    ratingCompensation: 1,
    ratingRole: 1,
    ratingStress: -1,
  },
  {
    title: 'VP of Engineering',
    company: 'GrowthStartup',
    description: 'Build and scale the engineering organization from 15 to 50 engineers. Report directly to CTO.',
    jobLocation: 'Paris, France',
    country: 'FR',
    status: 'ghosted',
    ghostedAt: new Date('2026-01-05'),
    track: 'management',
    salaryMin: 150000,
    salaryMax: 200000,
    salaryCurrency: 'EUR',
    vacationDays: 25,
    workLocation: 'hybrid',
    wfhDaysPerWeek: 2,
    wow: true,
    ratingImpact: 1,
    ratingRole: 1,
    ratingGrowth: 1,
    ratingStress: -1,
  },
  {
    title: 'Senior DevOps Engineer',
    company: 'RetailTech',
    description: 'Manage infrastructure for e-commerce platform handling 10M daily users.',
    jobLocation: 'Madrid, Spain',
    country: 'ES',
    status: 'applied',
    appliedAt: new Date('2026-01-20'),
    track: 'engineering',
    salaryMin: 55000,
    salaryMax: 70000,
    salaryCurrency: 'EUR',
    vacationDays: 23,
    workLocation: 'remote',
    ratingTech: 1,
    ratingLocation: 1,
    ratingCompensation: 0,
  },
]
```

**Step 2: Commit**

```bash
git add e2e/fixtures.ts
git commit -m "feat: add E2E test fixtures"
```

---

## Task 5: Create Test Database Setup Helper

**Files:**
- Create: `e2e/test-db.ts`

**Step 1: Create test database helper**

Create `e2e/test-db.ts`:

```typescript
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
```

**Step 2: Commit**

```bash
git add e2e/test-db.ts
git commit -m "feat: add test database setup helper"
```

---

## Task 6: Create Screenshot Tests

**Files:**
- Create: `e2e/screenshots.spec.ts`
- Create: `docs/screenshots/.gitkeep`

**Step 1: Create screenshots directory**

Run:
```bash
mkdir -p docs/screenshots
touch docs/screenshots/.gitkeep
```

**Step 2: Create screenshot tests**

Create `e2e/screenshots.spec.ts`:

```typescript
import { test } from '@playwright/test'
import { setupTestDb, teardownTestDb } from './test-db'

test.describe('Landing page screenshots', () => {
  test.beforeAll(async () => {
    await setupTestDb()
  })

  test.afterAll(async () => {
    await teardownTestDb()
  })

  test('job list with scores', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('table')

    // Wait for data to load
    await page.waitForTimeout(500)

    await page.screenshot({
      path: 'docs/screenshots/job-list.png',
      fullPage: false,
    })
  })

  test('status tracking tabs', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('[role="tablist"]')

    // Click on interviewing tab to show that status
    await page.click('[role="tab"]:has-text("Interviewing")')
    await page.waitForTimeout(300)

    await page.screenshot({
      path: 'docs/screenshots/status-tracking.png',
      fullPage: false,
    })
  })

  test('scoring formulas list', async ({ page }) => {
    await page.goto('/formulas')
    await page.waitForSelector('table')
    await page.waitForTimeout(300)

    await page.screenshot({
      path: 'docs/screenshots/scoring-formulas.png',
      fullPage: false,
    })
  })

  test('job form', async ({ page }) => {
    await page.goto('/jobs/new')
    await page.waitForSelector('form')
    await page.waitForTimeout(300)

    await page.screenshot({
      path: 'docs/screenshots/job-form.png',
      fullPage: true,
    })
  })

  test('filters section', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('table')
    await page.waitForTimeout(300)

    // Take a viewport screenshot focusing on the filter area
    await page.screenshot({
      path: 'docs/screenshots/filters.png',
      fullPage: false,
      clip: {
        x: 0,
        y: 0,
        width: 1280,
        height: 400,
      },
    })
  })
})
```

**Step 3: Commit**

```bash
git add e2e/screenshots.spec.ts docs/screenshots/.gitkeep
git commit -m "feat: add screenshot E2E tests"
```

---

## Task 7: Create Landing Page HTML

**Files:**
- Create: `docs/index.html`

**Step 1: Create landing page HTML**

Create `docs/index.html`:

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
    <div class="container">
      <h1>Job Tracker</h1>
      <p class="tagline">A simple, open-source tool to rank and track job applications</p>
      <a href="https://github.com/danbim/job-tracker" class="github-link">View on GitHub →</a>
    </div>
  </header>

  <main class="container">
    <section class="hero">
      <img src="screenshots/job-list.png" alt="Job list showing jobs ranked by customizable scores">
      <p>Rank job openings with customizable scoring formulas based on what matters most to you.</p>
    </section>

    <section class="feature">
      <div class="feature-content">
        <h2>Track Application Status</h2>
        <p>Follow each application through its lifecycle—from initial interest, to applied, interviewing, offer, or rejection. Filter by status to focus on what needs attention.</p>
      </div>
      <img src="screenshots/status-tracking.png" alt="Status tabs showing different application stages">
    </section>

    <section class="feature reverse">
      <div class="feature-content">
        <h2>Customizable Scoring</h2>
        <p>Create scoring formulas that weight the criteria you care about. Prioritize work-life balance, career growth, compensation, or any combination that fits your goals.</p>
      </div>
      <img src="screenshots/scoring-formulas.png" alt="Scoring formula configuration">
    </section>

    <section class="feature">
      <div class="feature-content">
        <h2>Comprehensive Job Details</h2>
        <p>Track everything about each opportunity: compensation, work location, remote policy, and rate each job on 12 different criteria like impact, culture, and growth potential.</p>
      </div>
      <img src="screenshots/job-form.png" alt="Job form with detailed fields and ratings">
    </section>

    <section class="feature reverse">
      <div class="feature-content">
        <h2>Filter and Sort</h2>
        <p>Quickly find jobs by country, career track, or filter to show only your "wow factor" opportunities. Sort by score or date added.</p>
      </div>
      <img src="screenshots/filters.png" alt="Filter controls for country, track, and wow factor">
    </section>
  </main>

  <footer>
    <div class="container">
      <p>Open Source · MIT License · <a href="https://github.com/danbim/job-tracker">GitHub</a></p>
    </div>
  </footer>
</body>
</html>
```

**Step 2: Commit**

```bash
git add docs/index.html
git commit -m "feat: add landing page HTML"
```

---

## Task 8: Create Landing Page CSS

**Files:**
- Create: `docs/styles.css`

**Step 1: Create landing page styles**

Create `docs/styles.css`:

```css
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
  line-height: 1.6;
  color: #1a1a1a;
  background: #fafafa;
}

.container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 20px;
}

/* Header */
header {
  background: #18181b;
  color: white;
  padding: 60px 0;
  text-align: center;
}

header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 10px;
}

header .tagline {
  font-size: 1.25rem;
  opacity: 0.9;
  margin-bottom: 20px;
}

.github-link {
  display: inline-block;
  color: white;
  text-decoration: none;
  border: 1px solid rgba(255,255,255,0.3);
  padding: 10px 20px;
  border-radius: 6px;
  transition: background 0.2s, border-color 0.2s;
}

.github-link:hover {
  background: rgba(255,255,255,0.1);
  border-color: rgba(255,255,255,0.5);
}

/* Main content */
main {
  padding: 60px 0;
}

/* Hero section */
.hero {
  text-align: center;
  margin-bottom: 80px;
}

.hero img {
  max-width: 100%;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  margin-bottom: 20px;
}

.hero p {
  font-size: 1.1rem;
  color: #666;
  max-width: 600px;
  margin: 0 auto;
}

/* Feature sections */
.feature {
  display: flex;
  align-items: center;
  gap: 40px;
  margin-bottom: 80px;
}

.feature.reverse {
  flex-direction: row-reverse;
}

.feature-content {
  flex: 1;
}

.feature h2 {
  font-size: 1.5rem;
  margin-bottom: 15px;
  color: #18181b;
}

.feature p {
  color: #666;
}

.feature img {
  flex: 1;
  max-width: 55%;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}

/* Footer */
footer {
  background: #f4f4f5;
  padding: 30px 0;
  text-align: center;
  color: #666;
}

footer a {
  color: #18181b;
}

/* Responsive */
@media (max-width: 768px) {
  header h1 {
    font-size: 2rem;
  }

  .feature,
  .feature.reverse {
    flex-direction: column;
  }

  .feature img {
    max-width: 100%;
  }
}
```

**Step 2: Commit**

```bash
git add docs/styles.css
git commit -m "feat: add landing page styles"
```

---

## Task 9: Create GitHub Actions Workflow

**Files:**
- Create: `.github/workflows/screenshots.yml`

**Step 1: Create workflow directory**

Run:
```bash
mkdir -p .github/workflows
```

**Step 2: Create screenshots workflow**

Create `.github/workflows/screenshots.yml`:

```yaml
name: Update Screenshots

on:
  push:
    branches: [main]
    paths:
      - 'app/**'
      - 'e2e/**'
  workflow_dispatch:

jobs:
  screenshots:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install

      - name: Install Playwright browsers
        run: bunx playwright install --with-deps chromium

      - name: Run screenshot tests
        run: bun run test:e2e
        env:
          TEST_PGLITE: 'true'

      - name: Commit updated screenshots
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add docs/screenshots/
          git diff --staged --quiet || git commit -m "chore: update screenshots [skip ci]"
          git push
```

**Step 3: Commit**

```bash
git add .github/workflows/screenshots.yml
git commit -m "feat: add GitHub Actions workflow for screenshots"
```

---

## Task 10: Run Tests and Generate Initial Screenshots

**Step 1: Run E2E tests locally**

Run:
```bash
TEST_PGLITE=true bun run test:e2e
```

Note: This may fail initially due to PGLite/Drizzle integration issues. Debug and fix as needed.

**Step 2: Verify screenshots were created**

Run:
```bash
ls -la docs/screenshots/
```
Expected: PNG files for each screenshot test

**Step 3: Commit screenshots**

```bash
git add docs/screenshots/
git commit -m "feat: add initial screenshots"
```

---

## Task 11: Final Verification

**Step 1: Preview landing page locally**

Run:
```bash
cd docs && python -m http.server 8000
```
Then open http://localhost:8000 in browser.

**Step 2: Verify all images load**

Check that all 5 screenshots display correctly.

**Step 3: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: landing page adjustments"
```

---

## Summary

| Task | Description |
|------|-------------|
| 1 | Install Playwright and PGLite dependencies |
| 2 | Create Playwright configuration |
| 3 | Update database connection for PGLite support |
| 4 | Create test fixtures (jobs and formulas) |
| 5 | Create test database setup helper |
| 6 | Create screenshot E2E tests |
| 7 | Create landing page HTML |
| 8 | Create landing page CSS |
| 9 | Create GitHub Actions workflow |
| 10 | Run tests and generate initial screenshots |
| 11 | Final verification |
