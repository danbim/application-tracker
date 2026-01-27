# Job Notes Feature Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a notes feature that lets users document their journey through the job application process.

**Architecture:** New `jobNotes` table with foreign key to `jobOpenings`. Slide-in sidebar panel for viewing/adding notes from both dashboard and edit page. Full CRUD with markdown support.

**Tech Stack:** Drizzle ORM, React Router v7, shadcn/ui components, Tailwind CSS, react-markdown

---

## Task 1: Database Schema

**Files:**
- Modify: `app/db/schema.ts`

**Step 1: Add jobNotes table to schema**

Add after the `jobOpenings` table definition in `app/db/schema.ts`:

```typescript
export const jobNotes = pgTable('job_notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  jobOpeningId: uuid('job_opening_id')
    .notNull()
    .references(() => jobOpenings.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export type JobNote = typeof jobNotes.$inferSelect
export type NewJobNote = typeof jobNotes.$inferInsert
```

**Step 2: Generate migration**

Run: `bun run db:generate`

Expected: New migration file created in `app/db/migrations/`

**Step 3: Add statement breakpoints to migration**

Open the generated migration file and ensure `--> statement-breakpoint` appears between SQL statements (required for PGLite E2E tests).

**Step 4: Run migration**

Run: `bun run db:migrate`

Expected: Migration applied successfully

**Step 5: Commit**

```bash
git add app/db/schema.ts app/db/migrations/
git commit -m "feat: add job_notes table schema"
```

---

## Task 2: Job Note Repository

**Files:**
- Create: `app/repositories/job-note.repository.ts`
- Create: `app/repositories/job-note.repository.test.ts`
- Modify: `app/repositories/index.server.ts`

**Step 1: Write test for findByJobId**

Create `app/repositories/job-note.repository.test.ts`:

```typescript
import { describe, expect, it } from 'vitest'

describe('JobNoteRepository', () => {
  describe('findByJobId', () => {
    it('should return notes ordered by createdAt descending', () => {
      // Test verifies sorting logic - actual DB tests in E2E
      const notes = [
        { id: '1', createdAt: new Date('2026-01-01') },
        { id: '2', createdAt: new Date('2026-01-03') },
        { id: '3', createdAt: new Date('2026-01-02') },
      ]
      const sorted = [...notes].sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      )
      expect(sorted[0].id).toBe('2')
      expect(sorted[1].id).toBe('3')
      expect(sorted[2].id).toBe('1')
    })
  })

  describe('countByJobIds', () => {
    it('should return a map of job IDs to note counts', () => {
      const counts = new Map<string, number>([
        ['job-1', 3],
        ['job-2', 0],
        ['job-3', 1],
      ])
      expect(counts.get('job-1')).toBe(3)
      expect(counts.get('job-2')).toBe(0)
      expect(counts.get('job-3')).toBe(1)
      expect(counts.get('job-4')).toBeUndefined()
    })
  })
})
```

**Step 2: Run test to verify it passes**

Run: `bun test app/repositories/job-note.repository.test.ts`

Expected: PASS

**Step 3: Create repository implementation**

Create `app/repositories/job-note.repository.ts`:

```typescript
import { desc, eq, inArray, sql } from 'drizzle-orm'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import type * as schema from '~/db/schema'
import { type JobNote, jobNotes, type NewJobNote } from '~/db/schema'

export class JobNoteRepository {
  constructor(private db: PostgresJsDatabase<typeof schema>) {}

  async findByJobId(jobOpeningId: string): Promise<JobNote[]> {
    return this.db
      .select()
      .from(jobNotes)
      .where(eq(jobNotes.jobOpeningId, jobOpeningId))
      .orderBy(desc(jobNotes.createdAt))
  }

  async findById(id: string): Promise<JobNote | undefined> {
    const results = await this.db
      .select()
      .from(jobNotes)
      .where(eq(jobNotes.id, id))
    return results[0]
  }

  async create(data: {
    jobOpeningId: string
    content: string
  }): Promise<JobNote> {
    const results = await this.db.insert(jobNotes).values(data).returning()
    return results[0]
  }

  async update(
    id: string,
    data: { content: string }
  ): Promise<JobNote | undefined> {
    const results = await this.db
      .update(jobNotes)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(jobNotes.id, id))
      .returning()
    return results[0]
  }

  async delete(id: string): Promise<boolean> {
    const results = await this.db
      .delete(jobNotes)
      .where(eq(jobNotes.id, id))
      .returning()
    return results.length > 0
  }

  async countByJobIds(jobOpeningIds: string[]): Promise<Map<string, number>> {
    if (jobOpeningIds.length === 0) {
      return new Map()
    }

    const results = await this.db
      .select({
        jobOpeningId: jobNotes.jobOpeningId,
        count: sql<number>`count(*)::int`,
      })
      .from(jobNotes)
      .where(inArray(jobNotes.jobOpeningId, jobOpeningIds))
      .groupBy(jobNotes.jobOpeningId)

    const counts = new Map<string, number>()
    for (const row of results) {
      counts.set(row.jobOpeningId, row.count)
    }
    return counts
  }
}
```

**Step 4: Export repository from index**

Modify `app/repositories/index.server.ts`:

```typescript
import { db } from '~/db/db.server'
import { JobNoteRepository } from './job-note.repository'
import { JobOpeningRepository } from './job-opening.repository'
import { ScoringFormulaRepository } from './scoring-formula.repository'

export const jobOpeningRepository = new JobOpeningRepository(db)
export const scoringFormulaRepository = new ScoringFormulaRepository(db)
export const jobNoteRepository = new JobNoteRepository(db)
```

**Step 5: Run typecheck**

Run: `bun run typecheck`

Expected: No errors

**Step 6: Commit**

```bash
git add app/repositories/
git commit -m "feat: add JobNoteRepository with CRUD operations"
```

---

## Task 3: Timestamp Formatting Utility

**Files:**
- Create: `app/lib/format-timestamp.ts`
- Create: `app/lib/format-timestamp.test.ts`

**Step 1: Write failing test**

Create `app/lib/format-timestamp.test.ts`:

```typescript
import { describe, expect, it, vi } from 'vitest'
import { formatDualTimestamp } from './format-timestamp'

describe('formatDualTimestamp', () => {
  it('should format timestamp with relative and absolute parts', () => {
    // Mock current time to 2026-01-23 16:03:00
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-23T16:03:00'))

    const timestamp = new Date('2026-01-23T14:03:00')
    const result = formatDualTimestamp(timestamp)

    expect(result).toBe('2 hours ago (23.01.2026 - 14:03)')

    vi.useRealTimers()
  })

  it('should handle "just now" for recent timestamps', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-23T16:03:00'))

    const timestamp = new Date('2026-01-23T16:02:30')
    const result = formatDualTimestamp(timestamp)

    expect(result).toBe('just now (23.01.2026 - 16:02)')

    vi.useRealTimers()
  })

  it('should handle days ago', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-23T16:03:00'))

    const timestamp = new Date('2026-01-20T14:03:00')
    const result = formatDualTimestamp(timestamp)

    expect(result).toBe('3 days ago (20.01.2026 - 14:03)')

    vi.useRealTimers()
  })
})
```

**Step 2: Run test to verify it fails**

Run: `bun test app/lib/format-timestamp.test.ts`

Expected: FAIL with "Cannot find module"

**Step 3: Implement formatDualTimestamp**

Create `app/lib/format-timestamp.ts`:

```typescript
export function formatDualTimestamp(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  let relative: string
  if (diffMinutes < 1) {
    relative = 'just now'
  } else if (diffMinutes < 60) {
    relative = `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`
  } else if (diffHours < 24) {
    relative = `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
  } else if (diffDays < 30) {
    relative = `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
  } else {
    const diffMonths = Math.floor(diffDays / 30)
    relative = `${diffMonths} month${diffMonths === 1 ? '' : 's'} ago`
  }

  const day = d.getDate().toString().padStart(2, '0')
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const year = d.getFullYear()
  const hours = d.getHours().toString().padStart(2, '0')
  const minutes = d.getMinutes().toString().padStart(2, '0')

  const absolute = `${day}.${month}.${year} - ${hours}:${minutes}`

  return `${relative} (${absolute})`
}
```

**Step 4: Run test to verify it passes**

Run: `bun test app/lib/format-timestamp.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add app/lib/format-timestamp.ts app/lib/format-timestamp.test.ts
git commit -m "feat: add dual timestamp formatting utility"
```

---

## Task 4: NotesPanel Component

**Files:**
- Create: `app/components/notes-panel.tsx`
- Create: `app/components/notes-panel.test.tsx`

**Step 1: Write component test**

Create `app/components/notes-panel.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { NotesPanel } from './notes-panel'

function renderWithRouter(ui: React.ReactElement) {
  const router = createMemoryRouter(
    [{ path: '/', element: ui, action: () => null }],
    { initialEntries: ['/'] }
  )
  return render(<RouterProvider router={router} />)
}

describe('NotesPanel', () => {
  it('should display job title and company in header', () => {
    renderWithRouter(
      <NotesPanel
        jobId="1"
        jobTitle="Software Engineer"
        jobCompany="Acme Corp"
        notes={[]}
        isOpen={true}
        onClose={() => {}}
      />
    )

    expect(screen.getByText('Software Engineer')).toBeInTheDocument()
    expect(screen.getByText('Acme Corp')).toBeInTheDocument()
  })

  it('should display notes in the list', () => {
    const notes = [
      {
        id: '1',
        jobOpeningId: '1',
        content: 'First note',
        createdAt: new Date('2026-01-23T14:00:00'),
        updatedAt: new Date('2026-01-23T14:00:00'),
      },
    ]

    renderWithRouter(
      <NotesPanel
        jobId="1"
        jobTitle="Software Engineer"
        jobCompany="Acme Corp"
        notes={notes}
        isOpen={true}
        onClose={() => {}}
      />
    )

    expect(screen.getByText('First note')).toBeInTheDocument()
  })

  it('should show empty state when no notes', () => {
    renderWithRouter(
      <NotesPanel
        jobId="1"
        jobTitle="Software Engineer"
        jobCompany="Acme Corp"
        notes={[]}
        isOpen={true}
        onClose={() => {}}
      />
    )

    expect(screen.getByText(/no notes yet/i)).toBeInTheDocument()
  })

  it('should not render when closed', () => {
    renderWithRouter(
      <NotesPanel
        jobId="1"
        jobTitle="Software Engineer"
        jobCompany="Acme Corp"
        notes={[]}
        isOpen={false}
        onClose={() => {}}
      />
    )

    expect(screen.queryByText('Software Engineer')).not.toBeInTheDocument()
  })

  it('should call onClose when backdrop is clicked', () => {
    const onClose = vi.fn()
    renderWithRouter(
      <NotesPanel
        jobId="1"
        jobTitle="Software Engineer"
        jobCompany="Acme Corp"
        notes={[]}
        isOpen={true}
        onClose={onClose}
      />
    )

    const backdrop = screen.getByTestId('notes-panel-backdrop')
    backdrop.click()

    expect(onClose).toHaveBeenCalled()
  })
})
```

**Step 2: Run test to verify it fails**

Run: `bun test app/components/notes-panel.test.tsx`

Expected: FAIL with "Cannot find module"

**Step 3: Implement NotesPanel component**

Create `app/components/notes-panel.tsx`:

```typescript
import { useEffect, useRef, useState } from 'react'
import Markdown from 'react-markdown'
import { useFetcher } from 'react-router'
import { formatDualTimestamp } from '~/lib/format-timestamp'
import type { JobNote } from '~/db/schema'
import { Button } from '~/components/ui/button'
import { Textarea } from '~/components/ui/textarea'

type NotesPanelProps = {
  jobId: string
  jobTitle: string
  jobCompany: string
  notes: JobNote[]
  isOpen: boolean
  onClose: () => void
}

export function NotesPanel({
  jobId,
  jobTitle,
  jobCompany,
  notes,
  isOpen,
  onClose,
}: NotesPanelProps) {
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const fetcher = useFetcher()
  const formRef = useRef<HTMLFormElement>(null)
  const prevFetcherState = useRef(fetcher.state)

  // Reset form after successful submission
  useEffect(() => {
    if (prevFetcherState.current !== 'idle' && fetcher.state === 'idle') {
      if (formRef.current) {
        formRef.current.reset()
      }
      setEditingNoteId(null)
    }
    prevFetcherState.current = fetcher.state
  }, [fetcher.state])

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (editingNoteId) {
          setEditingNoteId(null)
        } else {
          onClose()
        }
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose, editingNoteId])

  if (!isOpen) return null

  const startEditing = (note: JobNote) => {
    setEditingNoteId(note.id)
    setEditContent(note.content)
  }

  const cancelEditing = () => {
    setEditingNoteId(null)
    setEditContent('')
  }

  return (
    <>
      {/* Backdrop */}
      <div
        data-testid="notes-panel-backdrop"
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-[400px] bg-background border-l shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-start">
          <div>
            <h2 className="font-semibold text-lg">{jobTitle}</h2>
            <p className="text-sm text-muted-foreground">{jobCompany}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>

        {/* Add Note Form */}
        <div className="p-4 border-b">
          <fetcher.Form method="post" ref={formRef}>
            <input type="hidden" name="intent" value="createNote" />
            <input type="hidden" name="jobId" value={jobId} />
            <Textarea
              name="content"
              placeholder="Add a note..."
              className="mb-2 min-h-[80px]"
              required
            />
            <Button
              type="submit"
              size="sm"
              disabled={fetcher.state !== 'idle'}
            >
              {fetcher.state !== 'idle' ? 'Adding...' : 'Add Note'}
            </Button>
          </fetcher.Form>
        </div>

        {/* Notes List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {notes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No notes yet. Add one above.
            </p>
          ) : (
            notes.map((note) => (
              <div key={note.id} className="border rounded-lg p-3 space-y-2">
                {editingNoteId === note.id ? (
                  <fetcher.Form method="post">
                    <input type="hidden" name="intent" value="updateNote" />
                    <input type="hidden" name="noteId" value={note.id} />
                    <Textarea
                      name="content"
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="mb-2 min-h-[80px]"
                      required
                    />
                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        size="sm"
                        disabled={fetcher.state !== 'idle'}
                      >
                        Save
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={cancelEditing}
                      >
                        Cancel
                      </Button>
                    </div>
                  </fetcher.Form>
                ) : (
                  <>
                    <div className="prose prose-sm max-w-none">
                      <Markdown>{note.content}</Markdown>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-xs text-muted-foreground">
                        {formatDualTimestamp(note.createdAt)}
                      </span>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditing(note)}
                        >
                          Edit
                        </Button>
                        <fetcher.Form method="post">
                          <input type="hidden" name="intent" value="deleteNote" />
                          <input type="hidden" name="noteId" value={note.id} />
                          <Button
                            type="submit"
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                          >
                            Delete
                          </Button>
                        </fetcher.Form>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}
```

**Step 4: Run test to verify it passes**

Run: `bun test app/components/notes-panel.test.tsx`

Expected: PASS

**Step 5: Run typecheck**

Run: `bun run typecheck`

Expected: No errors

**Step 6: Commit**

```bash
git add app/components/notes-panel.tsx app/components/notes-panel.test.tsx
git commit -m "feat: add NotesPanel slide-in sidebar component"
```

---

## Task 5: Update JobTable for Row Click and Note Badge

**Files:**
- Modify: `app/components/job-table.tsx`
- Modify: `app/components/job-table.test.tsx`

**Step 1: Update test file**

Add tests to `app/components/job-table.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { JobTable } from './job-table'

function renderWithRouter(ui: React.ReactElement) {
  const router = createMemoryRouter(
    [{ path: '/', element: ui, action: () => null }],
    { initialEntries: ['/'] }
  )
  return render(<RouterProvider router={router} />)
}

const mockJob = {
  job: {
    id: '1',
    title: 'Software Engineer',
    company: 'Acme Corp',
    description: 'Test description',
    status: 'not_applied' as const,
    wow: false,
    dateAdded: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    jobLocation: null,
    country: null,
    postingUrl: null,
    dateOpened: null,
    track: null,
    appliedAt: null,
    interviewingAt: null,
    offerAt: null,
    rejectedAt: null,
    ghostedAt: null,
    dumpedAt: null,
    salaryMin: null,
    salaryMax: null,
    salaryCurrency: null,
    pensionScheme: null,
    healthInsurance: null,
    stockOptions: null,
    vacationDays: null,
    workLocation: null,
    officeDistanceKm: null,
    wfhDaysPerWeek: null,
    ratingImpact: null,
    ratingCompensation: null,
    ratingRole: null,
    ratingTech: null,
    ratingLocation: null,
    ratingIndustry: null,
    ratingCulture: null,
    ratingGrowth: null,
    ratingProfileMatch: null,
    ratingCompanySize: null,
    ratingStress: null,
    ratingJobSecurity: null,
  },
  score: 42,
}

describe('JobTable', () => {
  it('should display note count badge when job has notes', () => {
    const noteCounts = new Map([['1', 3]])

    renderWithRouter(
      <JobTable
        jobs={[mockJob]}
        noteCounts={noteCounts}
        onAppliedClick={() => {}}
        onRowClick={() => {}}
      />
    )

    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('should not display badge when job has no notes', () => {
    const noteCounts = new Map<string, number>()

    renderWithRouter(
      <JobTable
        jobs={[mockJob]}
        noteCounts={noteCounts}
        onAppliedClick={() => {}}
        onRowClick={() => {}}
      />
    )

    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })

  it('should call onRowClick when row is clicked', async () => {
    const onRowClick = vi.fn()
    const noteCounts = new Map<string, number>()

    renderWithRouter(
      <JobTable
        jobs={[mockJob]}
        noteCounts={noteCounts}
        onAppliedClick={() => {}}
        onRowClick={onRowClick}
      />
    )

    const row = screen.getByRole('row', { name: /software engineer/i })
    await userEvent.click(row)

    expect(onRowClick).toHaveBeenCalledWith('1')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `bun test app/components/job-table.test.tsx`

Expected: FAIL (props don't match)

**Step 3: Update JobTable component**

Modify `app/components/job-table.tsx`:

```typescript
import Markdown from 'react-markdown'
import { Link } from 'react-router'
import { StatusBadge } from '~/components/status-badge'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '~/components/ui/hover-card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import type { RankedJobOpening } from '~/services/scoring.service'

type JobTableProps = {
  jobs: RankedJobOpening[]
  noteCounts: Map<string, number>
  onAppliedClick: (jobId: string) => void
  onRowClick: (jobId: string) => void
}

export function JobTable({
  jobs,
  noteCounts,
  onAppliedClick,
  onRowClick,
}: JobTableProps) {
  const formatDate = (date: Date | string | null) => {
    if (!date) return '-'
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString()
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead></TableHead>
          <TableHead>Company</TableHead>
          <TableHead>Title</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Date Added</TableHead>
          <TableHead className="text-right">Score</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {jobs.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={7}
              className="text-center text-muted-foreground"
            >
              No job openings yet. Add one to get started.
            </TableCell>
          </TableRow>
        ) : (
          jobs.map(({ job, score }) => {
            const noteCount = noteCounts.get(job.id) ?? 0

            return (
              <TableRow
                key={job.id}
                className="cursor-pointer"
                onClick={() => onRowClick(job.id)}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/jobs/${job.id}/edit`}>Edit</Link>
                    </Button>
                  </div>
                </TableCell>
                <TableCell>{job.company}</TableCell>
                <TableCell className="font-medium">
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <span className="cursor-help underline decoration-dotted underline-offset-2">
                        {job.title}
                        {job.wow && ' ★'}
                      </span>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-96 max-h-80 overflow-y-auto">
                      <div className="space-y-2">
                        <h4 className="font-semibold">{job.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {job.company}
                        </p>
                        <div className="prose prose-sm max-w-none">
                          <Markdown>{job.description}</Markdown>
                        </div>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                  {noteCount > 0 && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {noteCount}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>{job.jobLocation || '-'}</TableCell>
                <TableCell>{formatDate(job.dateAdded)}</TableCell>
                <TableCell className="text-right font-mono">{score}</TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <StatusBadge
                    jobId={job.id}
                    status={job.status}
                    appliedAt={job.appliedAt}
                    onAppliedClick={() => onAppliedClick(job.id)}
                  />
                </TableCell>
              </TableRow>
            )
          })
        )}
      </TableBody>
    </Table>
  )
}
```

**Step 4: Run test to verify it passes**

Run: `bun test app/components/job-table.test.tsx`

Expected: PASS

**Step 5: Commit**

```bash
git add app/components/job-table.tsx app/components/job-table.test.tsx
git commit -m "feat: add note count badge and row click to JobTable"
```

---

## Task 6: Update Dashboard Route (home.tsx)

**Files:**
- Modify: `app/routes/home.tsx`
- Modify: `app/services/index.server.ts`

**Step 1: Export jobNoteRepository from services**

Modify `app/services/index.server.ts` to include:

```typescript
export { jobNoteRepository } from '~/repositories/index.server'
```

**Step 2: Update home.tsx loader**

Add note counts fetching to the loader:

```typescript
import {
  jobNoteRepository,
  jobOpeningRepository,
  scoringFormulaRepository,
  scoringService,
} from '~/services/index.server'

// In loader function, update the Promise.all:
const [allJobs, formulas, statusCounts] = await Promise.all([
  jobOpeningRepository.findAll(),
  scoringFormulaRepository.findAll(),
  jobOpeningRepository.countByStatus(),
])

// After getting jobs, fetch note counts:
const jobIds = allJobs.map((job) => job.id)
const noteCounts = await jobNoteRepository.countByJobIds(jobIds)

// Add to return:
return {
  // ... existing fields
  noteCounts: Object.fromEntries(noteCounts),
}
```

**Step 3: Update home.tsx action**

Add note action handlers:

```typescript
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData()
  const intent = formData.get('intent')

  if (intent === 'updateStatus') {
    const jobId = formData.get('jobId') as string
    const status = formData.get('status') as ApplicationStatus
    const date = formData.get('date') as string | null
    await jobOpeningRepository.updateStatus(jobId, status, date)
    return { success: true }
  }

  if (intent === 'createNote') {
    const jobId = formData.get('jobId') as string
    const content = formData.get('content') as string
    await jobNoteRepository.create({ jobOpeningId: jobId, content })
    return { success: true }
  }

  if (intent === 'updateNote') {
    const noteId = formData.get('noteId') as string
    const content = formData.get('content') as string
    await jobNoteRepository.update(noteId, { content })
    return { success: true }
  }

  if (intent === 'deleteNote') {
    const noteId = formData.get('noteId') as string
    await jobNoteRepository.delete(noteId)
    return { success: true }
  }

  return { success: false }
}
```

**Step 4: Update Home component**

Add notes panel state and rendering:

```typescript
import { NotesPanel } from '~/components/notes-panel'
import type { JobNote } from '~/db/schema'

export default function Home() {
  const {
    // ... existing destructuring
    noteCounts: noteCountsObj,
  } = useLoaderData<typeof loader>()

  const noteCounts = new Map(Object.entries(noteCountsObj))

  const [notesPanelJobId, setNotesPanelJobId] = useState<string | null>(null)
  const [notes, setNotes] = useState<JobNote[]>([])

  const notesPanelJob = notesPanelJobId
    ? jobs.find((j) => j.job.id === notesPanelJobId)?.job
    : null

  // Fetch notes when panel opens
  useEffect(() => {
    if (notesPanelJobId) {
      fetch(`/?index&jobId=${notesPanelJobId}&fetchNotes=true`)
        .then((res) => res.json())
        .then((data) => setNotes(data.notes || []))
    }
  }, [notesPanelJobId])

  const handleRowClick = (jobId: string) => {
    setNotesPanelJobId(jobId)
  }

  const closeNotesPanel = () => {
    setNotesPanelJobId(null)
    setNotes([])
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* ... existing content ... */}

      <JobTable
        jobs={jobs}
        noteCounts={noteCounts}
        onAppliedClick={handleAppliedClick}
        onRowClick={handleRowClick}
      />

      {/* ... ApplicationDialog ... */}

      {notesPanelJob && (
        <NotesPanel
          jobId={notesPanelJob.id}
          jobTitle={notesPanelJob.title}
          jobCompany={notesPanelJob.company}
          notes={notes}
          isOpen={!!notesPanelJobId}
          onClose={closeNotesPanel}
        />
      )}
    </div>
  )
}
```

**Step 5: Add notes fetching to loader**

Update loader to handle fetchNotes request:

```typescript
export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url)

  // Handle notes fetch for panel
  const fetchNotes = url.searchParams.get('fetchNotes')
  const jobIdForNotes = url.searchParams.get('jobId')
  if (fetchNotes === 'true' && jobIdForNotes) {
    const notes = await jobNoteRepository.findByJobId(jobIdForNotes)
    return Response.json({ notes })
  }

  // ... rest of existing loader
}
```

**Step 6: Run typecheck**

Run: `bun run typecheck`

Expected: No errors

**Step 7: Test manually**

Run: `bun run dev`

- Click a job row, notes panel should open
- Add a note, it should appear in the list
- Edit and delete should work
- Note count badge should update

**Step 8: Commit**

```bash
git add app/routes/home.tsx app/services/index.server.ts
git commit -m "feat: integrate notes panel into dashboard"
```

---

## Task 7: Update Edit Page Route

**Files:**
- Modify: `app/routes/jobs.$id.edit.tsx`

**Step 1: Update loader to fetch notes**

```typescript
import {
  jobNoteRepository,
  jobOpeningRepository,
} from '~/services/index.server'

export async function loader({ params }: Route.LoaderArgs) {
  const { id } = params
  if (!id) {
    throw new Response('Bad Request', { status: 400 })
  }

  const [job, notes] = await Promise.all([
    jobOpeningRepository.findById(id),
    jobNoteRepository.findByJobId(id),
  ])

  if (!job) {
    throw new Response('Not Found', { status: 404 })
  }

  return { job, notes }
}
```

**Step 2: Update action to handle notes**

Add note action handlers (same as home.tsx):

```typescript
export async function action({ request, params }: Route.ActionArgs) {
  const { id } = params
  if (!id) {
    throw new Response('Bad Request', { status: 400 })
  }

  const formData = await request.formData()
  const intent = formData.get('intent')

  if (intent === 'delete') {
    await jobOpeningRepository.delete(id)
    return redirect('/')
  }

  if (intent === 'createNote') {
    const content = formData.get('content') as string
    await jobNoteRepository.create({ jobOpeningId: id, content })
    return { success: true }
  }

  if (intent === 'updateNote') {
    const noteId = formData.get('noteId') as string
    const content = formData.get('content') as string
    await jobNoteRepository.update(noteId, { content })
    return { success: true }
  }

  if (intent === 'deleteNote') {
    const noteId = formData.get('noteId') as string
    await jobNoteRepository.delete(noteId)
    return { success: true }
  }

  // ... rest of existing update handling
}
```

**Step 3: Update component to show notes button and panel**

```typescript
import { useState } from 'react'
import { NotesPanel } from '~/components/notes-panel'

export default function EditJob() {
  const { job, notes } = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()
  const [notesPanelOpen, setNotesPanelOpen] = useState(false)

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Edit Job Opening</h1>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setNotesPanelOpen(true)}
          >
            Notes ({notes.length})
          </Button>
          <Form method="post">
            <input type="hidden" name="intent" value="delete" />
            <Button type="submit" variant="destructive">
              Delete
            </Button>
          </Form>
        </div>
      </div>
      <JobForm job={job} errors={actionData?.errors} />

      <NotesPanel
        jobId={job.id}
        jobTitle={job.title}
        jobCompany={job.company}
        notes={notes}
        isOpen={notesPanelOpen}
        onClose={() => setNotesPanelOpen(false)}
      />
    </div>
  )
}
```

**Step 4: Run typecheck**

Run: `bun run typecheck`

Expected: No errors

**Step 5: Test manually**

Run: `bun run dev`

- Navigate to edit page, click Notes button
- Add/edit/delete notes
- Count should update

**Step 6: Commit**

```bash
git add app/routes/jobs.$id.edit.tsx
git commit -m "feat: add notes panel to job edit page"
```

---

## Task 8: E2E Tests

**Files:**
- Create: `e2e/notes.spec.ts`

**Step 1: Write E2E tests**

Create `e2e/notes.spec.ts`:

```typescript
import { expect, test } from '@playwright/test'

test.describe('Job Notes', () => {
  test.beforeEach(async ({ page }) => {
    // Create a job first
    await page.goto('/jobs/new')
    await page.fill('input[name="title"]', 'Test Engineer')
    await page.fill('input[name="company"]', 'Test Corp')
    await page.fill('textarea[name="description"]', 'Test job description')
    await page.click('button[type="submit"]')
    await page.waitForURL('/')
  })

  test('should open notes panel when clicking job row', async ({ page }) => {
    // Click on the job row (not on Edit or Status)
    await page.click('td:has-text("Test Corp")')

    // Notes panel should open
    await expect(page.locator('text=Test Engineer')).toBeVisible()
    await expect(page.locator('text=Test Corp')).toBeVisible()
    await expect(page.locator('text=No notes yet')).toBeVisible()
  })

  test('should add a note from dashboard', async ({ page }) => {
    await page.click('td:has-text("Test Corp")')

    // Add a note
    await page.fill('textarea[name="content"]', 'My first note')
    await page.click('button:has-text("Add Note")')

    // Note should appear
    await expect(page.locator('text=My first note')).toBeVisible()
  })

  test('should edit a note', async ({ page }) => {
    await page.click('td:has-text("Test Corp")')
    await page.fill('textarea[name="content"]', 'Original note')
    await page.click('button:has-text("Add Note")')

    // Edit the note
    await page.click('button:has-text("Edit")')
    await page.fill('textarea[name="content"]', 'Updated note')
    await page.click('button:has-text("Save")')

    await expect(page.locator('text=Updated note')).toBeVisible()
  })

  test('should delete a note', async ({ page }) => {
    await page.click('td:has-text("Test Corp")')
    await page.fill('textarea[name="content"]', 'Note to delete')
    await page.click('button:has-text("Add Note")')

    // Delete the note
    await page.click('button:has-text("Delete")')

    await expect(page.locator('text=Note to delete')).not.toBeVisible()
    await expect(page.locator('text=No notes yet')).toBeVisible()
  })

  test('should show note count badge', async ({ page }) => {
    await page.click('td:has-text("Test Corp")')
    await page.fill('textarea[name="content"]', 'Note 1')
    await page.click('button:has-text("Add Note")')

    // Close panel
    await page.click('[data-testid="notes-panel-backdrop"]')

    // Badge should show count
    await expect(page.locator('.badge:has-text("1")')).toBeVisible()
  })

  test('should open notes from edit page', async ({ page }) => {
    await page.click('button:has-text("Edit")')
    await page.click('button:has-text("Notes")')

    await expect(page.locator('text=No notes yet')).toBeVisible()
  })
})
```

**Step 2: Run E2E tests**

Run: `bun run test:e2e`

Expected: All tests pass

**Step 3: Commit**

```bash
git add e2e/notes.spec.ts
git commit -m "test: add E2E tests for notes feature"
```

---

## Task 9: Final Verification and Cleanup

**Step 1: Run all tests**

Run: `bun test`

Expected: All unit tests pass

**Step 2: Run E2E tests**

Run: `bun run test:e2e`

Expected: All E2E tests pass

**Step 3: Run linter**

Run: `bun run check:fix`

Expected: No errors, auto-fixes applied

**Step 4: Run typecheck**

Run: `bun run typecheck`

Expected: No errors

**Step 5: Final commit**

```bash
git add -A
git commit -m "chore: final cleanup for notes feature"
```

---

## Summary

| Task | Description |
|------|-------------|
| 1 | Database schema + migration |
| 2 | JobNoteRepository with CRUD |
| 3 | Timestamp formatting utility |
| 4 | NotesPanel component |
| 5 | JobTable row click + badge |
| 6 | Dashboard route integration |
| 7 | Edit page route integration |
| 8 | E2E tests |
| 9 | Final verification |
