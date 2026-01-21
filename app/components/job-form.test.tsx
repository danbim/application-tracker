import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { createMockJobOpening, render, screen } from '~/test-utils'
import { JobForm } from './job-form'

// Mock react-router Form
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router')
  return {
    ...actual,
    Form: ({
      children,
      ...props
    }: { children: React.ReactNode } & Record<string, unknown>) => (
      <form {...props}>{children}</form>
    ),
  }
})

// Mock react-markdown
vi.mock('react-markdown', () => ({
  default: ({ children }: { children: string }) => (
    <div data-testid="markdown-preview">{children}</div>
  ),
}))

describe('JobForm', () => {
  describe('basic information section', () => {
    it('renders title input', () => {
      render(<JobForm />)
      expect(screen.getByLabelText(/Job Title/)).toBeInTheDocument()
    })

    it('renders company input', () => {
      render(<JobForm />)
      expect(screen.getByLabelText(/Company/)).toBeInTheDocument()
    })

    it('renders description textarea', () => {
      render(<JobForm />)
      expect(screen.getByLabelText(/Description/)).toBeInTheDocument()
    })

    it('renders track select', () => {
      render(<JobForm />)
      expect(screen.getByText('Select track')).toBeInTheDocument()
    })

    it('renders location input', () => {
      render(<JobForm />)
      expect(screen.getByLabelText(/City\/Region/)).toBeInTheDocument()
    })

    it('renders country select', () => {
      render(<JobForm />)
      expect(screen.getByText('Select country')).toBeInTheDocument()
    })

    it('renders posting URL input', () => {
      render(<JobForm />)
      expect(screen.getByLabelText(/Posting URL/)).toBeInTheDocument()
    })

    it('renders date opened input', () => {
      render(<JobForm />)
      expect(screen.getByLabelText(/Date Opened/)).toBeInTheDocument()
    })

    it('renders wow checkbox', () => {
      render(<JobForm />)
      expect(screen.getByLabelText(/Wow Factor/)).toBeInTheDocument()
    })
  })

  describe('compensation section', () => {
    it('renders salary min input', () => {
      render(<JobForm />)
      expect(screen.getByLabelText(/Salary Min/)).toBeInTheDocument()
    })

    it('renders salary max input', () => {
      render(<JobForm />)
      expect(screen.getByLabelText(/Salary Max/)).toBeInTheDocument()
    })

    it('renders currency select', () => {
      render(<JobForm />)
      // Currency uses a Select component which doesn't link label to form control directly
      expect(screen.getByText(/Currency/)).toBeInTheDocument()
    })

    it('renders vacation days input', () => {
      render(<JobForm />)
      expect(screen.getByLabelText(/Vacation Days/)).toBeInTheDocument()
    })

    it('renders pension scheme input', () => {
      render(<JobForm />)
      expect(screen.getByLabelText(/Pension Scheme/)).toBeInTheDocument()
    })

    it('renders health insurance input', () => {
      render(<JobForm />)
      expect(screen.getByLabelText(/Health Insurance/)).toBeInTheDocument()
    })

    it('renders stock options input', () => {
      render(<JobForm />)
      expect(screen.getByLabelText(/Stock Options/)).toBeInTheDocument()
    })
  })

  describe('work location section', () => {
    it('renders work type select', () => {
      render(<JobForm />)
      expect(screen.getByText('Select work type')).toBeInTheDocument()
    })

    it('renders office distance input', () => {
      render(<JobForm />)
      expect(screen.getByLabelText(/Office Distance/)).toBeInTheDocument()
    })

    it('renders WFH days input', () => {
      render(<JobForm />)
      expect(screen.getByLabelText(/WFH Days per Week/)).toBeInTheDocument()
    })
  })

  describe('ratings section', () => {
    it('renders all 12 rating inputs', () => {
      render(<JobForm />)

      expect(screen.getByText('Positive Impact')).toBeInTheDocument()
      // "Compensation" appears twice (section header + rating), so use getAllByText
      expect(screen.getAllByText('Compensation').length).toBeGreaterThanOrEqual(
        1,
      )
      expect(
        screen.getByText('Role / Level of Responsibility'),
      ).toBeInTheDocument()
      expect(screen.getByText('Technologies')).toBeInTheDocument()
      expect(screen.getByText('Remote / Hybrid / Office')).toBeInTheDocument()
      expect(screen.getByText('Industry')).toBeInTheDocument()
      expect(screen.getByText('Engineering Culture')).toBeInTheDocument()
      expect(screen.getByText('Growth Potential')).toBeInTheDocument()
      expect(screen.getByText('Profile Match')).toBeInTheDocument()
      expect(screen.getByText('Company Size')).toBeInTheDocument()
      expect(screen.getByText('Stress Factor')).toBeInTheDocument()
      expect(screen.getByText('Job Security')).toBeInTheDocument()
    })
  })

  describe('form buttons', () => {
    it('renders Create button when no job provided', () => {
      render(<JobForm />)
      expect(
        screen.getByRole('button', { name: /Create Job Opening/ }),
      ).toBeInTheDocument()
    })

    it('renders Update button when job provided', () => {
      const job = createMockJobOpening()
      render(<JobForm job={job} />)
      expect(
        screen.getByRole('button', { name: /Update Job Opening/ }),
      ).toBeInTheDocument()
    })

    it('renders Cancel button', () => {
      render(<JobForm />)
      expect(screen.getByRole('button', { name: /Cancel/ })).toBeInTheDocument()
    })
  })

  describe('default values when editing', () => {
    it('pre-fills title from job', () => {
      const job = createMockJobOpening({ title: 'Senior Engineer' })
      render(<JobForm job={job} />)

      expect(screen.getByLabelText(/Job Title/)).toHaveValue('Senior Engineer')
    })

    it('pre-fills company from job', () => {
      const job = createMockJobOpening({ company: 'Acme Corp' })
      render(<JobForm job={job} />)

      expect(screen.getByLabelText(/Company/)).toHaveValue('Acme Corp')
    })

    it('pre-fills description from job', () => {
      const job = createMockJobOpening({ description: 'Great opportunity' })
      render(<JobForm job={job} />)

      expect(screen.getByLabelText(/Description/)).toHaveValue(
        'Great opportunity',
      )
    })

    it('pre-fills location from job', () => {
      const job = createMockJobOpening({ jobLocation: 'Berlin' })
      render(<JobForm job={job} />)

      expect(screen.getByLabelText(/City\/Region/)).toHaveValue('Berlin')
    })

    it('pre-fills salary min from job', () => {
      const job = createMockJobOpening({ salaryMin: 80000 })
      render(<JobForm job={job} />)

      expect(screen.getByLabelText(/Salary Min/)).toHaveValue(80000)
    })

    it('pre-checks wow checkbox when job has wow', () => {
      const job = createMockJobOpening({ wow: true })
      render(<JobForm job={job} />)

      expect(screen.getByLabelText(/Wow Factor/)).toBeChecked()
    })
  })

  describe('markdown preview', () => {
    it('shows preview toggle button', () => {
      render(<JobForm />)
      expect(
        screen.getByRole('button', { name: /Show Preview/ }),
      ).toBeInTheDocument()
    })

    it('toggles preview when button clicked', async () => {
      const user = userEvent.setup()
      render(<JobForm />)

      // Initially shows textarea
      expect(screen.getByLabelText(/Description/)).toBeInTheDocument()

      // Click to show preview
      await user.click(screen.getByRole('button', { name: /Show Preview/ }))
      expect(
        screen.getByRole('button', { name: /Hide Preview/ }),
      ).toBeInTheDocument()
    })

    it('shows markdown preview when preview enabled', async () => {
      const user = userEvent.setup()
      const job = createMockJobOpening({ description: '# Hello World' })
      render(<JobForm job={job} />)

      await user.click(screen.getByRole('button', { name: /Show Preview/ }))

      expect(screen.getByTestId('markdown-preview')).toBeInTheDocument()
    })
  })

  describe('error display', () => {
    it('shows title error when provided', () => {
      render(<JobForm errors={{ title: 'Title is required' }} />)
      expect(screen.getByText('Title is required')).toBeInTheDocument()
    })

    it('shows company error when provided', () => {
      render(<JobForm errors={{ company: 'Company is required' }} />)
      expect(screen.getByText('Company is required')).toBeInTheDocument()
    })

    it('shows description error when provided', () => {
      render(<JobForm errors={{ description: 'Description is required' }} />)
      expect(screen.getByText('Description is required')).toBeInTheDocument()
    })
  })

  describe('hidden inputs', () => {
    it('includes hidden input for wow checkbox with false value', () => {
      const { container } = render(<JobForm />)

      const hiddenWow = container.querySelector(
        'input[type="hidden"][name="wow"][value="false"]',
      )
      expect(hiddenWow).toBeInTheDocument()
    })
  })
})
