import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  shadow?: 'none' | 'sm' | 'md' | 'lg'
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'md',
  shadow = 'md'
}) => {
  const baseClasses = 'bg-white rounded-lg border border-gray-200'

  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  }

  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg'
  }

  const combinedClasses = [
    baseClasses,
    paddingClasses[padding],
    shadowClasses[shadow],
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={combinedClasses}>
      {children}
    </div>
  )
}