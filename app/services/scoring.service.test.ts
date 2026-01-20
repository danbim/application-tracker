import { describe, it, expect } from 'bun:test'
import { ScoringService } from './scoring.service'
import type { JobOpening, ScoringFormula } from '~/db/schema'

describe('ScoringService', () => {
  const service = new ScoringService()

  const createJobOpening = (ratings: Partial<JobOpening>): JobOpening =>
    ({
      id: 'test-id',
      title: 'Test Job',
      company: 'Test Co',
      description: 'Test description',
      ratingImpact: null,
      ratingCompensation: null,
      ratingRole: null,
      ratingTech: null,
      ratingLocation: null,
      ratingIndustry: null,
      ratingCulture: null,
      ratingGrowth: null,
      ratingProfileMatch: null,
      ratingCompanySize: null,
      ratingStress: null,
      ratingJobSecurity: null,
      wow: false,
      ...ratings,
    }) as JobOpening

  const createFormula = (weights: ScoringFormula['weights']): ScoringFormula =>
    ({
      id: 'formula-id',
      name: 'Test Formula',
      weights,
    }) as ScoringFormula

  describe('calculateScore', () => {
    it('should return 0 for job with no ratings', () => {
      const job = createJobOpening({})
      const formula = createFormula({
        impact: 1,
        compensation: 1,
        role: 1,
        tech: 1,
        location: 1,
        industry: 1,
        culture: 1,
        growth: 1,
        profileMatch: 1,
        companySize: 1,
        stress: 1,
        jobSecurity: 1,
        wowBoost: 0,
      })

      const score = service.calculateScore(job, formula)
      expect(score).toBe(0)
    })

    it('should calculate weighted sum of ratings', () => {
      const job = createJobOpening({
        ratingImpact: 1,
        ratingGrowth: 1,
        ratingStress: -1,
      })
      const formula = createFormula({
        impact: 2,
        compensation: 0,
        role: 0,
        tech: 0,
        location: 0,
        industry: 0,
        culture: 0,
        growth: 3,
        profileMatch: 0,
        companySize: 0,
        stress: 1,
        jobSecurity: 0,
        wowBoost: 0,
      })

      // (1 * 2) + (1 * 3) + (-1 * 1) = 2 + 3 - 1 = 4
      const score = service.calculateScore(job, formula)
      expect(score).toBe(4)
    })

    it('should handle all negative ratings', () => {
      const job = createJobOpening({
        ratingImpact: -1,
        ratingCompensation: -1,
      })
      const formula = createFormula({
        impact: 2,
        compensation: 2,
        role: 0,
        tech: 0,
        location: 0,
        industry: 0,
        culture: 0,
        growth: 0,
        profileMatch: 0,
        companySize: 0,
        stress: 0,
        jobSecurity: 0,
        wowBoost: 0,
      })

      // (-1 * 2) + (-1 * 2) = -4
      const score = service.calculateScore(job, formula)
      expect(score).toBe(-4)
    })
  })

  describe('rankJobOpenings', () => {
    it('should sort jobs by score descending', () => {
      const job1 = createJobOpening({ id: '1', ratingImpact: 1 })
      const job2 = createJobOpening({ id: '2', ratingImpact: -1 })
      const job3 = createJobOpening({ id: '3', ratingImpact: 0 })

      const formula = createFormula({
        impact: 1,
        compensation: 0,
        role: 0,
        tech: 0,
        location: 0,
        industry: 0,
        culture: 0,
        growth: 0,
        profileMatch: 0,
        companySize: 0,
        stress: 0,
        jobSecurity: 0,
        wowBoost: 0,
      })

      const ranked = service.rankJobOpenings([job1, job2, job3], formula)

      expect(ranked[0].job.id).toBe('1')
      expect(ranked[0].score).toBe(1)
      expect(ranked[1].job.id).toBe('3')
      expect(ranked[1].score).toBe(0)
      expect(ranked[2].job.id).toBe('2')
      expect(ranked[2].score).toBe(-1)
    })
  })
})
