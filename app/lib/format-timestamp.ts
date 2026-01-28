import { format, formatDistanceToNow } from 'date-fns'

export function formatDualTimestamp(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  if (Number.isNaN(d.getTime())) {
    throw new Error('Invalid date provided')
  }
  const relative = formatDistanceToNow(d, { addSuffix: true })
  const absolute = format(d, 'PPp')
  return `${relative} (${absolute})`
}

export function formatDate(date: Date | string | null): string {
  if (!date) return '-'
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'PP')
}
