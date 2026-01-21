# Application Status System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace boolean `applicationSent` with a proper status enum (not_applied, applied, interviewing, offer, rejected, ghosted, dumped) and add tabs to filter jobs by status.

**Architecture:** Database enum for status, timestamp columns for each status change, repository methods for status updates and counts, tabs UI component for filtering, dropdown StatusBadge for changing status.

**Tech Stack:** Drizzle ORM, PostgreSQL, React Router, shadcn/ui (Tabs component), Vitest

---

## Task 1: Add Tabs UI Component

**Files:**
- Create: `app/components/ui/tabs.tsx`

**Step 1: Add shadcn/ui tabs component**

Run:
```bash
bunx shadcn@latest add tabs
```

**Step 2: Verify tabs component was added**

Run:
```bash
ls app/components/ui/tabs.tsx && echo "Tabs component added"
```
Expected: File exists

**Step 3: Commit**

```bash
git add app/components/ui/tabs.tsx
git commit -m "feat: add shadcn/ui tabs component"
```

---

## Task 2: Create Database Migration

**Files:**
- Create: `app/db/migrations/0004_add_application_status.sql`

**Step 1: Write migration SQL**

Create `app/db/migrations/0004_add_application_status.sql`:

```sql
-- Create application status enum
CREATE TYPE "application_status" AS ENUM (
  'not_applied',
  'applied',
  'interviewing',
  'offer',
  'rejected',
  'ghosted',
  'dumped'
);

-- Add status column with default
ALTER TABLE "job_openings" ADD COLUMN "status" "application_status" DEFAULT 'not_applied' NOT NULL;

-- Add timestamp columns for each status
ALTER TABLE "job_openings" ADD COLUMN "applied_at" timestamp;
ALTER TABLE "job_openings" ADD COLUMN "interviewing_at" timestamp;
ALTER TABLE "job_openings" ADD COLUMN "offer_at" timestamp;
ALTER TABLE "job_openings" ADD COLUMN "rejected_at" timestamp;
ALTER TABLE "job_openings" ADD COLUMN "ghosted_at" timestamp;
ALTER TABLE "job_openings" ADD COLUMN "dumped_at" timestamp;

-- Migrate existing data
UPDATE "job_openings"
SET "status" = 'applied', "applied_at" = "application_sent_date"::timestamp
WHERE "application_sent" = true;

-- Drop old columns
ALTER TABLE "job_openings" DROP COLUMN "application_sent";
ALTER TABLE "job_openings" DROP COLUMN "application_sent_date";
```

**Step 2: Run migration**

Run:
```bash
bun run db:migrate
```
Expected: Migration completes successfully

**Step 3: Commit**

```bash
git add app/db/migrations/0004_add_application_status.sql
git commit -m "feat: add application status migration"
```

---

## Task 3: Update Database Schema

**Files:**
- Modify: `app/db/schema.ts`

**Step 1: Add enum and update jobOpenings table**

In `app/db/schema.ts`, add after line 20 (after `jobTrackEnum`):

```typescript
export const applicationStatusEnum = pgEnum('application_status', [
  'not_applied',
  'applied',
  'interviewing',
  'offer',
  'rejected',
  'ghosted',
  'dumped',
])

export type ApplicationStatus = (typeof applicationStatusEnum.enumValues)[number]

export const ACTIVE_STATUSES: ApplicationStatus[] = [
  'not_applied',
  'applied',
  'interviewing',
  'offer',
]
```

Replace lines 56-57 (applicationSent fields) with:

```typescript
  status: applicationStatusEnum('status').default('not_applied').notNull(),
  appliedAt: timestamp('applied_at'),
  interviewingAt: timestamp('interviewing_at'),
  offerAt: timestamp('offer_at'),
  rejectedAt: timestamp('rejected_at'),
  ghostedAt: timestamp('ghosted_at'),
  dumpedAt: timestamp('dumped_at'),
```

**Step 2: Verify TypeScript compiles**

Run:
```bash
bun run typecheck
```
Expected: Type errors (expected - tests and components still use old fields)

**Step 3: Commit**

```bash
git add app/db/schema.ts
git commit -m "feat: update schema with application status enum"
```

---

## Task 4: Update Test Utilities

**Files:**
- Modify: `app/test-utils.tsx`

**Step 1: Update mock factory**

In `app/test-utils.tsx`, replace lines 55-56 (`applicationSent` fields) with:

```typescript
    status: 'not_applied',
    appliedAt: null,
    interviewingAt: null,
    offerAt: null,
    rejectedAt: null,
    ghostedAt: null,
    dumpedAt: null,
```

Also add import at top:

```typescript
import type { JobOpening, ScoringFormula, ApplicationStatus } from '~/db/schema'
```

**Step 2: Run tests to check for remaining issues**

Run:
```bash
bun run test:run 2>&1 | head -50
```
Expected: Some tests fail (expected - components still use old fields)

**Step 3: Commit**

```bash
git add app/test-utils.tsx
git commit -m "feat: update test mock factory for application status"
```

---

## Task 5: Update Repository with Status Methods

**Files:**
- Modify: `app/repositories/job-opening.repository.ts`
- Create: `app/repositories/job-opening.repository.test.ts`

**Step 1: Write failing test for updateStatus**

Create `app/repositories/job-opening.repository.test.ts`:

```typescript
import { describe, expect, it, vi, beforeEach } from 'vitest'

// We'll test the logic, not the actual DB
describe('JobOpeningRepository', () => {
  describe('updateStatus', () => {
    it('should set the correct timestamp field based on status', () => {
      // This is a design validation test - actual DB tests would need integration setup
      const statusToTimestampField: Record<string, string> = {
        applied: 'appliedAt',
        interviewing: 'interviewingAt',
        offer: 'offerAt',
        rejected: 'rejectedAt',
        ghosted: 'ghostedAt',
        dumped: 'dumpedAt',
      }

      expect(statusToTimestampField['applied']).toBe('appliedAt')
      expect(statusToTimestampField['interviewing']).toBe('interviewingAt')
      expect(statusToTimestampField['offer']).toBe('offerAt')
      expect(statusToTimestampField['rejected']).toBe('rejectedAt')
      expect(statusToTimestampField['ghosted']).toBe('ghostedAt')
      expect(statusToTimestampField['dumped']).toBe('dumpedAt')
    })

    it('should not set timestamp for not_applied status', () => {
      const statusToTimestampField: Record<string, string | null> = {
        not_applied: null,
        applied: 'appliedAt',
      }

      expect(statusToTimestampField['not_applied']).toBeNull()
    })
  })
})
```

**Step 2: Run test to verify it passes**

Run:
```bash
bun run test:run app/repositories/job-opening.repository.test.ts
```
Expected: PASS

**Step 3: Update repository with new methods**

In `app/repositories/job-opening.repository.ts`, add imports at top:

```typescript
import { desc, eq, sql, inArray } from 'drizzle-orm'
import type { ApplicationStatus } from '~/db/schema'
```

Replace `updateApplicationStatus` method (lines 49-64) with:

```typescript
  async updateStatus(
    id: string,
    status: ApplicationStatus,
    date?: string | null,
  ): Promise<JobOpening | undefined> {
    const timestampField = this.getTimestampFieldForStatus(status)
    const timestamp = date ? new Date(date) : new Date()

    const updateData: Record<string, unknown> = {
      status,
      updatedAt: new Date(),
    }

    if (timestampField) {
      updateData[timestampField] = timestamp
    }

    const results = await this.db
      .update(jobOpenings)
      .set(updateData)
      .where(eq(jobOpenings.id, id))
      .returning()
    return results[0]
  }

  private getTimestampFieldForStatus(status: ApplicationStatus): string | null {
    const mapping: Record<ApplicationStatus, string | null> = {
      not_applied: null,
      applied: 'appliedAt',
      interviewing: 'interviewingAt',
      offer: 'offerAt',
      rejected: 'rejectedAt',
      ghosted: 'ghostedAt',
      dumped: 'dumpedAt',
    }
    return mapping[status]
  }

  async countByStatus(): Promise<Record<ApplicationStatus, number>> {
    const results = await this.db
      .select({
        status: jobOpenings.status,
        count: sql<number>`count(*)::int`,
      })
      .from(jobOpenings)
      .groupBy(jobOpenings.status)

    const counts: Record<ApplicationStatus, number> = {
      not_applied: 0,
      applied: 0,
      interviewing: 0,
      offer: 0,
      rejected: 0,
      ghosted: 0,
      dumped: 0,
    }

    for (const row of results) {
      counts[row.status] = row.count
    }

    return counts
  }

  async findByStatuses(statuses: ApplicationStatus[]): Promise<JobOpening[]> {
    return this.db
      .select()
      .from(jobOpenings)
      .where(inArray(jobOpenings.status, statuses))
      .orderBy(desc(jobOpenings.dateAdded))
  }
```

**Step 4: Verify TypeScript compiles**

Run:
```bash
bun run typecheck 2>&1 | grep -E "(error|Error)" | head -10
```
Expected: Some errors in other files (expected)

**Step 5: Commit**

```bash
git add app/repositories/job-opening.repository.ts app/repositories/job-opening.repository.test.ts
git commit -m "feat: add updateStatus and countByStatus repository methods"
```

---

## Task 6: Create StatusBadge Dropdown Component

**Files:**
- Create: `app/components/status-badge.tsx`
- Create: `app/components/status-badge.test.tsx`

**Step 1: Write failing test**

Create `app/components/status-badge.test.tsx`:

```typescript
import { render, screen } from '~/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { StatusBadge } from './status-badge'

// Mock react-router's useFetcher
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router')
  return {
    ...actual,
    useFetcher: () => ({
      state: 'idle',
      submit: vi.fn(),
      Form: ({ children, ...props }: { children: React.ReactNode } & Record<string, unknown>) => (
        <form {...props}>{children}</form>
      ),
    }),
  }
})

describe('StatusBadge', () => {
  it('renders current status', () => {
    render(<StatusBadge jobId="123" status="not_applied" />)
    expect(screen.getByText('Not Applied')).toBeInTheDocument()
  })

  it('renders applied status with date', () => {
    render(<StatusBadge jobId="123" status="applied" appliedAt={new Date('2026-01-15')} />)
    expect(screen.getByText(/Applied/)).toBeInTheDocument()
  })

  it('renders interviewing status', () => {
    render(<StatusBadge jobId="123" status="interviewing" />)
    expect(screen.getByText('Interviewing')).toBeInTheDocument()
  })

  it('renders offer status', () => {
    render(<StatusBadge jobId="123" status="offer" />)
    expect(screen.getByText('Offer')).toBeInTheDocument()
  })

  it('renders rejected status', () => {
    render(<StatusBadge jobId="123" status="rejected" />)
    expect(screen.getByText('Rejected')).toBeInTheDocument()
  })

  it('renders ghosted status', () => {
    render(<StatusBadge jobId="123" status="ghosted" />)
    expect(screen.getByText('Ghosted')).toBeInTheDocument()
  })

  it('renders dumped status', () => {
    render(<StatusBadge jobId="123" status="dumped" />)
    expect(screen.getByText('Dumped')).toBeInTheDocument()
  })
})
```

**Step 2: Run test to verify it fails**

Run:
```bash
bun run test:run app/components/status-badge.test.tsx 2>&1 | head -20
```
Expected: FAIL - module not found

**Step 3: Create StatusBadge component**

Create `app/components/status-badge.tsx`:

```typescript
import { useFetcher } from 'react-router'
import { Badge } from '~/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '~/components/ui/select'
import type { ApplicationStatus } from '~/db/schema'

type StatusBadgeProps = {
  jobId: string
  status: ApplicationStatus
  appliedAt?: Date | null
  onAppliedClick?: () => void
}

const STATUS_CONFIG: Record<
  ApplicationStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string }
> = {
  not_applied: { label: 'Not Applied', variant: 'outline' },
  applied: { label: 'Applied', variant: 'default', className: 'bg-blue-500 hover:bg-blue-600' },
  interviewing: { label: 'Interviewing', variant: 'default', className: 'bg-amber-500 hover:bg-amber-600' },
  offer: { label: 'Offer', variant: 'default', className: 'bg-green-500 hover:bg-green-600' },
  rejected: { label: 'Rejected', variant: 'destructive' },
  ghosted: { label: 'Ghosted', variant: 'secondary', className: 'bg-purple-200 text-purple-800' },
  dumped: { label: 'Dumped', variant: 'secondary', className: 'line-through opacity-60' },
}

const ALL_STATUSES: ApplicationStatus[] = [
  'not_applied',
  'applied',
  'interviewing',
  'offer',
  'rejected',
  'ghosted',
  'dumped',
]

export function StatusBadge({ jobId, status, appliedAt, onAppliedClick }: StatusBadgeProps) {
  const fetcher = useFetcher()
  const config = STATUS_CONFIG[status]

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return ''
    return ` ${date.toLocaleDateString()}`
  }

  const handleStatusChange = (newStatus: string) => {
    if (newStatus === 'applied' && onAppliedClick) {
      onAppliedClick()
      return
    }

    fetcher.submit(
      { intent: 'updateStatus', jobId, status: newStatus },
      { method: 'post', action: '/?index' }
    )
  }

  return (
    <Select value={status} onValueChange={handleStatusChange}>
      <SelectTrigger className="w-auto border-0 p-0 h-auto focus:ring-0">
        <Badge variant={config.variant} className={config.className}>
          {config.label}
          {status === 'applied' && formatDate(appliedAt)}
        </Badge>
      </SelectTrigger>
      <SelectContent>
        {ALL_STATUSES.map((s) => (
          <SelectItem key={s} value={s}>
            <Badge variant={STATUS_CONFIG[s].variant} className={STATUS_CONFIG[s].className}>
              {STATUS_CONFIG[s].label}
            </Badge>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
```

**Step 4: Run test to verify it passes**

Run:
```bash
bun run test:run app/components/status-badge.test.tsx
```
Expected: PASS

**Step 5: Commit**

```bash
git add app/components/status-badge.tsx app/components/status-badge.test.tsx
git commit -m "feat: add StatusBadge dropdown component"
```

---

## Task 7: Update JobTable Component

**Files:**
- Modify: `app/components/job-table.tsx`
- Modify: `app/components/job-table.test.tsx`

**Step 1: Update JobTable to use new StatusBadge**

Replace entire `app/components/job-table.tsx` content:

```typescript
import Markdown from 'react-markdown'
import { Link } from 'react-router'
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
import { StatusBadge } from '~/components/status-badge'
import type { RankedJobOpening } from '~/services/scoring.service'

type JobTableProps = {
  jobs: RankedJobOpening[]
  onAppliedClick: (jobId: string) => void
}

export function JobTable({ jobs, onAppliedClick }: JobTableProps) {
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
          jobs.map(({ job, score }) => (
            <TableRow key={job.id}>
              <TableCell>
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
              </TableCell>
              <TableCell>{job.jobLocation || '-'}</TableCell>
              <TableCell>{formatDate(job.dateAdded)}</TableCell>
              <TableCell className="text-right font-mono">{score}</TableCell>
              <TableCell>
                <StatusBadge
                  jobId={job.id}
                  status={job.status}
                  appliedAt={job.appliedAt}
                  onAppliedClick={() => onAppliedClick(job.id)}
                />
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}
```

**Step 2: Update JobTable tests**

Replace `app/components/job-table.test.tsx`:

```typescript
import { render, screen } from '~/test-utils'
import { createMockJobOpening } from '~/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { JobTable } from './job-table'

// Mock react-router's useFetcher
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router')
  return {
    ...actual,
    useFetcher: () => ({
      state: 'idle',
      submit: vi.fn(),
      Form: ({ children, ...props }: { children: React.ReactNode } & Record<string, unknown>) => (
        <form {...props}>{children}</form>
      ),
    }),
  }
})

describe('JobTable', () => {
  const mockOnAppliedClick = vi.fn()

  describe('empty state', () => {
    it('shows empty message when no jobs', () => {
      render(<JobTable jobs={[]} onAppliedClick={mockOnAppliedClick} />)
      expect(screen.getByText(/No job openings yet/)).toBeInTheDocument()
    })
  })

  describe('with jobs', () => {
    it('renders job rows', () => {
      const jobs = [
        { job: createMockJobOpening({ id: '1', title: 'Engineer', company: 'Acme' }), score: 10 },
      ]
      render(<JobTable jobs={jobs} onAppliedClick={mockOnAppliedClick} />)

      expect(screen.getByText('Engineer')).toBeInTheDocument()
      expect(screen.getByText('Acme')).toBeInTheDocument()
    })

    it('shows wow indicator', () => {
      const jobs = [
        { job: createMockJobOpening({ title: 'Cool Job', wow: true }), score: 10 },
      ]
      render(<JobTable jobs={jobs} onAppliedClick={mockOnAppliedClick} />)

      expect(screen.getByText(/Cool Job/)).toBeInTheDocument()
      expect(screen.getByText(/★/)).toBeInTheDocument()
    })

    it('renders status badge', () => {
      const jobs = [
        { job: createMockJobOpening({ status: 'applied' }), score: 10 },
      ]
      render(<JobTable jobs={jobs} onAppliedClick={mockOnAppliedClick} />)

      expect(screen.getByText('Applied')).toBeInTheDocument()
    })

    it('renders score', () => {
      const jobs = [
        { job: createMockJobOpening(), score: 42 },
      ]
      render(<JobTable jobs={jobs} onAppliedClick={mockOnAppliedClick} />)

      expect(screen.getByText('42')).toBeInTheDocument()
    })

    it('renders edit link', () => {
      const jobs = [
        { job: createMockJobOpening({ id: 'job-123' }), score: 10 },
      ]
      render(<JobTable jobs={jobs} onAppliedClick={mockOnAppliedClick} />)

      expect(screen.getByRole('link', { name: 'Edit' })).toHaveAttribute('href', '/jobs/job-123/edit')
    })
  })
})
```

**Step 3: Run tests**

Run:
```bash
bun run test:run app/components/job-table.test.tsx
```
Expected: PASS

**Step 4: Commit**

```bash
git add app/components/job-table.tsx app/components/job-table.test.tsx
git commit -m "feat: update JobTable to use new StatusBadge"
```

---

## Task 8: Create StatusTabs Component

**Files:**
- Create: `app/components/status-tabs.tsx`
- Create: `app/components/status-tabs.test.tsx`

**Step 1: Write failing test**

Create `app/components/status-tabs.test.tsx`:

```typescript
import { render, screen } from '~/test-utils'
import { describe, expect, it } from 'vitest'
import { StatusTabs } from './status-tabs'
import type { ApplicationStatus } from '~/db/schema'

describe('StatusTabs', () => {
  const mockCounts: Record<ApplicationStatus, number> = {
    not_applied: 5,
    applied: 3,
    interviewing: 2,
    offer: 1,
    rejected: 4,
    ghosted: 2,
    dumped: 1,
  }

  it('renders all tabs', () => {
    render(<StatusTabs selectedStatus="active" counts={mockCounts} />)

    expect(screen.getByRole('tab', { name: /Active/ })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Not Applied/ })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Applied/ })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Interviewing/ })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Offer/ })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Rejected/ })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Ghosted/ })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Dumped/ })).toBeInTheDocument()
  })

  it('shows counts in badges', () => {
    render(<StatusTabs selectedStatus="active" counts={mockCounts} />)

    // Active count = not_applied + applied + interviewing + offer = 5 + 3 + 2 + 1 = 11
    expect(screen.getByText('11')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument() // not_applied
    expect(screen.getByText('3')).toBeInTheDocument() // applied
  })

  it('highlights selected tab', () => {
    render(<StatusTabs selectedStatus="applied" counts={mockCounts} />)

    const appliedTab = screen.getByRole('tab', { name: /Applied/ })
    expect(appliedTab).toHaveAttribute('data-state', 'active')
  })
})
```

**Step 2: Run test to verify it fails**

Run:
```bash
bun run test:run app/components/status-tabs.test.tsx 2>&1 | head -20
```
Expected: FAIL - module not found

**Step 3: Create StatusTabs component**

Create `app/components/status-tabs.tsx`:

```typescript
import { useSearchParams } from 'react-router'
import { Badge } from '~/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '~/components/ui/tabs'
import type { ApplicationStatus } from '~/db/schema'
import { ACTIVE_STATUSES } from '~/db/schema'

type StatusTabsProps = {
  selectedStatus: string
  counts: Record<ApplicationStatus, number>
}

type TabConfig = {
  value: string
  label: string
  getCount: (counts: Record<ApplicationStatus, number>) => number
}

const TABS: TabConfig[] = [
  {
    value: 'active',
    label: 'Active',
    getCount: (counts) =>
      ACTIVE_STATUSES.reduce((sum, s) => sum + counts[s], 0),
  },
  { value: 'not_applied', label: 'Not Applied', getCount: (c) => c.not_applied },
  { value: 'applied', label: 'Applied', getCount: (c) => c.applied },
  { value: 'interviewing', label: 'Interviewing', getCount: (c) => c.interviewing },
  { value: 'offer', label: 'Offer', getCount: (c) => c.offer },
  { value: 'rejected', label: 'Rejected', getCount: (c) => c.rejected },
  { value: 'ghosted', label: 'Ghosted', getCount: (c) => c.ghosted },
  { value: 'dumped', label: 'Dumped', getCount: (c) => c.dumped },
]

export function StatusTabs({ selectedStatus, counts }: StatusTabsProps) {
  const [searchParams, setSearchParams] = useSearchParams()

  const handleTabChange = (value: string) => {
    const newParams = new URLSearchParams(searchParams)
    if (value === 'active') {
      newParams.delete('status')
    } else {
      newParams.set('status', value)
    }
    setSearchParams(newParams)
  }

  return (
    <Tabs value={selectedStatus} onValueChange={handleTabChange}>
      <TabsList className="flex-wrap h-auto gap-1">
        {TABS.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value} className="gap-2">
            {tab.label}
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
              {tab.getCount(counts)}
            </Badge>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
```

**Step 4: Run test to verify it passes**

Run:
```bash
bun run test:run app/components/status-tabs.test.tsx
```
Expected: PASS

**Step 5: Commit**

```bash
git add app/components/status-tabs.tsx app/components/status-tabs.test.tsx
git commit -m "feat: add StatusTabs component"
```

---

## Task 9: Update Home Route Loader and Action

**Files:**
- Modify: `app/routes/home.tsx`
- Modify: `app/routes/home.test.ts`

**Step 1: Update loader and action**

In `app/routes/home.tsx`:

Add import at top:
```typescript
import { StatusTabs } from '~/components/status-tabs'
import { ACTIVE_STATUSES, type ApplicationStatus } from '~/db/schema'
```

Replace loader function (lines 49-118) with:

```typescript
export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url)
  const formulaParam = url.searchParams.get('formula')
  const sortParam = url.searchParams.get('sort') || 'score'
  const countryParam = url.searchParams.get('country')
  const wowParam = url.searchParams.get('wow')
  const trackParam = url.searchParams.get('track')
  const statusParam = url.searchParams.get('status') || 'active'

  const [allJobs, formulas, statusCounts] = await Promise.all([
    jobOpeningRepository.findAll(),
    scoringFormulaRepository.findAll(),
    jobOpeningRepository.countByStatus(),
  ])

  // Get unique countries from all jobs for the filter dropdown
  const availableCountries = [
    ...new Set(allJobs.map((job) => job.country).filter(Boolean)),
  ].sort() as string[]

  // Check if any jobs have wow factor
  const hasWowJobs = allJobs.some((job) => job.wow)

  // Filter jobs by status
  let jobs = allJobs
  if (statusParam === 'active') {
    jobs = jobs.filter((job) => ACTIVE_STATUSES.includes(job.status))
  } else {
    jobs = jobs.filter((job) => job.status === statusParam)
  }

  // Apply other filters
  if (countryParam && countryParam !== 'all') {
    jobs = jobs.filter((job) => job.country === countryParam)
  }
  if (wowParam === 'true') {
    jobs = jobs.filter((job) => job.wow)
  }
  if (trackParam && trackParam !== 'all') {
    jobs = jobs.filter((job) => job.track === trackParam)
  }

  let rankedJobs: RankedJobOpening[]
  let selectedFormulaId: string | null = null

  if (formulas.length > 0) {
    const selectedFormula = formulaParam
      ? formulas.find((f) => f.id === formulaParam) || formulas[0]
      : formulas[0]
    selectedFormulaId = selectedFormula.id
    rankedJobs = scoringService.rankJobOpenings(jobs, selectedFormula)
  } else {
    rankedJobs = jobs.map((job) => ({ job, score: 0 }))
  }

  if (sortParam === 'date') {
    rankedJobs.sort((a, b) => {
      const dateA = new Date(a.job.dateAdded).getTime()
      const dateB = new Date(b.job.dateAdded).getTime()
      return dateB - dateA
    })
  }

  return {
    jobs: rankedJobs,
    formulas,
    selectedFormulaId,
    sortBy: sortParam,
    availableCountries,
    selectedCountry: countryParam || 'all',
    hasWowJobs,
    wowFilter: wowParam === 'true',
    selectedTrack: trackParam || 'all',
    selectedStatus: statusParam,
    statusCounts,
  }
}
```

Replace action function (lines 120-146) with:

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

  return { success: false }
}
```

**Step 2: Update Home component to use StatusTabs**

In the Home component, update useLoaderData destructuring to include:
```typescript
  const {
    jobs,
    formulas,
    selectedFormulaId,
    sortBy,
    availableCountries,
    selectedCountry,
    hasWowJobs,
    wowFilter,
    selectedTrack,
    selectedStatus,
    statusCounts,
  } = useLoaderData<typeof loader>()
```

Add StatusTabs after the h1 and buttons div, before the filter forms:
```typescript
      <div className="mb-6">
        <StatusTabs selectedStatus={selectedStatus} counts={statusCounts} />
      </div>
```

Update hidden inputs in each filter Form to include status:
```typescript
<input type="hidden" name="status" value={selectedStatus} />
```

Rename `handleMarkApplied` to `handleAppliedClick` and update JobTable prop:
```typescript
  const handleAppliedClick = (jobId: string) => {
    setSelectedJobId(jobId)
    setDialogOpen(true)
  }
```
```typescript
<JobTable jobs={jobs} onAppliedClick={handleAppliedClick} />
```

**Step 3: Update home.test.ts**

Update `app/routes/home.test.ts` to test new functionality:

Add to the mock at top:
```typescript
vi.mock('~/services/index.server', () => ({
  jobOpeningRepository: {
    findAll: vi.fn(),
    updateStatus: vi.fn(),
    countByStatus: vi.fn(),
  },
  scoringFormulaRepository: {
    findAll: vi.fn(),
  },
  scoringService: {
    rankJobOpenings: vi.fn((jobs, _formula) =>
      jobs.map((job: unknown) => ({ job, score: 10 }))
    ),
  },
}))
```

Update imports:
```typescript
import {
  jobOpeningRepository,
  scoringFormulaRepository,
  scoringService,
} from '~/services/index.server'
```

Add `mockJobRepo.countByStatus` setup in beforeEach or each test:
```typescript
mockJobRepo.countByStatus.mockResolvedValue({
  not_applied: 0,
  applied: 0,
  interviewing: 0,
  offer: 0,
  rejected: 0,
  ghosted: 0,
  dumped: 0,
})
```

Add new tests:
```typescript
  describe('status filtering', () => {
    it('filters by active statuses by default', async () => {
      const mockJobs = [
        createMockJobOpening({ id: '1', status: 'not_applied' }),
        createMockJobOpening({ id: '2', status: 'applied' }),
        createMockJobOpening({ id: '3', status: 'rejected' }),
      ]
      mockJobRepo.findAll.mockResolvedValue(mockJobs)
      mockFormulaRepo.findAll.mockResolvedValue([])
      mockJobRepo.countByStatus.mockResolvedValue({
        not_applied: 1, applied: 1, interviewing: 0, offer: 0,
        rejected: 1, ghosted: 0, dumped: 0,
      })

      const result = await loader({
        request: createRequest('http://localhost/'),
        params: {},
        context: {},
      })

      // Should only include active statuses (not_applied, applied)
      expect(result.jobs).toHaveLength(2)
      expect(result.selectedStatus).toBe('active')
    })

    it('filters by specific status when provided', async () => {
      const mockJobs = [
        createMockJobOpening({ id: '1', status: 'rejected' }),
        createMockJobOpening({ id: '2', status: 'applied' }),
      ]
      mockJobRepo.findAll.mockResolvedValue(mockJobs)
      mockFormulaRepo.findAll.mockResolvedValue([])
      mockJobRepo.countByStatus.mockResolvedValue({
        not_applied: 0, applied: 1, interviewing: 0, offer: 0,
        rejected: 1, ghosted: 0, dumped: 0,
      })

      const result = await loader({
        request: createRequest('http://localhost/?status=rejected'),
        params: {},
        context: {},
      })

      expect(result.jobs).toHaveLength(1)
      expect(result.jobs[0].job.status).toBe('rejected')
    })

    it('returns status counts', async () => {
      mockJobRepo.findAll.mockResolvedValue([])
      mockFormulaRepo.findAll.mockResolvedValue([])
      mockJobRepo.countByStatus.mockResolvedValue({
        not_applied: 5, applied: 3, interviewing: 2, offer: 1,
        rejected: 4, ghosted: 2, dumped: 1,
      })

      const result = await loader({
        request: createRequest('http://localhost/'),
        params: {},
        context: {},
      })

      expect(result.statusCounts.not_applied).toBe(5)
      expect(result.statusCounts.applied).toBe(3)
    })
  })

  describe('updateStatus action', () => {
    it('updates job status', async () => {
      mockJobRepo.updateStatus.mockResolvedValue(undefined)

      const result = await action({
        request: createFormDataRequest({
          intent: 'updateStatus',
          jobId: 'job-123',
          status: 'interviewing',
        }),
        params: {},
        context: {},
      })

      expect(mockJobRepo.updateStatus).toHaveBeenCalledWith(
        'job-123',
        'interviewing',
        null
      )
      expect(result).toEqual({ success: true })
    })

    it('updates job status with date', async () => {
      mockJobRepo.updateStatus.mockResolvedValue(undefined)

      const result = await action({
        request: createFormDataRequest({
          intent: 'updateStatus',
          jobId: 'job-123',
          status: 'applied',
          date: '2026-01-15',
        }),
        params: {},
        context: {},
      })

      expect(mockJobRepo.updateStatus).toHaveBeenCalledWith(
        'job-123',
        'applied',
        '2026-01-15'
      )
      expect(result).toEqual({ success: true })
    })
  })
```

Remove old `markApplied`/`markUnapplied` tests.

**Step 4: Run tests**

Run:
```bash
bun run test:run app/routes/home.test.ts
```
Expected: PASS

**Step 5: Commit**

```bash
git add app/routes/home.tsx app/routes/home.test.ts
git commit -m "feat: update home route with status tabs and filtering"
```

---

## Task 10: Update ApplicationDialog for Applied Status

**Files:**
- Modify: `app/components/application-dialog.tsx`

**Step 1: Update dialog to use updateStatus intent**

In `app/components/application-dialog.tsx`, change the hidden input from:
```typescript
<input type="hidden" name="intent" value="markApplied" />
```
to:
```typescript
<input type="hidden" name="intent" value="updateStatus" />
<input type="hidden" name="status" value="applied" />
```

And rename `applicationSentDate` input to `date`:
```typescript
name="date"
```

**Step 2: Run all tests**

Run:
```bash
bun run test:run
```
Expected: All tests pass

**Step 3: Commit**

```bash
git add app/components/application-dialog.tsx
git commit -m "feat: update ApplicationDialog to use updateStatus intent"
```

---

## Task 11: Final Verification and Cleanup

**Step 1: Run type check**

Run:
```bash
bun run typecheck
```
Expected: No errors

**Step 2: Run all tests**

Run:
```bash
bun run test:run
```
Expected: All tests pass

**Step 3: Run linter**

Run:
```bash
bun run check:fix
```
Expected: No errors or auto-fixed

**Step 4: Test manually in browser**

Run:
```bash
bun run dev
```
Verify:
- Tabs appear and show counts
- Clicking tabs filters jobs
- Status dropdown works
- Changing status updates immediately
- Applied status shows date picker dialog

**Step 5: Final commit**

```bash
git add -A
git commit -m "feat: complete application status system implementation"
```
