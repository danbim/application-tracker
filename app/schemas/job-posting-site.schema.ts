import { z } from 'zod'

export const jobPostingSiteSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  url: z.string().url('Must be a valid URL'),
})

export type JobPostingSiteInput = z.infer<typeof jobPostingSiteSchema>
