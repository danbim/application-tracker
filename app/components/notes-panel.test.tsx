import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { NotesPanel } from './notes-panel'

function renderWithRouter(ui: React.ReactElement) {
  const router = createMemoryRouter(
    [{ path: '/', element: ui, action: () => null }],
    { initialEntries: ['/'] },
  )
  return render(<RouterProvider router={router} />)
}

describe('NotesPanel', () => {
  it('should display job title and company in header', () => {
    renderWithRouter(
      <NotesPanel
        jobId="1"
        jobTitle="Software Engineer"
        jobCompany="Acme Corp"
        notes={[]}
        isOpen={true}
        onClose={() => {}}
      />,
    )

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

    renderWithRouter(
      <NotesPanel
        jobId="1"
        jobTitle="Software Engineer"
        jobCompany="Acme Corp"
        notes={notes}
        isOpen={true}
        onClose={() => {}}
      />,
    )

    expect(screen.getByText('First note')).toBeInTheDocument()
  })

  it('should show empty state when no notes', () => {
    renderWithRouter(
      <NotesPanel
        jobId="1"
        jobTitle="Software Engineer"
        jobCompany="Acme Corp"
        notes={[]}
        isOpen={true}
        onClose={() => {}}
      />,
    )

    expect(screen.getByText(/no notes yet/i)).toBeInTheDocument()
  })

  it('should not render when closed', () => {
    renderWithRouter(
      <NotesPanel
        jobId="1"
        jobTitle="Software Engineer"
        jobCompany="Acme Corp"
        notes={[]}
        isOpen={false}
        onClose={() => {}}
      />,
    )

    expect(screen.queryByText('Software Engineer')).not.toBeInTheDocument()
  })

  it('should call onClose when backdrop is clicked', () => {
    const onClose = vi.fn()
    renderWithRouter(
      <NotesPanel
        jobId="1"
        jobTitle="Software Engineer"
        jobCompany="Acme Corp"
        notes={[]}
        isOpen={true}
        onClose={onClose}
      />,
    )

    const backdrop = screen.getByTestId('notes-panel-backdrop')
    backdrop.click()

    expect(onClose).toHaveBeenCalled()
  })
})
