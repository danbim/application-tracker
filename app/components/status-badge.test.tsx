import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '~/test-utils'
import { StatusBadge } from './status-badge'

// Create a mock submit function we can track
const mockSubmit = vi.fn()

// Mock react-router's useFetcher
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router')
  return {
    ...actual,
    useFetcher: () => ({
      state: 'idle',
      submit: mockSubmit,
      Form: ({
        children,
        ...props
      }: { children: React.ReactNode } & Record<string, unknown>) => (
        <form {...props}>{children}</form>
      ),
    }),
  }
})

// Store the onValueChange callback for testing
let capturedOnValueChange: ((value: string) => void) | null = null

// Mock the Select component to capture onValueChange and allow testing
vi.mock('~/components/ui/select', () => ({
  Select: ({
    children,
    onValueChange,
  }: {
    children: React.ReactNode
    value: string
    onValueChange: (value: string) => void
  }) => {
    capturedOnValueChange = onValueChange
    return <div data-testid="select">{children}</div>
  },
  SelectContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="select-content">{children}</div>
  ),
  SelectItem: ({
    children,
    value,
  }: {
    children: React.ReactNode
    value: string
  }) => (
    <button
      type="button"
      data-testid={`select-item-${value}`}
      onClick={() => capturedOnValueChange?.(value)}
    >
      {children}
    </button>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="select-trigger">{children}</div>
  ),
}))

describe('StatusBadge', () => {
  beforeEach(() => {
    mockSubmit.mockClear()
    capturedOnValueChange = null
  })

  it('renders current status', () => {
    render(<StatusBadge jobId="123" status="not_applied" />)
    const trigger = screen.getByTestId('select-trigger')
    expect(trigger).toHaveTextContent('Not Applied')
  })

  it('renders applied status with date', () => {
    render(
      <StatusBadge
        jobId="123"
        status="applied"
        appliedAt={new Date('2026-01-15')}
      />,
    )
    const trigger = screen.getByTestId('select-trigger')
    expect(trigger).toHaveTextContent(/Applied/)
    expect(trigger).toHaveTextContent(/Jan 15, 2026/)
  })

  it('renders interviewing status', () => {
    render(<StatusBadge jobId="123" status="interviewing" />)
    const trigger = screen.getByTestId('select-trigger')
    expect(trigger).toHaveTextContent('Interviewing')
  })

  it('renders offer status', () => {
    render(<StatusBadge jobId="123" status="offer" />)
    const trigger = screen.getByTestId('select-trigger')
    expect(trigger).toHaveTextContent('Offer')
  })

  it('renders rejected status', () => {
    render(<StatusBadge jobId="123" status="rejected" />)
    const trigger = screen.getByTestId('select-trigger')
    expect(trigger).toHaveTextContent('Rejected')
  })

  it('renders ghosted status', () => {
    render(<StatusBadge jobId="123" status="ghosted" />)
    const trigger = screen.getByTestId('select-trigger')
    expect(trigger).toHaveTextContent('Ghosted')
  })

  it('renders dumped status', () => {
    render(<StatusBadge jobId="123" status="dumped" />)
    const trigger = screen.getByTestId('select-trigger')
    expect(trigger).toHaveTextContent('Dumped')
  })

  it('calls onAppliedClick when applied is selected', async () => {
    const user = userEvent.setup()
    const onAppliedClick = vi.fn()
    render(
      <StatusBadge
        jobId="123"
        status="not_applied"
        onAppliedClick={onAppliedClick}
      />,
    )

    // Click the 'applied' option directly (our mock captures onValueChange)
    const appliedOption = screen.getByTestId('select-item-applied')
    await user.click(appliedOption)

    expect(onAppliedClick).toHaveBeenCalledTimes(1)
    expect(mockSubmit).not.toHaveBeenCalled()
  })

  it('submits form when changing to non-applied status', async () => {
    const user = userEvent.setup()
    render(<StatusBadge jobId="123" status="not_applied" />)

    // Click the 'interviewing' option directly
    const interviewingOption = screen.getByTestId('select-item-interviewing')
    await user.click(interviewingOption)

    expect(mockSubmit).toHaveBeenCalledWith(
      { intent: 'updateStatus', jobId: '123', status: 'interviewing' },
      { method: 'post', action: '/?index' },
    )
  })
})
