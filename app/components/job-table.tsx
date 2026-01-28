import Markdown from 'react-markdown'
import { Link } from 'react-router'
import { StatusBadge } from '~/components/status-badge'
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
import { formatDate } from '~/lib/format-timestamp'
import type { RankedJobOpening } from '~/services/scoring.service'

type JobTableProps = {
  jobs: RankedJobOpening[]
  noteCounts: Map<string, number>
  onAppliedClick: (jobId: string) => void
  onRowClick: (jobId: string) => void
}

export function JobTable({
  jobs,
  noteCounts,
  onAppliedClick,
  onRowClick,
}: JobTableProps) {
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
          jobs.map(({ job, score }) => {
            const noteCount = noteCounts.get(job.id) ?? 0
            return (
              <TableRow
                key={job.id}
                className="cursor-pointer"
                onClick={() => onRowClick(job.id)}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/jobs/${job.id}/edit`}>Edit</Link>
                    </Button>
                  </div>
                </TableCell>
                <TableCell>{job.company}</TableCell>
                <TableCell className="font-medium">
                  <div className="flex items-center">
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
                    {noteCount > 0 && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {noteCount}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>{job.jobLocation || '-'}</TableCell>
                <TableCell>{formatDate(job.dateAdded)}</TableCell>
                <TableCell className="text-right font-mono">{score}</TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <StatusBadge
                    jobId={job.id}
                    status={job.status}
                    appliedAt={job.appliedAt}
                    onAppliedClick={() => onAppliedClick(job.id)}
                  />
                </TableCell>
              </TableRow>
            )
          })
        )}
      </TableBody>
    </Table>
  )
}
