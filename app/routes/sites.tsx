import { useState } from 'react'
import { Form, Link, useLoaderData } from 'react-router'
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
import type { JobPostingSite } from '~/db/schema'
import { formatDualTimestamp } from '~/lib/format-timestamp'
import { jobPostingSiteSchema } from '~/schemas/job-posting-site.schema'
import { jobPostingSiteService } from '~/services/index.server'
import type { Route } from './+types/sites'

export function meta() {
  return [
    { title: 'Job Posting Sites - Job Tracker' },
    {
      name: 'description',
      content: 'Track job posting sites you check regularly',
    },
  ]
}

export async function loader() {
  const sites = await jobPostingSiteService.findAll()
  return { sites }
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData()
  const intent = formData.get('intent')

  if (intent === 'createSite') {
    const result = jobPostingSiteSchema.safeParse({
      name: formData.get('name'),
      url: formData.get('url'),
    })
    if (!result.success) {
      return { errors: result.error.flatten().fieldErrors }
    }
    await jobPostingSiteService.create(result.data)
    return { success: true }
  }

  if (intent === 'updateSite') {
    const id = formData.get('id') as string
    const result = jobPostingSiteSchema.safeParse({
      name: formData.get('name'),
      url: formData.get('url'),
    })
    if (!result.success) {
      return { errors: result.error.flatten().fieldErrors }
    }
    await jobPostingSiteService.update(id, result.data)
    return { success: true }
  }

  if (intent === 'deleteSite') {
    const id = formData.get('id') as string
    await jobPostingSiteService.delete(id)
    return { success: true }
  }

  if (intent === 'markChecked') {
    const id = formData.get('id') as string
    await jobPostingSiteService.markChecked(id)
    return { success: true }
  }

  return { success: false }
}

export default function Sites() {
  const { sites } = useLoaderData<typeof loader>()
  const [editSite, setEditSite] = useState<JobPostingSite | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [deleteSite, setDeleteSite] = useState<JobPostingSite | null>(null)

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Job Posting Sites</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/">Back to Jobs</Link>
          </Button>
          <Button onClick={() => setAddOpen(true)}>Add Site</Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Last Checked</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sites.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={3}
                className="text-center text-muted-foreground"
              >
                No sites yet. Add one to start tracking.
              </TableCell>
            </TableRow>
          ) : (
            sites.map((site) => (
              <TableRow key={site.id}>
                <TableCell>
                  <a
                    href={site.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline inline-flex items-center gap-1"
                  >
                    {site.name}
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
                <TableCell className="text-muted-foreground">
                  {site.lastCheckedAt
                    ? formatDualTimestamp(site.lastCheckedAt)
                    : 'Never'}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Form method="post">
                      <input type="hidden" name="intent" value="markChecked" />
                      <input type="hidden" name="id" value={site.id} />
                      <Button type="submit" variant="outline" size="sm">
                        Just Checked
                      </Button>
                    </Form>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditSite(site)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => setDeleteSite(site)}
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

      {/* Add Site Modal */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Site</DialogTitle>
            <DialogDescription>
              Add a job posting site or saved search to track.
            </DialogDescription>
          </DialogHeader>
          <Form method="post" onSubmit={() => setAddOpen(false)}>
            <input type="hidden" name="intent" value="createSite" />
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="add-name">Name</Label>
                <Input
                  id="add-name"
                  name="name"
                  placeholder="e.g. LinkedIn - React Berlin"
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

      {/* Edit Site Modal */}
      <Dialog
        open={!!editSite}
        onOpenChange={(open) => !open && setEditSite(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Site</DialogTitle>
          </DialogHeader>
          {editSite && (
            <Form method="post" onSubmit={() => setEditSite(null)}>
              <input type="hidden" name="intent" value="updateSite" />
              <input type="hidden" name="id" value={editSite.id} />
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">Name</Label>
                  <Input
                    id="edit-name"
                    name="name"
                    defaultValue={editSite.name}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-url">URL</Label>
                  <Input
                    id="edit-url"
                    name="url"
                    type="url"
                    defaultValue={editSite.url}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditSite(null)}
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
        open={!!deleteSite}
        onOpenChange={(open) => !open && setDeleteSite(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Site</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteSite?.name}&quot;?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteSite(null)}
            >
              Cancel
            </Button>
            <Form method="post" onSubmit={() => setDeleteSite(null)}>
              <input type="hidden" name="intent" value="deleteSite" />
              <input type="hidden" name="id" value={deleteSite?.id} />
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
