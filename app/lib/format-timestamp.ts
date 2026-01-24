export function formatDualTimestamp(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date

  // Handle invalid dates
  if (Number.isNaN(d.getTime())) {
    throw new Error('Invalid date provided')
  }

  const now = new Date()
  const diffMs = now.getTime() - d.getTime()

  // Handle future dates - treat as "just now"
  if (diffMs < 0) {
    const day = d.getDate().toString().padStart(2, '0')
    const month = (d.getMonth() + 1).toString().padStart(2, '0')
    const year = d.getFullYear()
    const hours = d.getHours().toString().padStart(2, '0')
    const minutes = d.getMinutes().toString().padStart(2, '0')
    const absolute = `${day}.${month}.${year} - ${hours}:${minutes}`
    return `just now (${absolute})`
  }
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  let relative: string
  if (diffMinutes < 1) {
    relative = 'just now'
  } else if (diffMinutes < 60) {
    relative = `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`
  } else if (diffHours < 24) {
    relative = `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
  } else if (diffDays < 30) {
    relative = `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
  } else {
    const diffMonths = Math.floor(diffDays / 30)
    relative = `${diffMonths} month${diffMonths === 1 ? '' : 's'} ago`
  }

  const day = d.getDate().toString().padStart(2, '0')
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const year = d.getFullYear()
  const hours = d.getHours().toString().padStart(2, '0')
  const minutes = d.getMinutes().toString().padStart(2, '0')

  const absolute = `${day}.${month}.${year} - ${hours}:${minutes}`

  return `${relative} (${absolute})`
}
