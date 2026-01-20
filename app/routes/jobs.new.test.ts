import { describe, expect, it, vi, beforeEach } from 'vitest'
import { action } from './jobs.new'

// Mock the repository
vi.mock('~/services/index.server', () => ({
  jobOpeningRepository: {
    create: vi.fn(),
  },
}))

import { jobOpeningRepository } from '~/services/index.server'

const mockJobRepo = vi.mocked(jobOpeningRepository)

function createFormDataRequest(data: Record<string, string | string[]>): Request {
  const formData = new FormData()
  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) {
      for (const v of value) {
        formData.append(key, v)
      }
    } else {
      formData.append(key, value)
    }
  }
  return new Request('http://localhost/jobs/new', {
    method: 'POST',
    body: formData,
  })
}

const validJobData = {
  title: 'Software Engineer',
  company: 'Acme Corp',
  description: 'Great job opportunity',
  ratingImpact: '1',
  ratingCompensation: '0',
  ratingRole: '-1',
  ratingTech: '1',
  ratingLocation: '0',
  ratingIndustry: '0',
  ratingCulture: '1',
  ratingGrowth: '0',
  ratingProfileMatch: '1',
  ratingCompanySize: '0',
  ratingStress: '-1',
  ratingJobSecurity: '1',
  wow: ['false', 'false'], // checkbox unchecked
}

describe('jobs.new route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('action', () => {
    it('creates job opening with valid data', async () => {
      mockJobRepo.create.mockResolvedValue(undefined)

      const response = await action({
        request: createFormDataRequest(validJobData),
        params: {},
        context: {},
      })

      expect(mockJobRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Software Engineer',
          company: 'Acme Corp',
          description: 'Great job opportunity',
        })
      )
      expect(response).toBeInstanceOf(Response)
      expect((response as Response).status).toBe(302)
      expect((response as Response).headers.get('Location')).toBe('/')
    })

    it('returns validation errors for missing required fields', async () => {
      const result = await action({
        request: createFormDataRequest({
          title: '',
          company: '',
          description: '',
        }),
        params: {},
        context: {},
      })

      expect(result).toHaveProperty('errors')
      expect(result.errors).toHaveProperty('title')
      expect(mockJobRepo.create).not.toHaveBeenCalled()
    })

    it('handles wow checkbox when checked', async () => {
      mockJobRepo.create.mockResolvedValue(undefined)

      await action({
        request: createFormDataRequest({
          ...validJobData,
          wow: ['false', 'true'], // checkbox checked - both hidden and checkbox values
        }),
        params: {},
        context: {},
      })

      expect(mockJobRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          wow: true,
        })
      )
    })

    it('handles wow checkbox when unchecked', async () => {
      mockJobRepo.create.mockResolvedValue(undefined)

      await action({
        request: createFormDataRequest({
          ...validJobData,
          wow: ['false'], // only hidden input value
        }),
        params: {},
        context: {},
      })

      expect(mockJobRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          wow: false,
        })
      )
    })

    it('transforms empty optional fields to null', async () => {
      mockJobRepo.create.mockResolvedValue(undefined)

      await action({
        request: createFormDataRequest({
          ...validJobData,
          jobLocation: '',
          country: '',
          postingUrl: '',
          track: '',
          salaryMin: '',
          salaryMax: '',
        }),
        params: {},
        context: {},
      })

      expect(mockJobRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          jobLocation: null,
          country: null,
          postingUrl: null,
          track: null,
          salaryMin: null,
          salaryMax: null,
        })
      )
    })

    it('includes ratings in created job', async () => {
      mockJobRepo.create.mockResolvedValue(undefined)

      await action({
        request: createFormDataRequest(validJobData),
        params: {},
        context: {},
      })

      expect(mockJobRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ratingImpact: 1,
          ratingCompensation: 0,
          ratingRole: -1,
        })
      )
    })
  })
})
