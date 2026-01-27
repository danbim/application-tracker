# Job Posting Sites Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a page to track job posting sites/saved searches with "last checked" timestamps.

**Architecture:** New DB table → repository → service → route. Single-page UI with modals for add/edit/delete. Navigation link from the home page.

**Tech Stack:** Drizzle ORM (schema + migration), Zod (validation), React Router v7 (loader/action), shadcn/ui (Table, Button, Dialog, Input, Label)

---

### Task 1: Database Schema

**Files:**
- Modify: `app/db/schema.ts` (add table definition after line 124)

**Step 1: Add the `jobPostingSites` table to the schema**

Add to `app/db/schema.ts` after the `jobNotes` table definition (after line 124):

```typescript
export const jobPostingSites = pgTable('job_posting_sites', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  url: text('url').notNull(),
  lastCheckedAt: timestamp('last_checked_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export type JobPostingSite = typeof jobPostingSites.$inferSelect
export type NewJobPostingSite = typeof jobPostingSites.$inferInsert
```

**Step 2: Generate the migration**

Run: `bun run db:generate`

This will create a new migration file in `app/db/migrations/`.

**Step 3: Verify the generated SQL**

Check the generated migration file contains a `CREATE TABLE "job_posting_sites"` statement. If it contains multiple SQL statements, add `--> statement-breakpoint` between them (required for PGLite E2E tests).

**Step 4: Run the migration**

Run: `bun run db:migrate`
Expected: Migration applied successfully.

**Step 5: Run typecheck**

Run: `bun run typecheck`
Expected: No errors.

**Step 6: Commit**

```bash
git add app/db/schema.ts app/db/migrations/
git commit -m "feat: add job_posting_sites table"
```

---

### Task 2: Zod Validation Schema

**Files:**
- Create: `app/schemas/job-posting-site.schema.ts`

**Step 1: Create the validation schema**

Create `app/schemas/job-posting-site.schema.ts`:

```typescript
import { z } from 'zod'

export const jobPostingSiteSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  url: z.string().url('Must be a valid URL'),
})

export type JobPostingSiteInput = z.infer<typeof jobPostingSiteSchema>
```

**Step 2: Run typecheck**

Run: `bun run typecheck`
Expected: No errors.

**Step 3: Commit**

```bash
git add app/schemas/job-posting-site.schema.ts
git commit -m "feat: add job posting site validation schema"
```

---

### Task 3: Repository

**Files:**
- Create: `app/repositories/job-posting-site.repository.ts`
- Modify: `app/repositories/index.server.ts`

**Step 1: Create the repository**

Create `app/repositories/job-posting-site.repository.ts`:

```typescript
import { asc, eq, sql } from 'drizzle-orm'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import type * as schema from '~/db/schema'
import {
  type JobPostingSite,
  type NewJobPostingSite,
  jobPostingSites,
} from '~/db/schema'

export class JobPostingSiteRepository {
  constructor(private db: PostgresJsDatabase<typeof schema>) {}

  async findAll(): Promise<JobPostingSite[]> {
    return this.db
      .select()
      .from(jobPostingSites)
      .orderBy(
        sql`${jobPostingSites.lastCheckedAt} ASC NULLS FIRST`,
      )
  }

  async findById(id: string): Promise<JobPostingSite | undefined> {
    const results = await this.db
      .select()
      .from(jobPostingSites)
      .where(eq(jobPostingSites.id, id))
    return results[0]
  }

  async create(data: NewJobPostingSite): Promise<JobPostingSite> {
    const results = await this.db
      .insert(jobPostingSites)
      .values(data)
      .returning()
    return results[0]
  }

  async update(
    id: string,
    data: Partial<NewJobPostingSite>,
  ): Promise<JobPostingSite | undefined> {
    const results = await this.db
      .update(jobPostingSites)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(jobPostingSites.id, id))
      .returning()
    return results[0]
  }

  async delete(id: string): Promise<boolean> {
    const results = await this.db
      .delete(jobPostingSites)
      .where(eq(jobPostingSites.id, id))
      .returning()
    return results.length > 0
  }

  async markChecked(id: string): Promise<JobPostingSite | undefined> {
    const now = new Date()
    const results = await this.db
      .update(jobPostingSites)
      .set({ lastCheckedAt: now, updatedAt: now })
      .where(eq(jobPostingSites.id, id))
      .returning()
    return results[0]
  }
}
```

**Step 2: Register the singleton**

Add to `app/repositories/index.server.ts`:

```typescript
import { JobPostingSiteRepository } from './job-posting-site.repository'
```

And add the export:

```typescript
export const jobPostingSiteRepository = new JobPostingSiteRepository(db)
```

**Step 3: Run typecheck**

Run: `bun run typecheck`
Expected: No errors.

**Step 4: Commit**

```bash
git add app/repositories/job-posting-site.repository.ts app/repositories/index.server.ts
git commit -m "feat: add job posting site repository"
```

---

### Task 4: Service Layer

**Files:**
- Create: `app/services/job-posting-site.service.ts`
- Modify: `app/services/index.server.ts`

**Step 1: Create the service**

Create `app/services/job-posting-site.service.ts`:

```typescript
import type {
  JobPostingSite,
  NewJobPostingSite,
} from '~/db/schema'
import type { JobPostingSiteRepository } from '~/repositories/job-posting-site.repository'

export class JobPostingSiteService {
  constructor(private repository: JobPostingSiteRepository) {}

  async findAll(): Promise<JobPostingSite[]> {
    return this.repository.findAll()
  }

  async findById(id: string): Promise<JobPostingSite | undefined> {
    return this.repository.findById(id)
  }

  async create(data: NewJobPostingSite): Promise<JobPostingSite> {
    return this.repository.create(data)
  }

  async update(
    id: string,
    data: Partial<NewJobPostingSite>,
  ): Promise<JobPostingSite | undefined> {
    return this.repository.update(id, data)
  }

  async delete(id: string): Promise<boolean> {
    return this.repository.delete(id)
  }

  async markChecked(id: string): Promise<JobPostingSite | undefined> {
    return this.repository.markChecked(id)
  }
}
```

**Step 2: Register the service singleton**

In `app/services/index.server.ts`, add the import and instantiation. The file should become:

```typescript
import { jobPostingSiteRepository } from '~/repositories/index.server'
import { JobPostingSiteService } from './job-posting-site.service'
import { ScoringService } from './scoring.service'

export const scoringService = new ScoringService()
export const jobPostingSiteService = new JobPostingSiteService(
  jobPostingSiteRepository,
)

// Re-export repositories for convenience
export {
  jobNoteRepository,
  jobOpeningRepository,
  scoringFormulaRepository,
} from '~/repositories/index.server'
```

**Step 3: Run typecheck**

Run: `bun run typecheck`
Expected: No errors.

**Step 4: Commit**

```bash
git add app/services/job-posting-site.service.ts app/services/index.server.ts
git commit -m "feat: add job posting site service layer"
```

---

### Task 5: Route and UI

**Files:**
- Create: `app/routes/sites.tsx`
- Modify: `app/routes.ts`

**Step 1: Register the route**

In `app/routes.ts`, add after the formulas routes (line 10):

```typescript
route('sites', 'routes/sites.tsx'),
```

**Step 2: Create the sites route**

Create `app/routes/sites.tsx` with the full page implementation:

```tsx
import { useState } from 'react'
import { Form, Link, useLoaderData } from 'react-router'
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
import { jobPostingSiteService } from '~/services/index.server'
import { jobPostingSiteSchema } from '~/schemas/job-posting-site.schema'
import type { JobPostingSite } from '~/db/schema'
import type { Route } from './+types/sites'

export function meta() {
  return [
    { title: 'Job Posting Sites - Job Tracker' },
    { name: 'description', content: 'Track job posting sites you check regularly' },
  ]
}

export async function loader() {
  const sites = await jobPostingSiteService.findAll()
  return { sites }
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData()
  const intent = formData.get('intent')

  if (intent === 'createSite') {
    const result = jobPostingSiteSchema.safeParse({
      name: formData.get('name'),
      url: formData.get('url'),
    })
    if (!result.success) {
      return { errors: result.error.flatten().fieldErrors }
    }
    await jobPostingSiteService.create(result.data)
    return { success: true }
  }

  if (intent === 'updateSite') {
    const id = formData.get('id') as string
    const result = jobPostingSiteSchema.safeParse({
      name: formData.get('name'),
      url: formData.get('url'),
    })
    if (!result.success) {
      return { errors: result.error.flatten().fieldErrors }
    }
    await jobPostingSiteService.update(id, result.data)
    return { success: true }
  }

  if (intent === 'deleteSite') {
    const id = formData.get('id') as string
    await jobPostingSiteService.delete(id)
    return { success: true }
  }

  if (intent === 'markChecked') {
    const id = formData.get('id') as string
    await jobPostingSiteService.markChecked(id)
    return { success: true }
  }

  return { success: false }
}

function formatLastChecked(date: string | null): string {
  if (!date) return 'Never'
  const now = new Date()
  const checked = new Date(date)
  const diffMs = now.getTime() - checked.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7)
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`
  }
  const months = Math.floor(diffDays / 30)
  return `${months} ${months === 1 ? 'month' : 'months'} ago`
}

export default function Sites() {
  const { sites } = useLoaderData<typeof loader>()
  const [editSite, setEditSite] = useState<JobPostingSite | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [deleteSite, setDeleteSite] = useState<JobPostingSite | null>(null)

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Job Posting Sites</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/">Back to Jobs</Link>
          </Button>
          <Button onClick={() => setAddOpen(true)}>Add Site</Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Last Checked</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sites.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={3}
                className="text-center text-muted-foreground"
              >
                No sites yet. Add one to start tracking.
              </TableCell>
            </TableRow>
          ) : (
            sites.map((site) => (
              <TableRow key={site.id}>
                <TableCell>
                  <a
                    href={site.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline inline-flex items-center gap-1"
                  >
                    {site.name}
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
                    >
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatLastChecked(site.lastCheckedAt as string | null)}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Form method="post">
                      <input type="hidden" name="intent" value="markChecked" />
                      <input type="hidden" name="id" value={site.id} />
                      <Button type="submit" variant="outline" size="sm">
                        Just Checked
                      </Button>
                    </Form>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditSite(site)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => setDeleteSite(site)}
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

      {/* Add Site Modal */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Site</DialogTitle>
            <DialogDescription>
              Add a job posting site or saved search to track.
            </DialogDescription>
          </DialogHeader>
          <Form method="post" onSubmit={() => setAddOpen(false)}>
            <input type="hidden" name="intent" value="createSite" />
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="add-name">Name</Label>
                <Input
                  id="add-name"
                  name="name"
                  placeholder="e.g. LinkedIn - React Berlin"
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

      {/* Edit Site Modal */}
      <Dialog
        open={!!editSite}
        onOpenChange={(open) => !open && setEditSite(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Site</DialogTitle>
          </DialogHeader>
          {editSite && (
            <Form method="post" onSubmit={() => setEditSite(null)}>
              <input type="hidden" name="intent" value="updateSite" />
              <input type="hidden" name="id" value={editSite.id} />
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">Name</Label>
                  <Input
                    id="edit-name"
                    name="name"
                    defaultValue={editSite.name}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-url">URL</Label>
                  <Input
                    id="edit-url"
                    name="url"
                    type="url"
                    defaultValue={editSite.url}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditSite(null)}
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
        open={!!deleteSite}
        onOpenChange={(open) => !open && setDeleteSite(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Site</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteSite?.name}"? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteSite(null)}
            >
              Cancel
            </Button>
            <Form method="post" onSubmit={() => setDeleteSite(null)}>
              <input type="hidden" name="intent" value="deleteSite" />
              <input type="hidden" name="id" value={deleteSite?.id} />
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
Expected: No errors.

**Step 4: Run lint/format**

Run: `bun run check:fix`
Expected: Clean or auto-fixed.

**Step 5: Manual smoke test**

Run: `bun run dev`

Verify:
- Navigate to `/sites` — empty state shows "No sites yet"
- Click "Add Site" — modal opens, fill in name + URL, save works
- Site appears in table with "Never" in Last Checked
- Click the site name — opens URL in new tab
- Click "Just Checked" — Last Checked updates to "Today"
- Click "Edit" — modal opens with pre-filled fields, save works
- Click "Delete" — confirmation modal shows, confirm deletes the site

**Step 6: Commit**

```bash
git add app/routes/sites.tsx app/routes.ts
git commit -m "feat: add job posting sites page with CRUD and last-checked tracking"
```

---

### Task 6: Home Page Navigation

**Files:**
- Modify: `app/routes/home.tsx`

**Step 1: Add the Sites link**

In `app/routes/home.tsx`, find the button group (around line 227-232):

```tsx
<div className="flex gap-2">
  <Button asChild variant="outline">
    <Link to="/formulas">Manage Formulas</Link>
  </Button>
  <Button asChild>
    <Link to="/jobs/new">Add Job</Link>
  </Button>
</div>
```

Add a Sites button before "Manage Formulas":

```tsx
<div className="flex gap-2">
  <Button asChild variant="outline">
    <Link to="/sites">Sites</Link>
  </Button>
  <Button asChild variant="outline">
    <Link to="/formulas">Manage Formulas</Link>
  </Button>
  <Button asChild>
    <Link to="/jobs/new">Add Job</Link>
  </Button>
</div>
```

**Step 2: Run typecheck**

Run: `bun run typecheck`
Expected: No errors.

**Step 3: Commit**

```bash
git add app/routes/home.tsx
git commit -m "feat: add Sites navigation link to home page"
```

---

### Task 7: Update README and Landing Page

**Files:**
- Modify: `README.md`
- Modify: `docs/index.html`

**Step 1: Update README.md**

In `README.md`, add to the features list (after the "Add notes to any job opening" line):

```markdown
- Track job posting sites and saved searches with "last checked" timestamps
```

**Step 2: Update landing page**

In `docs/index.html`, add a new feature section before the closing `</main>` tag (after the Job Notes section, before line 63):

```html
    <section class="feature reverse">
      <div class="feature-content">
        <h2>Job Posting Sites</h2>
        <p>Keep a list of job posting sites and saved search bookmarks. Track when you last checked each one so you never miss new opportunities. One click to mark a site as checked.</p>
      </div>
      <img src="screenshots/sites.png" alt="Job posting sites page with last checked dates">
    </section>
```

**Step 3: Take a screenshot**

After implementing, take a screenshot of the sites page with a few entries and save it as `docs/screenshots/sites.png`. (This can be done by running E2E tests or manually.)

**Step 4: Commit**

```bash
git add README.md docs/index.html
git commit -m "docs: add job posting sites feature to README and landing page"
```

---

### Task 8: Final Verification

**Step 1: Run typecheck**

Run: `bun run typecheck`
Expected: No errors.

**Step 2: Run lint/format**

Run: `bun run check:fix`
Expected: Clean.

**Step 3: Run unit tests**

Run: `bun test`
Expected: All existing tests pass.

**Step 4: Run E2E tests**

Run: `bun run test:e2e`
Expected: All existing tests pass (new feature has no E2E tests yet).
