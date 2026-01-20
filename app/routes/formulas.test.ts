import { describe, expect, it, vi, beforeEach } from 'vitest'
import { createMockScoringFormula } from '~/test-utils'
import { loader } from './formulas'

// Mock the repository
vi.mock('~/services/index.server', () => ({
  scoringFormulaRepository: {
    findAll: vi.fn(),
  },
}))

import { scoringFormulaRepository } from '~/services/index.server'

const mockFormulaRepo = vi.mocked(scoringFormulaRepository)

describe('formulas route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('loader', () => {
    it('returns all formulas', async () => {
      const mockFormulas = [
        createMockScoringFormula({ id: 'formula-1', name: 'First' }),
        createMockScoringFormula({ id: 'formula-2', name: 'Second' }),
      ]
      mockFormulaRepo.findAll.mockResolvedValue(mockFormulas)

      const result = await loader({
        request: new Request('http://localhost/formulas'),
        params: {},
        context: {},
      })

      expect(mockFormulaRepo.findAll).toHaveBeenCalled()
      expect(result.formulas).toHaveLength(2)
      expect(result.formulas[0].name).toBe('First')
      expect(result.formulas[1].name).toBe('Second')
    })

    it('returns empty array when no formulas exist', async () => {
      mockFormulaRepo.findAll.mockResolvedValue([])

      const result = await loader({
        request: new Request('http://localhost/formulas'),
        params: {},
        context: {},
      })

      expect(result.formulas).toHaveLength(0)
    })
  })
})
