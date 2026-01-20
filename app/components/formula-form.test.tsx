import { render, screen } from '~/test-utils'
import { createMockScoringFormula } from '~/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { FormulaForm } from './formula-form'

// Mock react-router Form
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router')
  return {
    ...actual,
    Form: ({ children, ...props }: { children: React.ReactNode } & Record<string, unknown>) => (
      <form {...props}>{children}</form>
    ),
  }
})

describe('FormulaForm', () => {
  describe('formula details section', () => {
    it('renders formula name input', () => {
      render(<FormulaForm />)
      expect(screen.getByLabelText(/Formula Name/)).toBeInTheDocument()
    })

    it('shows placeholder text for name input', () => {
      render(<FormulaForm />)
      expect(screen.getByPlaceholderText(/Professional Growth/)).toBeInTheDocument()
    })
  })

  describe('weight fields', () => {
    it('renders all 13 weight inputs', () => {
      render(<FormulaForm />)

      expect(screen.getByLabelText('Positive Impact')).toBeInTheDocument()
      expect(screen.getByLabelText('Compensation')).toBeInTheDocument()
      expect(screen.getByLabelText('Role / Level of Responsibility')).toBeInTheDocument()
      expect(screen.getByLabelText('Technologies')).toBeInTheDocument()
      expect(screen.getByLabelText('Remote / Hybrid / Office')).toBeInTheDocument()
      expect(screen.getByLabelText('Industry')).toBeInTheDocument()
      expect(screen.getByLabelText('Engineering Culture')).toBeInTheDocument()
      expect(screen.getByLabelText('Growth Potential')).toBeInTheDocument()
      expect(screen.getByLabelText('Profile Match')).toBeInTheDocument()
      expect(screen.getByLabelText('Company Size')).toBeInTheDocument()
      expect(screen.getByLabelText('Stress Factor')).toBeInTheDocument()
      expect(screen.getByLabelText('Job Security')).toBeInTheDocument()
      expect(screen.getByLabelText('Wow Boost')).toBeInTheDocument()
    })

    it('weight inputs are number type', () => {
      render(<FormulaForm />)

      const impactInput = screen.getByLabelText('Positive Impact')
      expect(impactInput).toHaveAttribute('type', 'number')
    })

    it('weight inputs default to 1 when no formula provided', () => {
      render(<FormulaForm />)

      const impactInput = screen.getByLabelText('Positive Impact')
      expect(impactInput).toHaveValue(1)
    })

    it('weight inputs accept negative values (no min constraint)', () => {
      render(<FormulaForm />)

      const stressInput = screen.getByLabelText('Stress Factor')
      expect(stressInput).not.toHaveAttribute('min')
    })

    it('shows help text about negative weights', () => {
      render(<FormulaForm />)

      expect(screen.getByText(/negative weights decrease it/i)).toBeInTheDocument()
    })
  })

  describe('form buttons', () => {
    it('renders Create button when no formula provided', () => {
      render(<FormulaForm />)
      expect(screen.getByRole('button', { name: /Create Formula/ })).toBeInTheDocument()
    })

    it('renders Update button when formula provided', () => {
      const formula = createMockScoringFormula()
      render(<FormulaForm formula={formula} />)
      expect(screen.getByRole('button', { name: /Update Formula/ })).toBeInTheDocument()
    })

    it('renders Cancel button', () => {
      render(<FormulaForm />)
      expect(screen.getByRole('button', { name: /Cancel/ })).toBeInTheDocument()
    })
  })

  describe('default values when editing', () => {
    it('pre-fills name from formula', () => {
      const formula = createMockScoringFormula({ name: 'My Custom Formula' })
      render(<FormulaForm formula={formula} />)

      expect(screen.getByLabelText(/Formula Name/)).toHaveValue('My Custom Formula')
    })

    it('pre-fills weights from formula', () => {
      const formula = createMockScoringFormula({
        weights: {
          impact: 5,
          compensation: 3,
          role: 2,
          tech: 4,
          location: 1,
          industry: 0,
          culture: 2,
          growth: 3,
          profileMatch: 4,
          companySize: 1,
          stress: -2,
          jobSecurity: 2,
          wowBoost: 10,
        },
      })
      render(<FormulaForm formula={formula} />)

      expect(screen.getByLabelText('Positive Impact')).toHaveValue(5)
      expect(screen.getByLabelText('Compensation')).toHaveValue(3)
      expect(screen.getByLabelText('Stress Factor')).toHaveValue(-2)
      expect(screen.getByLabelText('Wow Boost')).toHaveValue(10)
    })
  })

  describe('error display', () => {
    it('shows name error when provided', () => {
      render(<FormulaForm errors={{ name: 'Name is required' }} />)
      expect(screen.getByText('Name is required')).toBeInTheDocument()
    })
  })

  describe('input names for form submission', () => {
    it('uses nested names for weights (weights.key)', () => {
      const { container } = render(<FormulaForm />)

      expect(container.querySelector('input[name="weights.impact"]')).toBeInTheDocument()
      expect(container.querySelector('input[name="weights.compensation"]')).toBeInTheDocument()
      expect(container.querySelector('input[name="weights.wowBoost"]')).toBeInTheDocument()
    })
  })
})
