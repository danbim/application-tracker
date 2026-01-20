import { z } from 'zod'

export const weightsSchema = z.object({
  impact: z.coerce.number().int(),
  compensation: z.coerce.number().int(),
  role: z.coerce.number().int(),
  tech: z.coerce.number().int(),
  location: z.coerce.number().int(),
  industry: z.coerce.number().int(),
  culture: z.coerce.number().int(),
  growth: z.coerce.number().int(),
  profileMatch: z.coerce.number().int(),
  companySize: z.coerce.number().int(),
  stress: z.coerce.number().int(),
  jobSecurity: z.coerce.number().int(),
  wowBoost: z.coerce.number().int(),
})

export const scoringFormulaSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  weights: weightsSchema,
})

export type ScoringFormulaInput = z.infer<typeof scoringFormulaSchema>
export type WeightsInput = z.infer<typeof weightsSchema>
