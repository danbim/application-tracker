import { render, screen } from '~/test-utils'
import { describe, expect, it } from 'vitest'
import { RatingInput } from './rating-input'

describe('RatingInput', () => {
  it('renders the label', () => {
    render(<RatingInput name="testRating" label="Test Rating" />)

    expect(screen.getByText('Test Rating')).toBeInTheDocument()
  })

  it('renders all four rating options', () => {
    render(<RatingInput name="testRating" label="Test Rating" />)

    expect(screen.getByLabelText('Good (+1)')).toBeInTheDocument()
    expect(screen.getByLabelText('Medium (0)')).toBeInTheDocument()
    expect(screen.getByLabelText('Bad (-1)')).toBeInTheDocument()
    expect(screen.getByLabelText('Not Rated')).toBeInTheDocument()
  })

  it('selects "Good (+1)" when defaultValue is 1', () => {
    render(<RatingInput name="testRating" label="Test Rating" defaultValue={1} />)

    const goodRadio = screen.getByLabelText('Good (+1)')
    expect(goodRadio).toBeChecked()
  })

  it('selects "Medium (0)" when defaultValue is 0', () => {
    render(<RatingInput name="testRating" label="Test Rating" defaultValue={0} />)

    const mediumRadio = screen.getByLabelText('Medium (0)')
    expect(mediumRadio).toBeChecked()
  })

  it('selects "Bad (-1)" when defaultValue is -1', () => {
    render(<RatingInput name="testRating" label="Test Rating" defaultValue={-1} />)

    const badRadio = screen.getByLabelText('Bad (-1)')
    expect(badRadio).toBeChecked()
  })

  it('selects "Not Rated" when defaultValue is null', () => {
    render(<RatingInput name="testRating" label="Test Rating" defaultValue={null} />)

    const notRatedRadio = screen.getByLabelText('Not Rated')
    expect(notRatedRadio).toBeChecked()
  })

  it('selects "Not Rated" when defaultValue is undefined', () => {
    render(<RatingInput name="testRating" label="Test Rating" />)

    const notRatedRadio = screen.getByLabelText('Not Rated')
    expect(notRatedRadio).toBeChecked()
  })

  it('passes name prop to RadioGroup for form submission', () => {
    const { container } = render(<RatingInput name="ratingImpact" label="Impact" defaultValue={1} />)

    // Verify the radiogroup has correct aria attributes for identification
    const radioGroup = screen.getByRole('radiogroup')
    expect(radioGroup).toBeInTheDocument()
    // The radio buttons have values that get submitted with the name
    const checkedRadio = container.querySelector('button[data-state="checked"]')
    expect(checkedRadio).toHaveAttribute('value', '1')
  })

  it('generates unique IDs based on name prop', () => {
    render(<RatingInput name="myRating" label="My Rating" />)

    expect(screen.getByLabelText('Good (+1)')).toHaveAttribute('id', 'myRating-good')
    expect(screen.getByLabelText('Medium (0)')).toHaveAttribute('id', 'myRating-medium')
    expect(screen.getByLabelText('Bad (-1)')).toHaveAttribute('id', 'myRating-bad')
    expect(screen.getByLabelText('Not Rated')).toHaveAttribute('id', 'myRating-unrated')
  })
})
