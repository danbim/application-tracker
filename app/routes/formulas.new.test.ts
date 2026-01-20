import { describe, expect, it, vi, beforeEach } from 'vitest'
import { action } from './formulas.new'

// Mock the repository
vi.mock('~/services/index.server', () => ({
  scoringFormulaRepository: {
    create: vi.fn(),
  },
}))

import { scoringFormulaRepository } from '~/services/index.server'

const mockFormulaRepo = vi.mocked(scoringFormulaRepository)

function createFormDataRequest(data: Record<string, string>): Request {
  const formData = new FormData()
  for (const [key, value] of Object.entries(data)) {
    formData.append(key, value)
  }
  return new Request('http://localhost/formulas/new', {
    method: 'POST',
    body: formData,
  })
}

const validFormulaData = {
  name: 'My Formula',
  'weights.impact': '5',
  'weights.compensation': '4',
  'weights.role': '3',
  'weights.tech': '4',
  'weights.location': '2',
  'weights.industry': '3',
  'weights.culture': '5',
  'weights.growth': '4',
  'weights.profileMatch': '4',
  'weights.companySize': '2',
  'weights.stress': '-2',
  'weights.jobSecurity': '3',
  'weights.wowBoost': '10',
}

describe('formulas.new route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('action', () => {
    it('creates formula with valid data', async () => {
      mockFormulaRepo.create.mockResolvedValue(undefined)

      const response = await action({
        request: createFormDataRequest(validFormulaData),
        params: {},
        context: {},
      })

      expect(mockFormulaRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'My Formula',
          weights: expect.objectContaining({
            impact: 5,
            compensation: 4,
            stress: -2,
            wowBoost: 10,
          }),
        })
      )
      expect(response).toBeInstanceOf(Response)
      expect((response as Response).status).toBe(302)
      expect((response as Response).headers.get('Location')).toBe('/formulas')
    })

    it('returns validation errors for missing name', async () => {
      const result = await action({
        request: createFormDataRequest({
          ...validFormulaData,
          name: '',
        }),
        params: {},
        context: {},
      })

      expect(result).toHaveProperty('errors')
      expect(result.errors).toHaveProperty('name')
      expect(mockFormulaRepo.create).not.toHaveBeenCalled()
    })

    it('returns validation errors for non-numeric weights', async () => {
      const result = await action({
        request: createFormDataRequest({
          name: 'Test Formula',
          'weights.impact': 'abc',
          'weights.compensation': '4',
          'weights.role': '3',
          'weights.tech': '4',
          'weights.location': '2',
          'weights.industry': '3',
          'weights.culture': '5',
          'weights.growth': '4',
          'weights.profileMatch': '4',
          'weights.companySize': '2',
          'weights.stress': '-2',
          'weights.jobSecurity': '3',
          'weights.wowBoost': '10',
        }),
        params: {},
        context: {},
      })

      expect(result).toHaveProperty('errors')
      expect(mockFormulaRepo.create).not.toHaveBeenCalled()
    })

    it('accepts negative weights', async () => {
      mockFormulaRepo.create.mockResolvedValue(undefined)

      await action({
        request: createFormDataRequest({
          ...validFormulaData,
          'weights.stress': '-5',
          'weights.companySize': '-3',
        }),
        params: {},
        context: {},
      })

      expect(mockFormulaRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          weights: expect.objectContaining({
            stress: -5,
            companySize: -3,
          }),
        })
      )
    })

    it('accepts zero weights', async () => {
      mockFormulaRepo.create.mockResolvedValue(undefined)

      await action({
        request: createFormDataRequest({
          ...validFormulaData,
          'weights.industry': '0',
        }),
        params: {},
        context: {},
      })

      expect(mockFormulaRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          weights: expect.objectContaining({
            industry: 0,
          }),
        })
      )
    })
  })
})
