import { z } from 'zod'

export const talentPoolSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  url: z.string().url('Must be a valid URL'),
  status: z.enum(['not_submitted', 'submitted']).optional(),
  notes: z.string().optional(),
})

export type TalentPoolInput = z.infer<typeof talentPoolSchema>
