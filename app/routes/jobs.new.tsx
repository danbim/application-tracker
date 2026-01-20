import { redirect, useActionData } from 'react-router'
import { JobForm } from '~/components/job-form'
import { jobOpeningSchema } from '~/schemas/job-opening.schema'
import { jobOpeningRepository } from '~/services/index.server'
import type { Route } from './+types/jobs.new'

export function meta() {
  return [
    { title: 'Add Job Opening - Job Tracker' },
    { name: 'description', content: 'Create a new job opening' },
  ]
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData()
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

  await jobOpeningRepository.create(jobData)

  return redirect('/')
}

export default function NewJob() {
  const actionData = useActionData<typeof action>()

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">Add Job Opening</h1>
      <JobForm errors={actionData?.errors} />
    </div>
  )
}
