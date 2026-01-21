import { render, screen } from '~/test-utils'
import { describe, expect, it } from 'vitest'
import { StatusTabs } from './status-tabs'
import type { ApplicationStatus } from '~/db/schema'

describe('StatusTabs', () => {
  const mockCounts: Record<ApplicationStatus, number> = {
    not_applied: 5,
    applied: 3,
    interviewing: 2,
    offer: 1,
    rejected: 4,
    ghosted: 2,
    dumped: 1,
  }

  it('renders all tabs', () => {
    render(<StatusTabs selectedStatus="active" counts={mockCounts} />)

    expect(screen.getByRole('tab', { name: /^Active/ })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /^Not Applied/ })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /^Applied/ })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /^Interviewing/ })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /^Offer/ })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /^Rejected/ })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /^Ghosted/ })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /^Dumped/ })).toBeInTheDocument()
  })

  it('shows counts in badges', () => {
    render(<StatusTabs selectedStatus="active" counts={mockCounts} />)

    // Active count = not_applied + applied + interviewing + offer = 5 + 3 + 2 + 1 = 11
    expect(screen.getByText('11')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument() // not_applied
    expect(screen.getByText('3')).toBeInTheDocument() // applied
  })

  it('highlights selected tab', () => {
    render(<StatusTabs selectedStatus="applied" counts={mockCounts} />)

    const appliedTab = screen.getByRole('tab', { name: /^Applied/ })
    expect(appliedTab).toHaveAttribute('data-state', 'active')
  })
})
