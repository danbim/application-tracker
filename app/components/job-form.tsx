import { Form } from "react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { RatingInput } from "~/components/rating-input";
import type { JobOpening } from "~/db/schema";

type JobFormProps = {
  job?: JobOpening;
  errors?: Record<string, string>;
};

const CURRENCIES = ["EUR", "USD", "GBP", "CHF"];

const COUNTRIES = [
  { code: "DE", name: "Germany" },
  { code: "GB", name: "United Kingdom" },
  { code: "NL", name: "Netherlands" },
  { code: "FR", name: "France" },
  { code: "CH", name: "Switzerland" },
  { code: "AT", name: "Austria" },
  { code: "BE", name: "Belgium" },
  { code: "ES", name: "Spain" },
  { code: "IT", name: "Italy" },
  { code: "PL", name: "Poland" },
  { code: "SE", name: "Sweden" },
  { code: "DK", name: "Denmark" },
  { code: "NO", name: "Norway" },
  { code: "FI", name: "Finland" },
  { code: "IE", name: "Ireland" },
  { code: "PT", name: "Portugal" },
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
];

const RATING_CRITERIA = [
  { name: "ratingImpact", label: "Positive Impact" },
  { name: "ratingCompensation", label: "Compensation" },
  { name: "ratingRole", label: "Role / Level of Responsibility" },
  { name: "ratingTech", label: "Technologies" },
  { name: "ratingLocation", label: "Remote / Hybrid / Office" },
  { name: "ratingIndustry", label: "Industry" },
  { name: "ratingCulture", label: "Engineering Culture" },
  { name: "ratingGrowth", label: "Growth Potential" },
  { name: "ratingProfileMatch", label: "Profile Match" },
  { name: "ratingCompanySize", label: "Company Size" },
  { name: "ratingStress", label: "Stress Factor" },
];

export function JobForm({ job, errors }: JobFormProps) {
  return (
    <Form method="post" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
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
            <div className="space-y-2">
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              name="description"
              rows={6}
              defaultValue={job?.description}
              required
            />
            {errors?.description && (
              <p className="text-sm text-red-500">{errors.description}</p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="jobLocation">City/Region</Label>
              <Input
                id="jobLocation"
                name="jobLocation"
                placeholder="e.g., Berlin"
                defaultValue={job?.jobLocation ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Select name="country" defaultValue={job?.country ?? ""}>
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
            <div className="space-y-2">
              <Label htmlFor="postingUrl">Posting URL</Label>
              <Input
                id="postingUrl"
                name="postingUrl"
                type="url"
                defaultValue={job?.postingUrl ?? ""}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateOpened">Date Opened</Label>
            <Input
              id="dateOpened"
              name="dateOpened"
              type="date"
              defaultValue={job?.dateOpened ?? ""}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Compensation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="salaryMin">Salary Min</Label>
              <Input
                id="salaryMin"
                name="salaryMin"
                type="number"
                placeholder="e.g., 70000"
                defaultValue={job?.salaryMin ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salaryMax">Salary Max</Label>
              <Input
                id="salaryMax"
                name="salaryMax"
                type="number"
                placeholder="e.g., 90000"
                defaultValue={job?.salaryMax ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salaryCurrency">Currency</Label>
              <Select name="salaryCurrency" defaultValue={job?.salaryCurrency ?? ""}>
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
                defaultValue={job?.vacationDays ?? ""}
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
                defaultValue={job?.pensionScheme ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="healthInsurance">Health Insurance</Label>
              <Input
                id="healthInsurance"
                name="healthInsurance"
                defaultValue={job?.healthInsurance ?? ""}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="stockOptions">Stock Options</Label>
            <Input
              id="stockOptions"
              name="stockOptions"
              defaultValue={job?.stockOptions ?? ""}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Work Location</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="workLocation">Work Type</Label>
            <Select name="workLocation" defaultValue={job?.workLocation ?? ""}>
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
                defaultValue={job?.officeDistanceKm ?? ""}
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
                defaultValue={job?.wfhDaysPerWeek ?? ""}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ratings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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

      <div className="flex gap-4">
        <Button type="submit">{job ? "Update" : "Create"} Job Opening</Button>
        <Button type="button" variant="outline" onClick={() => history.back()}>
          Cancel
        </Button>
      </div>
    </Form>
  );
}
