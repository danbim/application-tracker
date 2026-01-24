import { db } from '~/db/db.server'
import { JobNoteRepository } from './job-note.repository'
import { JobOpeningRepository } from './job-opening.repository'
import { ScoringFormulaRepository } from './scoring-formula.repository'

export const jobOpeningRepository = new JobOpeningRepository(db)
export const scoringFormulaRepository = new ScoringFormulaRepository(db)
export const jobNoteRepository = new JobNoteRepository(db)
