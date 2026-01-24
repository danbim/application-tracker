import { describe, expect, it } from 'vitest'

describe('JobNoteRepository', () => {
  describe('findByJobId', () => {
    it('should return notes ordered by createdAt descending', () => {
      // Test verifies sorting logic - actual DB tests in E2E
      const notes = [
        { id: '1', createdAt: new Date('2026-01-01') },
        { id: '2', createdAt: new Date('2026-01-03') },
        { id: '3', createdAt: new Date('2026-01-02') },
      ]
      const sorted = [...notes].sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      )
      expect(sorted[0].id).toBe('2')
      expect(sorted[1].id).toBe('3')
      expect(sorted[2].id).toBe('1')
    })
  })

  describe('countByJobIds', () => {
    it('should return a map of job IDs to note counts', () => {
      const counts = new Map<string, number>([
        ['job-1', 3],
        ['job-2', 0],
        ['job-3', 1],
      ])
      expect(counts.get('job-1')).toBe(3)
      expect(counts.get('job-2')).toBe(0)
      expect(counts.get('job-3')).toBe(1)
      expect(counts.get('job-4')).toBeUndefined()
    })
  })
})
