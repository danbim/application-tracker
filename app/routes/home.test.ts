import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMockJobOpening, createMockScoringFormula } from '~/test-utils'
import { action, loader } from './home'

// Mock the services
vi.mock('~/services/index.server', () => ({
  jobOpeningRepository: {
    findAll: vi.fn(),
    countByStatus: vi.fn(),
    updateStatus: vi.fn(),
  },
  scoringFormulaRepository: {
    findAll: vi.fn(),
  },
  scoringService: {
    rankJobOpenings: vi.fn((jobs, _formula) =>
      jobs.map((job: unknown) => ({ job, score: 10 })),
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

const defaultStatusCounts = {
  not_applied: 0,
  applied: 0,
  interviewing: 0,
  offer: 0,
  rejected: 0,
  ghosted: 0,
  dumped: 0,
}

describe('home route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockJobRepo.countByStatus.mockResolvedValue(defaultStatusCounts)
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
        expect.arrayContaining([expect.objectContaining({ country: 'DE' })]),
        expect.anything(),
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

    it('filters to active statuses by default', async () => {
      const mockJobs = [
        createMockJobOpening({ id: '1', status: 'not_applied' }),
        createMockJobOpening({ id: '2', status: 'applied' }),
        createMockJobOpening({ id: '3', status: 'interviewing' }),
        createMockJobOpening({ id: '4', status: 'offer' }),
        createMockJobOpening({ id: '5', status: 'rejected' }),
        createMockJobOpening({ id: '6', status: 'ghosted' }),
      ]

      mockJobRepo.findAll.mockResolvedValue(mockJobs)
      mockFormulaRepo.findAll.mockResolvedValue([])

      const result = await loader({
        request: createRequest('http://localhost/'),
        params: {},
        context: {},
      })

      // Should only include active statuses (not_applied, applied, interviewing, offer)
      expect(result.jobs).toHaveLength(4)
      expect(result.selectedStatus).toBe('active')
    })

    it('filters to specific status when status param provided', async () => {
      const mockJobs = [
        createMockJobOpening({ id: '1', status: 'not_applied' }),
        createMockJobOpening({ id: '2', status: 'applied' }),
        createMockJobOpening({ id: '3', status: 'rejected' }),
      ]

      mockJobRepo.findAll.mockResolvedValue(mockJobs)
      mockFormulaRepo.findAll.mockResolvedValue([])

      const result = await loader({
        request: createRequest('http://localhost/?status=rejected'),
        params: {},
        context: {},
      })

      expect(result.jobs).toHaveLength(1)
      expect(result.jobs[0].job.status).toBe('rejected')
      expect(result.selectedStatus).toBe('rejected')
    })

    it('returns statusCounts from countByStatus', async () => {
      const statusCounts = {
        not_applied: 5,
        applied: 3,
        interviewing: 2,
        offer: 1,
        rejected: 4,
        ghosted: 2,
        dumped: 0,
      }

      mockJobRepo.findAll.mockResolvedValue([])
      mockFormulaRepo.findAll.mockResolvedValue([])
      mockJobRepo.countByStatus.mockResolvedValue(statusCounts)

      const result = await loader({
        request: createRequest('http://localhost/'),
        params: {},
        context: {},
      })

      expect(result.statusCounts).toEqual(statusCounts)
    })
  })

  describe('action', () => {
    it('updates job status with updateStatus intent', async () => {
      mockJobRepo.updateStatus.mockResolvedValue(undefined)

      const result = await action({
        request: createFormDataRequest({
          intent: 'updateStatus',
          jobId: 'job-123',
          status: 'applied',
          date: '2026-01-15',
        }),
        params: {},
        context: {},
      })

      expect(mockJobRepo.updateStatus).toHaveBeenCalledWith(
        'job-123',
        'applied',
        '2026-01-15',
      )
      expect(result).toEqual({ success: true })
    })

    it('updates job status without date', async () => {
      mockJobRepo.updateStatus.mockResolvedValue(undefined)

      const result = await action({
        request: createFormDataRequest({
          intent: 'updateStatus',
          jobId: 'job-456',
          status: 'interviewing',
        }),
        params: {},
        context: {},
      })

      expect(mockJobRepo.updateStatus).toHaveBeenCalledWith(
        'job-456',
        'interviewing',
        null,
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
