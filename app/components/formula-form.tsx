import { Form } from 'react-router'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import type { ScoringFormula } from '~/db/schema'

type FormulaFormProps = {
  formula?: ScoringFormula
  errors?: Record<string, string>
}

const WEIGHT_FIELDS = [
  { key: 'impact', label: 'Positive Impact' },
  { key: 'compensation', label: 'Compensation' },
  { key: 'role', label: 'Role / Level of Responsibility' },
  { key: 'tech', label: 'Technologies' },
  { key: 'location', label: 'Remote / Hybrid / Office' },
  { key: 'industry', label: 'Industry' },
  { key: 'culture', label: 'Engineering Culture' },
  { key: 'growth', label: 'Growth Potential' },
  { key: 'profileMatch', label: 'Profile Match' },
  { key: 'companySize', label: 'Company Size' },
  { key: 'stress', label: 'Stress Factor' },
  { key: 'jobSecurity', label: 'Job Security' },
  { key: 'wowBoost', label: 'Wow Boost' },
]

export function FormulaForm({ formula, errors }: FormulaFormProps) {
  return (
    <Form method="post" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Formula Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Formula Name *</Label>
            <Input
              id="name"
              name="name"
              defaultValue={formula?.name}
              placeholder="e.g., Professional Growth"
              required
            />
            {errors?.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Criterion Weights</CardTitle>
          <p className="text-sm text-muted-foreground">
            Set the weight for each criterion. Positive weights increase the
            score, negative weights decrease it. Use negative weights for
            criteria like stress.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {WEIGHT_FIELDS.map(({ key, label }) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={`weights.${key}`}>{label}</Label>
                <Input
                  id={`weights.${key}`}
                  name={`weights.${key}`}
                  type="number"
                  defaultValue={
                    formula?.weights?.[key as keyof typeof formula.weights] ?? 1
                  }
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button type="submit">{formula ? 'Update' : 'Create'} Formula</Button>
        <Button type="button" variant="outline" onClick={() => history.back()}>
          Cancel
        </Button>
      </div>
    </Form>
  )
}
