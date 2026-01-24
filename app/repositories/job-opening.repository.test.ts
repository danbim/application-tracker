import { describe, expect, it } from 'vitest'

describe('JobOpeningRepository', () => {
  describe('updateStatus', () => {
    it('should set the correct timestamp field based on status', () => {
      const statusToTimestampField: Record<string, string> = {
        applied: 'appliedAt',
        interviewing: 'interviewingAt',
        offer: 'offerAt',
        rejected: 'rejectedAt',
        ghosted: 'ghostedAt',
        dumped: 'dumpedAt',
      }

      expect(statusToTimestampField.applied).toBe('appliedAt')
      expect(statusToTimestampField.interviewing).toBe('interviewingAt')
      expect(statusToTimestampField.offer).toBe('offerAt')
      expect(statusToTimestampField.rejected).toBe('rejectedAt')
      expect(statusToTimestampField.ghosted).toBe('ghostedAt')
      expect(statusToTimestampField.dumped).toBe('dumpedAt')
    })

    it('should not set timestamp for not_applied status', () => {
      const statusToTimestampField: Record<string, string | null> = {
        not_applied: null,
        applied: 'appliedAt',
      }

      expect(statusToTimestampField.not_applied).toBeNull()
    })
  })
})
