import type { Route } from "./+types/formulas.new";
import { redirect, useActionData } from "react-router";
import { FormulaForm } from "~/components/formula-form";
import { scoringFormulaSchema } from "~/schemas/scoring-formula.schema";
import { scoringFormulaRepository } from "~/services/index.server";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Create Scoring Formula - Job Tracker" },
    { name: "description", content: "Create a new scoring formula" },
  ];
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();

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

  await scoringFormulaRepository.create(result.data);

  return redirect("/formulas");
}

export default function NewFormula() {
  const actionData = useActionData<typeof action>();

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">Create Scoring Formula</h1>
      <FormulaForm errors={actionData?.errors} />
    </div>
  );
}
