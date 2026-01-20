import Markdown from 'react-markdown'
import { Link, useFetcher } from 'react-router'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '~/components/ui/hover-card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import type { RankedJobOpening } from '~/services/scoring.service'

type JobTableProps = {
  jobs: RankedJobOpening[]
  onMarkApplied: (jobId: string) => void
}

function StatusBadge({
  job,
  onMarkApplied,
}: {
  job: RankedJobOpening['job']
  onMarkApplied: (jobId: string) => void
}) {
  const fetcher = useFetcher()

  const formatDate = (date: Date | string | null) => {
    if (!date) return ''
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString()
  }

  if (job.applicationSent) {
    return (
      <fetcher.Form method="post" action="/?index" className="inline">
        <input type="hidden" name="intent" value="markUnapplied" />
        <input type="hidden" name="jobId" value={job.id} />
        <button type="submit" className="cursor-pointer">
          <Badge variant="secondary" className="hover:bg-secondary/60">
            Applied {job.applicationSentDate ? formatDate(job.applicationSentDate) : ''}
          </Badge>
        </button>
      </fetcher.Form>
    )
  }

  return (
    <button type="button" onClick={() => onMarkApplied(job.id)} className="cursor-pointer">
      <Badge variant="outline" className="hover:bg-accent">
        Not Applied
      </Badge>
    </button>
  )
}

export function JobTable({ jobs, onMarkApplied }: JobTableProps) {
  const formatDate = (date: Date | string | null) => {
    if (!date) return '-'
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString()
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead></TableHead>
          <TableHead>Company</TableHead>
          <TableHead>Title</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Date Added</TableHead>
          <TableHead className="text-right">Score</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {jobs.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={7}
              className="text-center text-muted-foreground"
            >
              No job openings yet. Add one to get started.
            </TableCell>
          </TableRow>
        ) : (
          jobs.map(({ job, score }) => (
            <TableRow key={job.id}>
              <TableCell>
                <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/jobs/${job.id}/edit`}>Edit</Link>
                    </Button>
                </div>
              </TableCell>
              <TableCell>{job.company}</TableCell>
              <TableCell className="font-medium">
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <span className="cursor-help underline decoration-dotted underline-offset-2">
                      {job.title}
                      {job.wow && ' ★'}
                    </span>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-96 max-h-80 overflow-y-auto">
                    <div className="space-y-2">
                      <h4 className="font-semibold">{job.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {job.company}
                      </p>
                      <div className="prose prose-sm max-w-none">
                        <Markdown>{job.description}</Markdown>
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </TableCell>
              <TableCell>{job.jobLocation || '-'}</TableCell>
              <TableCell>{formatDate(job.dateAdded)}</TableCell>
              <TableCell className="text-right font-mono">{score}</TableCell>
              <TableCell>
                <StatusBadge job={job} onMarkApplied={onMarkApplied} />
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}
