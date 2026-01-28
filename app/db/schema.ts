import {
  boolean,
  date,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

export const workLocationEnum = pgEnum('work_location', [
  'remote',
  'hybrid',
  'office',
])

export const jobTrackEnum = pgEnum('job_track', ['engineering', 'management'])

export const applicationStatusEnum = pgEnum('application_status', [
  'not_applied',
  'applied',
  'interviewing',
  'offer',
  'rejected',
  'ghosted',
  'dumped',
])

export type ApplicationStatus =
  (typeof applicationStatusEnum.enumValues)[number]

export const ACTIVE_STATUSES: ApplicationStatus[] = [
  'not_applied',
  'applied',
  'interviewing',
  'offer',
]

export const scoringFormulas = pgTable('scoring_formulas', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  weights: jsonb('weights').notNull().$type<{
    impact: number
    compensation: number
    role: number
    tech: number
    location: number
    industry: number
    culture: number
    growth: number
    profileMatch: number
    companySize: number
    stress: number
    jobSecurity: number
    wowBoost: number
  }>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const jobOpenings = pgTable('job_openings', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  company: varchar('company', { length: 255 }).notNull(),
  description: text('description').notNull(),
  jobLocation: varchar('job_location', { length: 255 }),
  country: varchar('country', { length: 2 }),
  postingUrl: varchar('posting_url', { length: 2048 }),
  dateOpened: date('date_opened'),
  dateAdded: timestamp('date_added').defaultNow().notNull(),
  wow: boolean('wow').default(false).notNull(),
  track: jobTrackEnum('track'),
  status: applicationStatusEnum('status').default('not_applied').notNull(),
  appliedAt: timestamp('applied_at'),
  interviewingAt: timestamp('interviewing_at'),
  offerAt: timestamp('offer_at'),
  rejectedAt: timestamp('rejected_at'),
  ghostedAt: timestamp('ghosted_at'),
  dumpedAt: timestamp('dumped_at'),

  // Compensation
  salaryMin: integer('salary_min'),
  salaryMax: integer('salary_max'),
  salaryCurrency: varchar('salary_currency', { length: 3 }),
  pensionScheme: text('pension_scheme'),
  healthInsurance: text('health_insurance'),
  stockOptions: text('stock_options'),
  vacationDays: integer('vacation_days'),

  // Work location metadata
  workLocation: workLocationEnum('work_location'),
  officeDistanceKm: integer('office_distance_km'),
  wfhDaysPerWeek: integer('wfh_days_per_week'),

  // Ratings (-1, 0, 1, or null)
  ratingImpact: integer('rating_impact'),
  ratingCompensation: integer('rating_compensation'),
  ratingRole: integer('rating_role'),
  ratingTech: integer('rating_tech'),
  ratingLocation: integer('rating_location'),
  ratingIndustry: integer('rating_industry'),
  ratingCulture: integer('rating_culture'),
  ratingGrowth: integer('rating_growth'),
  ratingProfileMatch: integer('rating_profile_match'),
  ratingCompanySize: integer('rating_company_size'),
  ratingStress: integer('rating_stress'),
  ratingJobSecurity: integer('rating_job_security'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const jobNotes = pgTable('job_notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  jobOpeningId: uuid('job_opening_id')
    .notNull()
    .references(() => jobOpenings.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export type ScoringFormula = typeof scoringFormulas.$inferSelect
export type NewScoringFormula = typeof scoringFormulas.$inferInsert
export type JobOpening = typeof jobOpenings.$inferSelect
export type NewJobOpening = typeof jobOpenings.$inferInsert
export type JobNote = typeof jobNotes.$inferSelect
export type NewJobNote = typeof jobNotes.$inferInsert

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

export const talentPoolStatusEnum = pgEnum('talent_pool_status', [
  'not_submitted',
  'submitted',
])

export type TalentPoolStatus = (typeof talentPoolStatusEnum.enumValues)[number]

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
