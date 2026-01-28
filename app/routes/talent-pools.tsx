import { useState } from 'react'
import { Form, Link, useFetcher, useLoaderData } from 'react-router'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import { Textarea } from '~/components/ui/textarea'
import type { TalentPool } from '~/db/schema'
import { talentPoolSchema } from '~/schemas/talent-pool.schema'
import { talentPoolService } from '~/services/index.server'
import type { Route } from './+types/talent-pools'

export function meta() {
  return [
    { title: 'Talent Pools - Job Tracker' },
    {
      name: 'description',
      content: 'Track talent pools you have joined or submitted to',
    },
  ]
}

export async function loader() {
  const pools = await talentPoolService.findAll()
  return { pools }
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData()
  const intent = formData.get('intent')

  if (intent === 'createPool') {
    const result = talentPoolSchema.safeParse({
      companyName: formData.get('companyName'),
      url: formData.get('url'),
      notes: formData.get('notes') || undefined,
    })
    if (!result.success) {
      return { errors: result.error.flatten().fieldErrors }
    }
    await talentPoolService.create(result.data)
    return { success: true }
  }

  if (intent === 'updatePool') {
    const id = formData.get('id') as string
    const result = talentPoolSchema.safeParse({
      companyName: formData.get('companyName'),
      url: formData.get('url'),
      status: formData.get('status') || undefined,
      notes: formData.get('notes') || undefined,
    })
    if (!result.success) {
      return { errors: result.error.flatten().fieldErrors }
    }
    await talentPoolService.update(id, result.data)
    return { success: true }
  }

  if (intent === 'deletePool') {
    const id = formData.get('id') as string
    await talentPoolService.delete(id)
    return { success: true }
  }

  if (intent === 'toggleStatus') {
    const id = formData.get('id') as string
    await talentPoolService.toggleStatus(id)
    return { success: true }
  }

  return { success: false }
}

export default function TalentPools() {
  const { pools } = useLoaderData<typeof loader>()
  const [editPool, setEditPool] = useState<TalentPool | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [deletePool, setDeletePool] = useState<TalentPool | null>(null)
  const fetcher = useFetcher()

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Talent Pools</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/">Back to Jobs</Link>
          </Button>
          <Button onClick={() => setAddOpen(true)}>Add Pool</Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Company</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pools.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={4}
                className="text-center text-muted-foreground"
              >
                No talent pools yet. Add one to start tracking.
              </TableCell>
            </TableRow>
          ) : (
            pools.map((pool) => (
              <TableRow key={pool.id}>
                <TableCell>
                  <a
                    href={pool.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline inline-flex items-center gap-1"
                  >
                    {pool.companyName}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      role="img"
                      aria-label="External link"
                    >
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>
                </TableCell>
                <TableCell>
                  <fetcher.Form method="post">
                    <input type="hidden" name="intent" value="toggleStatus" />
                    <input type="hidden" name="id" value={pool.id} />
                    <button type="submit" className="cursor-pointer">
                      <Badge
                        variant={
                          pool.status === 'submitted' ? 'default' : 'secondary'
                        }
                        className={
                          pool.status === 'submitted'
                            ? 'bg-green-100 text-green-800 hover:bg-green-200 border-green-200'
                            : ''
                        }
                      >
                        {pool.status === 'submitted'
                          ? 'Submitted'
                          : 'Not Submitted'}
                      </Badge>
                    </button>
                  </fetcher.Form>
                </TableCell>
                <TableCell className="text-muted-foreground max-w-xs truncate">
                  {pool.notes || '-'}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditPool(pool)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => setDeletePool(pool)}
                    >
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Add Pool Modal */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Talent Pool</DialogTitle>
            <DialogDescription>
              Add a talent pool you have joined or want to submit to.
            </DialogDescription>
          </DialogHeader>
          <Form method="post" onSubmit={() => setAddOpen(false)}>
            <input type="hidden" name="intent" value="createPool" />
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="add-companyName">Company Name</Label>
                <Input
                  id="add-companyName"
                  name="companyName"
                  placeholder="e.g. Stripe"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="add-url">URL</Label>
                <Input
                  id="add-url"
                  name="url"
                  type="url"
                  placeholder="https://..."
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="add-notes">Notes</Label>
                <Textarea
                  id="add-notes"
                  name="notes"
                  placeholder="Any notes about this talent pool..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Pool Modal */}
      <Dialog
        open={!!editPool}
        onOpenChange={(open) => !open && setEditPool(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Talent Pool</DialogTitle>
          </DialogHeader>
          {editPool && (
            <Form method="post" onSubmit={() => setEditPool(null)}>
              <input type="hidden" name="intent" value="updatePool" />
              <input type="hidden" name="id" value={editPool.id} />
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-companyName">Company Name</Label>
                  <Input
                    id="edit-companyName"
                    name="companyName"
                    defaultValue={editPool.companyName}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-url">URL</Label>
                  <Input
                    id="edit-url"
                    name="url"
                    type="url"
                    defaultValue={editPool.url}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <select
                    id="edit-status"
                    name="status"
                    defaultValue={editPool.status}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm"
                  >
                    <option value="not_submitted">Not Submitted</option>
                    <option value="submitted">Submitted</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-notes">Notes</Label>
                  <Textarea
                    id="edit-notes"
                    name="notes"
                    defaultValue={editPool.notes ?? ''}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditPool(null)}
                >
                  Cancel
                </Button>
                <Button type="submit">Save</Button>
              </DialogFooter>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog
        open={!!deletePool}
        onOpenChange={(open) => !open && setDeletePool(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Talent Pool</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deletePool?.companyName}
              &quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletePool(null)}
            >
              Cancel
            </Button>
            <Form method="post" onSubmit={() => setDeletePool(null)}>
              <input type="hidden" name="intent" value="deletePool" />
              <input type="hidden" name="id" value={deletePool?.id} />
              <Button type="submit" variant="destructive">
                Delete
              </Button>
            </Form>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
