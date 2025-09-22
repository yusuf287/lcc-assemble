import React from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'

interface EventDeleteDialogProps {
  isOpen: boolean
  eventTitle: string
  step: 'confirm' | 'warning'
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
}

const EventDeleteDialog: React.FC<EventDeleteDialogProps> = ({
  isOpen,
  eventTitle,
  step,
  onConfirm,
  onCancel,
  isLoading = false
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <Card className="w-full max-w-md mx-4">
        <div className="p-6">
          {step === 'confirm' ? (
            <>
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Cancel Event</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone</p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-sm text-gray-700">
                  Are you sure you want to cancel <strong>"{eventTitle}"</strong>?
                  This will mark the event as cancelled and notify all attendees.
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={onCancel}
                  disabled={isLoading}
                >
                  Keep Event
                </Button>
                <Button
                  className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
                  onClick={onConfirm}
                  disabled={isLoading}
                >
                  Cancel Event
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Final Confirmation</h3>
                  <p className="text-sm text-gray-500">Please confirm your decision</p>
                </div>
              </div>

              <div className="mb-6">
                <div className="bg-orange-50 p-4 rounded-lg">
                  <p className="text-sm text-orange-800">
                    <strong>Warning:</strong> This will notify all attendees that the event has been cancelled.
                    This action cannot be undone.
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={onCancel}
                  disabled={isLoading}
                >
                  No, Keep Event
                </Button>
                <Button
                  className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
                  onClick={onConfirm}
                  disabled={isLoading}
                >
                  {isLoading ? 'Cancelling...' : 'Yes, Cancel Event'}
                </Button>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  )
}

export default EventDeleteDialog