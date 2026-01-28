import { describe, expect, it, vi } from 'vitest'
import { formatDate, formatDualTimestamp } from './format-timestamp'

describe('formatDualTimestamp', () => {
  it('should format timestamp with relative and absolute parts', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-23T16:03:00'))

    const timestamp = new Date('2026-01-23T14:03:00')
    const result = formatDualTimestamp(timestamp)

    expect(result).toBe('about 2 hours ago (Jan 23, 2026, 2:03 PM)')

    vi.useRealTimers()
  })

  it('should handle recent timestamps', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-23T16:03:00'))

    const timestamp = new Date('2026-01-23T16:02:30')
    const result = formatDualTimestamp(timestamp)

    expect(result).toBe('1 minute ago (Jan 23, 2026, 4:02 PM)')

    vi.useRealTimers()
  })

  it('should handle days ago', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-23T16:03:00'))

    const timestamp = new Date('2026-01-20T14:03:00')
    const result = formatDualTimestamp(timestamp)

    expect(result).toBe('3 days ago (Jan 20, 2026, 2:03 PM)')

    vi.useRealTimers()
  })

  it('should handle minutes ago', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-23T16:03:00'))

    const timestamp = new Date('2026-01-23T15:58:00')
    const result = formatDualTimestamp(timestamp)

    expect(result).toBe('5 minutes ago (Jan 23, 2026, 3:58 PM)')

    vi.useRealTimers()
  })

  it('should handle months ago', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-23T16:03:00'))

    const timestamp = new Date('2025-11-23T14:03:00')
    const result = formatDualTimestamp(timestamp)

    expect(result).toBe('2 months ago (Nov 23, 2025, 2:03 PM)')

    vi.useRealTimers()
  })

  it('should handle 1 minute ago', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-23T16:03:00'))

    const timestamp = new Date('2026-01-23T16:02:00')
    const result = formatDualTimestamp(timestamp)

    expect(result).toBe('1 minute ago (Jan 23, 2026, 4:02 PM)')

    vi.useRealTimers()
  })

  it('should handle about 1 hour ago', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-23T16:03:00'))

    const timestamp = new Date('2026-01-23T15:03:00')
    const result = formatDualTimestamp(timestamp)

    expect(result).toBe('about 1 hour ago (Jan 23, 2026, 3:03 PM)')

    vi.useRealTimers()
  })

  it('should handle 1 day ago', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-23T16:03:00'))

    const timestamp = new Date('2026-01-22T16:03:00')
    const result = formatDualTimestamp(timestamp)

    expect(result).toBe('1 day ago (Jan 22, 2026, 4:03 PM)')

    vi.useRealTimers()
  })

  it('should handle about 1 month ago', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-23T16:03:00'))

    const timestamp = new Date('2025-12-23T16:03:00')
    const result = formatDualTimestamp(timestamp)

    expect(result).toBe('about 1 month ago (Dec 23, 2025, 4:03 PM)')

    vi.useRealTimers()
  })

  it('should handle string input', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-23T16:03:00'))

    const result = formatDualTimestamp('2026-01-23T14:03:00')

    expect(result).toBe('about 2 hours ago (Jan 23, 2026, 2:03 PM)')

    vi.useRealTimers()
  })

  it('should throw error for invalid date', () => {
    expect(() => formatDualTimestamp('invalid-date')).toThrow(
      'Invalid date provided',
    )
  })

  it('should handle future dates with "in X" prefix', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-23T16:03:00'))

    const timestamp = new Date('2026-01-23T16:08:00')
    const result = formatDualTimestamp(timestamp)

    expect(result).toBe('in 5 minutes (Jan 23, 2026, 4:08 PM)')

    vi.useRealTimers()
  })
})

describe('formatDate', () => {
  it('should format a Date object', () => {
    const result = formatDate(new Date('2026-01-23'))
    expect(result).toBe('Jan 23, 2026')
  })

  it('should format a date string', () => {
    const result = formatDate('2026-01-23')
    expect(result).toBe('Jan 23, 2026')
  })

  it('should return dash for null', () => {
    expect(formatDate(null)).toBe('-')
  })
})
