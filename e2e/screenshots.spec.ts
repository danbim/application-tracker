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
