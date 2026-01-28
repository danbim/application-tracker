# Talent Pools Feature Design

## Overview

A listing page where users can track talent pools they have joined or been added to. Modeled closely on the existing Job Posting Sites feature, with an added status field to distinguish between pools where the user has submitted their profile and those where they have not.

## Data Model

New `talent_pools` table:

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK, auto-generated via `gen_random_uuid()` |
| `company_name` | text | Required. The company running the talent pool. |
| `url` | text | Required. Link to the talent pool. |
| `status` | enum(`submitted`, `not_submitted`) | Required, default `not_submitted`. |
| `notes` | text | Optional. Free-text multi-line notes. |
| `created_at` | timestamp | Auto-set on creation. |
| `updated_at` | timestamp | Auto-set, updated on changes. |

**Default sort order:** `not_submitted` first (actionable items on top), then alphabetical by company name.

## Architecture

Follows the same layered pattern as Job Posting Sites:

### Schema (`app/db/schema.ts`)

- Define `talentPoolStatusEnum` pgEnum with values `submitted`, `not_submitted`
- Define `talentPools` pgTable
- Export `TalentPool` and `NewTalentPool` types

### Validation (`app/schemas/talent-pool.schema.ts`)

Zod schema with:
- `companyName`: non-empty string
- `url`: valid URL
- `status`: enum of `submitted` | `not_submitted`
- `notes`: optional string

### Repository (`app/repositories/talent-pool.repository.ts`)

Standard CRUD operations:
- `findAll()` — ordered by status (`not_submitted` first), then company name alphabetically
- `findById(id)`
- `create(data)`
- `update(id, data)`
- `delete(id)`
- `toggleStatus(id)` — flip between `submitted` and `not_submitted`

### Service (`app/services/talent-pool.service.ts`)

Pass-through to repository (same pattern as `JobPostingSiteService`).

### Wiring

- Register repository in `app/repositories/index.server.ts`
- Register service in `app/services/index.server.ts`

## UI

### Route (`app/routes/talent-pools.tsx`)

**Loader:** Fetches all talent pools via the service.

**Actions (form intents):**
- `createPool` — validate with Zod, create via service
- `updatePool` — validate with Zod, update via service
- `deletePool` — delete via service
- `toggleStatus` — toggle submitted/not_submitted via service

**Table columns:**
| Column | Behavior |
|--------|----------|
| Company Name | Linked to URL with external link icon |
| Status | Clickable badge that toggles between submitted (green) and not submitted (muted/gray) |
| Notes | Truncated in table view, full text visible in edit modal |
| Actions | Edit and Delete buttons |

**Modals:**
- Add/Edit: Company name input, URL input, status selector, multi-line textarea for notes
- Delete: Confirmation dialog

**Empty state:** Message prompting the user to add their first talent pool.

### Navigation

- Add "Talent Pools" link to the main navigation bar (alongside Jobs and Sites)
- Add a link card on the home page matching the existing Sites card pattern

## Testing

### E2E Tests (`e2e/talent-pools.spec.ts`)

Coverage matching `sites.spec.ts`:
- Display talent pools on the page
- Navigate to talent pools from home page
- Add a new talent pool
- Edit an existing talent pool
- Delete a talent pool with confirmation
- Toggle status between submitted and not submitted
- External links have correct href and target attributes
- Navigate back to jobs from talent pools page

### Migration

- Generate via `bun run db:generate`
- Ensure `statement-breakpoint` between SQL statements (required for PGLite E2E tests)
