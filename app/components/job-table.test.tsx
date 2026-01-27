import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMockJobOpening, render, screen } from '~/test-utils'
import { JobTable } from './job-table'

// Mock react-router's useFetcher while keeping Link and MemoryRouter working
vi.mock('react-router', () => ({
  useFetcher: () => ({
    state: 'idle',
    submit: vi.fn(),
    Form: ({
      children,
      ...props
    }: { children: ReactNode } & Record<string, unknown>) => (
      <form {...props}>{children}</form>
    ),
  }),
  Link: ({
    children,
    to,
    ...props
  }: { children: ReactNode; to: string } & Record<string, unknown>) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  MemoryRouter: ({ children }: { children: ReactNode }) => children,
}))

describe('JobTable', () => {
  const mockOnAppliedClick = vi.fn()
  const mockOnRowClick = vi.fn()
  const emptyNoteCounts = new Map<string, number>()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('empty state', () => {
    it('shows empty message when no jobs', () => {
      render(
        <JobTable
          jobs={[]}
          noteCounts={emptyNoteCounts}
          onAppliedClick={mockOnAppliedClick}
          onRowClick={mockOnRowClick}
        />,
      )
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
      render(
        <JobTable
          jobs={jobs}
          noteCounts={emptyNoteCounts}
          onAppliedClick={mockOnAppliedClick}
          onRowClick={mockOnRowClick}
        />,
      )

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
      render(
        <JobTable
          jobs={jobs}
          noteCounts={emptyNoteCounts}
          onAppliedClick={mockOnAppliedClick}
          onRowClick={mockOnRowClick}
        />,
      )

      expect(screen.getByText(/Cool Job/)).toBeInTheDocument()
      expect(screen.getByText(/★/)).toBeInTheDocument()
    })

    it('renders status badge', () => {
      const jobs = [
        { job: createMockJobOpening({ status: 'applied' }), score: 10 },
      ]
      render(
        <JobTable
          jobs={jobs}
          noteCounts={emptyNoteCounts}
          onAppliedClick={mockOnAppliedClick}
          onRowClick={mockOnRowClick}
        />,
      )

      expect(screen.getByText('Applied')).toBeInTheDocument()
    })

    it('renders score', () => {
      const jobs = [{ job: createMockJobOpening(), score: 42 }]
      render(
        <JobTable
          jobs={jobs}
          noteCounts={emptyNoteCounts}
          onAppliedClick={mockOnAppliedClick}
          onRowClick={mockOnRowClick}
        />,
      )

      expect(screen.getByText('42')).toBeInTheDocument()
    })

    it('renders edit link', () => {
      const jobs = [{ job: createMockJobOpening({ id: 'job-123' }), score: 10 }]
      render(
        <JobTable
          jobs={jobs}
          noteCounts={emptyNoteCounts}
          onAppliedClick={mockOnAppliedClick}
          onRowClick={mockOnRowClick}
        />,
      )

      expect(screen.getByRole('link', { name: 'Edit' })).toHaveAttribute(
        'href',
        '/jobs/job-123/edit',
      )
    })
  })

  describe('note count badge', () => {
    it('displays note count badge when job has notes', () => {
      const jobs = [
        {
          job: createMockJobOpening({ id: 'job-1', title: 'Engineer' }),
          score: 10,
        },
      ]
      const noteCounts = new Map([['job-1', 3]])
      render(
        <JobTable
          jobs={jobs}
          noteCounts={noteCounts}
          onAppliedClick={mockOnAppliedClick}
          onRowClick={mockOnRowClick}
        />,
      )

      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('does not display badge when job has no notes', () => {
      const jobs = [
        {
          job: createMockJobOpening({ id: 'job-1', title: 'Engineer' }),
          score: 10,
        },
      ]
      render(
        <JobTable
          jobs={jobs}
          noteCounts={emptyNoteCounts}
          onAppliedClick={mockOnAppliedClick}
          onRowClick={mockOnRowClick}
        />,
      )

      // Badge with note count should not be present
      const badges = screen.queryAllByText(/^\d+$/)
      // Only the score badge (10) should be present, not a note count badge
      expect(badges.filter((b) => b.textContent !== '10')).toHaveLength(0)
    })
  })

  describe('row click', () => {
    it('calls onRowClick when row is clicked', async () => {
      const user = userEvent.setup()
      const jobs = [
        {
          job: createMockJobOpening({ id: 'job-1', title: 'Engineer' }),
          score: 10,
        },
      ]
      render(
        <JobTable
          jobs={jobs}
          noteCounts={emptyNoteCounts}
          onAppliedClick={mockOnAppliedClick}
          onRowClick={mockOnRowClick}
        />,
      )

      const row = screen.getByRole('row', { name: /Engineer/ })
      await user.click(row)

      expect(mockOnRowClick).toHaveBeenCalledWith('job-1')
    })
  })
})
