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

  it('should handle minutes ago', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-23T16:03:00'))

    const timestamp = new Date('2026-01-23T15:58:00')
    const result = formatDualTimestamp(timestamp)

    expect(result).toBe('5 minutes ago (23.01.2026 - 15:58)')

    vi.useRealTimers()
  })

  it('should handle months ago', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-23T16:03:00'))

    const timestamp = new Date('2025-11-23T14:03:00')
    const result = formatDualTimestamp(timestamp)

    expect(result).toBe('2 months ago (23.11.2025 - 14:03)')

    vi.useRealTimers()
  })

  it('should handle singular forms - 1 minute ago', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-23T16:03:00'))

    const timestamp = new Date('2026-01-23T16:02:00')
    const result = formatDualTimestamp(timestamp)

    expect(result).toBe('1 minute ago (23.01.2026 - 16:02)')

    vi.useRealTimers()
  })

  it('should handle singular forms - 1 hour ago', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-23T16:03:00'))

    const timestamp = new Date('2026-01-23T15:03:00')
    const result = formatDualTimestamp(timestamp)

    expect(result).toBe('1 hour ago (23.01.2026 - 15:03)')

    vi.useRealTimers()
  })

  it('should handle singular forms - 1 day ago', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-23T16:03:00'))

    const timestamp = new Date('2026-01-22T16:03:00')
    const result = formatDualTimestamp(timestamp)

    expect(result).toBe('1 day ago (22.01.2026 - 16:03)')

    vi.useRealTimers()
  })

  it('should handle singular forms - 1 month ago', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-23T16:03:00'))

    const timestamp = new Date('2025-12-23T16:03:00')
    const result = formatDualTimestamp(timestamp)

    expect(result).toBe('1 month ago (23.12.2025 - 16:03)')

    vi.useRealTimers()
  })

  it('should handle string input', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-23T16:03:00'))

    const result = formatDualTimestamp('2026-01-23T14:03:00')

    expect(result).toBe('2 hours ago (23.01.2026 - 14:03)')

    vi.useRealTimers()
  })

  it('should throw error for invalid date', () => {
    expect(() => formatDualTimestamp('invalid-date')).toThrow(
      'Invalid date provided',
    )
  })

  it('should handle future dates as "just now"', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-23T16:03:00'))

    const timestamp = new Date('2026-01-23T16:08:00')
    const result = formatDualTimestamp(timestamp)

    expect(result).toBe('just now (23.01.2026 - 16:08)')

    vi.useRealTimers()
  })
})
