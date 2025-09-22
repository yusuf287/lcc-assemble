import React from 'react'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'rectangular' | 'circular'
  width?: string | number
  height?: string | number
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'text',
  width,
  height
}) => {
  const baseClasses = 'animate-pulse bg-gray-200'

  const variantClasses = {
    text: 'h-4 rounded',
    rectangular: 'rounded',
    circular: 'rounded-full'
  }

  const style: React.CSSProperties = {}
  if (width) {
    style.width = typeof width === 'number' ? `${width}px` : width
  }
  if (height) {
    style.height = typeof height === 'number' ? `${height}px` : height
  }

  const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${className}`.trim()

  return <div className={combinedClasses} style={style} role="presentation" />
}

// Specific skeleton components
export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({
  lines = 1,
  className = ''
}) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }, (_, i) => (
      <Skeleton
        key={i}
        variant="text"
        width={i === lines - 1 ? '60%' : '100%'}
      />
    ))}
  </div>
)

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`p-4 border border-gray-200 rounded-lg ${className}`}>
    <div className="flex items-center space-x-4 mb-4">
      <Skeleton variant="circular" width={40} height={40} />
      <div className="flex-1">
        <Skeleton variant="text" width="60%" className="mb-2" />
        <Skeleton variant="text" width="40%" />
      </div>
    </div>
    <SkeletonText lines={3} />
  </div>
)

export const SkeletonList: React.FC<{ items?: number; className?: string }> = ({
  items = 3,
  className = ''
}) => (
  <div className={`space-y-4 ${className}`}>
    {Array.from({ length: items }, (_, i) => (
      <div key={i} className="flex items-center space-x-4">
        <Skeleton variant="circular" width={32} height={32} />
        <div className="flex-1">
          <Skeleton variant="text" width="70%" className="mb-1" />
          <Skeleton variant="text" width="50%" />
        </div>
      </div>
    ))}
  </div>
)

export const SkeletonTable: React.FC<{ rows?: number; cols?: number; className?: string }> = ({
  rows = 5,
  cols = 4,
  className = ''
}) => (
  <div className={`space-y-3 ${className}`}>
    {/* Header */}
    <div className="flex space-x-4">
      {Array.from({ length: cols }, (_, i) => (
        <Skeleton key={i} variant="text" width="100%" height={20} />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }, (_, rowIndex) => (
      <div key={rowIndex} className="flex space-x-4">
        {Array.from({ length: cols }, (_, colIndex) => (
          <Skeleton
            key={colIndex}
            variant="text"
            width="100%"
            height={16}
          />
        ))}
      </div>
    ))}
  </div>
)

export default Skeleton