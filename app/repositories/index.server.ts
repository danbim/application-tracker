import { db } from '~/db/db.server'
import { JobOpeningRepository } from './job-opening.repository'
import { ScoringFormulaRepository } from './scoring-formula.repository'

export const jobOpeningRepository = new JobOpeningRepository(db)
export const scoringFormulaRepository = new ScoringFormulaRepository(db)
