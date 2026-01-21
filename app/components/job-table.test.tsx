import { describe, expect, it, vi } from 'vitest'
import { createMockJobOpening, render, screen } from '~/test-utils'
import { JobTable } from './job-table'

// Mock react-router's useFetcher
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router')
  return {
    ...actual,
    useFetcher: () => ({
      state: 'idle',
      submit: vi.fn(),
      Form: ({
        children,
        ...props
      }: { children: React.ReactNode } & Record<string, unknown>) => (
        <form {...props}>{children}</form>
      ),
    }),
  }
})

describe('JobTable', () => {
  const mockOnAppliedClick = vi.fn()

  describe('empty state', () => {
    it('shows empty message when no jobs', () => {
      render(<JobTable jobs={[]} onAppliedClick={mockOnAppliedClick} />)
      expect(screen.getByText(/No job openings yet/)).toBeInTheDocument()
    })
  })

  describe('with jobs', () => {
    it('renders job rows', () => {
      const jobs = [
        {
          job: createMockJobOpening({
            id: '1',
            title: 'Engineer',
            company: 'Acme',
          }),
          score: 10,
        },
      ]
      render(<JobTable jobs={jobs} onAppliedClick={mockOnAppliedClick} />)

      expect(screen.getByText('Engineer')).toBeInTheDocument()
      expect(screen.getByText('Acme')).toBeInTheDocument()
    })

    it('shows wow indicator', () => {
      const jobs = [
        {
          job: createMockJobOpening({ title: 'Cool Job', wow: true }),
          score: 10,
        },
      ]
      render(<JobTable jobs={jobs} onAppliedClick={mockOnAppliedClick} />)

      expect(screen.getByText(/Cool Job/)).toBeInTheDocument()
      expect(screen.getByText(/★/)).toBeInTheDocument()
    })

    it('renders status badge', () => {
      const jobs = [
        { job: createMockJobOpening({ status: 'applied' }), score: 10 },
      ]
      render(<JobTable jobs={jobs} onAppliedClick={mockOnAppliedClick} />)

      expect(screen.getByText('Applied')).toBeInTheDocument()
    })

    it('renders score', () => {
      const jobs = [{ job: createMockJobOpening(), score: 42 }]
      render(<JobTable jobs={jobs} onAppliedClick={mockOnAppliedClick} />)

      expect(screen.getByText('42')).toBeInTheDocument()
    })

    it('renders edit link', () => {
      const jobs = [{ job: createMockJobOpening({ id: 'job-123' }), score: 10 }]
      render(<JobTable jobs={jobs} onAppliedClick={mockOnAppliedClick} />)

      expect(screen.getByRole('link', { name: 'Edit' })).toHaveAttribute(
        'href',
        '/jobs/job-123/edit',
      )
    })
  })
})
