import { describe, expect, it, vi, beforeEach } from 'vitest'
import { createMockScoringFormula } from '~/test-utils'
import { loader, action } from './formulas.$id.edit'

// Mock the repository
vi.mock('~/services/index.server', () => ({
  scoringFormulaRepository: {
    findById: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}))

import { scoringFormulaRepository } from '~/services/index.server'

const mockFormulaRepo = vi.mocked(scoringFormulaRepository)

function createFormDataRequest(data: Record<string, string>): Request {
  const formData = new FormData()
  for (const [key, value] of Object.entries(data)) {
    formData.append(key, value)
  }
  return new Request('http://localhost/formulas/123/edit', {
    method: 'POST',
    body: formData,
  })
}

const validFormulaData = {
  name: 'Updated Formula',
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

describe('formulas.$id.edit route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('loader', () => {
    it('returns formula when found', async () => {
      const mockFormula = createMockScoringFormula({ id: 'formula-123', name: 'Test Formula' })
      mockFormulaRepo.findById.mockResolvedValue(mockFormula)

      const result = await loader({
        request: new Request('http://localhost/formulas/formula-123/edit'),
        params: { id: 'formula-123' },
        context: {},
      })

      expect(mockFormulaRepo.findById).toHaveBeenCalledWith('formula-123')
      expect(result.formula).toEqual(mockFormula)
    })

    it('throws 404 when formula not found', async () => {
      mockFormulaRepo.findById.mockResolvedValue(null)

      await expect(
        loader({
          request: new Request('http://localhost/formulas/nonexistent/edit'),
          params: { id: 'nonexistent' },
          context: {},
        })
      ).rejects.toThrow()

      try {
        await loader({
          request: new Request('http://localhost/formulas/nonexistent/edit'),
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
          request: new Request('http://localhost/formulas//edit'),
          params: {},
          context: {},
        })
      ).rejects.toThrow()

      try {
        await loader({
          request: new Request('http://localhost/formulas//edit'),
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
    it('updates formula with valid data', async () => {
      mockFormulaRepo.update.mockResolvedValue(undefined)

      const response = await action({
        request: createFormDataRequest(validFormulaData),
        params: { id: 'formula-123' },
        context: {},
      })

      expect(mockFormulaRepo.update).toHaveBeenCalledWith(
        'formula-123',
        expect.objectContaining({
          name: 'Updated Formula',
          weights: expect.objectContaining({
            impact: 5,
            compensation: 4,
          }),
        })
      )
      expect(response).toBeInstanceOf(Response)
      expect((response as Response).status).toBe(302)
      expect((response as Response).headers.get('Location')).toBe('/formulas')
    })

    it('returns validation errors for invalid data', async () => {
      const result = await action({
        request: createFormDataRequest({
          name: '',
        }),
        params: { id: 'formula-123' },
        context: {},
      })

      expect(result).toHaveProperty('errors')
      expect(result.errors).toHaveProperty('name')
      expect(mockFormulaRepo.update).not.toHaveBeenCalled()
    })

    it('deletes formula when intent is delete', async () => {
      mockFormulaRepo.delete.mockResolvedValue(undefined)

      const response = await action({
        request: createFormDataRequest({
          intent: 'delete',
        }),
        params: { id: 'formula-456' },
        context: {},
      })

      expect(mockFormulaRepo.delete).toHaveBeenCalledWith('formula-456')
      expect(response).toBeInstanceOf(Response)
      expect((response as Response).status).toBe(302)
      expect((response as Response).headers.get('Location')).toBe('/formulas')
    })

    it('throws 400 when no id provided for update', async () => {
      await expect(
        action({
          request: createFormDataRequest(validFormulaData),
          params: {},
          context: {},
        })
      ).rejects.toThrow()

      try {
        await action({
          request: createFormDataRequest(validFormulaData),
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
        })
      ).rejects.toThrow()
    })

    it('updates weights correctly', async () => {
      mockFormulaRepo.update.mockResolvedValue(undefined)

      await action({
        request: createFormDataRequest({
          ...validFormulaData,
          'weights.impact': '10',
          'weights.stress': '-10',
        }),
        params: { id: 'formula-123' },
        context: {},
      })

      expect(mockFormulaRepo.update).toHaveBeenCalledWith(
        'formula-123',
        expect.objectContaining({
          weights: expect.objectContaining({
            impact: 10,
            stress: -10,
          }),
        })
      )
    })
  })
})
