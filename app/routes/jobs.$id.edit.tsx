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

  const [job, notes] = await Promise.all([
    jobOpeningRepository.findById(id),
    jobNoteRepository.findByJobId(id),
  ])

  if (!job) {
    throw new Response('Not Found', { status: 404 })
  }

  return { job, notes }
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

  if (intent === 'createNote') {
    const content = formData.get('content') as string
    await jobNoteRepository.create({ jobOpeningId: id, content })
    return { success: true }
  }

  if (intent === 'updateNote') {
    const noteId = formData.get('noteId') as string
    const content = formData.get('content') as string
    await jobNoteRepository.update(noteId, { content })
    return { success: true }
  }

  if (intent === 'deleteNote') {
    const noteId = formData.get('noteId') as string
    await jobNoteRepository.delete(noteId)
    return { success: true }
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
  const { job, notes } = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()
  const [notesPanelOpen, setNotesPanelOpen] = useState(false)

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Edit Job Opening</h1>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setNotesPanelOpen(true)}
          >
            Notes ({notes.length})
          </Button>
          <Form method="post">
            <input type="hidden" name="intent" value="delete" />
            <Button type="submit" variant="destructive">
              Delete
            </Button>
          </Form>
        </div>
      </div>
      <JobForm job={job} errors={actionData?.errors} />

      <NotesPanel
        jobId={job.id}
        jobTitle={job.title}
        jobCompany={job.company}
        notes={notes}
        isOpen={notesPanelOpen}
        onClose={() => setNotesPanelOpen(false)}
      />
    </div>
  )
}
