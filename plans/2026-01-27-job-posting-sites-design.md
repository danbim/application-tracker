# Job Posting Sites Feature Design

## Overview

A standalone page for tracking job posting sites and saved search bookmarks. Users maintain a list of sites they regularly check for new job postings, with a "last checked" timestamp to track when each was last reviewed.

## Data Model

New `jobPostingSites` table:

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key, default random |
| `name` | `text` | Required — descriptive label (e.g., "LinkedIn - React Berlin") |
| `url` | `text` | Required — site homepage or saved search query URL |
| `lastCheckedAt` | `timestamp` | Nullable — null means never checked |
| `createdAt` | `timestamp` | Default now |
| `updatedAt` | `timestamp` | Default now |

No relations to other tables.

## UI Design

### Navigation

A "Sites" link added to the home page, consistent with existing "Formulas" link placement.

### Sites Page (`/sites`)

A table with columns:

- **Name** — clickable link opening the URL in a new browser tab (with external-link icon)
- **Last Checked** — human-readable relative date (e.g., "3 days ago") or "Never"
- **Actions**:
  - "Just Checked" button — instantly sets `lastCheckedAt` to now
  - Edit icon — opens modal with name + URL pre-filled
  - Delete icon — opens confirmation modal

**"Add Site" button** at the top opens the add/edit modal with empty fields.

**Sort order:** `lastCheckedAt` ascending (null/oldest first), so stale sites float to the top.

### Modals

- **Add/Edit modal:** Name (text input) + URL (text input), Save/Cancel buttons
- **Delete confirmation modal:** "Are you sure you want to delete [name]?" with Confirm/Cancel

## Validation

Zod schema with:

- `name`: required non-empty string
- `url`: validated with `z.string().url()`

## Architecture

### Files to create

| File | Purpose |
|------|---------|
| `app/db/schema.ts` | Add `jobPostingSites` table definition |
| `app/db/migrations/XXXX_*.sql` | Generated via `bun run db:generate` |
| `app/schemas/job-posting-site.schema.ts` | Zod validation schema |
| `app/repositories/job-posting-site.repository.ts` | Data access (CRUD + updateLastChecked) |
| `app/services/job-posting-site.service.ts` | Service layer wrapping repository |
| `app/routes/sites.tsx` | Full page: loader, action, UI |

### Files to modify

| File | Change |
|------|--------|
| `app/repositories/index.server.ts` | Export repository singleton |
| `app/services/index.server.ts` | Export service singleton |
| `app/routes.ts` | Register `/sites` route |
| `app/routes/home.tsx` | Add "Sites" navigation link |
| `README.md` | Add Sites to feature list |
| `docs/index.html` | Add Sites to landing page |

### Layer architecture

Route → Service → Repository → Database

The route never talks to the repository directly. The service wraps the repository even for simple pass-through CRUD to maintain consistent architecture and allow future business logic.

### Route action intents

- `createSite` — validate and insert new site
- `updateSite` — validate and update name/URL
- `deleteSite` — delete by ID
- `markChecked` — set `lastCheckedAt` to current timestamp

### Components

No new shadcn/ui components needed. Uses existing: Table, Button, Dialog, Input, Label.

Custom components are built inline in the route file (add/edit modal, delete confirmation modal) unless complexity warrants extraction.
