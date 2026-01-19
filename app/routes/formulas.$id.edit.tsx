import type { Route } from "./+types/formulas.$id.edit";
import { redirect, useLoaderData, useActionData, Form } from "react-router";
import { Button } from "~/components/ui/button";
import { FormulaForm } from "~/components/formula-form";
import { scoringFormulaSchema } from "~/schemas/scoring-formula.schema";
import { scoringFormulaRepository } from "~/services/index.server";

export function meta({ data }: Route.MetaArgs) {
  return [
    { title: data?.formula ? `Edit ${data.formula.name} - Job Tracker` : "Edit Formula - Job Tracker" },
    { name: "description", content: "Edit scoring formula details" },
  ];
}

export async function loader({ params }: Route.LoaderArgs) {
  const formula = await scoringFormulaRepository.findById(params.id!);

  if (!formula) {
    throw new Response("Not Found", { status: 404 });
  }

  return { formula };
}

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "delete") {
    await scoringFormulaRepository.delete(params.id!);
    return redirect("/formulas");
  }

  // Parse nested weights data from form fields like "weights.impact", "weights.compensation", etc.
  const data = {
    name: formData.get("name"),
    weights: {
      impact: formData.get("weights.impact"),
      compensation: formData.get("weights.compensation"),
      role: formData.get("weights.role"),
      tech: formData.get("weights.tech"),
      location: formData.get("weights.location"),
      industry: formData.get("weights.industry"),
      culture: formData.get("weights.culture"),
      growth: formData.get("weights.growth"),
      profileMatch: formData.get("weights.profileMatch"),
      companySize: formData.get("weights.companySize"),
      stress: formData.get("weights.stress"),
    },
  };

  const result = scoringFormulaSchema.safeParse(data);

  if (!result.success) {
    const errors: Record<string, string> = {};
    result.error.issues.forEach((issue) => {
      errors[issue.path.join(".")] = issue.message;
    });
    return { errors };
  }

  await scoringFormulaRepository.update(params.id!, result.data);

  return redirect("/formulas");
}

export default function EditFormula() {
  const { formula } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Edit Scoring Formula</h1>
        <Form method="post">
          <input type="hidden" name="intent" value="delete" />
          <Button type="submit" variant="destructive">
            Delete
          </Button>
        </Form>
      </div>
      <FormulaForm formula={formula} errors={actionData?.errors} />
    </div>
  );
}
