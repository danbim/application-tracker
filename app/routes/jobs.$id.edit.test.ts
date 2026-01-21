import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMockJobOpening } from '~/test-utils'
import { action, loader } from './jobs.$id.edit'

// Mock the repository
vi.mock('~/services/index.server', () => ({
  jobOpeningRepository: {
    findById: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}))

import { jobOpeningRepository } from '~/services/index.server'

const mockJobRepo = vi.mocked(jobOpeningRepository)

function createFormDataRequest(
  data: Record<string, string | string[]>,
): Request {
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
  return new Request('http://localhost/jobs/123/edit', {
    method: 'POST',
    body: formData,
  })
}

const validJobData = {
  title: 'Updated Engineer',
  company: 'New Corp',
  description: 'Updated description',
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
  wow: ['false', 'false'],
}

describe('jobs.$id.edit route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('loader', () => {
    it('returns job when found', async () => {
      const mockJob = createMockJobOpening({ id: 'job-123', title: 'Test Job' })
      mockJobRepo.findById.mockResolvedValue(mockJob)

      const result = await loader({
        request: new Request('http://localhost/jobs/job-123/edit'),
        params: { id: 'job-123' },
        context: {},
      })

      expect(mockJobRepo.findById).toHaveBeenCalledWith('job-123')
      expect(result.job).toEqual(mockJob)
    })

    it('throws 404 when job not found', async () => {
      mockJobRepo.findById.mockResolvedValue(null)

      await expect(
        loader({
          request: new Request('http://localhost/jobs/nonexistent/edit'),
          params: { id: 'nonexistent' },
          context: {},
        }),
      ).rejects.toThrow()

      try {
        await loader({
          request: new Request('http://localhost/jobs/nonexistent/edit'),
          params: { id: 'nonexistent' },
          context: {},
        })
      } catch (error) {
        expect(error).toBeInstanceOf(Response)
        expect((error as Response).status).toBe(404)
      }
    })

    it('throws 400 when no id provided', async () => {
      await expect(
        loader({
          request: new Request('http://localhost/jobs//edit'),
          params: {},
          context: {},
        }),
      ).rejects.toThrow()

      try {
        await loader({
          request: new Request('http://localhost/jobs//edit'),
          params: {},
          context: {},
        })
      } catch (error) {
        expect(error).toBeInstanceOf(Response)
        expect((error as Response).status).toBe(400)
      }
    })
  })

  describe('action', () => {
    it('updates job with valid data', async () => {
      mockJobRepo.update.mockResolvedValue(undefined)

      const response = await action({
        request: createFormDataRequest(validJobData),
        params: { id: 'job-123' },
        context: {},
      })

      expect(mockJobRepo.update).toHaveBeenCalledWith(
        'job-123',
        expect.objectContaining({
          title: 'Updated Engineer',
          company: 'New Corp',
          description: 'Updated description',
        }),
      )
      expect(response).toBeInstanceOf(Response)
      expect((response as Response).status).toBe(302)
      expect((response as Response).headers.get('Location')).toBe('/')
    })

    it('returns validation errors for invalid data', async () => {
      const result = await action({
        request: createFormDataRequest({
          title: '',
          company: '',
          description: '',
        }),
        params: { id: 'job-123' },
        context: {},
      })

      expect(result).toHaveProperty('errors')
      expect(result.errors).toHaveProperty('title')
      expect(mockJobRepo.update).not.toHaveBeenCalled()
    })

    it('deletes job when intent is delete', async () => {
      mockJobRepo.delete.mockResolvedValue(undefined)

      const response = await action({
        request: createFormDataRequest({
          intent: 'delete',
        }),
        params: { id: 'job-456' },
        context: {},
      })

      expect(mockJobRepo.delete).toHaveBeenCalledWith('job-456')
      expect(response).toBeInstanceOf(Response)
      expect((response as Response).status).toBe(302)
      expect((response as Response).headers.get('Location')).toBe('/')
    })

    it('throws 400 when no id provided for update', async () => {
      await expect(
        action({
          request: createFormDataRequest(validJobData),
          params: {},
          context: {},
        }),
      ).rejects.toThrow()

      try {
        await action({
          request: createFormDataRequest(validJobData),
          params: {},
          context: {},
        })
      } catch (error) {
        expect(error).toBeInstanceOf(Response)
        expect((error as Response).status).toBe(400)
      }
    })

    it('throws 400 when no id provided for delete', async () => {
      await expect(
        action({
          request: createFormDataRequest({ intent: 'delete' }),
          params: {},
          context: {},
        }),
      ).rejects.toThrow()
    })

    it('handles wow checkbox correctly', async () => {
      mockJobRepo.update.mockResolvedValue(undefined)

      await action({
        request: createFormDataRequest({
          ...validJobData,
          wow: ['false', 'true'],
        }),
        params: { id: 'job-123' },
        context: {},
      })

      expect(mockJobRepo.update).toHaveBeenCalledWith(
        'job-123',
        expect.objectContaining({
          wow: true,
        }),
      )
    })

    it('transforms empty optional fields to null', async () => {
      mockJobRepo.update.mockResolvedValue(undefined)

      await action({
        request: createFormDataRequest({
          ...validJobData,
          jobLocation: '',
          country: '',
          salaryMin: '',
        }),
        params: { id: 'job-123' },
        context: {},
      })

      expect(mockJobRepo.update).toHaveBeenCalledWith(
        'job-123',
        expect.objectContaining({
          jobLocation: null,
          country: null,
          salaryMin: null,
        }),
      )
    })
  })
})
