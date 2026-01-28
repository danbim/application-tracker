import {
  jobPostingSiteRepository,
  talentPoolRepository,
} from '~/repositories/index.server'
import { JobPostingSiteService } from './job-posting-site.service'
import { ScoringService } from './scoring.service'
import { TalentPoolService } from './talent-pool.service'

export const scoringService = new ScoringService()
export const jobPostingSiteService = new JobPostingSiteService(
  jobPostingSiteRepository,
)
export const talentPoolService = new TalentPoolService(talentPoolRepository)

// Re-export repositories for convenience
export {
  jobNoteRepository,
  jobOpeningRepository,
  scoringFormulaRepository,
  talentPoolRepository,
} from '~/repositories/index.server'
