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
