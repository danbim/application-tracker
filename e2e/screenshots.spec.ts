import { test } from '@playwright/test'

test.describe('Landing page screenshots', () => {
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

  test('notes panel', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('table')

    // Click on the first job row (Stripe - Staff Software Engineer) to open notes panel
    await page.locator('td:has-text("Stripe")').click()
    await page.waitForSelector('[role="dialog"]')

    // Add a couple of notes to make the screenshot useful
    const panel = page.locator('[role="dialog"]')
    await panel.locator('textarea[name="content"]').fill('Had a great call with the hiring manager. Team works on distributed systems at massive scale.')
    await panel.locator('button:has-text("Add Note")').click()
    await panel.locator('.prose:has-text("Had a great call")').waitFor({ timeout: 10000 })

    await panel.locator('textarea[name="content"]').fill('Tech stack: TypeScript, Go, Kubernetes. Strong engineering culture.')
    await panel.locator('button:has-text("Add Note")').click()
    await panel.locator('.prose:has-text("Tech stack")').waitFor({ timeout: 10000 })

    await page.screenshot({
      path: 'docs/screenshots/notes-panel.png',
      fullPage: false,
    })
  })

  test('job posting sites', async ({ page }) => {
    await page.goto('/sites')
    await page.waitForSelector('table')
    await page.waitForTimeout(300)

    await page.screenshot({
      path: 'docs/screenshots/sites.png',
      fullPage: false,
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
