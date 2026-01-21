import { useSearchParams } from 'react-router'
import { Badge } from '~/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '~/components/ui/tabs'
import type { ApplicationStatus } from '~/db/schema'
import { ACTIVE_STATUSES } from '~/db/schema'

type StatusTabsProps = {
  selectedStatus: string
  counts: Record<ApplicationStatus, number>
}

type TabConfig = {
  value: string
  label: string
  getCount: (counts: Record<ApplicationStatus, number>) => number
}

const TABS: TabConfig[] = [
  {
    value: 'active',
    label: 'Active',
    getCount: (counts) =>
      ACTIVE_STATUSES.reduce((sum, s) => sum + counts[s], 0),
  },
  { value: 'not_applied', label: 'Not Applied', getCount: (c) => c.not_applied },
  { value: 'applied', label: 'Applied', getCount: (c) => c.applied },
  { value: 'interviewing', label: 'Interviewing', getCount: (c) => c.interviewing },
  { value: 'offer', label: 'Offer', getCount: (c) => c.offer },
  { value: 'rejected', label: 'Rejected', getCount: (c) => c.rejected },
  { value: 'ghosted', label: 'Ghosted', getCount: (c) => c.ghosted },
  { value: 'dumped', label: 'Dumped', getCount: (c) => c.dumped },
]

export function StatusTabs({ selectedStatus, counts }: StatusTabsProps) {
  const [searchParams, setSearchParams] = useSearchParams()

  const handleTabChange = (value: string) => {
    const newParams = new URLSearchParams(searchParams)
    if (value === 'active') {
      newParams.delete('status')
    } else {
      newParams.set('status', value)
    }
    setSearchParams(newParams)
  }

  return (
    <Tabs value={selectedStatus} onValueChange={handleTabChange}>
      <TabsList className="flex-wrap h-auto gap-1">
        {TABS.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value} className="gap-2">
            {tab.label}
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
              {tab.getCount(counts)}
            </Badge>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
