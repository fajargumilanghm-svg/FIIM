import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LoadingSpinner } from './LoadingSpinner'

describe('LoadingSpinner', () => {
  it('renders an accessible status role', () => {
    render(<LoadingSpinner />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('exposes a visually-hidden "Loading..." label', () => {
    render(<LoadingSpinner />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('applies the size class for the requested size', () => {
    render(<LoadingSpinner size="lg" />)
    expect(screen.getByRole('status').className).toContain('h-12 w-12')
  })
})
