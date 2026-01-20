import { z } from 'zod'

const ratingSchema = z.coerce.number().int().min(-1).max(1).nullable()

export const jobOpeningSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  company: z.string().min(1, 'Company is required').max(255),
  description: z.string().min(1, 'Description is required'),
  jobLocation: z.string().max(255).optional().or(z.literal('')),
  country: z.string().length(2).optional().or(z.literal('')),
  postingUrl: z.string().url().max(2048).optional().or(z.literal('')),
  dateOpened: z.string().optional().or(z.literal('')),

  // Compensation
  salaryMin: z.coerce.number().int().positive().optional().or(z.literal('')),
  salaryMax: z.coerce.number().int().positive().optional().or(z.literal('')),
  salaryCurrency: z.string().length(3).optional().or(z.literal('')),
  pensionScheme: z.string().optional().or(z.literal('')),
  healthInsurance: z.string().optional().or(z.literal('')),
  stockOptions: z.string().optional().or(z.literal('')),
  vacationDays: z.coerce.number().int().positive().optional().or(z.literal('')),

  // Track
  track: z.enum(['engineering', 'management']).optional().or(z.literal('')),

  // Work location
  workLocation: z
    .enum(['remote', 'hybrid', 'office'])
    .optional()
    .or(z.literal('')),
  officeDistanceKm: z.coerce.number().int().min(0).optional().or(z.literal('')),
  wfhDaysPerWeek: z.coerce
    .number()
    .int()
    .min(0)
    .max(7)
    .optional()
    .or(z.literal('')),

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
  ratingJobSecurity: ratingSchema,

  // Wow factor
  wow: z.coerce.boolean().default(false),
})

export const applicationStatusSchema = z.object({
  applicationSent: z.coerce.boolean(),
  applicationSentDate: z.string().optional().or(z.literal('')),
})

export type JobOpeningInput = z.infer<typeof jobOpeningSchema>
export type ApplicationStatusInput = z.infer<typeof applicationStatusSchema>
