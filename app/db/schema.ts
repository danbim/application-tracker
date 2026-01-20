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
  applicationSent: boolean('application_sent').default(false).notNull(),
  applicationSentDate: date('application_sent_date'),

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

export type ScoringFormula = typeof scoringFormulas.$inferSelect
export type NewScoringFormula = typeof scoringFormulas.$inferInsert
export type JobOpening = typeof jobOpenings.$inferSelect
export type NewJobOpening = typeof jobOpenings.$inferInsert
