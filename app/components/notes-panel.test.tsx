import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '~/test-utils'
import { NotesPanel } from './notes-panel'

// Mock react-router's useFetcher
const mockLoad = vi.fn()
vi.mock('react-router', () => {
  let callCount = 0
  return {
    useFetcher: () => {
      callCount++
      // Odd calls = mutation fetcher, even calls = load fetcher
      if (callCount % 2 === 1) {
        return {
          state: 'idle',
          submit: vi.fn(),
          Form: ({
            children,
            ...props
          }: { children: ReactNode } & Record<string, unknown>) => (
            <form {...props}>{children}</form>
          ),
        }
      }
      return {
        state: 'idle',
        data: mockLoadData,
        load: mockLoad,
        Form: ({
          children,
          ...props
        }: { children: ReactNode } & Record<string, unknown>) => (
          <form {...props}>{children}</form>
        ),
      }
    },
    MemoryRouter: ({ children }: { children: ReactNode }) => children,
  }
})

let mockLoadData:
  | {
      notes: Array<{
        id: string
        jobOpeningId: string
        content: string
        createdAt: Date
        updatedAt: Date
      }>
    }
  | undefined

describe('NotesPanel', () => {
  const defaultProps = {
    jobId: '1',
    jobTitle: 'Software Engineer',
    jobCompany: 'Acme Corp',
    isOpen: true,
    onClose: vi.fn(),
  }

  beforeEach(() => {
    mockLoadData = undefined
    mockLoad.mockClear()
  })

  it('should display job title and company in header', () => {
    render(<NotesPanel {...defaultProps} />)

    expect(screen.getByText('Software Engineer')).toBeInTheDocument()
    expect(screen.getByText('Acme Corp')).toBeInTheDocument()
  })

  it('should display notes when loaded', () => {
    mockLoadData = {
      notes: [
        {
          id: '1',
          jobOpeningId: '1',
          content: 'First note',
          createdAt: new Date('2026-01-23T14:00:00'),
          updatedAt: new Date('2026-01-23T14:00:00'),
        },
      ],
    }

    render(<NotesPanel {...defaultProps} />)

    expect(screen.getByText('First note')).toBeInTheDocument()
  })

  it('should show empty state when no notes', () => {
    render(<NotesPanel {...defaultProps} />)

    expect(screen.getByText(/no notes yet/i)).toBeInTheDocument()
  })

  it('should not render when closed', () => {
    render(<NotesPanel {...defaultProps} isOpen={false} />)

    expect(screen.queryByText('Software Engineer')).not.toBeInTheDocument()
  })

  it('should call onClose when backdrop is clicked', () => {
    const onClose = vi.fn()
    render(<NotesPanel {...defaultProps} onClose={onClose} />)

    const backdrop = screen.getByTestId('notes-panel-backdrop')
    backdrop.click()

    expect(onClose).toHaveBeenCalled()
  })

  it('should call onClose when Escape key is pressed', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<NotesPanel {...defaultProps} onClose={onClose} />)

    await user.keyboard('{Escape}')

    expect(onClose).toHaveBeenCalled()
  })

  it('should enter edit mode when Edit button is clicked', async () => {
    const user = userEvent.setup()
    mockLoadData = {
      notes: [
        {
          id: '1',
          jobOpeningId: '1',
          content: 'Note to edit',
          createdAt: new Date('2026-01-23T14:00:00'),
          updatedAt: new Date('2026-01-23T14:00:00'),
        },
      ],
    }

    render(<NotesPanel {...defaultProps} />)

    const editButton = screen.getByRole('button', { name: 'Edit' })
    await user.click(editButton)

    // In edit mode, we should see the textarea with the note content and Save/Cancel buttons
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
    expect(screen.getByDisplayValue('Note to edit')).toBeInTheDocument()
  })

  it('should exit edit mode when Cancel button is clicked', async () => {
    const user = userEvent.setup()
    mockLoadData = {
      notes: [
        {
          id: '1',
          jobOpeningId: '1',
          content: 'Note to edit',
          createdAt: new Date('2026-01-23T14:00:00'),
          updatedAt: new Date('2026-01-23T14:00:00'),
        },
      ],
    }

    render(<NotesPanel {...defaultProps} />)

    // Enter edit mode
    const editButton = screen.getByRole('button', { name: 'Edit' })
    await user.click(editButton)

    // Verify we're in edit mode
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()

    // Click Cancel
    const cancelButton = screen.getByRole('button', { name: 'Cancel' })
    await user.click(cancelButton)

    // Should be back to view mode - Edit button should be visible again
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Cancel' }),
    ).not.toBeInTheDocument()
  })

  it('should have proper ARIA attributes for accessibility', () => {
    render(<NotesPanel {...defaultProps} />)

    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-labelledby', 'notes-panel-title')
    expect(dialog).toHaveAttribute('aria-modal', 'true')

    const title = screen.getByText('Software Engineer')
    expect(title).toHaveAttribute('id', 'notes-panel-title')

    const closeButton = screen.getByRole('button', {
      name: 'Close notes panel',
    })
    expect(closeButton).toBeInTheDocument()
  })

  it('should load notes from resource route when opened', () => {
    render(<NotesPanel {...defaultProps} />)

    expect(mockLoad).toHaveBeenCalledWith('/api/jobs/1/notes')
  })

  it('should set form action to resource route', () => {
    render(<NotesPanel {...defaultProps} />)

    const forms = document.querySelectorAll('form')
    const formsWithAction = Array.from(forms).filter(
      (f) => f.getAttribute('action') === '/api/jobs/1/notes',
    )
    expect(formsWithAction.length).toBeGreaterThan(0)
  })
})
