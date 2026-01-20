import userEvent from '@testing-library/user-event'
import { render, screen } from '~/test-utils'
import { createMockJobOpening } from '~/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { JobTable } from './job-table'

// Mock react-router's useFetcher
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router')
  return {
    ...actual,
    useFetcher: () => ({
      state: 'idle',
      Form: ({ children, ...props }: { children: React.ReactNode } & Record<string, unknown>) => (
        <form {...props}>{children}</form>
      ),
    }),
  }
})

describe('JobTable', () => {
  const mockOnMarkApplied = vi.fn()

  beforeEach(() => {
    mockOnMarkApplied.mockClear()
  })

  describe('empty state', () => {
    it('shows empty message when no jobs', () => {
      render(<JobTable jobs={[]} onMarkApplied={mockOnMarkApplied} />)

      expect(screen.getByText('No job openings yet. Add one to get started.')).toBeInTheDocument()
    })
  })

  describe('table headers', () => {
    it('renders all column headers', () => {
      const job = createMockJobOpening()
      render(<JobTable jobs={[{ job, score: 10 }]} onMarkApplied={mockOnMarkApplied} />)

      expect(screen.getByText('Company')).toBeInTheDocument()
      expect(screen.getByText('Title')).toBeInTheDocument()
      expect(screen.getByText('Location')).toBeInTheDocument()
      expect(screen.getByText('Date Added')).toBeInTheDocument()
      expect(screen.getByText('Score')).toBeInTheDocument()
      expect(screen.getByText('Status')).toBeInTheDocument()
    })
  })

  describe('job rows', () => {
    it('renders job data correctly', () => {
      const job = createMockJobOpening({
        company: 'Acme Corp',
        title: 'Senior Developer',
        jobLocation: 'Berlin',
      })
      render(<JobTable jobs={[{ job, score: 15 }]} onMarkApplied={mockOnMarkApplied} />)

      expect(screen.getByText('Acme Corp')).toBeInTheDocument()
      expect(screen.getByText('Senior Developer')).toBeInTheDocument()
      expect(screen.getByText('Berlin')).toBeInTheDocument()
      expect(screen.getByText('15')).toBeInTheDocument()
    })

    it('shows dash for missing location', () => {
      const job = createMockJobOpening({ jobLocation: null })
      render(<JobTable jobs={[{ job, score: 0 }]} onMarkApplied={mockOnMarkApplied} />)

      // Find the location cell (4th column data cell)
      const cells = screen.getAllByRole('cell')
      const locationCell = cells.find(cell => cell.textContent === '-')
      expect(locationCell).toBeInTheDocument()
    })

    it('shows wow indicator (star) when job has wow flag', () => {
      const job = createMockJobOpening({ title: 'Dream Job', wow: true })
      render(<JobTable jobs={[{ job, score: 0 }]} onMarkApplied={mockOnMarkApplied} />)

      expect(screen.getByText(/Dream Job/)).toBeInTheDocument()
      expect(screen.getByText(/★/)).toBeInTheDocument()
    })

    it('does not show wow indicator when job has no wow flag', () => {
      const job = createMockJobOpening({ title: 'Regular Job', wow: false })
      render(<JobTable jobs={[{ job, score: 0 }]} onMarkApplied={mockOnMarkApplied} />)

      expect(screen.getByText('Regular Job')).toBeInTheDocument()
      expect(screen.queryByText(/★/)).not.toBeInTheDocument()
    })

    it('renders Edit link with correct href', () => {
      const job = createMockJobOpening({ id: 'job-123' })
      render(<JobTable jobs={[{ job, score: 0 }]} onMarkApplied={mockOnMarkApplied} />)

      const editLink = screen.getByRole('link', { name: 'Edit' })
      expect(editLink).toHaveAttribute('href', '/jobs/job-123/edit')
    })

    it('renders multiple jobs', () => {
      const job1 = createMockJobOpening({ id: '1', company: 'Company A' })
      const job2 = createMockJobOpening({ id: '2', company: 'Company B' })
      const job3 = createMockJobOpening({ id: '3', company: 'Company C' })

      render(
        <JobTable
          jobs={[
            { job: job1, score: 10 },
            { job: job2, score: 5 },
            { job: job3, score: 0 },
          ]}
          onMarkApplied={mockOnMarkApplied}
        />
      )

      expect(screen.getByText('Company A')).toBeInTheDocument()
      expect(screen.getByText('Company B')).toBeInTheDocument()
      expect(screen.getByText('Company C')).toBeInTheDocument()
    })
  })

  describe('StatusBadge', () => {
    it('shows "Not Applied" badge for unapplied jobs', () => {
      const job = createMockJobOpening({ applicationSent: false })
      render(<JobTable jobs={[{ job, score: 0 }]} onMarkApplied={mockOnMarkApplied} />)

      expect(screen.getByText('Not Applied')).toBeInTheDocument()
    })

    it('shows "Applied" badge for applied jobs', () => {
      const job = createMockJobOpening({
        applicationSent: true,
        applicationSentDate: '2026-01-15',
      })
      render(<JobTable jobs={[{ job, score: 0 }]} onMarkApplied={mockOnMarkApplied} />)

      expect(screen.getByText(/Applied/)).toBeInTheDocument()
    })

    it('calls onMarkApplied when clicking "Not Applied" badge', async () => {
      const user = userEvent.setup()

      const job = createMockJobOpening({ id: 'job-to-apply', applicationSent: false })
      render(<JobTable jobs={[{ job, score: 0 }]} onMarkApplied={mockOnMarkApplied} />)

      const badge = screen.getByText('Not Applied')
      await user.click(badge)

      expect(mockOnMarkApplied).toHaveBeenCalledWith('job-to-apply')
    })

    it('renders form with markUnapplied intent for applied jobs', () => {
      const job = createMockJobOpening({
        id: 'applied-job',
        applicationSent: true,
        applicationSentDate: '2026-01-15',
      })
      const { container } = render(<JobTable jobs={[{ job, score: 0 }]} onMarkApplied={mockOnMarkApplied} />)

      const intentInput = container.querySelector('input[name="intent"][value="markUnapplied"]')
      expect(intentInput).toBeInTheDocument()

      const jobIdInput = container.querySelector('input[name="jobId"][value="applied-job"]')
      expect(jobIdInput).toBeInTheDocument()
    })
  })

  describe('HoverCard', () => {
    it('renders title as hover trigger', () => {
      const job = createMockJobOpening({ title: 'Hoverable Title' })
      render(<JobTable jobs={[{ job, score: 0 }]} onMarkApplied={mockOnMarkApplied} />)

      const trigger = screen.getByText('Hoverable Title')
      expect(trigger).toHaveClass('cursor-help')
    })
  })
})
