import { ScoringService } from './scoring.service'

export const scoringService = new ScoringService()

// Re-export repositories for convenience
export {
  jobNoteRepository,
  jobOpeningRepository,
  scoringFormulaRepository,
} from '~/repositories/index.server'
