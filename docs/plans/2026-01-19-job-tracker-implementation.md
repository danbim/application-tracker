# Job Tracker Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a single-user job tracking application with weighted scoring formulas to rank job openings.

**Architecture:** Layered architecture with Remix routes calling singleton services, which use singleton repositories backed by Drizzle ORM. Validation via shared Zod schemas.

**Tech Stack:** Bun, TypeScript, Remix, Drizzle ORM, PostgreSQL (Docker), shadcn/ui, Tailwind CSS, Zod

**Design Document:** `docs/plans/2026-01-19-job-tracker-design.md`

---

## Phase 1: Project Setup

### Task 1: Initialize Bun + Remix Project

**Files:**
- Create: `package.json`
- Create: `app/root.tsx`
- Create: `app/routes/_index.tsx`

**Step 1: Create Remix project with Bun**

Run:
```bash
cd /Users/danbim/coding/job-tracker
bunx create-remix@latest . --template remix-run/remix/templates/remix --package-manager bun --no-git-init
```

Select defaults when prompted. If asked about overwriting, allow it.

**Step 2: Verify project runs**

Run:
```bash
bun run dev
```

Expected: Server starts on http://localhost:5173 (or similar port)

Stop the server with Ctrl+C.

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: initialize Remix project with Bun"
```

---

### Task 2: Add Development Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install Drizzle and database dependencies**

Run:
```bash
bun add drizzle-orm postgres
bun add -d drizzle-kit @types/node
```

**Step 2: Install Zod**

Run:
```bash
bun add zod
```

**Step 3: Install shadcn/ui dependencies**

Run:
```bash
bun add tailwindcss-animate class-variance-authority clsx tailwind-merge lucide-react
bun add -d @types/react @types/react-dom
```

**Step 4: Commit**

```bash
git add package.json bun.lockb
git commit -m "feat: add Drizzle, Zod, and shadcn/ui dependencies"
```

---

### Task 3: Configure shadcn/ui

**Files:**
- Create: `components.json`
- Modify: `app/tailwind.css`
- Create: `app/lib/utils.ts`

**Step 1: Initialize shadcn/ui**

Run:
```bash
bunx shadcn@latest init
```

When prompted:
- Style: Default
- Base color: Slate
- CSS variables: Yes
- Tailwind CSS config: `tailwind.config.ts`
- Components: `app/components/ui`
- Utils: `app/lib/utils.ts`
- React Server Components: No

**Step 2: Verify utils.ts was created**

Run:
```bash
cat app/lib/utils.ts
```

Expected: Should contain `cn` function combining clsx and tailwind-merge.

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: configure shadcn/ui"
```

---

### Task 4: Set Up Docker Compose for PostgreSQL

**Files:**
- Create: `docker-compose.yml`
- Create: `.env`
- Create: `.env.example`
- Modify: `.gitignore`

**Step 1: Create docker-compose.yml**

Create `docker-compose.yml`:
```yaml
services:
  db:
    image: postgres:16-alpine
    container_name: job-tracker-db
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: job_tracker
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

**Step 2: Create .env file**

Create `.env`:
```
DATABASE_URL=postgres://postgres:postgres@localhost:5432/job_tracker
```

**Step 3: Create .env.example**

Create `.env.example`:
```
DATABASE_URL=postgres://postgres:postgres@localhost:5432/job_tracker
```

**Step 4: Update .gitignore**

Add to `.gitignore`:
```
.env
```

**Step 5: Start database**

Run:
```bash
docker compose up -d
```

Expected: Container starts successfully.

**Step 6: Verify database is running**

Run:
```bash
docker compose ps
```

Expected: Shows `job-tracker-db` as running.

**Step 7: Commit**

```bash
git add docker-compose.yml .env.example .gitignore
git commit -m "feat: add Docker Compose for PostgreSQL"
```

---

## Phase 2: Database Schema

### Task 5: Create Drizzle Configuration

**Files:**
- Create: `drizzle.config.ts`

**Step 1: Create drizzle.config.ts**

Create `drizzle.config.ts`:
```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./app/db/schema.ts",
  out: "./app/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

**Step 2: Commit**

```bash
git add drizzle.config.ts
git commit -m "feat: add Drizzle configuration"
```

---

### Task 6: Define Database Schema

**Files:**
- Create: `app/db/schema.ts`

**Step 1: Create schema.ts with scoring_formulas table**

Create `app/db/schema.ts`:
```typescript
import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  date,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";

export const workLocationEnum = pgEnum("work_location", [
  "remote",
  "hybrid",
  "office",
]);

export const scoringFormulas = pgTable("scoring_formulas", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  weights: jsonb("weights").notNull().$type<{
    impact: number;
    compensation: number;
    role: number;
    tech: number;
    location: number;
    industry: number;
    culture: number;
    growth: number;
    profileMatch: number;
    companySize: number;
    stress: number;
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const jobOpenings = pgTable("job_openings", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  company: varchar("company", { length: 255 }).notNull(),
  description: text("description").notNull(),
  jobLocation: varchar("job_location", { length: 255 }),
  postingUrl: varchar("posting_url", { length: 2048 }),
  dateOpened: date("date_opened"),
  dateAdded: timestamp("date_added").defaultNow().notNull(),
  applicationSent: boolean("application_sent").default(false).notNull(),
  applicationSentDate: date("application_sent_date"),

  // Compensation
  salaryAmount: integer("salary_amount"),
  salaryCurrency: varchar("salary_currency", { length: 3 }),
  pensionScheme: text("pension_scheme"),
  healthInsurance: text("health_insurance"),
  stockOptions: text("stock_options"),
  vacationDays: integer("vacation_days"),

  // Work location metadata
  workLocation: workLocationEnum("work_location"),
  officeDistanceKm: integer("office_distance_km"),
  wfhDaysPerWeek: integer("wfh_days_per_week"),

  // Ratings (-1, 0, 1, or null)
  ratingImpact: integer("rating_impact"),
  ratingCompensation: integer("rating_compensation"),
  ratingRole: integer("rating_role"),
  ratingTech: integer("rating_tech"),
  ratingLocation: integer("rating_location"),
  ratingIndustry: integer("rating_industry"),
  ratingCulture: integer("rating_culture"),
  ratingGrowth: integer("rating_growth"),
  ratingProfileMatch: integer("rating_profile_match"),
  ratingCompanySize: integer("rating_company_size"),
  ratingStress: integer("rating_stress"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type ScoringFormula = typeof scoringFormulas.$inferSelect;
export type NewScoringFormula = typeof scoringFormulas.$inferInsert;
export type JobOpening = typeof jobOpenings.$inferSelect;
export type NewJobOpening = typeof jobOpenings.$inferInsert;
```

**Step 2: Commit**

```bash
git add app/db/schema.ts
git commit -m "feat: define database schema for job openings and scoring formulas"
```

---

### Task 7: Generate and Run Initial Migration

**Files:**
- Create: `app/db/migrations/*.sql`

**Step 1: Generate migration**

Run:
```bash
bunx drizzle-kit generate
```

Expected: Migration file created in `app/db/migrations/`.

**Step 2: Create database connection for migrations**

Create `app/db/db.server.ts`:
```typescript
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

const client = postgres(connectionString);
export const db = drizzle(client, { schema });
```

**Step 3: Run migration**

Run:
```bash
bunx drizzle-kit migrate
```

Expected: Migration applied successfully.

**Step 4: Verify tables exist**

Run:
```bash
docker exec -it job-tracker-db psql -U postgres -d job_tracker -c "\dt"
```

Expected: Shows `job_openings` and `scoring_formulas` tables.

**Step 5: Commit**

```bash
git add app/db/
git commit -m "feat: generate and run initial database migration"
```

---

## Phase 3: Validation Schemas

### Task 8: Create Zod Schemas

**Files:**
- Create: `app/schemas/scoring-formula.schema.ts`
- Create: `app/schemas/job-opening.schema.ts`

**Step 1: Create scoring formula schema**

Create `app/schemas/scoring-formula.schema.ts`:
```typescript
import { z } from "zod";

export const weightsSchema = z.object({
  impact: z.coerce.number().int().min(0),
  compensation: z.coerce.number().int().min(0),
  role: z.coerce.number().int().min(0),
  tech: z.coerce.number().int().min(0),
  location: z.coerce.number().int().min(0),
  industry: z.coerce.number().int().min(0),
  culture: z.coerce.number().int().min(0),
  growth: z.coerce.number().int().min(0),
  profileMatch: z.coerce.number().int().min(0),
  companySize: z.coerce.number().int().min(0),
  stress: z.coerce.number().int().min(0),
});

export const scoringFormulaSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  weights: weightsSchema,
});

export type ScoringFormulaInput = z.infer<typeof scoringFormulaSchema>;
export type WeightsInput = z.infer<typeof weightsSchema>;
```

**Step 2: Create job opening schema**

Create `app/schemas/job-opening.schema.ts`:
```typescript
import { z } from "zod";

const ratingSchema = z.coerce.number().int().min(-1).max(1).nullable();

export const jobOpeningSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  company: z.string().min(1, "Company is required").max(255),
  description: z.string().min(1, "Description is required"),
  jobLocation: z.string().max(255).optional().or(z.literal("")),
  postingUrl: z.string().url().max(2048).optional().or(z.literal("")),
  dateOpened: z.string().optional().or(z.literal("")),

  // Compensation
  salaryAmount: z.coerce.number().int().positive().optional().or(z.literal("")),
  salaryCurrency: z.string().length(3).optional().or(z.literal("")),
  pensionScheme: z.string().optional().or(z.literal("")),
  healthInsurance: z.string().optional().or(z.literal("")),
  stockOptions: z.string().optional().or(z.literal("")),
  vacationDays: z.coerce.number().int().positive().optional().or(z.literal("")),

  // Work location
  workLocation: z.enum(["remote", "hybrid", "office"]).optional().or(z.literal("")),
  officeDistanceKm: z.coerce.number().int().min(0).optional().or(z.literal("")),
  wfhDaysPerWeek: z.coerce.number().int().min(0).max(7).optional().or(z.literal("")),

  // Ratings
  ratingImpact: ratingSchema,
  ratingCompensation: ratingSchema,
  ratingRole: ratingSchema,
  ratingTech: ratingSchema,
  ratingLocation: ratingSchema,
  ratingIndustry: ratingSchema,
  ratingCulture: ratingSchema,
  ratingGrowth: ratingSchema,
  ratingProfileMatch: ratingSchema,
  ratingCompanySize: ratingSchema,
  ratingStress: ratingSchema,
});

export const applicationStatusSchema = z.object({
  applicationSent: z.coerce.boolean(),
  applicationSentDate: z.string().optional().or(z.literal("")),
});

export type JobOpeningInput = z.infer<typeof jobOpeningSchema>;
export type ApplicationStatusInput = z.infer<typeof applicationStatusSchema>;
```

**Step 3: Commit**

```bash
git add app/schemas/
git commit -m "feat: add Zod validation schemas for job openings and scoring formulas"
```

---

## Phase 4: Repository Layer

### Task 9: Create Scoring Formula Repository

**Files:**
- Create: `app/repositories/scoring-formula.repository.ts`

**Step 1: Create the repository**

Create `app/repositories/scoring-formula.repository.ts`:
```typescript
import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import {
  scoringFormulas,
  type ScoringFormula,
  type NewScoringFormula,
} from "~/db/schema";
import type * as schema from "~/db/schema";

export class ScoringFormulaRepository {
  constructor(private db: PostgresJsDatabase<typeof schema>) {}

  async findAll(): Promise<ScoringFormula[]> {
    return this.db.select().from(scoringFormulas).orderBy(scoringFormulas.name);
  }

  async findById(id: string): Promise<ScoringFormula | undefined> {
    const results = await this.db
      .select()
      .from(scoringFormulas)
      .where(eq(scoringFormulas.id, id));
    return results[0];
  }

  async create(data: NewScoringFormula): Promise<ScoringFormula> {
    const results = await this.db
      .insert(scoringFormulas)
      .values(data)
      .returning();
    return results[0];
  }

  async update(
    id: string,
    data: Partial<NewScoringFormula>
  ): Promise<ScoringFormula | undefined> {
    const results = await this.db
      .update(scoringFormulas)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(scoringFormulas.id, id))
      .returning();
    return results[0];
  }

  async delete(id: string): Promise<boolean> {
    const results = await this.db
      .delete(scoringFormulas)
      .where(eq(scoringFormulas.id, id))
      .returning();
    return results.length > 0;
  }
}
```

**Step 2: Commit**

```bash
git add app/repositories/scoring-formula.repository.ts
git commit -m "feat: add scoring formula repository"
```

---

### Task 10: Create Job Opening Repository

**Files:**
- Create: `app/repositories/job-opening.repository.ts`

**Step 1: Create the repository**

Create `app/repositories/job-opening.repository.ts`:
```typescript
import { eq, desc } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import {
  jobOpenings,
  type JobOpening,
  type NewJobOpening,
} from "~/db/schema";
import type * as schema from "~/db/schema";

export class JobOpeningRepository {
  constructor(private db: PostgresJsDatabase<typeof schema>) {}

  async findAll(): Promise<JobOpening[]> {
    return this.db
      .select()
      .from(jobOpenings)
      .orderBy(desc(jobOpenings.dateAdded));
  }

  async findById(id: string): Promise<JobOpening | undefined> {
    const results = await this.db
      .select()
      .from(jobOpenings)
      .where(eq(jobOpenings.id, id));
    return results[0];
  }

  async create(data: NewJobOpening): Promise<JobOpening> {
    const results = await this.db.insert(jobOpenings).values(data).returning();
    return results[0];
  }

  async update(
    id: string,
    data: Partial<NewJobOpening>
  ): Promise<JobOpening | undefined> {
    const results = await this.db
      .update(jobOpenings)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(jobOpenings.id, id))
      .returning();
    return results[0];
  }

  async delete(id: string): Promise<boolean> {
    const results = await this.db
      .delete(jobOpenings)
      .where(eq(jobOpenings.id, id))
      .returning();
    return results.length > 0;
  }

  async updateApplicationStatus(
    id: string,
    sent: boolean,
    sentDate: string | null
  ): Promise<JobOpening | undefined> {
    const results = await this.db
      .update(jobOpenings)
      .set({
        applicationSent: sent,
        applicationSentDate: sentDate,
        updatedAt: new Date(),
      })
      .where(eq(jobOpenings.id, id))
      .returning();
    return results[0];
  }
}
```

**Step 2: Commit**

```bash
git add app/repositories/job-opening.repository.ts
git commit -m "feat: add job opening repository"
```

---

## Phase 5: Service Layer

### Task 11: Create Scoring Service with Tests

**Files:**
- Create: `app/services/scoring.service.ts`
- Create: `app/services/scoring.service.test.ts`

**Step 1: Create test file first (TDD)**

Create `app/services/scoring.service.test.ts`:
```typescript
import { describe, it, expect } from "bun:test";
import { ScoringService } from "./scoring.service";
import type { JobOpening, ScoringFormula } from "~/db/schema";

describe("ScoringService", () => {
  const service = new ScoringService();

  const createJobOpening = (ratings: Partial<JobOpening>): JobOpening =>
    ({
      id: "test-id",
      title: "Test Job",
      company: "Test Co",
      description: "Test description",
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
      ...ratings,
    }) as JobOpening;

  const createFormula = (weights: ScoringFormula["weights"]): ScoringFormula =>
    ({
      id: "formula-id",
      name: "Test Formula",
      weights,
    }) as ScoringFormula;

  describe("calculateScore", () => {
    it("should return 0 for job with no ratings", () => {
      const job = createJobOpening({});
      const formula = createFormula({
        impact: 1,
        compensation: 1,
        role: 1,
        tech: 1,
        location: 1,
        industry: 1,
        culture: 1,
        growth: 1,
        profileMatch: 1,
        companySize: 1,
        stress: 1,
      });

      const score = service.calculateScore(job, formula);
      expect(score).toBe(0);
    });

    it("should calculate weighted sum of ratings", () => {
      const job = createJobOpening({
        ratingImpact: 1,
        ratingGrowth: 1,
        ratingStress: -1,
      });
      const formula = createFormula({
        impact: 2,
        compensation: 0,
        role: 0,
        tech: 0,
        location: 0,
        industry: 0,
        culture: 0,
        growth: 3,
        profileMatch: 0,
        companySize: 0,
        stress: 1,
      });

      // (1 * 2) + (1 * 3) + (-1 * 1) = 2 + 3 - 1 = 4
      const score = service.calculateScore(job, formula);
      expect(score).toBe(4);
    });

    it("should handle all negative ratings", () => {
      const job = createJobOpening({
        ratingImpact: -1,
        ratingCompensation: -1,
      });
      const formula = createFormula({
        impact: 2,
        compensation: 2,
        role: 0,
        tech: 0,
        location: 0,
        industry: 0,
        culture: 0,
        growth: 0,
        profileMatch: 0,
        companySize: 0,
        stress: 0,
      });

      // (-1 * 2) + (-1 * 2) = -4
      const score = service.calculateScore(job, formula);
      expect(score).toBe(-4);
    });
  });

  describe("rankJobOpenings", () => {
    it("should sort jobs by score descending", () => {
      const job1 = createJobOpening({ id: "1", ratingImpact: 1 });
      const job2 = createJobOpening({ id: "2", ratingImpact: -1 });
      const job3 = createJobOpening({ id: "3", ratingImpact: 0 });

      const formula = createFormula({
        impact: 1,
        compensation: 0,
        role: 0,
        tech: 0,
        location: 0,
        industry: 0,
        culture: 0,
        growth: 0,
        profileMatch: 0,
        companySize: 0,
        stress: 0,
      });

      const ranked = service.rankJobOpenings([job1, job2, job3], formula);

      expect(ranked[0].job.id).toBe("1");
      expect(ranked[0].score).toBe(1);
      expect(ranked[1].job.id).toBe("3");
      expect(ranked[1].score).toBe(0);
      expect(ranked[2].job.id).toBe("2");
      expect(ranked[2].score).toBe(-1);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run:
```bash
bun test app/services/scoring.service.test.ts
```

Expected: FAIL - module not found or similar error.

**Step 3: Implement the service**

Create `app/services/scoring.service.ts`:
```typescript
import type { JobOpening, ScoringFormula } from "~/db/schema";

export type RankedJobOpening = {
  job: JobOpening;
  score: number;
};

const RATING_FIELDS = [
  "ratingImpact",
  "ratingCompensation",
  "ratingRole",
  "ratingTech",
  "ratingLocation",
  "ratingIndustry",
  "ratingCulture",
  "ratingGrowth",
  "ratingProfileMatch",
  "ratingCompanySize",
  "ratingStress",
] as const;

const WEIGHT_KEYS = [
  "impact",
  "compensation",
  "role",
  "tech",
  "location",
  "industry",
  "culture",
  "growth",
  "profileMatch",
  "companySize",
  "stress",
] as const;

export class ScoringService {
  calculateScore(job: JobOpening, formula: ScoringFormula): number {
    let score = 0;

    for (let i = 0; i < RATING_FIELDS.length; i++) {
      const ratingField = RATING_FIELDS[i];
      const weightKey = WEIGHT_KEYS[i];
      const rating = job[ratingField];
      const weight = formula.weights[weightKey];

      if (rating !== null && rating !== undefined) {
        score += rating * weight;
      }
    }

    return score;
  }

  rankJobOpenings(
    jobs: JobOpening[],
    formula: ScoringFormula
  ): RankedJobOpening[] {
    return jobs
      .map((job) => ({
        job,
        score: this.calculateScore(job, formula),
      }))
      .sort((a, b) => b.score - a.score);
  }
}
```

**Step 4: Run test to verify it passes**

Run:
```bash
bun test app/services/scoring.service.test.ts
```

Expected: All tests PASS.

**Step 5: Commit**

```bash
git add app/services/
git commit -m "feat: add scoring service with tests"
```

---

### Task 12: Create Service Singletons

**Files:**
- Create: `app/services/index.server.ts`
- Create: `app/repositories/index.server.ts`

**Step 1: Create repository singletons**

Create `app/repositories/index.server.ts`:
```typescript
import { db } from "~/db/db.server";
import { JobOpeningRepository } from "./job-opening.repository";
import { ScoringFormulaRepository } from "./scoring-formula.repository";

export const jobOpeningRepository = new JobOpeningRepository(db);
export const scoringFormulaRepository = new ScoringFormulaRepository(db);
```

**Step 2: Create service singletons**

Create `app/services/index.server.ts`:
```typescript
import { ScoringService } from "./scoring.service";

export const scoringService = new ScoringService();

// Re-export repositories for convenience
export { jobOpeningRepository, scoringFormulaRepository } from "~/repositories/index.server";
```

**Step 3: Commit**

```bash
git add app/services/index.server.ts app/repositories/index.server.ts
git commit -m "feat: add singleton exports for services and repositories"
```

---

## Phase 6: UI Components

### Task 13: Install Required shadcn/ui Components

**Files:**
- Create: `app/components/ui/*.tsx`

**Step 1: Install components**

Run:
```bash
bunx shadcn@latest add button
bunx shadcn@latest add input
bunx shadcn@latest add label
bunx shadcn@latest add textarea
bunx shadcn@latest add select
bunx shadcn@latest add table
bunx shadcn@latest add dialog
bunx shadcn@latest add card
bunx shadcn@latest add radio-group
bunx shadcn@latest add form
bunx shadcn@latest add badge
```

Accept defaults when prompted.

**Step 2: Verify components installed**

Run:
```bash
ls app/components/ui/
```

Expected: Should list button.tsx, input.tsx, table.tsx, etc.

**Step 3: Commit**

```bash
git add app/components/ui/
git commit -m "feat: add shadcn/ui components"
```

---

### Task 14: Create Rating Input Component

**Files:**
- Create: `app/components/rating-input.tsx`

**Step 1: Create the component**

Create `app/components/rating-input.tsx`:
```typescript
import { Label } from "~/components/ui/label";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";

type RatingInputProps = {
  name: string;
  label: string;
  defaultValue?: number | null;
};

export function RatingInput({ name, label, defaultValue }: RatingInputProps) {
  const value = defaultValue === null || defaultValue === undefined
    ? ""
    : String(defaultValue);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <RadioGroup name={name} defaultValue={value} className="flex gap-4">
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="1" id={`${name}-good`} />
          <Label htmlFor={`${name}-good`} className="font-normal text-green-600">
            Good (+1)
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="0" id={`${name}-medium`} />
          <Label htmlFor={`${name}-medium`} className="font-normal text-yellow-600">
            Medium (0)
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="-1" id={`${name}-bad`} />
          <Label htmlFor={`${name}-bad`} className="font-normal text-red-600">
            Bad (-1)
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="" id={`${name}-unrated`} />
          <Label htmlFor={`${name}-unrated`} className="font-normal text-gray-400">
            Not Rated
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add app/components/rating-input.tsx
git commit -m "feat: add rating input component"
```

---

### Task 15: Create Job Form Component

**Files:**
- Create: `app/components/job-form.tsx`

**Step 1: Create the component**

Create `app/components/job-form.tsx`:
```typescript
import { Form } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { RatingInput } from "~/components/rating-input";
import type { JobOpening } from "~/db/schema";

type JobFormProps = {
  job?: JobOpening;
  errors?: Record<string, string>;
};

const CURRENCIES = ["EUR", "USD", "GBP", "CHF"];

const RATING_CRITERIA = [
  { name: "ratingImpact", label: "Positive Impact" },
  { name: "ratingCompensation", label: "Compensation" },
  { name: "ratingRole", label: "Role / Level of Responsibility" },
  { name: "ratingTech", label: "Technologies" },
  { name: "ratingLocation", label: "Remote / Hybrid / Office" },
  { name: "ratingIndustry", label: "Industry" },
  { name: "ratingCulture", label: "Engineering Culture" },
  { name: "ratingGrowth", label: "Growth Potential" },
  { name: "ratingProfileMatch", label: "Profile Match" },
  { name: "ratingCompanySize", label: "Company Size" },
  { name: "ratingStress", label: "Stress Factor" },
];

export function JobForm({ job, errors }: JobFormProps) {
  return (
    <Form method="post" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Job Title *</Label>
              <Input
                id="title"
                name="title"
                defaultValue={job?.title}
                required
              />
              {errors?.title && (
                <p className="text-sm text-red-500">{errors.title}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company *</Label>
              <Input
                id="company"
                name="company"
                defaultValue={job?.company}
                required
              />
              {errors?.company && (
                <p className="text-sm text-red-500">{errors.company}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              name="description"
              rows={6}
              defaultValue={job?.description}
              required
            />
            {errors?.description && (
              <p className="text-sm text-red-500">{errors.description}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="jobLocation">Location</Label>
              <Input
                id="jobLocation"
                name="jobLocation"
                placeholder="e.g., Berlin, Germany"
                defaultValue={job?.jobLocation ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postingUrl">Posting URL</Label>
              <Input
                id="postingUrl"
                name="postingUrl"
                type="url"
                defaultValue={job?.postingUrl ?? ""}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateOpened">Date Opened</Label>
            <Input
              id="dateOpened"
              name="dateOpened"
              type="date"
              defaultValue={job?.dateOpened ?? ""}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Compensation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="salaryAmount">Annual Gross Salary</Label>
              <Input
                id="salaryAmount"
                name="salaryAmount"
                type="number"
                placeholder="e.g., 80000"
                defaultValue={job?.salaryAmount ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salaryCurrency">Currency</Label>
              <Select name="salaryCurrency" defaultValue={job?.salaryCurrency ?? ""}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((currency) => (
                    <SelectItem key={currency} value={currency}>
                      {currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pensionScheme">Pension Scheme</Label>
              <Input
                id="pensionScheme"
                name="pensionScheme"
                placeholder="e.g., 5% match"
                defaultValue={job?.pensionScheme ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="healthInsurance">Health Insurance</Label>
              <Input
                id="healthInsurance"
                name="healthInsurance"
                defaultValue={job?.healthInsurance ?? ""}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stockOptions">Stock Options</Label>
              <Input
                id="stockOptions"
                name="stockOptions"
                defaultValue={job?.stockOptions ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vacationDays">Vacation Days</Label>
              <Input
                id="vacationDays"
                name="vacationDays"
                type="number"
                defaultValue={job?.vacationDays ?? ""}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Work Location</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="workLocation">Work Type</Label>
            <Select name="workLocation" defaultValue={job?.workLocation ?? ""}>
              <SelectTrigger>
                <SelectValue placeholder="Select work type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="remote">Remote</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
                <SelectItem value="office">Office</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="officeDistanceKm">Office Distance (km)</Label>
              <Input
                id="officeDistanceKm"
                name="officeDistanceKm"
                type="number"
                defaultValue={job?.officeDistanceKm ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wfhDaysPerWeek">WFH Days per Week</Label>
              <Input
                id="wfhDaysPerWeek"
                name="wfhDaysPerWeek"
                type="number"
                min="0"
                max="7"
                defaultValue={job?.wfhDaysPerWeek ?? ""}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ratings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {RATING_CRITERIA.map(({ name, label }) => (
            <RatingInput
              key={name}
              name={name}
              label={label}
              defaultValue={job?.[name as keyof JobOpening] as number | null}
            />
          ))}
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button type="submit">{job ? "Update" : "Create"} Job Opening</Button>
        <Button type="button" variant="outline" onClick={() => history.back()}>
          Cancel
        </Button>
      </div>
    </Form>
  );
}
```

**Step 2: Commit**

```bash
git add app/components/job-form.tsx
git commit -m "feat: add job form component"
```

---

### Task 16: Create Formula Form Component

**Files:**
- Create: `app/components/formula-form.tsx`

**Step 1: Create the component**

Create `app/components/formula-form.tsx`:
```typescript
import { Form } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import type { ScoringFormula } from "~/db/schema";

type FormulaFormProps = {
  formula?: ScoringFormula;
  errors?: Record<string, string>;
};

const WEIGHT_FIELDS = [
  { key: "impact", label: "Positive Impact" },
  { key: "compensation", label: "Compensation" },
  { key: "role", label: "Role / Level of Responsibility" },
  { key: "tech", label: "Technologies" },
  { key: "location", label: "Remote / Hybrid / Office" },
  { key: "industry", label: "Industry" },
  { key: "culture", label: "Engineering Culture" },
  { key: "growth", label: "Growth Potential" },
  { key: "profileMatch", label: "Profile Match" },
  { key: "companySize", label: "Company Size" },
  { key: "stress", label: "Stress Factor" },
];

export function FormulaForm({ formula, errors }: FormulaFormProps) {
  return (
    <Form method="post" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Formula Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Formula Name *</Label>
            <Input
              id="name"
              name="name"
              defaultValue={formula?.name}
              placeholder="e.g., Professional Growth"
              required
            />
            {errors?.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Criterion Weights</CardTitle>
          <p className="text-sm text-muted-foreground">
            Set the weight (0 or higher) for each criterion. Higher weights mean the criterion has more impact on the final score.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {WEIGHT_FIELDS.map(({ key, label }) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={`weights.${key}`}>{label}</Label>
                <Input
                  id={`weights.${key}`}
                  name={`weights.${key}`}
                  type="number"
                  min="0"
                  defaultValue={formula?.weights?.[key as keyof typeof formula.weights] ?? 1}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button type="submit">{formula ? "Update" : "Create"} Formula</Button>
        <Button type="button" variant="outline" onClick={() => history.back()}>
          Cancel
        </Button>
      </div>
    </Form>
  );
}
```

**Step 2: Commit**

```bash
git add app/components/formula-form.tsx
git commit -m "feat: add formula form component"
```

---

### Task 17: Create Job Table Component

**Files:**
- Create: `app/components/job-table.tsx`

**Step 1: Create the component**

Create `app/components/job-table.tsx`:
```typescript
import { Link } from "@remix-run/react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import type { RankedJobOpening } from "~/services/scoring.service";

type JobTableProps = {
  jobs: RankedJobOpening[];
  onMarkApplied: (jobId: string) => void;
};

export function JobTable({ jobs, onMarkApplied }: JobTableProps) {
  const formatDate = (date: Date | string | null) => {
    if (!date) return "-";
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString();
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Company</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Date Added</TableHead>
          <TableHead className="text-right">Score</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {jobs.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="text-center text-muted-foreground">
              No job openings yet. Add one to get started.
            </TableCell>
          </TableRow>
        ) : (
          jobs.map(({ job, score }) => (
            <TableRow key={job.id}>
              <TableCell className="font-medium">{job.title}</TableCell>
              <TableCell>{job.company}</TableCell>
              <TableCell>{job.jobLocation || "-"}</TableCell>
              <TableCell>{formatDate(job.dateAdded)}</TableCell>
              <TableCell className="text-right font-mono">{score}</TableCell>
              <TableCell>
                {job.applicationSent ? (
                  <Badge variant="secondary">
                    Applied {job.applicationSentDate ? formatDate(job.applicationSentDate) : ""}
                  </Badge>
                ) : (
                  <Badge variant="outline">Not Applied</Badge>
                )}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button asChild variant="ghost" size="sm">
                    <Link to={`/jobs/${job.id}/edit`}>Edit</Link>
                  </Button>
                  {!job.applicationSent && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onMarkApplied(job.id)}
                    >
                      Mark Applied
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
```

**Step 2: Commit**

```bash
git add app/components/job-table.tsx
git commit -m "feat: add job table component"
```

---

### Task 18: Create Application Status Dialog Component

**Files:**
- Create: `app/components/application-dialog.tsx`

**Step 1: Create the component**

Create `app/components/application-dialog.tsx`:
```typescript
import { Form } from "@remix-run/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

type ApplicationDialogProps = {
  jobId: string | null;
  jobTitle?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ApplicationDialog({
  jobId,
  jobTitle,
  open,
  onOpenChange,
}: ApplicationDialogProps) {
  const today = new Date().toISOString().split("T")[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark Application Sent</DialogTitle>
        </DialogHeader>
        <Form method="post" action="/?index">
          <input type="hidden" name="intent" value="markApplied" />
          <input type="hidden" name="jobId" value={jobId ?? ""} />

          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Mark application as sent for: <strong>{jobTitle}</strong>
            </p>
            <div className="space-y-2">
              <Label htmlFor="applicationSentDate">Application Date</Label>
              <Input
                id="applicationSentDate"
                name="applicationSentDate"
                type="date"
                defaultValue={today}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" onClick={() => onOpenChange(false)}>
              Confirm
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

**Step 2: Commit**

```bash
git add app/components/application-dialog.tsx
git commit -m "feat: add application status dialog component"
```

---

## Phase 7: Routes

### Task 19: Create Main Page Route

**Files:**
- Modify: `app/routes/_index.tsx`

**Step 1: Implement the main page**

Replace contents of `app/routes/_index.tsx`:
```typescript
import { useState } from "react";
import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link, Form } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { JobTable } from "~/components/job-table";
import { ApplicationDialog } from "~/components/application-dialog";
import {
  jobOpeningRepository,
  scoringFormulaRepository,
  scoringService,
} from "~/services/index.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const formulaId = url.searchParams.get("formula");
  const sortBy = url.searchParams.get("sort") || "score";

  const [jobs, formulas] = await Promise.all([
    jobOpeningRepository.findAll(),
    scoringFormulaRepository.findAll(),
  ]);

  const selectedFormula = formulaId
    ? formulas.find((f) => f.id === formulaId)
    : formulas[0];

  let rankedJobs = selectedFormula
    ? scoringService.rankJobOpenings(jobs, selectedFormula)
    : jobs.map((job) => ({ job, score: 0 }));

  if (sortBy === "date") {
    rankedJobs = [...rankedJobs].sort(
      (a, b) =>
        new Date(b.job.dateAdded).getTime() - new Date(a.job.dateAdded).getTime()
    );
  }

  return json({
    jobs: rankedJobs,
    formulas,
    selectedFormulaId: selectedFormula?.id ?? null,
    sortBy,
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "markApplied") {
    const jobId = formData.get("jobId") as string;
    const applicationSentDate = formData.get("applicationSentDate") as string;

    await jobOpeningRepository.updateApplicationStatus(
      jobId,
      true,
      applicationSentDate
    );
  }

  return json({ success: true });
}

export default function Index() {
  const { jobs, formulas, selectedFormulaId, sortBy } = useLoaderData<typeof loader>();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const selectedJob = selectedJobId
    ? jobs.find((j) => j.job.id === selectedJobId)?.job
    : null;

  const handleMarkApplied = (jobId: string) => {
    setSelectedJobId(jobId);
    setDialogOpen(true);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Job Openings</h1>
        <div className="flex gap-4">
          <Button asChild variant="outline">
            <Link to="/formulas">Manage Formulas</Link>
          </Button>
          <Button asChild>
            <Link to="/jobs/new">Add Job</Link>
          </Button>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <Form method="get" className="flex gap-4">
          <input type="hidden" name="sort" value={sortBy} />
          <Select name="formula" defaultValue={selectedFormulaId ?? ""}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select formula" />
            </SelectTrigger>
            <SelectContent>
              {formulas.map((formula) => (
                <SelectItem key={formula.id} value={formula.id}>
                  {formula.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="submit" variant="secondary">
            Apply
          </Button>
        </Form>

        <Form method="get" className="flex gap-4">
          <input type="hidden" name="formula" value={selectedFormulaId ?? ""} />
          <Select name="sort" defaultValue={sortBy}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="score">Sort by Score</SelectItem>
              <SelectItem value="date">Sort by Date</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit" variant="secondary">
            Sort
          </Button>
        </Form>
      </div>

      {formulas.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
          <p className="text-yellow-800">
            No scoring formulas yet.{" "}
            <Link to="/formulas/new" className="underline">
              Create one
            </Link>{" "}
            to start ranking jobs.
          </p>
        </div>
      )}

      <JobTable jobs={jobs} onMarkApplied={handleMarkApplied} />

      <ApplicationDialog
        jobId={selectedJobId}
        jobTitle={selectedJob?.title}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add app/routes/_index.tsx
git commit -m "feat: implement main page with job listing and scoring"
```

---

### Task 20: Create New Job Route

**Files:**
- Create: `app/routes/jobs.new.tsx`

**Step 1: Create the route**

Create `app/routes/jobs.new.tsx`:
```typescript
import { json, redirect, type ActionFunctionArgs } from "@remix-run/node";
import { useActionData } from "@remix-run/react";
import { JobForm } from "~/components/job-form";
import { jobOpeningSchema } from "~/schemas/job-opening.schema";
import { jobOpeningRepository } from "~/services/index.server";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const data = Object.fromEntries(formData);

  const result = jobOpeningSchema.safeParse(data);

  if (!result.success) {
    const errors: Record<string, string> = {};
    result.error.issues.forEach((issue) => {
      errors[issue.path[0] as string] = issue.message;
    });
    return json({ errors }, { status: 400 });
  }

  const jobData = {
    ...result.data,
    jobLocation: result.data.jobLocation || null,
    postingUrl: result.data.postingUrl || null,
    dateOpened: result.data.dateOpened || null,
    salaryAmount: result.data.salaryAmount || null,
    salaryCurrency: result.data.salaryCurrency || null,
    pensionScheme: result.data.pensionScheme || null,
    healthInsurance: result.data.healthInsurance || null,
    stockOptions: result.data.stockOptions || null,
    vacationDays: result.data.vacationDays || null,
    workLocation: result.data.workLocation || null,
    officeDistanceKm: result.data.officeDistanceKm || null,
    wfhDaysPerWeek: result.data.wfhDaysPerWeek || null,
  };

  await jobOpeningRepository.create(jobData);

  return redirect("/");
}

export default function NewJob() {
  const actionData = useActionData<typeof action>();

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">Add Job Opening</h1>
      <JobForm errors={actionData?.errors} />
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add app/routes/jobs.new.tsx
git commit -m "feat: add new job route"
```

---

### Task 21: Create Edit Job Route

**Files:**
- Create: `app/routes/jobs.$id.edit.tsx`

**Step 1: Create the route**

Create `app/routes/jobs.$id.edit.tsx`:
```typescript
import {
  json,
  redirect,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
} from "@remix-run/node";
import { useLoaderData, useActionData, Form } from "@remix-run/react";
import { JobForm } from "~/components/job-form";
import { Button } from "~/components/ui/button";
import { jobOpeningSchema } from "~/schemas/job-opening.schema";
import { jobOpeningRepository } from "~/services/index.server";

export async function loader({ params }: LoaderFunctionArgs) {
  const job = await jobOpeningRepository.findById(params.id!);

  if (!job) {
    throw new Response("Not Found", { status: 404 });
  }

  return json({ job });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "delete") {
    await jobOpeningRepository.delete(params.id!);
    return redirect("/");
  }

  const data = Object.fromEntries(formData);
  const result = jobOpeningSchema.safeParse(data);

  if (!result.success) {
    const errors: Record<string, string> = {};
    result.error.issues.forEach((issue) => {
      errors[issue.path[0] as string] = issue.message;
    });
    return json({ errors }, { status: 400 });
  }

  const jobData = {
    ...result.data,
    jobLocation: result.data.jobLocation || null,
    postingUrl: result.data.postingUrl || null,
    dateOpened: result.data.dateOpened || null,
    salaryAmount: result.data.salaryAmount || null,
    salaryCurrency: result.data.salaryCurrency || null,
    pensionScheme: result.data.pensionScheme || null,
    healthInsurance: result.data.healthInsurance || null,
    stockOptions: result.data.stockOptions || null,
    vacationDays: result.data.vacationDays || null,
    workLocation: result.data.workLocation || null,
    officeDistanceKm: result.data.officeDistanceKm || null,
    wfhDaysPerWeek: result.data.wfhDaysPerWeek || null,
  };

  await jobOpeningRepository.update(params.id!, jobData);

  return redirect("/");
}

export default function EditJob() {
  const { job } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Edit Job Opening</h1>
        <Form method="post">
          <input type="hidden" name="intent" value="delete" />
          <Button type="submit" variant="destructive">
            Delete
          </Button>
        </Form>
      </div>
      <JobForm job={job} errors={actionData?.errors} />
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add app/routes/jobs.\$id.edit.tsx
git commit -m "feat: add edit job route"
```

---

### Task 22: Create Formula List Route

**Files:**
- Create: `app/routes/formulas._index.tsx`

**Step 1: Create the route**

Create `app/routes/formulas._index.tsx`:
```typescript
import { json } from "@remix-run/node";
import { useLoaderData, Link, Form } from "@remix-run/react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Button } from "~/components/ui/button";
import { scoringFormulaRepository } from "~/services/index.server";

export async function loader() {
  const formulas = await scoringFormulaRepository.findAll();
  return json({ formulas });
}

export default function FormulasList() {
  const { formulas } = useLoaderData<typeof loader>();

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Scoring Formulas</h1>
        <div className="flex gap-4">
          <Button asChild variant="outline">
            <Link to="/">Back to Jobs</Link>
          </Button>
          <Button asChild>
            <Link to="/formulas/new">Add Formula</Link>
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {formulas.length === 0 ? (
            <TableRow>
              <TableCell colSpan={2} className="text-center text-muted-foreground">
                No formulas yet. Create one to start ranking jobs.
              </TableCell>
            </TableRow>
          ) : (
            formulas.map((formula) => (
              <TableRow key={formula.id}>
                <TableCell className="font-medium">{formula.name}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button asChild variant="ghost" size="sm">
                      <Link to={`/formulas/${formula.id}/edit`}>Edit</Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add app/routes/formulas._index.tsx
git commit -m "feat: add formulas list route"
```

---

### Task 23: Create New Formula Route

**Files:**
- Create: `app/routes/formulas.new.tsx`

**Step 1: Create the route**

Create `app/routes/formulas.new.tsx`:
```typescript
import { json, redirect, type ActionFunctionArgs } from "@remix-run/node";
import { useActionData } from "@remix-run/react";
import { FormulaForm } from "~/components/formula-form";
import { scoringFormulaSchema } from "~/schemas/scoring-formula.schema";
import { scoringFormulaRepository } from "~/services/index.server";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();

  const data = {
    name: formData.get("name"),
    weights: {
      impact: formData.get("weights.impact"),
      compensation: formData.get("weights.compensation"),
      role: formData.get("weights.role"),
      tech: formData.get("weights.tech"),
      location: formData.get("weights.location"),
      industry: formData.get("weights.industry"),
      culture: formData.get("weights.culture"),
      growth: formData.get("weights.growth"),
      profileMatch: formData.get("weights.profileMatch"),
      companySize: formData.get("weights.companySize"),
      stress: formData.get("weights.stress"),
    },
  };

  const result = scoringFormulaSchema.safeParse(data);

  if (!result.success) {
    const errors: Record<string, string> = {};
    result.error.issues.forEach((issue) => {
      errors[issue.path.join(".")] = issue.message;
    });
    return json({ errors }, { status: 400 });
  }

  await scoringFormulaRepository.create(result.data);

  return redirect("/formulas");
}

export default function NewFormula() {
  const actionData = useActionData<typeof action>();

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">Create Scoring Formula</h1>
      <FormulaForm errors={actionData?.errors} />
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add app/routes/formulas.new.tsx
git commit -m "feat: add new formula route"
```

---

### Task 24: Create Edit Formula Route

**Files:**
- Create: `app/routes/formulas.$id.edit.tsx`

**Step 1: Create the route**

Create `app/routes/formulas.$id.edit.tsx`:
```typescript
import {
  json,
  redirect,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
} from "@remix-run/node";
import { useLoaderData, useActionData, Form } from "@remix-run/react";
import { FormulaForm } from "~/components/formula-form";
import { Button } from "~/components/ui/button";
import { scoringFormulaSchema } from "~/schemas/scoring-formula.schema";
import { scoringFormulaRepository } from "~/services/index.server";

export async function loader({ params }: LoaderFunctionArgs) {
  const formula = await scoringFormulaRepository.findById(params.id!);

  if (!formula) {
    throw new Response("Not Found", { status: 404 });
  }

  return json({ formula });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "delete") {
    await scoringFormulaRepository.delete(params.id!);
    return redirect("/formulas");
  }

  const data = {
    name: formData.get("name"),
    weights: {
      impact: formData.get("weights.impact"),
      compensation: formData.get("weights.compensation"),
      role: formData.get("weights.role"),
      tech: formData.get("weights.tech"),
      location: formData.get("weights.location"),
      industry: formData.get("weights.industry"),
      culture: formData.get("weights.culture"),
      growth: formData.get("weights.growth"),
      profileMatch: formData.get("weights.profileMatch"),
      companySize: formData.get("weights.companySize"),
      stress: formData.get("weights.stress"),
    },
  };

  const result = scoringFormulaSchema.safeParse(data);

  if (!result.success) {
    const errors: Record<string, string> = {};
    result.error.issues.forEach((issue) => {
      errors[issue.path.join(".")] = issue.message;
    });
    return json({ errors }, { status: 400 });
  }

  await scoringFormulaRepository.update(params.id!, result.data);

  return redirect("/formulas");
}

export default function EditFormula() {
  const { formula } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Edit Scoring Formula</h1>
        <Form method="post">
          <input type="hidden" name="intent" value="delete" />
          <Button type="submit" variant="destructive">
            Delete
          </Button>
        </Form>
      </div>
      <FormulaForm formula={formula} errors={actionData?.errors} />
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add app/routes/formulas.\$id.edit.tsx
git commit -m "feat: add edit formula route"
```

---

## Phase 8: Final Setup

### Task 25: Update Root Layout

**Files:**
- Modify: `app/root.tsx`

**Step 1: Update root.tsx for proper styling**

Read the current `app/root.tsx` and ensure it imports the tailwind styles properly. If using the default Remix template, it should already be set up. Verify the file includes proper html/body structure with the tailwind classes.

**Step 2: Commit if changes were made**

```bash
git add app/root.tsx
git commit -m "chore: update root layout" || echo "No changes needed"
```

---

### Task 26: Verify Application Works

**Step 1: Ensure database is running**

Run:
```bash
docker compose up -d
```

**Step 2: Run migrations**

Run:
```bash
bunx drizzle-kit migrate
```

**Step 3: Start the development server**

Run:
```bash
bun run dev
```

**Step 4: Manual verification checklist**

Open http://localhost:5173 and verify:
- [ ] Main page loads without errors
- [ ] Can navigate to "Add Formula" and create a formula
- [ ] Can navigate to "Add Job" and create a job opening
- [ ] Jobs appear in the table with calculated scores
- [ ] Can change scoring formula and see scores update
- [ ] Can sort by score or date
- [ ] Can mark a job as applied
- [ ] Can edit and delete jobs
- [ ] Can edit and delete formulas

**Step 5: Stop server and commit any fixes**

Press Ctrl+C to stop the server, then:
```bash
git add -A
git commit -m "chore: final fixes from manual testing" || echo "No fixes needed"
```

---

### Task 27: Add README

**Files:**
- Create: `README.md`

**Step 1: Create README**

Create `README.md`:
```markdown
# Job Tracker

A single-user application for ranking and tracking job openings using weighted scoring formulas.

## Prerequisites

- [Bun](https://bun.sh/) runtime
- [Docker](https://www.docker.com/) for PostgreSQL

## Setup

1. Start the database:
   ```bash
   docker compose up -d
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Run migrations:
   ```bash
   bunx drizzle-kit migrate
   ```

4. Start the development server:
   ```bash
   bun run dev
   ```

5. Open http://localhost:5173

## Features

- Add and manage job openings with detailed information
- Create custom scoring formulas with weighted criteria
- Rank jobs based on selected formula
- Track application status

## Tech Stack

- Bun + TypeScript
- Remix
- PostgreSQL + Drizzle ORM
- shadcn/ui + Tailwind CSS
```

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README"
```

---

## Summary

This implementation plan covers:

1. **Phase 1**: Project initialization with Bun, Remix, and dependencies
2. **Phase 2**: Database schema with Drizzle ORM
3. **Phase 3**: Shared Zod validation schemas
4. **Phase 4**: Repository layer for data access
5. **Phase 5**: Service layer with scoring logic (TDD)
6. **Phase 6**: UI components with shadcn/ui
7. **Phase 7**: Remix routes for all screens
8. **Phase 8**: Final setup and verification

Total: 27 tasks across 8 phases.
