import userEvent from '@testing-library/user-event'
import { render, screen } from '~/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApplicationDialog } from './application-dialog'

// Mock react-router's useFetcher
const mockSubmit = vi.fn()
let mockFetcherState = 'idle'

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router')
  return {
    ...actual,
    useFetcher: () => ({
      state: mockFetcherState,
      submit: mockSubmit,
      Form: ({ children, ...props }: { children: React.ReactNode } & Record<string, unknown>) => (
        <form {...props}>{children}</form>
      ),
    }),
  }
})

describe('ApplicationDialog', () => {
  const mockOnOpenChange = vi.fn()

  beforeEach(() => {
    mockOnOpenChange.mockClear()
    mockSubmit.mockClear()
    mockFetcherState = 'idle'
  })

  describe('rendering', () => {
    it('renders dialog title', () => {
      render(
        <ApplicationDialog
          jobId="job-123"
          jobTitle="Software Engineer"
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      expect(screen.getByText('Mark Application Sent')).toBeInTheDocument()
    })

    it('shows job title in the dialog', () => {
      render(
        <ApplicationDialog
          jobId="job-123"
          jobTitle="Senior Developer"
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      expect(screen.getByText(/Senior Developer/)).toBeInTheDocument()
    })

    it('renders date input with today as default', () => {
      render(
        <ApplicationDialog
          jobId="job-123"
          jobTitle="Test Job"
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      const dateInput = screen.getByLabelText('Application Date')
      expect(dateInput).toBeInTheDocument()
      expect(dateInput).toHaveAttribute('type', 'date')

      // Check it defaults to today
      const today = new Date().toISOString().split('T')[0]
      expect(dateInput).toHaveValue(today)
    })

    it('renders Cancel and Confirm buttons', () => {
      render(
        <ApplicationDialog
          jobId="job-123"
          jobTitle="Test Job"
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument()
    })
  })

  describe('hidden inputs', () => {
    it('includes hidden input for intent with updateStatus value', () => {
      render(
        <ApplicationDialog
          jobId="job-123"
          jobTitle="Test Job"
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      // Dialog content is rendered in a portal, so we search the whole document
      const intentInput = document.querySelector('input[name="intent"][value="updateStatus"]')
      expect(intentInput).toBeInTheDocument()
    })

    it('includes hidden input for status with applied value', () => {
      render(
        <ApplicationDialog
          jobId="job-123"
          jobTitle="Test Job"
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      // Dialog content is rendered in a portal, so we search the whole document
      const statusInput = document.querySelector('input[name="status"][value="applied"]')
      expect(statusInput).toBeInTheDocument()
    })

    it('includes hidden input for jobId', () => {
      render(
        <ApplicationDialog
          jobId="job-456"
          jobTitle="Test Job"
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      // Dialog content is rendered in a portal, so we search the whole document
      const jobIdInput = document.querySelector('input[name="jobId"][value="job-456"]')
      expect(jobIdInput).toBeInTheDocument()
    })
  })

  describe('cancel button', () => {
    it('calls onOpenChange(false) when Cancel is clicked', async () => {
      const user = userEvent.setup()

      render(
        <ApplicationDialog
          jobId="job-123"
          jobTitle="Test Job"
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      await user.click(screen.getByRole('button', { name: 'Cancel' }))

      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    })
  })

  describe('dialog state', () => {
    it('does not render content when open is false', () => {
      render(
        <ApplicationDialog
          jobId="job-123"
          jobTitle="Test Job"
          open={false}
          onOpenChange={mockOnOpenChange}
        />
      )

      expect(screen.queryByText('Mark Application Sent')).not.toBeInTheDocument()
    })

    it('closes dialog when fetcher transitions from submitting to idle', () => {
      // Start with dialog open and fetcher idle
      const { rerender } = render(
        <ApplicationDialog
          jobId="job-123"
          jobTitle="Test Job"
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      // Transition to submitting (user submitted form)
      mockFetcherState = 'submitting'
      rerender(
        <ApplicationDialog
          jobId="job-123"
          jobTitle="Test Job"
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      // onOpenChange should not be called yet
      expect(mockOnOpenChange).not.toHaveBeenCalled()

      // Transition to idle (submission complete)
      mockFetcherState = 'idle'
      rerender(
        <ApplicationDialog
          jobId="job-123"
          jobTitle="Test Job"
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    })
  })

  describe('submit button state', () => {
    it('disables submit button and shows Saving... when fetcher is submitting', () => {
      mockFetcherState = 'submitting'

      render(
        <ApplicationDialog
          jobId="job-123"
          jobTitle="Test Job"
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      const button = screen.getByRole('button', { name: /saving/i })
      expect(button).toBeDisabled()
    })

    it('enables submit button and shows Confirm when fetcher is idle', () => {
      mockFetcherState = 'idle'

      render(
        <ApplicationDialog
          jobId="job-123"
          jobTitle="Test Job"
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      const button = screen.getByRole('button', { name: 'Confirm' })
      expect(button).not.toBeDisabled()
    })
  })
})
