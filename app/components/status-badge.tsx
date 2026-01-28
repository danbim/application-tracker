import { useFetcher } from 'react-router'
import { Badge } from '~/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '~/components/ui/select'
import { type ApplicationStatus, applicationStatusEnum } from '~/db/schema'
import { formatDate } from '~/lib/format-timestamp'

type StatusBadgeProps = {
  jobId: string
  status: ApplicationStatus
  appliedAt?: Date | null
  onAppliedClick?: () => void
}

const STATUS_CONFIG: Record<
  ApplicationStatus,
  {
    label: string
    variant: 'default' | 'secondary' | 'destructive' | 'outline'
    className?: string
  }
> = {
  not_applied: { label: 'Not Applied', variant: 'outline' },
  applied: {
    label: 'Applied',
    variant: 'default',
    className: 'bg-blue-500 hover:bg-blue-600',
  },
  interviewing: {
    label: 'Interviewing',
    variant: 'default',
    className: 'bg-amber-500 hover:bg-amber-600',
  },
  offer: {
    label: 'Offer',
    variant: 'default',
    className: 'bg-green-500 hover:bg-green-600',
  },
  rejected: { label: 'Rejected', variant: 'destructive' },
  ghosted: {
    label: 'Ghosted',
    variant: 'secondary',
    className: 'bg-purple-200 text-purple-800',
  },
  dumped: {
    label: 'Dumped',
    variant: 'secondary',
    className: 'line-through opacity-60',
  },
}

const ALL_STATUSES = applicationStatusEnum.enumValues

export function StatusBadge({
  jobId,
  status,
  appliedAt,
  onAppliedClick,
}: StatusBadgeProps) {
  const fetcher = useFetcher()
  const config = STATUS_CONFIG[status]

  const handleStatusChange = (newStatus: string) => {
    if (newStatus === 'applied' && onAppliedClick) {
      onAppliedClick()
      return
    }

    fetcher.submit(
      { intent: 'updateStatus', jobId, status: newStatus },
      { method: 'post', action: '/?index' },
    )
  }

  return (
    <Select value={status} onValueChange={handleStatusChange}>
      <SelectTrigger className="w-auto border-0 p-0 h-auto focus:ring-0 shadow-none">
        <Badge variant={config.variant} className={config.className}>
          {config.label}
          {status === 'applied' && appliedAt && ` ${formatDate(appliedAt)}`}
        </Badge>
      </SelectTrigger>
      <SelectContent position="popper" align="start">
        {ALL_STATUSES.map((s) => (
          <SelectItem key={s} value={s}>
            <Badge
              variant={STATUS_CONFIG[s].variant}
              className={STATUS_CONFIG[s].className}
            >
              {STATUS_CONFIG[s].label}
            </Badge>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
