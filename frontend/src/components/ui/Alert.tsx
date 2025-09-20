import React from 'react'

interface AlertProps {
  variant?: 'success' | 'error' | 'warning' | 'info'
  type?: 'success' | 'error' | 'warning' | 'info'
  message?: string
  children?: React.ReactNode
  className?: string
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  type,
  message,
  children,
  className = ''
}) => {
  const actualVariant = type || variant

  const baseClasses = 'p-4 rounded-md'

  const variantClasses = {
    success: 'bg-green-50 border border-green-200 text-green-800',
    error: 'bg-red-50 border border-red-200 text-red-800',
    warning: 'bg-yellow-50 border border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border border-blue-200 text-blue-800'
  }

  const combinedClasses = `${baseClasses} ${variantClasses[actualVariant]} ${className}`.trim()

  return (
    <div className={combinedClasses} role="alert">
      {message || children}
    </div>
  )
}

export default Alert