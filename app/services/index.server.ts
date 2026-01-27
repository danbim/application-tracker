import { jobPostingSiteRepository } from '~/repositories/index.server'
import { JobPostingSiteService } from './job-posting-site.service'
import { ScoringService } from './scoring.service'

export const scoringService = new ScoringService()
export const jobPostingSiteService = new JobPostingSiteService(
  jobPostingSiteRepository,
)

// Re-export repositories for convenience
export {
  jobNoteRepository,
  jobOpeningRepository,
  scoringFormulaRepository,
} from '~/repositories/index.server'
