import { db } from '~/db/db.server'
import { JobNoteRepository } from './job-note.repository'
import { JobOpeningRepository } from './job-opening.repository'
import { JobPostingSiteRepository } from './job-posting-site.repository'
import { ScoringFormulaRepository } from './scoring-formula.repository'
import { TalentPoolRepository } from './talent-pool.repository'

export const jobOpeningRepository = new JobOpeningRepository(db)
export const scoringFormulaRepository = new ScoringFormulaRepository(db)
export const jobNoteRepository = new JobNoteRepository(db)
export const jobPostingSiteRepository = new JobPostingSiteRepository(db)
export const talentPoolRepository = new TalentPoolRepository(db)
