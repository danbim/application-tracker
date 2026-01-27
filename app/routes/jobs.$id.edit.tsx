import { useState } from 'react'
import { Form, redirect, useActionData, useLoaderData } from 'react-router'
import { JobForm } from '~/components/job-form'
import { NotesPanel } from '~/components/notes-panel'
import { Button } from '~/components/ui/button'
import { jobOpeningSchema } from '~/schemas/job-opening.schema'
import {
  jobNoteRepository,
  jobOpeningRepository,
} from '~/services/index.server'
import type { Route } from './+types/jobs.$id.edit'

export function meta({ data }: Route.MetaArgs) {
  return [
    {
      title: data?.job
        ? `Edit ${data.job.title} - Job Tracker`
        : 'Edit Job - Job Tracker',
    },
    { name: 'description', content: 'Edit job opening details' },
  ]
}

export async function loader({ params }: Route.LoaderArgs) {
  const { id } = params
  if (!id) {
    throw new Response('Bad Request', { status: 400 })
  }

  const [job, noteCounts] = await Promise.all([
    jobOpeningRepository.findById(id),
    jobNoteRepository.countByJobIds([id]),
  ])

  if (!job) {
    throw new Response('Not Found', { status: 404 })
  }

  return { job, noteCount: noteCounts.get(id) ?? 0 }
}

export async function action({ request, params }: Route.ActionArgs) {
  const { id } = params
  if (!id) {
    throw new Response('Bad Request', { status: 400 })
  }

  const formData = await request.formData()
  const intent = formData.get('intent')

  if (intent === 'delete') {
    await jobOpeningRepository.delete(id)
    return redirect('/')
  }

  // Update handling - same validation as new job route
  const data = {
    ...Object.fromEntries(formData),
    // Handle checkbox: if checked, last value is "true"; use getAll to check
    wow: formData.getAll('wow').includes('true'),
  }
  const result = jobOpeningSchema.safeParse(data)

  if (!result.success) {
    const errors: Record<string, string> = {}
    result.error.issues.forEach((issue) => {
      errors[issue.path[0] as string] = issue.message
    })
    return { errors }
  }

  // Transform empty strings to null for optional fields
  const jobData = {
    ...result.data,
    jobLocation: result.data.jobLocation || null,
    country: result.data.country || null,
    postingUrl: result.data.postingUrl || null,
    track: result.data.track || null,
    dateOpened: result.data.dateOpened || null,
    salaryMin: result.data.salaryMin || null,
    salaryMax: result.data.salaryMax || null,
    salaryCurrency: result.data.salaryCurrency || null,
    pensionScheme: result.data.pensionScheme || null,
    healthInsurance: result.data.healthInsurance || null,
    stockOptions: result.data.stockOptions || null,
    vacationDays: result.data.vacationDays || null,
    workLocation: result.data.workLocation || null,
    officeDistanceKm: result.data.officeDistanceKm || null,
    wfhDaysPerWeek: result.data.wfhDaysPerWeek || null,
  }

  await jobOpeningRepository.update(id, jobData)

  return redirect('/')
}

export default function EditJob() {
  const { job, noteCount } = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()
  const [notesPanelOpen, setNotesPanelOpen] = useState(false)

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <JobForm
        job={job}
        errors={actionData?.errors}
        headerActions={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setNotesPanelOpen(true)}
            >
              Notes ({noteCount})
            </Button>
            <Form method="post">
              <input type="hidden" name="intent" value="delete" />
              <Button type="submit" variant="destructive">
                Delete
              </Button>
            </Form>
          </>
        }
      />

      <NotesPanel
        jobId={job.id}
        jobTitle={job.title}
        jobCompany={job.company}
        isOpen={notesPanelOpen}
        onClose={() => setNotesPanelOpen(false)}
      />
    </div>
  )
}
