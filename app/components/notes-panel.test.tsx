import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '~/test-utils'
import { NotesPanel } from './notes-panel'

// Mock react-router's useFetcher
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
  MemoryRouter: ({ children }: { children: ReactNode }) => children,
}))

describe('NotesPanel', () => {
  const defaultProps = {
    jobId: '1',
    jobTitle: 'Software Engineer',
    jobCompany: 'Acme Corp',
    notes: [] as {
      id: string
      jobOpeningId: string
      content: string
      createdAt: Date
      updatedAt: Date
    }[],
    isOpen: true,
    onClose: vi.fn(),
  }

  it('should display job title and company in header', () => {
    render(<NotesPanel {...defaultProps} />)

    expect(screen.getByText('Software Engineer')).toBeInTheDocument()
    expect(screen.getByText('Acme Corp')).toBeInTheDocument()
  })

  it('should display notes in the list', () => {
    const notes = [
      {
        id: '1',
        jobOpeningId: '1',
        content: 'First note',
        createdAt: new Date('2026-01-23T14:00:00'),
        updatedAt: new Date('2026-01-23T14:00:00'),
      },
    ]

    render(<NotesPanel {...defaultProps} notes={notes} />)

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
    const notes = [
      {
        id: '1',
        jobOpeningId: '1',
        content: 'Note to edit',
        createdAt: new Date('2026-01-23T14:00:00'),
        updatedAt: new Date('2026-01-23T14:00:00'),
      },
    ]

    render(<NotesPanel {...defaultProps} notes={notes} />)

    const editButton = screen.getByRole('button', { name: 'Edit' })
    await user.click(editButton)

    // In edit mode, we should see the textarea with the note content and Save/Cancel buttons
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
    expect(screen.getByDisplayValue('Note to edit')).toBeInTheDocument()
  })

  it('should exit edit mode when Cancel button is clicked', async () => {
    const user = userEvent.setup()
    const notes = [
      {
        id: '1',
        jobOpeningId: '1',
        content: 'Note to edit',
        createdAt: new Date('2026-01-23T14:00:00'),
        updatedAt: new Date('2026-01-23T14:00:00'),
      },
    ]

    render(<NotesPanel {...defaultProps} notes={notes} />)

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
})
