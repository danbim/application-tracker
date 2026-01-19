import type { Route } from "./+types/jobs.$id.edit";
import { redirect, useLoaderData, useActionData, Form } from "react-router";
import { Button } from "~/components/ui/button";
import { JobForm } from "~/components/job-form";
import { jobOpeningSchema } from "~/schemas/job-opening.schema";
import { jobOpeningRepository } from "~/services/index.server";

export function meta({ data }: Route.MetaArgs) {
  return [
    { title: data?.job ? `Edit ${data.job.title} - Job Tracker` : "Edit Job - Job Tracker" },
    { name: "description", content: "Edit job opening details" },
  ];
}

export async function loader({ params }: Route.LoaderArgs) {
  const job = await jobOpeningRepository.findById(params.id!);

  if (!job) {
    throw new Response("Not Found", { status: 404 });
  }

  return { job };
}

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "delete") {
    await jobOpeningRepository.delete(params.id!);
    return redirect("/");
  }

  // Update handling - same validation as new job route
  const data = Object.fromEntries(formData);
  const result = jobOpeningSchema.safeParse(data);

  if (!result.success) {
    const errors: Record<string, string> = {};
    result.error.issues.forEach((issue) => {
      errors[issue.path[0] as string] = issue.message;
    });
    return { errors };
  }

  // Transform empty strings to null for optional fields
  const jobData = {
    ...result.data,
    jobLocation: result.data.jobLocation || null,
    country: result.data.country || null,
    postingUrl: result.data.postingUrl || null,
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
  };

  await jobOpeningRepository.update(params.id!, jobData);

  return redirect("/");
}

export default function EditJob() {
  const { job } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Edit Job Opening</h1>
        <Form method="post">
          <input type="hidden" name="intent" value="delete" />
          <Button type="submit" variant="destructive">
            Delete
          </Button>
        </Form>
      </div>
      <JobForm job={job} errors={actionData?.errors} />
    </div>
  );
}
