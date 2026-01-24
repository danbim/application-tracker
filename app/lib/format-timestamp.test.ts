import { describe, expect, it, vi } from 'vitest'
import { formatDualTimestamp } from './format-timestamp'

describe('formatDualTimestamp', () => {
  it('should format timestamp with relative and absolute parts', () => {
    // Mock current time to 2026-01-23 16:03:00
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-23T16:03:00'))

    const timestamp = new Date('2026-01-23T14:03:00')
    const result = formatDualTimestamp(timestamp)

    expect(result).toBe('2 hours ago (23.01.2026 - 14:03)')

    vi.useRealTimers()
  })

  it('should handle "just now" for recent timestamps', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-23T16:03:00'))

    const timestamp = new Date('2026-01-23T16:02:30')
    const result = formatDualTimestamp(timestamp)

    expect(result).toBe('just now (23.01.2026 - 16:02)')

    vi.useRealTimers()
  })

  it('should handle days ago', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-23T16:03:00'))

    const timestamp = new Date('2026-01-20T14:03:00')
    const result = formatDualTimestamp(timestamp)

    expect(result).toBe('3 days ago (20.01.2026 - 14:03)')

    vi.useRealTimers()
  })
})
