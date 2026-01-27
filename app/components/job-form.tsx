import { useCallback, useState } from 'react'
import Markdown from 'react-markdown'
import { Form } from 'react-router'
import { RatingInput } from '~/components/rating-input'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { Textarea } from '~/components/ui/textarea'
import type { JobOpening } from '~/db/schema'

type JobFormProps = {
  job?: JobOpening
  errors?: Record<string, string>
  headerActions?: React.ReactNode
}

const CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF']

const COUNTRIES = [
  { code: 'AT', name: 'Austria' },
  { code: 'BE', name: 'Belgium' },
  { code: 'CA', name: 'Canada' },
  { code: 'DK', name: 'Denmark' },
  { code: 'FI', name: 'Finland' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
  { code: 'IE', name: 'Ireland' },
  { code: 'IT', name: 'Italy' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'NO', name: 'Norway' },
  { code: 'PL', name: 'Poland' },
  { code: 'PT', name: 'Portugal' },
  { code: 'ES', name: 'Spain' },
  { code: 'SE', name: 'Sweden' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
]

const RATING_CRITERIA = [
  { name: 'ratingImpact', label: 'Positive Impact' },
  { name: 'ratingCompensation', label: 'Compensation' },
  { name: 'ratingRole', label: 'Role / Level of Responsibility' },
  { name: 'ratingTech', label: 'Technologies' },
  { name: 'ratingLocation', label: 'Remote / Hybrid / Office' },
  { name: 'ratingIndustry', label: 'Industry' },
  { name: 'ratingCulture', label: 'Engineering Culture' },
  { name: 'ratingGrowth', label: 'Growth Potential' },
  { name: 'ratingProfileMatch', label: 'Profile Match' },
  { name: 'ratingCompanySize', label: 'Company Size' },
  { name: 'ratingStress', label: 'Stress Factor' },
  { name: 'ratingJobSecurity', label: 'Job Security' },
]

export function JobForm({ job, errors, headerActions }: JobFormProps) {
  const [description, setDescription] = useState(job?.description ?? '')
  const [showPreview, setShowPreview] = useState(false)

  const handlePaste = useCallback(
    async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const html = e.clipboardData.getData('text/html')
      if (html) {
        e.preventDefault()
        // Dynamically import turndown only on client side when needed
        const TurndownService = (await import('turndown')).default
        const turndownService = new TurndownService({
          headingStyle: 'atx',
          codeBlockStyle: 'fenced',
        })
        const markdown = turndownService.turndown(html)
        const textarea = e.currentTarget
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const newValue =
          description.slice(0, start) + markdown + description.slice(end)
        setDescription(newValue)
      }
    },
    [description],
  )

  return (
    <Form method="post" className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="sticky top-0 z-10 bg-background border-b py-3 -mx-4 px-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">
            {job ? 'Edit Job Opening' : 'Add Job Opening'}
          </h1>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => history.back()}
            >
              Cancel
            </Button>
            {headerActions}
            <Button type="submit">
              {job ? 'Update' : 'Create'} Job Opening
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="basic-info" className="mt-6 flex flex-col flex-1 min-h-0">
        <TabsList className="w-full">
          <TabsTrigger value="basic-info">Basic Info</TabsTrigger>
          <TabsTrigger value="compensation">Compensation</TabsTrigger>
          <TabsTrigger value="work-location">Work Location</TabsTrigger>
          <TabsTrigger value="ratings">Ratings</TabsTrigger>
        </TabsList>

        <TabsContent value="basic-info" forceMount className="data-[state=inactive]:hidden flex-1 min-h-0">
          <Card className="h-full">
            <CardContent className="pt-6 space-y-4 h-full flex flex-col">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="postingUrl">Posting URL</Label>
                  <Input
                    id="postingUrl"
                    name="postingUrl"
                    type="url"
                    defaultValue={job?.postingUrl ?? ''}
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-1 space-y-2">
                  <Label htmlFor="company">Company *</Label>
                  <Input
                    id="company"
                    name="company"
                    defaultValue={job?.company}
                    required
                  />
                  {errors?.company && (
                    <p className="text-sm text-red-500">{errors.company}</p>
                  )}
                </div>
                <div className="col-span-3 space-y-2">
                  <Label htmlFor="title">Job Title *</Label>
                  <Input
                    id="title"
                    name="title"
                    defaultValue={job?.title}
                    required
                  />
                  {errors?.title && (
                    <p className="text-sm text-red-500">{errors.title}</p>
                  )}
                </div>
              </div>

              <div className="flex-1 min-h-0 flex flex-col space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="description">Description *</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                  >
                    {showPreview ? 'Hide Preview' : 'Show Preview'}
                  </Button>
                </div>
                {!showPreview && (
                  <Textarea
                    id="description"
                    name="description"
                    className="flex-1 min-h-[15rem] overflow-y-auto resize-none"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    onPaste={handlePaste}
                    placeholder="Paste from LinkedIn or other sources - HTML will be converted to Markdown"
                    required
                  />
                )}
                {errors?.description && (
                  <p className="text-sm text-red-500">{errors.description}</p>
                )}
                {showPreview && description && (
                  <div className="flex-1 min-h-[15rem] overflow-y-auto mt-2 p-4 border rounded-md bg-muted/50 prose prose-sm max-w-none">
                    <Markdown>{description}</Markdown>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="track">Track</Label>
                  <Select name="track" defaultValue={job?.track ?? ''}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select track" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="engineering">Engineering</SelectItem>
                      <SelectItem value="management">Management</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2 space-y-2">
                  <Label htmlFor="jobLocation">City/Region</Label>
                  <Input
                    id="jobLocation"
                    name="jobLocation"
                    placeholder="e.g., Berlin"
                    defaultValue={job?.jobLocation ?? ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Select name="country" defaultValue={job?.country ?? ''}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOpened">Date Opened</Label>
                <Input
                  id="dateOpened"
                  name="dateOpened"
                  type="date"
                  defaultValue={job?.dateOpened ?? ''}
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input type="hidden" name="wow" value="false" />
                <input
                  type="checkbox"
                  id="wow"
                  name="wow"
                  value="true"
                  defaultChecked={job?.wow ?? false}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label
                  htmlFor="wow"
                  className="text-base font-medium cursor-pointer"
                >
                  Wow Factor — This job stands out!
                </Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compensation" forceMount className="data-[state=inactive]:hidden">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="salaryMin">Salary Min</Label>
                  <Input
                    id="salaryMin"
                    name="salaryMin"
                    type="number"
                    placeholder="e.g., 70000"
                    defaultValue={job?.salaryMin ?? ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salaryMax">Salary Max</Label>
                  <Input
                    id="salaryMax"
                    name="salaryMax"
                    type="number"
                    placeholder="e.g., 90000"
                    defaultValue={job?.salaryMax ?? ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salaryCurrency">Currency</Label>
                  <Select
                    name="salaryCurrency"
                    defaultValue={job?.salaryCurrency ?? ''}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((currency) => (
                        <SelectItem key={currency} value={currency}>
                          {currency}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vacationDays">Vacation Days</Label>
                  <Input
                    id="vacationDays"
                    name="vacationDays"
                    type="number"
                    defaultValue={job?.vacationDays ?? ''}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pensionScheme">Pension Scheme</Label>
                  <Input
                    id="pensionScheme"
                    name="pensionScheme"
                    placeholder="e.g., 5% match"
                    defaultValue={job?.pensionScheme ?? ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="healthInsurance">Health Insurance</Label>
                  <Input
                    id="healthInsurance"
                    name="healthInsurance"
                    defaultValue={job?.healthInsurance ?? ''}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stockOptions">Stock Options</Label>
                <Input
                  id="stockOptions"
                  name="stockOptions"
                  defaultValue={job?.stockOptions ?? ''}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="work-location" forceMount className="data-[state=inactive]:hidden">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="workLocation">Work Type</Label>
                <Select name="workLocation" defaultValue={job?.workLocation ?? ''}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select work type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="remote">Remote</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                    <SelectItem value="office">Office</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="officeDistanceKm">Office Distance (km)</Label>
                  <Input
                    id="officeDistanceKm"
                    name="officeDistanceKm"
                    type="number"
                    defaultValue={job?.officeDistanceKm ?? ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wfhDaysPerWeek">WFH Days per Week</Label>
                  <Input
                    id="wfhDaysPerWeek"
                    name="wfhDaysPerWeek"
                    type="number"
                    min="0"
                    max="7"
                    defaultValue={job?.wfhDaysPerWeek ?? ''}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ratings" forceMount className="data-[state=inactive]:hidden">
          <Card>
            <CardContent className="pt-6 space-y-4">
              {RATING_CRITERIA.map(({ name, label }) => (
                <RatingInput
                  key={name}
                  name={name}
                  label={label}
                  defaultValue={job?.[name as keyof JobOpening] as number | null}
                />
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

    </Form>
  )
}
