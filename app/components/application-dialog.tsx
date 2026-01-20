import { Form } from 'react-router'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'

type ApplicationDialogProps = {
  jobId: string | null
  jobTitle?: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ApplicationDialog({
  jobId,
  jobTitle,
  open,
  onOpenChange,
}: ApplicationDialogProps) {
  const today = new Date().toISOString().split('T')[0]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark Application Sent</DialogTitle>
        </DialogHeader>
        <Form method="post" action="/?index">
          <input type="hidden" name="intent" value="markApplied" />
          <input type="hidden" name="jobId" value={jobId ?? ''} />

          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Mark application as sent for: <strong>{jobTitle}</strong>
            </p>
            <div className="space-y-2">
              <Label htmlFor="applicationSentDate">Application Date</Label>
              <Input
                id="applicationSentDate"
                name="applicationSentDate"
                type="date"
                defaultValue={today}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" onClick={() => onOpenChange(false)}>
              Confirm
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
