import { render, screen } from '~/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { StatusBadge } from './status-badge'

// Mock react-router's useFetcher
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router')
  return {
    ...actual,
    useFetcher: () => ({
      state: 'idle',
      submit: vi.fn(),
      Form: ({ children, ...props }: { children: React.ReactNode } & Record<string, unknown>) => (
        <form {...props}>{children}</form>
      ),
    }),
  }
})

describe('StatusBadge', () => {
  it('renders current status', () => {
    render(<StatusBadge jobId="123" status="not_applied" />)
    expect(screen.getByText('Not Applied')).toBeInTheDocument()
  })

  it('renders applied status with date', () => {
    render(<StatusBadge jobId="123" status="applied" appliedAt={new Date('2026-01-15')} />)
    expect(screen.getByText(/Applied/)).toBeInTheDocument()
  })

  it('renders interviewing status', () => {
    render(<StatusBadge jobId="123" status="interviewing" />)
    expect(screen.getByText('Interviewing')).toBeInTheDocument()
  })

  it('renders offer status', () => {
    render(<StatusBadge jobId="123" status="offer" />)
    expect(screen.getByText('Offer')).toBeInTheDocument()
  })

  it('renders rejected status', () => {
    render(<StatusBadge jobId="123" status="rejected" />)
    expect(screen.getByText('Rejected')).toBeInTheDocument()
  })

  it('renders ghosted status', () => {
    render(<StatusBadge jobId="123" status="ghosted" />)
    expect(screen.getByText('Ghosted')).toBeInTheDocument()
  })

  it('renders dumped status', () => {
    render(<StatusBadge jobId="123" status="dumped" />)
    expect(screen.getByText('Dumped')).toBeInTheDocument()
  })
})
