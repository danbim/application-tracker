import { describe, expect, it, vi, beforeEach } from 'vitest'
import { createMockJobOpening, createMockScoringFormula } from '~/test-utils'
import { loader, action } from './home'

// Mock the services
vi.mock('~/services/index.server', () => ({
  jobOpeningRepository: {
    findAll: vi.fn(),
    updateApplicationStatus: vi.fn(),
  },
  scoringFormulaRepository: {
    findAll: vi.fn(),
  },
  scoringService: {
    rankJobOpenings: vi.fn((jobs, _formula) =>
      jobs.map((job: unknown) => ({ job, score: 10 }))
    ),
  },
}))

// Import the mocked modules
import {
  jobOpeningRepository,
  scoringFormulaRepository,
  scoringService,
} from '~/services/index.server'

const mockJobRepo = vi.mocked(jobOpeningRepository)
const mockFormulaRepo = vi.mocked(scoringFormulaRepository)
const mockScoringService = vi.mocked(scoringService)

function createRequest(url: string): Request {
  return new Request(url)
}

function createFormDataRequest(data: Record<string, string>): Request {
  const formData = new FormData()
  for (const [key, value] of Object.entries(data)) {
    formData.append(key, value)
  }
  return new Request('http://localhost/?index', {
    method: 'POST',
    body: formData,
  })
}

describe('home route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('loader', () => {
    it('returns jobs and formulas from repositories', async () => {
      const mockJobs = [createMockJobOpening({ id: '1' })]
      const mockFormulas = [createMockScoringFormula({ id: 'formula-1' })]

      mockJobRepo.findAll.mockResolvedValue(mockJobs)
      mockFormulaRepo.findAll.mockResolvedValue(mockFormulas)

      const result = await loader({
        request: createRequest('http://localhost/'),
        params: {},
        context: {},
      })

      expect(mockJobRepo.findAll).toHaveBeenCalled()
      expect(mockFormulaRepo.findAll).toHaveBeenCalled()
      expect(result.jobs).toHaveLength(1)
      expect(result.formulas).toHaveLength(1)
    })

    it('uses first formula when no formula param specified', async () => {
      const mockJobs = [createMockJobOpening()]
      const mockFormulas = [
        createMockScoringFormula({ id: 'formula-1', name: 'First' }),
        createMockScoringFormula({ id: 'formula-2', name: 'Second' }),
      ]

      mockJobRepo.findAll.mockResolvedValue(mockJobs)
      mockFormulaRepo.findAll.mockResolvedValue(mockFormulas)

      const result = await loader({
        request: createRequest('http://localhost/'),
        params: {},
        context: {},
      })

      expect(result.selectedFormulaId).toBe('formula-1')
    })

    it('uses specified formula when formula param provided', async () => {
      const mockJobs = [createMockJobOpening()]
      const mockFormulas = [
        createMockScoringFormula({ id: 'formula-1', name: 'First' }),
        createMockScoringFormula({ id: 'formula-2', name: 'Second' }),
      ]

      mockJobRepo.findAll.mockResolvedValue(mockJobs)
      mockFormulaRepo.findAll.mockResolvedValue(mockFormulas)

      const result = await loader({
        request: createRequest('http://localhost/?formula=formula-2'),
        params: {},
        context: {},
      })

      expect(result.selectedFormulaId).toBe('formula-2')
    })

    it('filters jobs by country when country param provided', async () => {
      const mockJobs = [
        createMockJobOpening({ id: '1', country: 'DE' }),
        createMockJobOpening({ id: '2', country: 'GB' }),
        createMockJobOpening({ id: '3', country: 'DE' }),
      ]
      const mockFormulas = [createMockScoringFormula()]

      mockJobRepo.findAll.mockResolvedValue(mockJobs)
      mockFormulaRepo.findAll.mockResolvedValue(mockFormulas)

      const result = await loader({
        request: createRequest('http://localhost/?country=DE'),
        params: {},
        context: {},
      })

      // Only DE jobs should be passed to rankJobOpenings
      expect(mockScoringService.rankJobOpenings).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ country: 'DE' }),
        ]),
        expect.anything()
      )
      expect(result.selectedCountry).toBe('DE')
    })

    it('filters jobs by wow when wow param is true', async () => {
      const mockJobs = [
        createMockJobOpening({ id: '1', wow: true }),
        createMockJobOpening({ id: '2', wow: false }),
      ]
      const mockFormulas = [createMockScoringFormula()]

      mockJobRepo.findAll.mockResolvedValue(mockJobs)
      mockFormulaRepo.findAll.mockResolvedValue(mockFormulas)

      const result = await loader({
        request: createRequest('http://localhost/?wow=true'),
        params: {},
        context: {},
      })

      expect(result.wowFilter).toBe(true)
    })

    it('filters jobs by track when track param provided', async () => {
      const mockJobs = [
        createMockJobOpening({ id: '1', track: 'engineering' }),
        createMockJobOpening({ id: '2', track: 'management' }),
      ]
      const mockFormulas = [createMockScoringFormula()]

      mockJobRepo.findAll.mockResolvedValue(mockJobs)
      mockFormulaRepo.findAll.mockResolvedValue(mockFormulas)

      const result = await loader({
        request: createRequest('http://localhost/?track=engineering'),
        params: {},
        context: {},
      })

      expect(result.selectedTrack).toBe('engineering')
    })

    it('returns jobs with score 0 when no formulas exist', async () => {
      const mockJobs = [createMockJobOpening({ id: '1' })]

      mockJobRepo.findAll.mockResolvedValue(mockJobs)
      mockFormulaRepo.findAll.mockResolvedValue([])

      const result = await loader({
        request: createRequest('http://localhost/'),
        params: {},
        context: {},
      })

      expect(result.jobs[0].score).toBe(0)
      expect(result.selectedFormulaId).toBe(null)
    })

    it('returns available countries from jobs', async () => {
      const mockJobs = [
        createMockJobOpening({ id: '1', country: 'DE' }),
        createMockJobOpening({ id: '2', country: 'GB' }),
        createMockJobOpening({ id: '3', country: 'DE' }), // duplicate
      ]

      mockJobRepo.findAll.mockResolvedValue(mockJobs)
      mockFormulaRepo.findAll.mockResolvedValue([])

      const result = await loader({
        request: createRequest('http://localhost/'),
        params: {},
        context: {},
      })

      expect(result.availableCountries).toEqual(['DE', 'GB'])
    })

    it('returns hasWowJobs true when at least one job has wow', async () => {
      const mockJobs = [
        createMockJobOpening({ id: '1', wow: false }),
        createMockJobOpening({ id: '2', wow: true }),
      ]

      mockJobRepo.findAll.mockResolvedValue(mockJobs)
      mockFormulaRepo.findAll.mockResolvedValue([])

      const result = await loader({
        request: createRequest('http://localhost/'),
        params: {},
        context: {},
      })

      expect(result.hasWowJobs).toBe(true)
    })

    it('returns sortBy from query param', async () => {
      mockJobRepo.findAll.mockResolvedValue([])
      mockFormulaRepo.findAll.mockResolvedValue([])

      const result = await loader({
        request: createRequest('http://localhost/?sort=date'),
        params: {},
        context: {},
      })

      expect(result.sortBy).toBe('date')
    })
  })

  describe('action', () => {
    it('marks job as applied with markApplied intent', async () => {
      mockJobRepo.updateApplicationStatus.mockResolvedValue(undefined)

      const result = await action({
        request: createFormDataRequest({
          intent: 'markApplied',
          jobId: 'job-123',
          applicationSentDate: '2026-01-15',
        }),
        params: {},
        context: {},
      })

      expect(mockJobRepo.updateApplicationStatus).toHaveBeenCalledWith(
        'job-123',
        true,
        '2026-01-15'
      )
      expect(result).toEqual({ success: true })
    })

    it('marks job as unapplied with markUnapplied intent', async () => {
      mockJobRepo.updateApplicationStatus.mockResolvedValue(undefined)

      const result = await action({
        request: createFormDataRequest({
          intent: 'markUnapplied',
          jobId: 'job-456',
        }),
        params: {},
        context: {},
      })

      expect(mockJobRepo.updateApplicationStatus).toHaveBeenCalledWith(
        'job-456',
        false,
        null
      )
      expect(result).toEqual({ success: true })
    })

    it('returns success false for unknown intent', async () => {
      const result = await action({
        request: createFormDataRequest({
          intent: 'unknownIntent',
        }),
        params: {},
        context: {},
      })

      expect(result).toEqual({ success: false })
    })
  })
})
