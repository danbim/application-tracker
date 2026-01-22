# Job Tracker System Design

A single-user application for ranking and tracking job openings to optimize the application process.

## Data Model

### Job Opening

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID | Yes | Primary key |
| title | string | Yes | Job title |
| company | string | Yes | Company name |
| description | text | Yes | Job description |
| jobLocation | string | No | Geographic location (e.g., "Berlin, Germany") |
| postingUrl | string | No | Link to job posting |
| dateOpened | date | No | When listing was posted |
| dateAdded | timestamp | Yes | Auto-set on creation |
| applicationSent | boolean | Yes | Default false |
| applicationSentDate | date | No | When application was sent |

### Compensation (embedded in job_openings table)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| salaryAmount | integer | No | Annual gross salary |
| salaryCurrency | string | No | Currency code (EUR, USD, etc.) |
| pensionScheme | text | No | Description of pension benefits |
| healthInsurance | text | No | Description of health coverage |
| stockOptions | text | No | Description of equity compensation |
| vacationDays | integer | No | Annual vacation days |

### Work Location Metadata (embedded in job_openings table)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| workLocation | enum | No | "remote", "hybrid", or "office" |
| officeDistanceKm | integer | No | Distance from home in km |
| wfhDaysPerWeek | integer | No | Work-from-home days per week |

### Job Ratings (embedded in job_openings table)

Each criterion is rated as: -1 (bad), 0 (medium), 1 (good), or null (not rated).

| Criterion | Field Name |
|-----------|------------|
| Positive Impact | ratingImpact |
| Compensation | ratingCompensation |
| Role / Level of responsibility | ratingRole |
| Technologies | ratingTech |
| Remote / hybrid / office | ratingLocation |
| Industry | ratingIndustry |
| Engineering Culture | ratingCulture |
| Growth Potential | ratingGrowth |
| Profile Match | ratingProfileMatch |
| Company size | ratingCompanySize |
| Stress factor | ratingStress |

### Scoring Formula

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID | Yes | Primary key |
| name | string | Yes | Formula name (e.g., "Professional Growth") |
| weights | JSON | Yes | Maps criterion names to weight multipliers |

**Scoring Calculation:**
```
score = Σ (job.rating[criterion] × formula.weights[criterion])
```
Unrated criteria (null) are treated as 0.

## Architecture

### Layer Overview

```
UI (React + shadcn/ui)
        ↓
Remix Routes (loaders/actions)
        ↓
Services (business logic)
        ↓
Repositories (data access)
        ↓
Drizzle ORM → PostgreSQL
```

### Dependency Injection

Stateless singletons with constructor-based injection:

```typescript
// db.server.ts
export const db = drizzle(...)

// repositories.server.ts
export const jobOpeningRepository = new JobOpeningRepository(db)
export const scoringFormulaRepository = new ScoringFormulaRepository(db)

// services.server.ts
export const jobOpeningService = new JobOpeningService(jobOpeningRepository)
export const scoringService = new ScoringService(jobOpeningRepository, scoringFormulaRepository)
```

### Services

- **JobOpeningService** - CRUD operations for job openings
- **ScoringService** - Calculate scores, rank job openings by formula

### Repositories

- **JobOpeningRepository** - Database operations for job openings
- **ScoringFormulaRepository** - Database operations for scoring formulas

## Project Structure

```
job-tracker/
├── app/
│   ├── components/
│   │   ├── ui/              # shadcn/ui components
│   │   ├── job-form.tsx
│   │   ├── job-table.tsx
│   │   ├── formula-form.tsx
│   │   └── rating-input.tsx
│   ├── routes/
│   │   ├── _index.tsx       # Main job list
│   │   ├── jobs.new.tsx
│   │   ├── jobs.$id.edit.tsx
│   │   ├── formulas._index.tsx
│   │   ├── formulas.new.tsx
│   │   └── formulas.$id.edit.tsx
│   ├── db/
│   │   ├── schema.ts        # Drizzle schema definitions
│   │   ├── db.server.ts     # DB connection singleton
│   │   └── migrations/
│   ├── repositories/
│   │   ├── job-opening.repository.ts
│   │   └── scoring-formula.repository.ts
│   ├── services/
│   │   ├── job-opening.service.ts
│   │   ├── scoring.service.ts
│   │   └── index.server.ts
│   ├── schemas/             # Shared Zod validation schemas
│   │   ├── job-opening.schema.ts
│   │   └── scoring-formula.schema.ts
│   └── root.tsx
├── docker-compose.yml
├── drizzle.config.ts
├── package.json
└── tsconfig.json
```

## UI Screens

### Main Screen (`/`)

- DataTable with columns: Title, Company, Location, Date Added, Score, Application Status
- Select dropdown to choose scoring formula (dynamically updates scores)
- Sortable by score or date added
- "Mark Applied" button opens Dialog to set application date
- "Add Job" button in header
- Row actions for Edit/Delete

### Job Opening Form (`/jobs/new`, `/jobs/:id/edit`)

Sections:
1. **Basic Info** - title, company, description, job location, posting URL, date opened
2. **Compensation** - salary (amount + currency), pension, health insurance, stock options, vacation days
3. **Work Location** - radio group (remote/hybrid/office), conditional fields for distance and WFH days
4. **Ratings** - 11 criteria, each a radio group: Good (+1), Medium (0), Bad (-1), Not Rated

Actions: Save, Cancel, Delete (edit only)

### Scoring Formulas (`/formulas`, `/formulas/new`, `/formulas/:id/edit`)

- List view with all formulas and Edit/Delete actions
- Form: name field + 11 number inputs for weights

## Technologies

| Component | Technology |
|-----------|------------|
| Runtime | Bun |
| Language | TypeScript |
| Database | PostgreSQL (Docker) |
| ORM | Drizzle |
| Framework | Remix |
| UI Components | shadcn/ui |
| Styling | Tailwind CSS |
| Validation | Zod (shared client/server) |

## Validation

- Zod schemas in `app/schemas/` shared between client and server
- Client: real-time form validation feedback
- Server: validate in actions before persisting
- Rating values constrained to -1, 0, 1
- Weights constrained to non-negative integers

## Out of Scope (Future)

- Authentication / multi-user support
- Application stage tracking beyond "sent" checkbox
- Note-taking on applications
- LLM-based extraction from job posting URLs
- Automated job import from external sources
