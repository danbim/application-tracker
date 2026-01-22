# Application Status System Design

## Overview

Replace the boolean `applicationSent` field with a proper status enum to track job applications through their full lifecycle. Add tabs to the main screen for filtering by status.

## Status Values

| Status | Description | Color | In "Active" tab |
|--------|-------------|-------|-----------------|
| not_applied | Default state, job added but no action taken | Gray | Yes |
| applied | Application submitted | Blue | Yes |
| interviewing | In interview process | Yellow/Amber | Yes |
| offer | Received an offer | Green | Yes |
| rejected | Explicitly rejected by employer | Red | No |
| ghosted | No response from employer | Purple/Gray | No |
| dumped | User chose not to apply | Gray strikethrough | No |

## Data Model

### New Enum

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
```

### Schema Changes

**Remove from `jobOpenings`:**
- `applicationSent: boolean`
- `applicationSentDate: date`

**Add to `jobOpenings`:**
- `status: applicationStatusEnum` (default: 'not_applied')
- `appliedAt: timestamp` (nullable)
- `interviewingAt: timestamp` (nullable)
- `offerAt: timestamp` (nullable)
- `rejectedAt: timestamp` (nullable)
- `ghostedAt: timestamp` (nullable)
- `dumpedAt: timestamp` (nullable)

When status changes, the corresponding timestamp is set. Previous timestamps are preserved for history tracking.

## UI Components

### Tab Bar

Horizontal tabs above the filter row, using shadcn/ui Tabs component.

| Tab | URL Param | Filter Logic |
|-----|-----------|--------------|
| Active | `?status=active` (default) | status IN (not_applied, applied, interviewing, offer) |
| Not Applied | `?status=not_applied` | status = not_applied |
| Applied | `?status=applied` | status = applied |
| Interviewing | `?status=interviewing` | status = interviewing |
| Offer | `?status=offer` | status = offer |
| Rejected | `?status=rejected` | status = rejected |
| Ghosted | `?status=ghosted` | status = ghosted |
| Dumped | `?status=dumped` | status = dumped |

Each tab displays a badge with the count of jobs in that status.

### StatusBadge Component

Dropdown component showing current status with option to change to any other status.

- Click badge → dropdown opens with all 7 status options
- Select new status → immediate update via useFetcher
- Exception: selecting "Applied" shows date picker dialog

## Repository Layer

### Updated Methods

```typescript
// Replace updateApplicationStatus
updateStatus(id: string, status: ApplicationStatus, date?: string): Promise<void>
```

### New Methods

```typescript
findByStatus(status: ApplicationStatus): Promise<JobOpening[]>
countByStatus(): Promise<Record<ApplicationStatus, number>>
```

## Route Changes

### Loader (`home.tsx`)

- Accept `status` query param (default: 'active')
- Call `countByStatus()` for tab badges
- Filter jobs based on selected tab
- Return filtered jobs and counts object

### Action (`home.tsx`)

Replace `markApplied`/`markUnapplied` intents with single `updateStatus` intent:

```typescript
if (intent === 'updateStatus') {
  const jobId = formData.get('jobId') as string
  const newStatus = formData.get('status') as ApplicationStatus
  const date = formData.get('date') as string | null
  await jobOpeningRepository.updateStatus(jobId, newStatus, date)
  return { success: true }
}
```

## Database Migration

1. Create `application_status` enum type
2. Add `status` column with default `'not_applied'`
3. Add timestamp columns for each status
4. Migrate existing data:
   - `application_sent = true` → `status = 'applied'`, copy date to `applied_at`
   - `application_sent = false` → `status = 'not_applied'`
5. Drop `application_sent` and `application_sent_date` columns

## Test Updates

- Update `home.test.ts`: tab filtering, status counts, updateStatus action
- Update `job-table.test.tsx`: StatusBadge dropdown behavior
- Update mock factories: use `status` field instead of `applicationSent`
- Add tests for `countByStatus` repository method
