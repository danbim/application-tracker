import { expect, test } from '@playwright/test'

test.describe('Job Notes', () => {
  // Use unique identifiers for each test to avoid collisions
  let uniqueCompany: string
  let uniqueTitle: string

  test.beforeEach(async ({ page }, testInfo) => {
    // Create unique identifier based on test name and timestamp
    const uniqueId = `${Date.now()}`
    uniqueCompany = `TestCo-${uniqueId}`
    uniqueTitle = `Engineer-${uniqueId}`

    // Create a job first
    await page.goto('/jobs/new')
    await page.waitForSelector('form')

    await page.fill('#title', uniqueTitle)
    await page.fill('#company', uniqueCompany)
    await page.fill('#description', 'Test job description')
    await page.click('button[type="submit"]')
    await page.waitForURL('/')
    await page.waitForSelector('table')
  })

  test('should open notes panel when clicking job row', async ({ page }) => {
    // Click on the company cell to trigger row click
    await page.click(`td:has-text("${uniqueCompany}")`)

    // Notes panel should open with job details
    const panel = page.locator('[role="dialog"]')
    await expect(panel).toBeVisible()
    await expect(panel.locator('h2')).toContainText(uniqueTitle)
    await expect(panel.locator(`text=${uniqueCompany}`)).toBeVisible()
    await expect(panel.locator('text=No notes yet')).toBeVisible()
  })

  test('should add a note from edit page', async ({ page }) => {
    // Navigate to edit page for our test job
    const jobRow = page.locator(`tr:has-text("${uniqueCompany}")`)
    await jobRow.locator('a:has-text("Edit")').click()
    await page.waitForURL(/\/jobs\/.*\/edit/)
    await page.waitForSelector('form')

    // Open notes panel
    await page.click('button:has-text("Notes")')
    await page.waitForSelector('[role="dialog"]')

    // Add a note
    const panel = page.locator('[role="dialog"]')
    await panel.locator('textarea[name="content"]').fill('My first note')
    await panel.locator('button:has-text("Add Note")').click()

    // Wait for the note to appear (React Router revalidates after fetcher submission)
    await expect(panel.locator('.prose:has-text("My first note")')).toBeVisible({ timeout: 10000 })
  })

  test('should edit a note from edit page', async ({ page }) => {
    // Navigate to edit page for our test job
    const jobRow = page.locator(`tr:has-text("${uniqueCompany}")`)
    await jobRow.locator('a:has-text("Edit")').click()
    await page.waitForURL(/\/jobs\/.*\/edit/)
    await page.waitForSelector('form')

    // Open notes panel
    await page.click('button:has-text("Notes")')
    await page.waitForSelector('[role="dialog"]')

    // Add a note first
    const panel = page.locator('[role="dialog"]')
    await panel.locator('textarea[name="content"]').fill('Original note')
    await panel.locator('button:has-text("Add Note")').click()

    // Wait for the note to appear
    await expect(panel.locator('.prose:has-text("Original note")')).toBeVisible({ timeout: 10000 })

    // Edit the note - click Edit button on the note
    await panel.locator('button:has-text("Edit")').click()

    // The textarea in edit mode should have the original content
    const editTextarea = panel.locator('.border.rounded-lg textarea[name="content"]')
    await editTextarea.fill('Updated note')
    await panel.locator('button:has-text("Save")').click()

    // Updated note should appear
    await expect(panel.locator('.prose:has-text("Updated note")')).toBeVisible({ timeout: 10000 })
    await expect(panel.locator('.prose:has-text("Original note")')).not.toBeVisible()
  })

  test('should delete a note from edit page', async ({ page }) => {
    // Navigate to edit page for our test job
    const jobRow = page.locator(`tr:has-text("${uniqueCompany}")`)
    await jobRow.locator('a:has-text("Edit")').click()
    await page.waitForURL(/\/jobs\/.*\/edit/)
    await page.waitForSelector('form')

    // Open notes panel
    await page.click('button:has-text("Notes")')
    await page.waitForSelector('[role="dialog"]')

    // Add a note first
    const panel = page.locator('[role="dialog"]')
    await panel.locator('textarea[name="content"]').fill('Note to delete')
    await panel.locator('button:has-text("Add Note")').click()

    // Wait for the note to appear
    await expect(panel.locator('.prose:has-text("Note to delete")')).toBeVisible({ timeout: 10000 })

    // Delete the note
    await panel.locator('button:has-text("Delete")').click()

    // Note should be gone and empty state should appear
    await expect(panel.locator('.prose:has-text("Note to delete")')).not.toBeVisible()
    await expect(panel.locator('text=No notes yet')).toBeVisible()
  })

  test('should show note count badge after adding note', async ({ page }) => {
    // Navigate to edit page for our test job
    const jobRow = page.locator(`tr:has-text("${uniqueCompany}")`)
    await jobRow.locator('a:has-text("Edit")').click()
    await page.waitForURL(/\/jobs\/.*\/edit/)
    await page.waitForSelector('form')

    // Open notes panel and add a note
    await page.click('button:has-text("Notes")')
    await page.waitForSelector('[role="dialog"]')

    const panel = page.locator('[role="dialog"]')
    await panel.locator('textarea[name="content"]').fill('Note 1')
    await panel.locator('button:has-text("Add Note")').click()

    // Wait for the note to appear
    await expect(panel.locator('.prose:has-text("Note 1")')).toBeVisible({ timeout: 10000 })

    // Close panel and go back to dashboard
    await page.click('[data-testid="notes-panel-backdrop"]')
    await expect(page.locator('[role="dialog"]')).not.toBeVisible()

    // Navigate back to dashboard
    await page.goto('/')
    await page.waitForSelector('table')

    // Click on "Not Applied" tab to see our new job (new jobs start as "not_applied")
    await page.click('[role="tab"]:has-text("Not Applied")')
    await page.waitForTimeout(300)

    // Badge should show count of 1 next to the job title (Badge component uses a span)
    const jobRowWithBadge = page.locator(`tr:has-text("${uniqueCompany}")`)
    // The badge appears as a small span with the number after the title
    await expect(jobRowWithBadge.locator('text=1').first()).toBeVisible()
  })

  test('should open notes from edit page', async ({ page }) => {
    // Navigate to edit page for our test job
    const jobRow = page.locator(`tr:has-text("${uniqueCompany}")`)
    await jobRow.locator('a:has-text("Edit")').click()
    await page.waitForURL(/\/jobs\/.*\/edit/)
    await page.waitForSelector('form')

    // Click Notes button
    await page.click('button:has-text("Notes")')

    // Notes panel should open
    const panel = page.locator('[role="dialog"]')
    await expect(panel).toBeVisible()
    await expect(panel.locator('text=No notes yet')).toBeVisible()
  })

  test('should close notes panel with Escape key', async ({ page }) => {
    // Open notes panel from dashboard
    await page.click(`td:has-text("${uniqueCompany}")`)
    await page.waitForSelector('[role="dialog"]')

    // Press Escape to close
    await page.keyboard.press('Escape')

    // Panel should be closed
    await expect(page.locator('[role="dialog"]')).not.toBeVisible()
  })

  test('should close notes panel with close button', async ({ page }) => {
    // Open notes panel from dashboard
    await page.click(`td:has-text("${uniqueCompany}")`)
    await page.waitForSelector('[role="dialog"]')

    // Click the close button (X)
    await page.click('[role="dialog"] button[aria-label="Close notes panel"]')

    // Panel should be closed
    await expect(page.locator('[role="dialog"]')).not.toBeVisible()
  })
})
