# Talent Pools Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a talent pools listing page where users track which company talent pools they have joined or submitted their profile to.

**Architecture:** New `talent_pools` table with CRUD operations following the same layered pattern as job posting sites (schema -> repository -> service -> route). Includes a status enum (`submitted`/`not_submitted`) with a clickable toggle badge in the UI.

**Tech Stack:** Drizzle ORM, Zod, React Router v7, shadcn/ui (Table, Dialog, Badge, Button, Input, Textarea, Label)

---

### Task 1: Add database schema and generate migration

**Files:**
- Modify: `app/db/schema.ts`

**Step 1: Add enum and table to schema**

Add after the `jobPostingSites` table and its types at the end of `app/db/schema.ts`:

```typescript
export const talentPoolStatusEnum = pgEnum('talent_pool_status', [
  'not_submitted',
  'submitted',
])

export type TalentPoolStatus =
  (typeof talentPoolStatusEnum.enumValues)[number]

export const talentPools = pgTable('talent_pools', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyName: text('company_name').notNull(),
  url: text('url').notNull(),
  status: talentPoolStatusEnum('status').default('not_submitted').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export type TalentPool = typeof talentPools.$inferSelect
export type NewTalentPool = typeof talentPools.$inferInsert
```

**Step 2: Generate migration**

Run: `bun run db:generate`
Expected: New migration SQL file created in `app/db/migrations/`

**Step 3: Verify migration has statement-breakpoint**

Open the generated migration file. If it contains multiple SQL statements (CREATE TYPE + CREATE TABLE), ensure they are separated by `--> statement-breakpoint`. This is required for PGLite E2E tests.

Example expected content:
```sql
CREATE TYPE "public"."talent_pool_status" AS ENUM('not_submitted', 'submitted');
--> statement-breakpoint
CREATE TABLE "talent_pools" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_name" text NOT NULL,
	"url" text NOT NULL,
	"status" "talent_pool_status" DEFAULT 'not_submitted' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
```

**Step 4: Run typecheck**

Run: `bun run typecheck`
Expected: No errors

**Step 5: Commit**

```bash
git add app/db/schema.ts app/db/migrations/
git commit -m "feat: add talent_pools table and status enum"
```

---

### Task 2: Add Zod validation schema

**Files:**
- Create: `app/schemas/talent-pool.schema.ts`

**Step 1: Create the schema file**

Create `app/schemas/talent-pool.schema.ts`:

```typescript
import { z } from 'zod'

export const talentPoolSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  url: z.string().url('Must be a valid URL'),
  status: z.enum(['not_submitted', 'submitted']).optional(),
  notes: z.string().optional(),
})

export type TalentPoolInput = z.infer<typeof talentPoolSchema>
```

Note: `status` is optional in the schema because it defaults to `not_submitted` at the database level. The add form won't include it; the edit form will.

**Step 2: Run typecheck**

Run: `bun run typecheck`
Expected: No errors

**Step 3: Commit**

```bash
git add app/schemas/talent-pool.schema.ts
git commit -m "feat: add talent pool Zod validation schema"
```

---

### Task 3: Add repository

**Files:**
- Create: `app/repositories/talent-pool.repository.ts`
- Modify: `app/repositories/index.server.ts`

**Step 1: Create the repository**

Create `app/repositories/talent-pool.repository.ts`:

```typescript
import { eq, sql } from 'drizzle-orm'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import type * as schema from '~/db/schema'
import {
  type NewTalentPool,
  type TalentPool,
  talentPools,
} from '~/db/schema'

export class TalentPoolRepository {
  constructor(private db: PostgresJsDatabase<typeof schema>) {}

  async findAll(): Promise<TalentPool[]> {
    return this.db
      .select()
      .from(talentPools)
      .orderBy(
        sql`${talentPools.status} DESC`,
        sql`${talentPools.companyName} ASC`,
      )
  }

  async findById(id: string): Promise<TalentPool | undefined> {
    const results = await this.db
      .select()
      .from(talentPools)
      .where(eq(talentPools.id, id))
    return results[0]
  }

  async create(data: NewTalentPool): Promise<TalentPool> {
    const results = await this.db
      .insert(talentPools)
      .values(data)
      .returning()
    return results[0]
  }

  async update(
    id: string,
    data: Partial<NewTalentPool>,
  ): Promise<TalentPool | undefined> {
    const results = await this.db
      .update(talentPools)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(talentPools.id, id))
      .returning()
    return results[0]
  }

  async delete(id: string): Promise<boolean> {
    const results = await this.db
      .delete(talentPools)
      .where(eq(talentPools.id, id))
      .returning()
    return results.length > 0
  }

  async toggleStatus(id: string): Promise<TalentPool | undefined> {
    const pool = await this.findById(id)
    if (!pool) return undefined
    const newStatus =
      pool.status === 'submitted' ? 'not_submitted' : 'submitted'
    const now = new Date()
    const results = await this.db
      .update(talentPools)
      .set({ status: newStatus, updatedAt: now })
      .where(eq(talentPools.id, id))
      .returning()
    return results[0]
  }
}
```

Note on ordering: `status DESC` puts `not_submitted` before `submitted` because `not_submitted` comes after `submitted` alphabetically — but the enum is defined as `['not_submitted', 'submitted']`, so enum ordinal 0 = `not_submitted`, 1 = `submitted`. `DESC` puts `submitted` (1) first. We actually want `not_submitted` first (actionable items). Use `ASC` instead:

```typescript
.orderBy(
  sql`${talentPools.status} ASC`,
  sql`${talentPools.companyName} ASC`,
)
```

Enum ordinal 0 = `not_submitted`, 1 = `submitted`. ASC puts 0 first. Correct.

**Step 2: Register in index.server.ts**

Add to `app/repositories/index.server.ts`:

```typescript
import { TalentPoolRepository } from './talent-pool.repository'
```

And at the end:

```typescript
export const talentPoolRepository = new TalentPoolRepository(db)
```

**Step 3: Run typecheck**

Run: `bun run typecheck`
Expected: No errors

**Step 4: Commit**

```bash
git add app/repositories/talent-pool.repository.ts app/repositories/index.server.ts
git commit -m "feat: add talent pool repository"
```

---

### Task 4: Add service

**Files:**
- Create: `app/services/talent-pool.service.ts`
- Modify: `app/services/index.server.ts`

**Step 1: Create the service**

Create `app/services/talent-pool.service.ts`:

```typescript
import type { NewTalentPool, TalentPool } from '~/db/schema'
import type { TalentPoolRepository } from '~/repositories/talent-pool.repository'

export class TalentPoolService {
  constructor(private repository: TalentPoolRepository) {}

  async findAll(): Promise<TalentPool[]> {
    return this.repository.findAll()
  }

  async findById(id: string): Promise<TalentPool | undefined> {
    return this.repository.findById(id)
  }

  async create(data: NewTalentPool): Promise<TalentPool> {
    return this.repository.create(data)
  }

  async update(
    id: string,
    data: Partial<NewTalentPool>,
  ): Promise<TalentPool | undefined> {
    return this.repository.update(id, data)
  }

  async delete(id: string): Promise<boolean> {
    return this.repository.delete(id)
  }

  async toggleStatus(id: string): Promise<TalentPool | undefined> {
    return this.repository.toggleStatus(id)
  }
}
```

**Step 2: Register in index.server.ts**

Add to `app/services/index.server.ts`:

Import:
```typescript
import { talentPoolRepository } from '~/repositories/index.server'
import { TalentPoolService } from './talent-pool.service'
```

Export:
```typescript
export const talentPoolService = new TalentPoolService(talentPoolRepository)
```

Also add `talentPoolRepository` to the re-export block:
```typescript
export {
  jobNoteRepository,
  jobOpeningRepository,
  scoringFormulaRepository,
  talentPoolRepository,
} from '~/repositories/index.server'
```

**Step 3: Run typecheck**

Run: `bun run typecheck`
Expected: No errors

**Step 4: Commit**

```bash
git add app/services/talent-pool.service.ts app/services/index.server.ts
git commit -m "feat: add talent pool service"
```

---

### Task 5: Add route and UI page

**Files:**
- Create: `app/routes/talent-pools.tsx`
- Modify: `app/routes.ts`

**Step 1: Register the route**

Add to `app/routes.ts` before the closing `]`:

```typescript
route('talent-pools', 'routes/talent-pools.tsx'),
```

**Step 2: Create the route page**

Create `app/routes/talent-pools.tsx`. This follows the same structure as `app/routes/sites.tsx`:

```tsx
import { useState } from 'react'
import { Form, Link, useFetcher, useLoaderData } from 'react-router'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import { Textarea } from '~/components/ui/textarea'
import type { TalentPool } from '~/db/schema'
import { talentPoolSchema } from '~/schemas/talent-pool.schema'
import { talentPoolService } from '~/services/index.server'
import type { Route } from './+types/talent-pools'

export function meta() {
  return [
    { title: 'Talent Pools - Job Tracker' },
    {
      name: 'description',
      content: 'Track talent pools you have joined or submitted to',
    },
  ]
}

export async function loader() {
  const pools = await talentPoolService.findAll()
  return { pools }
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData()
  const intent = formData.get('intent')

  if (intent === 'createPool') {
    const result = talentPoolSchema.safeParse({
      companyName: formData.get('companyName'),
      url: formData.get('url'),
      notes: formData.get('notes') || undefined,
    })
    if (!result.success) {
      return { errors: result.error.flatten().fieldErrors }
    }
    await talentPoolService.create(result.data)
    return { success: true }
  }

  if (intent === 'updatePool') {
    const id = formData.get('id') as string
    const result = talentPoolSchema.safeParse({
      companyName: formData.get('companyName'),
      url: formData.get('url'),
      status: formData.get('status') || undefined,
      notes: formData.get('notes') || undefined,
    })
    if (!result.success) {
      return { errors: result.error.flatten().fieldErrors }
    }
    await talentPoolService.update(id, result.data)
    return { success: true }
  }

  if (intent === 'deletePool') {
    const id = formData.get('id') as string
    await talentPoolService.delete(id)
    return { success: true }
  }

  if (intent === 'toggleStatus') {
    const id = formData.get('id') as string
    await talentPoolService.toggleStatus(id)
    return { success: true }
  }

  return { success: false }
}

export default function TalentPools() {
  const { pools } = useLoaderData<typeof loader>()
  const [editPool, setEditPool] = useState<TalentPool | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [deletePool, setDeletePool] = useState<TalentPool | null>(null)
  const fetcher = useFetcher()

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Talent Pools</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/">Back to Jobs</Link>
          </Button>
          <Button onClick={() => setAddOpen(true)}>Add Pool</Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Company</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pools.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={4}
                className="text-center text-muted-foreground"
              >
                No talent pools yet. Add one to start tracking.
              </TableCell>
            </TableRow>
          ) : (
            pools.map((pool) => (
              <TableRow key={pool.id}>
                <TableCell>
                  <a
                    href={pool.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline inline-flex items-center gap-1"
                  >
                    {pool.companyName}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      role="img"
                      aria-label="External link"
                    >
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>
                </TableCell>
                <TableCell>
                  <fetcher.Form method="post">
                    <input type="hidden" name="intent" value="toggleStatus" />
                    <input type="hidden" name="id" value={pool.id} />
                    <button type="submit" className="cursor-pointer">
                      <Badge
                        variant={
                          pool.status === 'submitted' ? 'default' : 'secondary'
                        }
                        className={
                          pool.status === 'submitted'
                            ? 'bg-green-100 text-green-800 hover:bg-green-200 border-green-200'
                            : ''
                        }
                      >
                        {pool.status === 'submitted'
                          ? 'Submitted'
                          : 'Not Submitted'}
                      </Badge>
                    </button>
                  </fetcher.Form>
                </TableCell>
                <TableCell className="text-muted-foreground max-w-xs truncate">
                  {pool.notes || '-'}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditPool(pool)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => setDeletePool(pool)}
                    >
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Add Pool Modal */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Talent Pool</DialogTitle>
            <DialogDescription>
              Add a talent pool you have joined or want to submit to.
            </DialogDescription>
          </DialogHeader>
          <Form method="post" onSubmit={() => setAddOpen(false)}>
            <input type="hidden" name="intent" value="createPool" />
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="add-companyName">Company Name</Label>
                <Input
                  id="add-companyName"
                  name="companyName"
                  placeholder="e.g. Stripe"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="add-url">URL</Label>
                <Input
                  id="add-url"
                  name="url"
                  type="url"
                  placeholder="https://..."
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="add-notes">Notes</Label>
                <Textarea
                  id="add-notes"
                  name="notes"
                  placeholder="Any notes about this talent pool..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Pool Modal */}
      <Dialog
        open={!!editPool}
        onOpenChange={(open) => !open && setEditPool(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Talent Pool</DialogTitle>
          </DialogHeader>
          {editPool && (
            <Form method="post" onSubmit={() => setEditPool(null)}>
              <input type="hidden" name="intent" value="updatePool" />
              <input type="hidden" name="id" value={editPool.id} />
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-companyName">Company Name</Label>
                  <Input
                    id="edit-companyName"
                    name="companyName"
                    defaultValue={editPool.companyName}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-url">URL</Label>
                  <Input
                    id="edit-url"
                    name="url"
                    type="url"
                    defaultValue={editPool.url}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <select
                    id="edit-status"
                    name="status"
                    defaultValue={editPool.status}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm"
                  >
                    <option value="not_submitted">Not Submitted</option>
                    <option value="submitted">Submitted</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-notes">Notes</Label>
                  <Textarea
                    id="edit-notes"
                    name="notes"
                    defaultValue={editPool.notes ?? ''}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditPool(null)}
                >
                  Cancel
                </Button>
                <Button type="submit">Save</Button>
              </DialogFooter>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog
        open={!!deletePool}
        onOpenChange={(open) => !open && setDeletePool(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Talent Pool</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deletePool?.companyName}
              &quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletePool(null)}
            >
              Cancel
            </Button>
            <Form method="post" onSubmit={() => setDeletePool(null)}>
              <input type="hidden" name="intent" value="deletePool" />
              <input type="hidden" name="id" value={deletePool?.id} />
              <Button type="submit" variant="destructive">
                Delete
              </Button>
            </Form>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
```

**Step 3: Run typecheck**

Run: `bun run typecheck`
Expected: No errors

**Step 4: Commit**

```bash
git add app/routes/talent-pools.tsx app/routes.ts
git commit -m "feat: add talent pools route and page"
```

---

### Task 6: Add navigation links

**Files:**
- Modify: `app/routes/home.tsx:227-228`

**Step 1: Add "Talent Pools" link to home page nav**

In `app/routes/home.tsx`, find the nav buttons section (around line 227). Add a "Talent Pools" link after the "Sites" link:

```tsx
<Button asChild variant="outline">
  <Link to="/sites">Sites</Link>
</Button>
<Button asChild variant="outline">
  <Link to="/talent-pools">Talent Pools</Link>
</Button>
```

**Step 2: Run typecheck**

Run: `bun run typecheck`
Expected: No errors

**Step 3: Commit**

```bash
git add app/routes/home.tsx
git commit -m "feat: add Talent Pools link to home page navigation"
```

---

### Task 7: Add E2E seed data and update test database setup

**Files:**
- Modify: `e2e/fixtures.ts`
- Modify: `app/db/db.server.ts:19-24`

**Step 1: Add test talent pools to fixtures**

Add to `e2e/fixtures.ts`. First, add `NewTalentPool` to the import:

```typescript
import type {
  NewJobOpening,
  NewJobPostingSite,
  NewScoringFormula,
  NewTalentPool,
} from '../app/db/schema'
```

Then add at the end of the file:

```typescript
/**
 * Test talent pools with varied statuses
 */
export const testPools: NewTalentPool[] = [
  {
    companyName: 'Stripe',
    url: 'https://stripe.com/jobs/talent',
    status: 'submitted',
    notes: 'Applied through referral from a friend.',
  },
  {
    companyName: 'Datadog',
    url: 'https://careers.datadoghq.com/talent-pool',
    status: 'submitted',
    notes: null,
  },
  {
    companyName: 'Vercel',
    url: 'https://vercel.com/careers/talent',
    status: 'not_submitted',
    notes: 'Saw this on Twitter, looks interesting.',
  },
  {
    companyName: 'Cloudflare',
    url: 'https://www.cloudflare.com/careers/talent-pool',
    status: 'not_submitted',
    notes: null,
  },
]
```

**Step 2: Seed talent pools in db.server.ts**

In `app/db/db.server.ts`, update the import (line 19) to include `testPools`:

```typescript
const { testFormulas, testJobs, testSites, testPools } = await import(
  '../../e2e/fixtures'
)
```

Add after line 24 (`await db.insert(schema.jobPostingSites).values(testSites)`):

```typescript
await db.insert(schema.talentPools).values(testPools)
```

**Step 3: Run typecheck**

Run: `bun run typecheck`
Expected: No errors

**Step 4: Commit**

```bash
git add e2e/fixtures.ts app/db/db.server.ts
git commit -m "feat: add talent pool E2E seed data"
```

---

### Task 8: Add E2E tests

**Files:**
- Create: `e2e/talent-pools.spec.ts`

**Step 1: Create E2E test file**

Create `e2e/talent-pools.spec.ts`:

```typescript
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
    await expect(page.locator('text=Vercel').first()).not.toHaveText('Vercel', {
      exact: true,
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
```

**Step 2: Run E2E tests**

Run: `bun run test:e2e`
Expected: All talent pool tests pass. If any test fails, fix and re-run.

**Step 3: Commit**

```bash
git add e2e/talent-pools.spec.ts
git commit -m "feat: add talent pools E2E tests"
```

---

### Task 9: Lint and final verification

**Step 1: Run Biome lint and format**

Run: `bun run check:fix`
Expected: All files formatted and linted. Fix any issues if they arise.

**Step 2: Run typecheck**

Run: `bun run typecheck`
Expected: No errors

**Step 3: Run unit tests**

Run: `bun test`
Expected: All tests pass

**Step 4: Run E2E tests**

Run: `bun run test:e2e`
Expected: All tests pass (including existing tests — no regressions)

**Step 5: Commit any formatting fixes**

If Biome made changes:

```bash
git add -A
git commit -m "chore: lint and format"
```
