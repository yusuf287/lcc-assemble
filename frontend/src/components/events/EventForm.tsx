import React, { useState } from 'react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Card } from '../ui/Card'
import { Alert } from '../ui/Alert'
import { Event, EventType, BringItem } from '../../types'

interface EventFormProps {
  onSuccess?: (event: Event) => void
  onCancel?: () => void
  initialData?: Partial<Event>
}

export const EventForm: React.FC<EventFormProps> = ({
  onSuccess,
  onCancel,
  initialData
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    type: initialData?.type || 'other' as EventType,
    visibility: initialData?.visibility || 'public' as 'public' | 'private',
    dateTime: initialData?.dateTime ? new Date(initialData.dateTime).toISOString().slice(0, 16) : '',
    duration: initialData?.duration || 120,
    location: {
      name: initialData?.location?.name || '',
      address: initialData?.location?.address || '',
    },
    capacity: initialData?.capacity?.toString() || '',
    bringListEnabled: initialData?.bringList?.enabled || false,
    bringItems: initialData?.bringList?.items || [] as BringItem[],
  })
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [newBringItem, setNewBringItem] = useState('')

  const handleInputChange = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const value = e.target.value
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }))
    }
    // Clear error when user interacts with form
    if (error) {
      setError(null)
    }
  }

  const handleLocationChange = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value
    setFormData(prev => ({
      ...prev,
      location: { ...prev.location, [field]: value }
    }))
  }

  const handleCheckboxChange = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const checked = e.target.checked
    setFormData(prev => ({ ...prev, [field]: checked }))
  }

  const addBringItem = () => {
    if (newBringItem.trim()) {
      const item: BringItem = {
        id: `item_${Date.now()}`,
        eventId: '', // Will be set when event is created
        item: newBringItem.trim(),
        quantity: 1,
        fulfilled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      setFormData(prev => ({
        ...prev,
        bringItems: [...prev.bringItems, item]
      }))
      setNewBringItem('')
    }
  }

  const removeBringItem = (itemId: string) => {
    setFormData(prev => ({
      ...prev,
      bringItems: prev.bringItems.filter(item => item.id !== itemId)
    }))
  }

  const updateBringItemQuantity = (itemId: string, quantity: number) => {
    setFormData(prev => ({
      ...prev,
      bringItems: prev.bringItems.map(item =>
        item.id === itemId ? { ...item, quantity: Math.max(1, quantity) } : item
      )
    }))
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!formData.title.trim()) {
      errors.title = 'Event title is required'
    } else if (formData.title.length < 3) {
      errors.title = 'Title must be at least 3 characters'
    } else if (formData.title.length > 100) {
      errors.title = 'Title must be less than 100 characters'
    }

    if (!formData.description.trim()) {
      errors.description = 'Event description is required'
    } else if (formData.description.length < 10) {
      errors.description = 'Description must be at least 10 characters'
    } else if (formData.description.length > 2000) {
      errors.description = 'Description must be less than 2000 characters'
    }

    if (!formData.dateTime) {
      errors.dateTime = 'Event date and time is required'
    } else {
      const eventDate = new Date(formData.dateTime)
      const now = new Date()
      if (eventDate <= now) {
        errors.dateTime = 'Event must be scheduled in the future'
      }
    }

    if (!formData.location.name.trim()) {
      errors.locationName = 'Location name is required'
    }

    if (!formData.location.address.trim()) {
      errors.locationAddress = 'Location address is required'
    }

    if (formData.capacity && (isNaN(Number(formData.capacity)) || Number(formData.capacity) < 1)) {
      errors.capacity = 'Capacity must be a positive number'
    }

    if (formData.duration < 30 || formData.duration > 1440) {
      errors.duration = 'Duration must be between 30 minutes and 24 hours'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      // Create event object
      const eventData: Omit<Event, 'capacity'> & { capacity?: number } = {
        id: `event_${Date.now()}`, // In real app, this would be generated by Firestore
        title: formData.title.trim(),
        description: formData.description.trim(),
        type: formData.type,
        visibility: formData.visibility,
        organizer: 'current-user-id', // Would come from auth context
        dateTime: new Date(formData.dateTime),
        duration: formData.duration,
        location: {
          name: formData.location.name.trim(),
          address: formData.location.address.trim(),
        },
        images: [],
        bringList: {
          enabled: formData.bringListEnabled,
          items: formData.bringItems,
        },
        attendees: {},
        waitlist: [],
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // Add capacity if specified
      if (formData.capacity) {
        eventData.capacity = Number(formData.capacity)
      }

      // Here you would typically save to Firestore
      console.log('Event data to save:', eventData)

      onSuccess?.(eventData)
    } catch (err) {
      console.error('Error creating event:', err)
      setError(err instanceof Error ? err.message : 'Failed to create event')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {initialData ? 'Edit Event' : 'Create New Event'}
          </h2>
          <p className="text-gray-600 mt-2">
            Fill in the details for your community event
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert type="error" message={error} />
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>

            <Input
              type="text"
              label="Event Title"
              value={formData.title}
              onChange={handleInputChange('title')}
              {...(validationErrors.title && { error: validationErrors.title })}
              placeholder="e.g., Community Potluck Dinner"
              disabled={isSubmitting}
              required
            />

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={handleInputChange('description')}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-50 disabled:cursor-not-allowed"
                placeholder="Describe your event..."
                rows={4}
                disabled={isSubmitting}
                required
              />
              {validationErrors.description && (
                <p className="text-sm text-red-600">{validationErrors.description}</p>
              )}
              <p className="text-sm text-gray-500">
                {formData.description.length}/2000 characters
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Event Type
                </label>
                <select
                  value={formData.type}
                  onChange={handleInputChange('type')}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  <option value="birthday">Birthday</option>
                  <option value="potluck">Potluck</option>
                  <option value="farewell">Farewell</option>
                  <option value="celebration">Celebration</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Visibility
                </label>
                <select
                  value={formData.visibility}
                  onChange={handleInputChange('visibility')}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </div>
            </div>
          </div>

          {/* Date and Time */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Date & Time</h3>

            <div className="grid grid-cols-2 gap-4">
              <Input
                type="datetime-local"
                label="Event Date & Time"
                value={formData.dateTime}
                onChange={handleInputChange('dateTime')}
                {...(validationErrors.dateTime && { error: validationErrors.dateTime })}
                disabled={isSubmitting}
                required
              />

              <Input
                type="number"
                label="Duration (minutes)"
                value={formData.duration.toString()}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: Number(e.target.value) }))}
                {...(validationErrors.duration && { error: validationErrors.duration })}
                placeholder="120"
                min="30"
                max="1440"
                disabled={isSubmitting}
                required
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Location</h3>

            <Input
              type="text"
              label="Location Name"
              value={formData.location.name}
              onChange={handleLocationChange('name')}
              {...(validationErrors.locationName && { error: validationErrors.locationName })}
              placeholder="e.g., Community Center"
              disabled={isSubmitting}
              required
            />

            <Input
              type="text"
              label="Address"
              value={formData.location.address}
              onChange={handleLocationChange('address')}
              {...(validationErrors.locationAddress && { error: validationErrors.locationAddress })}
              placeholder="Full address"
              disabled={isSubmitting}
              required
            />

            <Input
              type="number"
              label="Capacity (optional)"
              value={formData.capacity}
              onChange={handleInputChange('capacity')}
              {...(validationErrors.capacity && { error: validationErrors.capacity })}
              placeholder="Maximum number of attendees"
              min="1"
              disabled={isSubmitting}
            />
          </div>

          {/* Bring List */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Bring List</h3>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.bringListEnabled}
                onChange={handleCheckboxChange('bringListEnabled')}
                disabled={isSubmitting}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                Enable bring list for this event
              </span>
            </label>

            {formData.bringListEnabled && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={newBringItem}
                    onChange={(e) => setNewBringItem(e.target.value)}
                    placeholder="Add an item..."
                    disabled={isSubmitting}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addBringItem()
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={addBringItem}
                    disabled={!newBringItem.trim() || isSubmitting}
                    size="sm"
                  >
                    Add
                  </Button>
                </div>

                <div className="space-y-2">
                  {formData.bringItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-md">
                      <span className="flex-1 text-sm">{item.item}</span>
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-gray-600">Qty:</label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateBringItemQuantity(item.id, Number(e.target.value))}
                          className="w-16 px-2 py-1 text-xs border border-gray-300 rounded"
                          min="1"
                          disabled={isSubmitting}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeBringItem(item.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                        disabled={isSubmitting}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={isSubmitting}
              isLoading={isSubmitting}
            >
              {isSubmitting ? 'Creating Event...' : (initialData ? 'Update Event' : 'Create Event')}
            </Button>
          </div>
        </form>
      </div>
    </Card>
  )
}