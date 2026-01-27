import { useState } from 'react'
import { Link, useLoaderData, useSearchParams } from 'react-router'
import { ApplicationDialog } from '~/components/application-dialog'
import { JobTable } from '~/components/job-table'
import { NotesPanel } from '~/components/notes-panel'
import { StatusTabs } from '~/components/status-tabs'
import { Button } from '~/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { ACTIVE_STATUSES, type ApplicationStatus } from '~/db/schema'
import {
  jobNoteRepository,
  jobOpeningRepository,
  scoringFormulaRepository,
  scoringService,
} from '~/services/index.server'
import type { RankedJobOpening } from '~/services/scoring.service'
import type { Route } from './+types/home'

const COUNTRIES: Record<string, string> = {
  DE: 'Germany',
  GB: 'United Kingdom',
  NL: 'Netherlands',
  FR: 'France',
  CH: 'Switzerland',
  AT: 'Austria',
  BE: 'Belgium',
  ES: 'Spain',
  IT: 'Italy',
  PL: 'Poland',
  SE: 'Sweden',
  DK: 'Denmark',
  NO: 'Norway',
  FI: 'Finland',
  IE: 'Ireland',
  PT: 'Portugal',
  US: 'United States',
  CA: 'Canada',
}

export function meta() {
  return [
    { title: 'Job Openings - Job Tracker' },
    { name: 'description', content: 'Track and manage your job applications' },
  ]
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url)

  const formulaParam = url.searchParams.get('formula')
  const sortParam = url.searchParams.get('sort') || 'score'
  const countryParam = url.searchParams.get('country')
  const wowParam = url.searchParams.get('wow')
  const trackParam = url.searchParams.get('track')
  const statusParam = url.searchParams.get('status') || 'active'

  const [allJobs, formulas, statusCounts] = await Promise.all([
    jobOpeningRepository.findAll(),
    scoringFormulaRepository.findAll(),
    jobOpeningRepository.countByStatus(),
  ])

  // Get unique countries from all jobs for the filter dropdown
  const availableCountries = [
    ...new Set(allJobs.map((job) => job.country).filter(Boolean)),
  ].sort() as string[]

  // Check if any jobs have wow factor
  const hasWowJobs = allJobs.some((job) => job.wow)

  // Filter jobs by status
  let jobs = allJobs
  if (statusParam === 'active') {
    jobs = jobs.filter((job) => ACTIVE_STATUSES.includes(job.status))
  } else {
    jobs = jobs.filter((job) => job.status === statusParam)
  }

  // Filter jobs by country, wow, and track if specified
  if (countryParam && countryParam !== 'all') {
    jobs = jobs.filter((job) => job.country === countryParam)
  }
  if (wowParam === 'true') {
    jobs = jobs.filter((job) => job.wow)
  }
  if (trackParam && trackParam !== 'all') {
    jobs = jobs.filter((job) => job.track === trackParam)
  }

  let rankedJobs: RankedJobOpening[]
  let selectedFormulaId: string | null = null

  if (formulas.length > 0) {
    // Use specified formula or default to first one
    const selectedFormula = formulaParam
      ? formulas.find((f) => f.id === formulaParam) || formulas[0]
      : formulas[0]
    selectedFormulaId = selectedFormula.id

    rankedJobs = scoringService.rankJobOpenings(jobs, selectedFormula)
  } else {
    // No formulas - just list jobs with score 0
    rankedJobs = jobs.map((job) => ({ job, score: 0 }))
  }

  // Sort by date if requested (default is already by score from rankJobOpenings)
  if (sortParam === 'date') {
    rankedJobs.sort((a, b) => {
      const dateA = new Date(a.job.dateAdded).getTime()
      const dateB = new Date(b.job.dateAdded).getTime()
      return dateB - dateA // newest first
    })
  }

  // Fetch note counts for all jobs
  const jobIds = allJobs.map((job) => job.id)
  const noteCounts = await jobNoteRepository.countByJobIds(jobIds)

  return {
    jobs: rankedJobs,
    formulas,
    selectedFormulaId,
    sortBy: sortParam,
    availableCountries,
    selectedCountry: countryParam || 'all',
    hasWowJobs,
    wowFilter: wowParam === 'true',
    selectedTrack: trackParam || 'all',
    selectedStatus: statusParam,
    statusCounts,
    noteCounts: Object.fromEntries(noteCounts),
  }
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData()
  const intent = formData.get('intent')

  if (intent === 'updateStatus') {
    const jobId = formData.get('jobId') as string
    const status = formData.get('status') as ApplicationStatus
    const date = formData.get('date') as string | null

    await jobOpeningRepository.updateStatus(jobId, status, date)

    return { success: true }
  }

  return { success: false }
}

export default function Home() {
  const {
    jobs,
    formulas,
    selectedFormulaId,
    sortBy,
    availableCountries,
    selectedCountry,
    hasWowJobs,
    wowFilter,
    selectedTrack,
    selectedStatus,
    statusCounts,
    noteCounts: noteCountsObj,
  } = useLoaderData<typeof loader>()

  const noteCounts = new Map(Object.entries(noteCountsObj || {}))

  const [searchParams, setSearchParams] = useSearchParams()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [notesPanelJobId, setNotesPanelJobId] = useState<string | null>(null)

  const selectedJob = selectedJobId
    ? jobs.find((j) => j.job.id === selectedJobId)?.job
    : null

  const notesPanelJob = notesPanelJobId
    ? jobs.find((j) => j.job.id === notesPanelJobId)?.job
    : null

  const handleAppliedClick = (jobId: string) => {
    setSelectedJobId(jobId)
    setDialogOpen(true)
  }

  const handleRowClick = (jobId: string) => {
    setNotesPanelJobId(jobId)
  }

  const closeNotesPanel = () => {
    setNotesPanelJobId(null)
  }

  const updateFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams)
    if (value === '' || value === 'all') {
      newParams.delete(key)
    } else {
      newParams.set(key, value)
    }
    setSearchParams(newParams)
  }

  const toggleWow = () => {
    const newParams = new URLSearchParams(searchParams)
    if (wowFilter) {
      newParams.delete('wow')
    } else {
      newParams.set('wow', 'true')
    }
    setSearchParams(newParams)
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Job Openings</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/sites">Sites</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/formulas">Manage Formulas</Link>
          </Button>
          <Button asChild>
            <Link to="/jobs/new">Add Job</Link>
          </Button>
        </div>
      </div>

      {formulas.length === 0 && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-yellow-800">
            No scoring formulas found. Jobs will be listed without scores.{' '}
            <Link to="/formulas/new" className="underline font-medium">
              Create a formula
            </Link>{' '}
            to start scoring your job opportunities.
          </p>
        </div>
      )}

      <div className="mb-6">
        <StatusTabs selectedStatus={selectedStatus} counts={statusCounts} />
      </div>

      <div className="flex gap-4 mb-6 flex-wrap items-center">
        {formulas.length > 0 && (
          <div className="flex gap-2 items-center">
            <label htmlFor="formula-select" className="text-sm font-medium">
              Formula:
            </label>
            <Select
              value={selectedFormulaId || undefined}
              onValueChange={(value) => updateFilter('formula', value)}
            >
              <SelectTrigger id="formula-select" className="w-[200px]">
                <SelectValue placeholder="Select formula" />
              </SelectTrigger>
              <SelectContent>
                {formulas.map((formula) => (
                  <SelectItem key={formula.id} value={formula.id}>
                    {formula.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex gap-2 items-center">
          <label htmlFor="sort-select" className="text-sm font-medium">
            Sort:
          </label>
          <Select
            value={sortBy}
            onValueChange={(value) => updateFilter('sort', value)}
          >
            <SelectTrigger id="sort-select" className="w-[150px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="score">Score</SelectItem>
              <SelectItem value="date">Date Added</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {availableCountries.length > 0 && (
          <div className="flex gap-2 items-center">
            <label htmlFor="country-select" className="text-sm font-medium">
              Country:
            </label>
            <Select
              value={selectedCountry}
              onValueChange={(value) => updateFilter('country', value)}
            >
              <SelectTrigger id="country-select" className="w-[180px]">
                <SelectValue placeholder="Filter by country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Countries</SelectItem>
                {availableCountries.map((code) => (
                  <SelectItem key={code} value={code}>
                    {COUNTRIES[code] || code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex gap-2 items-center">
          <label htmlFor="track-select" className="text-sm font-medium">
            Track:
          </label>
          <Select
            value={selectedTrack}
            onValueChange={(value) => updateFilter('track', value)}
          >
            <SelectTrigger id="track-select" className="w-[150px]">
              <SelectValue placeholder="Filter by track" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tracks</SelectItem>
              <SelectItem value="engineering">Engineering</SelectItem>
              <SelectItem value="management">Management</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {hasWowJobs && (
          <Button
            type="button"
            variant={wowFilter ? 'default' : 'outline'}
            size="sm"
            onClick={toggleWow}
          >
            {wowFilter ? '★ Wow Only' : '☆ Show Wow'}
          </Button>
        )}
      </div>

      <JobTable
        jobs={jobs}
        noteCounts={noteCounts}
        onAppliedClick={handleAppliedClick}
        onRowClick={handleRowClick}
      />

      <ApplicationDialog
        jobId={selectedJobId}
        jobTitle={selectedJob?.title}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />

      {notesPanelJob && (
        <NotesPanel
          jobId={notesPanelJob.id}
          jobTitle={notesPanelJob.title}
          jobCompany={notesPanelJob.company}
          isOpen={!!notesPanelJobId}
          onClose={closeNotesPanel}
        />
      )}
    </div>
  )
}
