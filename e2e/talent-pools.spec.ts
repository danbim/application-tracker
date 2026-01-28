import { expect, test } from '@playwright/test'

test.describe('Talent Pools', () => {
  test('should display seeded talent pools', async ({ page }) => {
    await page.goto('/talent-pools')
    await page.waitForSelector('table')

    // not_submitted pools should appear (sorted first)
    await expect(page.locator('text=Cloudflare')).toBeVisible()
    await expect(page.locator('text=Vercel')).toBeVisible()

    // submitted pools should appear
    await expect(page.locator('text=Datadog')).toBeVisible()
    await expect(page.locator('text=Stripe')).toBeVisible()
  })

  test('should navigate to talent pools from home page', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('table')

    await page.click('a:has-text("Talent Pools")')
    await page.waitForURL('/talent-pools')
    await page.waitForSelector('table')

    await expect(
      page.locator('h1:has-text("Talent Pools")'),
    ).toBeVisible()
  })

  test('should add a new talent pool', async ({ page }) => {
    await page.goto('/talent-pools')
    await page.waitForSelector('table')

    await page.click('button:has-text("Add Pool")')

    const dialog = page.locator('[data-slot="dialog-content"]')
    await expect(dialog).toBeVisible()
    await dialog.locator('#add-companyName').fill('GitHub')
    await dialog.locator('#add-url').fill('https://github.com/about/careers')
    await dialog.locator('#add-notes').fill('Great engineering culture.')
    await dialog.locator('button:has-text("Save")').click()

    await expect(page.locator('text=GitHub')).toBeVisible({ timeout: 10000 })
  })

  test('should edit a talent pool', async ({ page }) => {
    await page.goto('/talent-pools')
    await page.waitForSelector('table')

    const row = page.locator('tr:has-text("Vercel")')
    await row.locator('button:has-text("Edit")').click()

    const dialog = page.locator('[data-slot="dialog-content"]')
    await expect(dialog).toBeVisible()

    await dialog.locator('#edit-companyName').fill('Vercel Inc.')
    await dialog.locator('button:has-text("Save")').click()

    await expect(page.locator('text=Vercel Inc.')).toBeVisible({
      timeout: 10000,
    })
  })

  test('should delete a talent pool', async ({ page }) => {
    await page.goto('/talent-pools')
    await page.waitForSelector('table')

    const row = page.locator('tr:has-text("Cloudflare")')
    await row.locator('button:has-text("Delete")').click()

    const dialog = page.locator('[data-slot="dialog-content"]')
    await expect(dialog).toBeVisible()
    await expect(dialog.locator('text=Are you sure')).toBeVisible()

    await dialog.locator('button:has-text("Delete")').click()

    await expect(page.locator('text=Cloudflare')).not.toBeVisible({
      timeout: 10000,
    })
  })

  test('should toggle status', async ({ page }) => {
    await page.goto('/talent-pools')
    await page.waitForSelector('table')

    // Vercel is "not_submitted" - toggle to "submitted"
    const row = page.locator('tr:has-text("Vercel")')
    await expect(row.locator('text=Not Submitted')).toBeVisible()

    await row.locator('button:has([data-slot="badge"])').click()

    await expect(row.locator('text=Submitted')).toBeVisible({
      timeout: 10000,
    })
  })

  test('should have working external links', async ({ page }) => {
    await page.goto('/talent-pools')
    await page.waitForSelector('table')

    const link = page.locator('a:has-text("Stripe")')
    await expect(link).toHaveAttribute(
      'href',
      'https://stripe.com/jobs/talent',
    )
    await expect(link).toHaveAttribute('target', '_blank')
  })

  test('should navigate back to jobs from talent pools page', async ({
    page,
  }) => {
    await page.goto('/talent-pools')
    await page.waitForSelector('table')

    await page.click('a:has-text("Back to Jobs")')
    await page.waitForURL('/')
    await page.waitForSelector('table')

    await expect(page.locator('h1:has-text("Job Openings")')).toBeVisible()
  })
})
