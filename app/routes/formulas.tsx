import { Link, useLoaderData } from 'react-router'
import { Button } from '~/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import { scoringFormulaRepository } from '~/services/index.server'

export function meta() {
  return [
    { title: 'Scoring Formulas - Job Tracker' },
    { name: 'description', content: 'Manage your job scoring formulas' },
  ]
}

export async function loader() {
  const formulas = await scoringFormulaRepository.findAll()
  return { formulas }
}

export default function FormulasList() {
  const { formulas } = useLoaderData<typeof loader>()

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Scoring Formulas</h1>
        <div className="flex gap-4">
          <Button asChild variant="outline">
            <Link to="/">Back to Jobs</Link>
          </Button>
          <Button asChild>
            <Link to="/formulas/new">Add Formula</Link>
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {formulas.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={2}
                className="text-center text-muted-foreground"
              >
                No formulas yet. Create one to start ranking jobs.
              </TableCell>
            </TableRow>
          ) : (
            formulas.map((formula) => (
              <TableRow key={formula.id}>
                <TableCell className="font-medium">{formula.name}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button asChild variant="ghost" size="sm">
                      <Link to={`/formulas/${formula.id}/edit`}>Edit</Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
