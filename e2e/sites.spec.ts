import { expect, test } from '@playwright/test'

test.describe('Job Posting Sites', () => {
  test('should display seeded sites on the sites page', async ({ page }) => {
    await page.goto('/sites')
    await page.waitForSelector('table')

    // All seeded sites should be visible
    await expect(page.locator('text=LinkedIn - React Berlin')).toBeVisible()
    await expect(page.locator('text=Indeed - Engineering Manager')).toBeVisible()
    await expect(
      page.locator('text=Hacker News - Who is Hiring'),
    ).toBeVisible()
    await expect(page.locator('text=WeWorkRemotely')).toBeVisible()
    await expect(page.locator('text=Berlin Startup Jobs')).toBeVisible()

    // The never-checked site should show "Never"
    const berlinRow = page.locator('tr:has-text("Berlin Startup Jobs")')
    await expect(berlinRow.locator('text=Never')).toBeVisible()
  })

  test('should navigate to sites from home page', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('table')

    await page.click('a:has-text("Sites")')
    await page.waitForURL('/sites')
    await page.waitForSelector('table')

    await expect(
      page.locator('h1:has-text("Job Posting Sites")'),
    ).toBeVisible()
  })

  test('should add a new site', async ({ page }) => {
    await page.goto('/sites')
    await page.waitForSelector('table')

    // Click Add Site button
    await page.click('button:has-text("Add Site")')

    // Fill in the modal
    const dialog = page.locator('[data-slot="dialog-content"]')
    await expect(dialog).toBeVisible()
    await dialog.locator('#add-name').fill('Stack Overflow Jobs')
    await dialog.locator('#add-url').fill('https://stackoverflow.com/jobs')
    await dialog.locator('button:has-text("Save")').click()

    // New site should appear in the table
    await expect(
      page.locator('text=Stack Overflow Jobs'),
    ).toBeVisible({ timeout: 10000 })
  })

  test('should edit a site', async ({ page }) => {
    await page.goto('/sites')
    await page.waitForSelector('table')

    // Click Edit on the first site row
    const row = page.locator('tr:has-text("LinkedIn - React Berlin")')
    await row.locator('button:has-text("Edit")').click()

    // Edit modal should show with pre-filled values
    const dialog = page.locator('[data-slot="dialog-content"]')
    await expect(dialog).toBeVisible()

    // Change the name
    await dialog.locator('#edit-name').fill('LinkedIn - TypeScript Berlin')
    await dialog.locator('button:has-text("Save")').click()

    // Updated name should appear
    await expect(
      page.locator('text=LinkedIn - TypeScript Berlin'),
    ).toBeVisible({ timeout: 10000 })
    await expect(
      page.locator('text=LinkedIn - React Berlin'),
    ).not.toBeVisible()
  })

  test('should delete a site', async ({ page }) => {
    await page.goto('/sites')
    await page.waitForSelector('table')

    // Click Delete on WeWorkRemotely
    const row = page.locator('tr:has-text("WeWorkRemotely")')
    await row.locator('button:has-text("Delete")').click()

    // Confirmation dialog should appear
    const dialog = page.locator('[data-slot="dialog-content"]')
    await expect(dialog).toBeVisible()
    await expect(dialog.locator('text=Are you sure')).toBeVisible()

    // Confirm deletion
    await dialog.locator('button:has-text("Delete")').click()

    // Site should be gone
    await expect(page.locator('text=WeWorkRemotely')).not.toBeVisible({
      timeout: 10000,
    })
  })

  test('should mark a site as just checked', async ({ page }) => {
    await page.goto('/sites')
    await page.waitForSelector('table')

    // Berlin Startup Jobs should show "Never"
    const row = page.locator('tr:has-text("Berlin Startup Jobs")')
    await expect(row.locator('text=Never')).toBeVisible()

    // Click "Just Checked"
    await row.locator('button:has-text("Just Checked")').click()

    // Should now show a relative timestamp instead of "Never"
    await expect(row.locator('text=less than a minute ago')).toBeVisible({
      timeout: 10000,
    })
    await expect(row.locator('text=Never')).not.toBeVisible()
  })

  test('should have working external links', async ({ page }) => {
    await page.goto('/sites')
    await page.waitForSelector('table')

    // Verify the link has correct href and target (use a site not modified by earlier tests)
    const link = page.locator(
      'a:has-text("Hacker News - Who is Hiring")',
    )
    await expect(link).toHaveAttribute(
      'href',
      'https://news.ycombinator.com/item?id=whoishiring',
    )
    await expect(link).toHaveAttribute('target', '_blank')
  })

  test('should navigate back to jobs from sites page', async ({ page }) => {
    await page.goto('/sites')
    await page.waitForSelector('table')

    await page.click('a:has-text("Back to Jobs")')
    await page.waitForURL('/')
    await page.waitForSelector('table')

    await expect(page.locator('h1:has-text("Job Openings")')).toBeVisible()
  })
})
