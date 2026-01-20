# Frontend Test Suite Design

## Overview

Extensive unit test suite for the Job Tracker frontend using Vitest and React Testing Library, providing full coverage of components, data display, and route loaders/actions.

## Decisions

- **Framework:** Vitest + React Testing Library
- **File location:** Colocated (tests next to source files)
- **Priority areas:** Form components, data display, route loaders/actions

## Infrastructure Setup

### Dependencies

```bash
bun add -d vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom @vitejs/plugin-react
```

### Configuration Files

**vitest.config.ts:**
- Configure jsdom environment
- Set up path aliases matching tsconfig
- Include setup file

**vitest.setup.ts:**
- Import `@testing-library/jest-dom` matchers
- Global mocks for React Router hooks

**app/test-utils.tsx:**
- Custom `render` function with providers
- Mock factories for `JobOpening`, `ScoringFormula`
- React Router context mocks (useFetcher, useLoaderData)

### Package.json Scripts

```json
{
  "test": "vitest",
  "test:run": "vitest run",
  "test:coverage": "vitest run --coverage"
}
```

## Test Files

### Form Components

#### job-form.test.tsx
- Renders all form fields
- Pre-fills fields when editing existing job
- Required field validation (title, company, description)
- All 12 rating criteria render with correct labels
- Wow checkbox toggles correctly
- Markdown preview toggle shows/hides preview
- Paste handler converts HTML to markdown (mock turndown)
- Form submission with correct values

#### formula-form.test.tsx
- Renders name input and all 13 weight inputs
- Pre-fills weights when editing
- Weight inputs accept negative values
- Form submission with nested weights structure

#### application-dialog.test.tsx
- Shows job title and date picker (defaults to today)
- Opens/closes based on `open` prop
- Cancel button calls `onOpenChange(false)`
- Submit via fetcher, closes after completion
- Loading state shows "Saving..." and disables button

### Data Display Components

#### job-table.test.tsx
- Empty state message when no jobs
- Renders correct columns (company, title, location, date, score, status)
- Edit link points to `/jobs/{id}/edit`
- Numeric score display
- Wow indicator (star) when `job.wow` is true
- HoverCard trigger renders for description
- Date formatting

#### StatusBadge tests (within job-table.test.tsx)
- "Not Applied" badge calls `onMarkApplied` on click
- "Applied {date}" badge renders correctly
- Unapply submits form with `markUnapplied` intent
- Hover state classes

#### rating-input.test.tsx
- Shows label and three radio options (-1, 0, +1)
- Selects correct option based on `defaultValue`
- Hidden input for null/unselected state
- Clicking option updates selection

### Route Loaders/Actions

#### home.test.ts

**Loader:**
- Returns jobs and formulas from repositories
- Uses specified formula param or defaults to first
- Filters by country param
- Filters by wow param
- Filters by track param
- Sorts by score (default) or date

**Action:**
- `markApplied`: calls `updateApplicationStatus(id, true, date)`
- `markUnapplied`: calls `updateApplicationStatus(id, false, null)`
- Unknown intent returns `{ success: false }`

#### jobs.new.test.ts

**Action:**
- Valid submission creates job and redirects
- Invalid submission returns validation errors
- Wow checkbox parsed via `getAll('wow')`
- Empty optional fields transformed to null

#### jobs.$id.edit.test.ts

**Loader:**
- Returns job by id
- Throws 404 when job not found
- Throws 400 if params.id undefined

**Action:**
- Update intent updates job and redirects
- Delete intent deletes and redirects to `/`
- Validation errors returned for invalid data

#### formulas.test.ts
- Loader returns all formulas

#### formulas.new.test.ts
- Action creates formula with nested weights

#### formulas.$id.edit.test.ts
- Loader returns formula or 404
- Action updates or deletes formula

## File Structure

```
app/
├── components/
│   ├── job-form.tsx
│   ├── job-form.test.tsx
│   ├── job-table.tsx
│   ├── job-table.test.tsx
│   ├── application-dialog.tsx
│   ├── application-dialog.test.tsx
│   ├── formula-form.tsx
│   ├── formula-form.test.tsx
│   ├── rating-input.tsx
│   └── rating-input.test.tsx
├── routes/
│   ├── home.tsx
│   ├── home.test.ts
│   ├── jobs.new.tsx
│   ├── jobs.new.test.ts
│   ├── jobs.$id.edit.tsx
│   ├── jobs.$id.edit.test.ts
│   ├── formulas.tsx
│   ├── formulas.test.ts
│   ├── formulas.new.tsx
│   ├── formulas.new.test.ts
│   ├── formulas.$id.edit.tsx
│   └── formulas.$id.edit.test.ts
├── test-utils.tsx
vitest.config.ts
vitest.setup.ts
```

## Estimated Scope

- ~50-60 tests across 11 test files
- Full coverage of user-facing components
- Route loader/action logic tested in isolation
