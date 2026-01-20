import { Label } from '~/components/ui/label'
import { RadioGroup, RadioGroupItem } from '~/components/ui/radio-group'

type RatingInputProps = {
  name: string
  label: string
  defaultValue?: number | null
}

export function RatingInput({ name, label, defaultValue }: RatingInputProps) {
  const value =
    defaultValue === null || defaultValue === undefined
      ? ''
      : String(defaultValue)

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <RadioGroup name={name} defaultValue={value} className="flex gap-4">
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="1" id={`${name}-good`} />
          <Label
            htmlFor={`${name}-good`}
            className="font-normal text-green-600"
          >
            Good (+1)
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="0" id={`${name}-medium`} />
          <Label
            htmlFor={`${name}-medium`}
            className="font-normal text-yellow-600"
          >
            Medium (0)
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="-1" id={`${name}-bad`} />
          <Label htmlFor={`${name}-bad`} className="font-normal text-red-600">
            Bad (-1)
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="" id={`${name}-unrated`} />
          <Label
            htmlFor={`${name}-unrated`}
            className="font-normal text-gray-400"
          >
            Not Rated
          </Label>
        </div>
      </RadioGroup>
    </div>
  )
}
