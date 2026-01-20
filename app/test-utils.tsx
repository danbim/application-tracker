import type { RenderOptions } from '@testing-library/react'
import { render } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { MemoryRouter } from 'react-router'
import type { JobOpening, ScoringFormula } from '~/db/schema'

// Custom render with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[]
}

function AllProviders({
  children,
  initialEntries = ['/'],
}: {
  children: ReactNode
  initialEntries?: string[]
}) {
  return <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
}

export function customRender(
  ui: ReactElement,
  options: CustomRenderOptions = {},
) {
  const { initialEntries, ...renderOptions } = options
  return render(ui, {
    wrapper: ({ children }) => (
      <AllProviders initialEntries={initialEntries}>{children}</AllProviders>
    ),
    ...renderOptions,
  })
}

// Re-export everything from testing-library
export * from '@testing-library/react'
export { customRender as render }

// Mock factories
export function createMockJobOpening(
  overrides: Partial<JobOpening> = {},
): JobOpening {
  return {
    id: 'test-job-id',
    title: 'Software Engineer',
    company: 'Test Company',
    description: 'A great job opportunity',
    jobLocation: 'Berlin',
    country: 'DE',
    postingUrl: 'https://example.com/job',
    dateOpened: '2026-01-15',
    dateAdded: new Date('2026-01-15T10:00:00Z'),
    wow: false,
    track: 'engineering',
    applicationSent: false,
    applicationSentDate: null,
    salaryMin: 70000,
    salaryMax: 90000,
    salaryCurrency: 'EUR',
    pensionScheme: '5% match',
    healthInsurance: 'Full coverage',
    stockOptions: null,
    vacationDays: 30,
    workLocation: 'hybrid',
    officeDistanceKm: 10,
    wfhDaysPerWeek: 3,
    ratingImpact: null,
    ratingCompensation: null,
    ratingRole: null,
    ratingTech: null,
    ratingLocation: null,
    ratingIndustry: null,
    ratingCulture: null,
    ratingGrowth: null,
    ratingProfileMatch: null,
    ratingCompanySize: null,
    ratingStress: null,
    ratingJobSecurity: null,
    createdAt: new Date('2026-01-15T10:00:00Z'),
    updatedAt: new Date('2026-01-15T10:00:00Z'),
    ...overrides,
  }
}

export function createMockScoringFormula(
  overrides: Partial<ScoringFormula> = {},
): ScoringFormula {
  return {
    id: 'test-formula-id',
    name: 'Test Formula',
    weights: {
      impact: 1,
      compensation: 1,
      role: 1,
      tech: 1,
      location: 1,
      industry: 1,
      culture: 1,
      growth: 1,
      profileMatch: 1,
      companySize: 1,
      stress: 1,
      jobSecurity: 1,
      wowBoost: 5,
    },
    createdAt: new Date('2026-01-15T10:00:00Z'),
    updatedAt: new Date('2026-01-15T10:00:00Z'),
    ...overrides,
  }
}

// Mock for useFetcher
export function createMockFetcher(overrides: Record<string, unknown> = {}) {
  return {
    state: 'idle' as const,
    data: undefined,
    formData: undefined,
    formAction: undefined,
    formMethod: undefined,
    submit: vi.fn(),
    load: vi.fn(),
    Form: ({ children, ...props }: { children: ReactNode } & Record<string, unknown>) => (
      <form {...props}>{children}</form>
    ),
    ...overrides,
  }
}
