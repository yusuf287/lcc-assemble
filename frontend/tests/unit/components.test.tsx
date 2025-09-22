import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { jest } from '@jest/globals'

// Mock Firebase
jest.mock('firebase/app', () => ({
  getApp: jest.fn(),
  initializeApp: jest.fn()
}))

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  onAuthStateChanged: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  updateProfile: jest.fn()
}))

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  getDocs: jest.fn(),
  onSnapshot: jest.fn()
}))

jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(),
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
  deleteObject: jest.fn()
}))

// Component imports
import { Button } from '../../src/components/ui/Button'
import { Input } from '../../src/components/ui/Input'
import { Card } from '../../src/components/ui/Card'
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner'
import { Skeleton, SkeletonText, SkeletonCard, SkeletonList, SkeletonTable } from '../../src/components/ui/Skeleton'

// Test Button component
describe('Button Component', () => {
  test('renders with default props', () => {
    render(<Button>Click me</Button>)
    const button = screen.getByRole('button', { name: /click me/i })
    expect(button).toBeInTheDocument()
    expect(button).toHaveClass('bg-blue-600')
  })

  test('renders with different variants', () => {
    const { rerender } = render(<Button variant="outline">Outline</Button>)
    expect(screen.getByRole('button')).toHaveClass('border-gray-300')

    rerender(<Button variant="ghost">Ghost</Button>)
    expect(screen.getByRole('button')).toHaveClass('text-gray-700')
  })

  test('handles click events', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)

    const button = screen.getByRole('button')
    fireEvent.click(button)

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  test('shows loading state', () => {
    render(<Button isLoading>Loading</Button>)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeDisabled()
  })

  test('applies size classes', () => {
    const { rerender } = render(<Button size="sm">Small</Button>)
    expect(screen.getByRole('button')).toHaveClass('px-3', 'py-2')

    rerender(<Button size="lg">Large</Button>)
    expect(screen.getByRole('button')).toHaveClass('px-6', 'py-3')
  })
})

// Test Input component
describe('Input Component', () => {
  test('renders with basic props', () => {
    render(<Input placeholder="Enter text" />)
    const input = screen.getByPlaceholderText('Enter text')
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('type', 'text')
  })

  test('handles different input types', () => {
    render(<Input type="email" placeholder="Enter email" />)
    const input = screen.getByPlaceholderText('Enter email')
    expect(input).toHaveAttribute('type', 'email')
  })

  test('handles value changes', () => {
    const handleChange = jest.fn()
    render(<Input value="test" onChange={handleChange} />)

    const input = screen.getByDisplayValue('test')
    fireEvent.change(input, { target: { value: 'new value' } })

    expect(handleChange).toHaveBeenCalled()
  })

  test('shows error state', () => {
    render(<Input error="This field is required" />)
    expect(screen.getByText('This field is required')).toBeInTheDocument()
  })

  test('applies disabled state', () => {
    render(<Input disabled placeholder="Disabled input" />)
    const input = screen.getByPlaceholderText('Disabled input')
    expect(input).toBeDisabled()
  })
})

// Test Card component
describe('Card Component', () => {
  test('renders with children', () => {
    render(
      <Card>
        <h3>Card Title</h3>
        <p>Card content</p>
      </Card>
    )

    expect(screen.getByText('Card Title')).toBeInTheDocument()
    expect(screen.getByText('Card content')).toBeInTheDocument()
  })

  test('applies custom className', () => {
    render(<Card className="custom-class">Content</Card>)
    const card = screen.getByText('Content').closest('div')
    expect(card).toHaveClass('custom-class')
  })

  test('renders with different padding', () => {
    const { rerender } = render(<Card padding="sm">Small padding</Card>)
    expect(screen.getByText('Small padding').closest('div')).toHaveClass('p-4')

    rerender(<Card padding="lg">Large padding</Card>)
    expect(screen.getByText('Large padding').closest('div')).toHaveClass('p-8')
  })
})

// Test LoadingSpinner component
describe('LoadingSpinner Component', () => {
  test('renders with default size', () => {
    render(<LoadingSpinner />)
    const spinner = screen.getByRole('status')
    expect(spinner).toHaveClass('h-8', 'w-8')
  })

  test('renders with different sizes', () => {
    const { rerender } = render(<LoadingSpinner size="sm" />)
    expect(screen.getByRole('status')).toHaveClass('h-4', 'w-4')

    rerender(<LoadingSpinner size="lg" />)
    expect(screen.getByRole('status')).toHaveClass('h-12', 'w-12')
  })

  test('applies custom className', () => {
    render(<LoadingSpinner className="custom-spinner" />)
    expect(screen.getByRole('status')).toHaveClass('custom-spinner')
  })

  test('has proper accessibility attributes', () => {
    render(<LoadingSpinner />)
    const spinner = screen.getByRole('status')
    expect(spinner).toHaveAttribute('aria-label', 'Loading')
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })
})

// Test Skeleton component
describe('Skeleton Component', () => {
  test('renders with default variant', () => {
    render(<Skeleton />)
    const skeleton = screen.getByRole('presentation')
    expect(skeleton).toHaveClass('animate-pulse', 'bg-gray-200', 'h-4', 'rounded')
  })

  test('renders different variants', () => {
    const { rerender } = render(<Skeleton variant="rectangular" />)
    expect(screen.getByRole('presentation')).toHaveClass('rounded')

    rerender(<Skeleton variant="circular" />)
    expect(screen.getByRole('presentation')).toHaveClass('rounded-full')
  })

  test('applies custom dimensions', () => {
    render(<Skeleton width={200} height={100} />)
    const skeleton = screen.getByRole('presentation')
    expect(skeleton).toHaveStyle({ width: '200px', height: '100px' })
  })

  test('applies custom className', () => {
    render(<Skeleton className="custom-skeleton" />)
    expect(screen.getByRole('presentation')).toHaveClass('custom-skeleton')
  })
})

// Test SkeletonText component
describe('SkeletonText Component', () => {
  test('renders single line by default', () => {
    render(<SkeletonText />)
    const skeletons = screen.getAllByRole('presentation')
    expect(skeletons).toHaveLength(1)
  })

  test('renders multiple lines', () => {
    render(<SkeletonText lines={3} />)
    const skeletons = screen.getAllByRole('presentation')
    expect(skeletons).toHaveLength(3)
  })

  test('last line is shorter', () => {
    render(<SkeletonText lines={3} />)
    const skeletons = screen.getAllByRole('presentation')
    expect(skeletons[2]).toHaveStyle({ width: '60%' })
  })
})

// Test SkeletonCard component
describe('SkeletonCard Component', () => {
  test('renders card skeleton structure', () => {
    render(<SkeletonCard />)
    // Should have avatar, title, subtitle, and content skeletons
    const skeletons = screen.getAllByRole('presentation')
    expect(skeletons.length).toBeGreaterThan(3)
  })
})

// Test SkeletonList component
describe('SkeletonList Component', () => {
  test('renders list skeleton with default items', () => {
    render(<SkeletonList />)
    const skeletons = screen.getAllByRole('presentation')
    // Each item has avatar + 2 text skeletons, so 9 skeletons for 3 items
    expect(skeletons).toHaveLength(9)
  })

  test('renders custom number of items', () => {
    render(<SkeletonList items={5} />)
    const skeletons = screen.getAllByRole('presentation')
    expect(skeletons).toHaveLength(15) // 3 skeletons per item
  })
})

// Test SkeletonTable component
describe('SkeletonTable Component', () => {
  test('renders table skeleton structure', () => {
    render(<SkeletonTable />)
    const skeletons = screen.getAllByRole('presentation')
    // Header (4 cols) + 5 rows (4 cols each) = 24 skeletons
    expect(skeletons).toHaveLength(24)
  })

  test('renders custom dimensions', () => {
    render(<SkeletonTable rows={3} cols={2} />)
    const skeletons = screen.getAllByRole('presentation')
    // Header (2 cols) + 3 rows (2 cols each) = 8 skeletons
    expect(skeletons).toHaveLength(8)
  })
})