import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { getEvent, updateEvent, uploadEventImage, cancelEvent } from '../services/eventService'
import { EventCreationForm, EventType, EventVisibility } from '../types'
import MemberSelector from '../components/events/MemberSelector'
import MapDisplay from '../components/ui/MapDisplay'
import EventDeleteDialog from '../components/events/EventDeleteDialog'
import toast from 'react-hot-toast'

// Step definitions
const STEPS = [
  { id: 'basic', title: 'Basic Info', description: 'Event title and description' },
  { id: 'details', title: 'Details', description: 'Date, time, and location' },
  { id: 'settings', title: 'Settings', description: 'Privacy and capacity' },
  { id: 'invites', title: 'Invitations', description: 'Invite specific members (private events only)' },
  { id: 'review', title: 'Review', description: 'Review and save changes' }
]

const EVENT_TYPES: { value: EventType; label: string; icon: string }[] = [
  { value: 'birthday', label: 'Birthday', icon: '🎂' },
  { value: 'potluck', label: 'Potluck', icon: '🍽️' },
  { value: 'farewell', label: 'Farewell', icon: '👋' },
  { value: 'celebration', label: 'Celebration', icon: '🎉' },
  { value: 'other', label: 'Other', icon: '📅' }
]

const EditEventPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null)
  const [coverImagePreview, setCoverImagePreview] = useState<string>('')
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [originalEvent, setOriginalEvent] = useState<any>(null)

  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deleteDialogStep, setDeleteDialogStep] = useState<'confirm' | 'warning'>('confirm')
  const [isDeleting, setIsDeleting] = useState(false)

  // Form data
  const [formData, setFormData] = useState<EventCreationForm>({
    title: '',
    description: '',
    type: 'other',
    visibility: 'public',
    dateTime: new Date(),
    duration: 120,
    location: {
      name: '',
      address: '',
      coordinates: undefined
    },
    capacity: undefined,
    coverImage: undefined,
    bringList: {
      enabled: false,
      items: []
    },
    invitedMembers: []
  })

  // Form validation
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (eventId) {
      loadEvent()
    }
  }, [eventId])

  const loadEvent = async () => {
    if (!eventId || !user) return

    try {
      setIsLoading(true)
      const eventData = await getEvent(eventId)

      if (!eventData) {
        toast.error('Event not found')
        navigate('/events')
        return
      }

      // Check if user is the organizer
      if (eventData.organizer !== user.uid) {
        toast.error('You do not have permission to edit this event')
        navigate(`/events/${eventId}`)
        return
      }

      // Check if event is already cancelled or completed
      if (eventData.status === 'cancelled' || eventData.status === 'completed') {
        toast.error(`Cannot edit a ${eventData.status} event`)
        navigate(`/events/${eventId}`)
        return
      }

      setOriginalEvent(eventData)

      // Populate form data
      setFormData({
        title: eventData.title,
        description: eventData.description,
        type: eventData.type,
        visibility: eventData.visibility,
        dateTime: eventData.dateTime,
        duration: eventData.duration,
        location: eventData.location,
        capacity: eventData.capacity,
        coverImage: undefined,
        bringList: eventData.bringList,
        invitedMembers: eventData.invitedMembers || []
      })

      setSelectedMembers(eventData.invitedMembers || [])
      setCoverImagePreview(eventData.coverImage || '')

    } catch (error) {
      console.error('Error loading event:', error)
      toast.error('Failed to load event')
      navigate('/events')
    } finally {
      setIsLoading(false)
    }
  }

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}

    switch (step) {
      case 0: // Basic Info
        if (!formData.title.trim()) newErrors.title = 'Title is required'
        if (!formData.description.trim()) newErrors.description = 'Description is required'
        break

      case 1: // Details
        if (!formData.location.name.trim()) newErrors.locationName = 'Location name is required'
        if (!formData.location.address.trim()) newErrors.locationAddress = 'Address is required'
        if (!formData.dateTime || formData.dateTime <= new Date()) {
          newErrors.dateTime = 'Event must be in the future'
        }
        if (formData.duration < 30) newErrors.duration = 'Duration must be at least 30 minutes'
        break

      case 2: // Settings
        if (formData.capacity && formData.capacity < 1) {
          newErrors.capacity = 'Capacity must be at least 1'
        }
        break

      case 3: // Invites
        if (formData.visibility === 'private' && selectedMembers.length === 0) {
          newErrors.invites = 'Private events must have at least one invited member'
        }
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      let nextStep = currentStep + 1

      // Skip invites step if event is public
      if (currentStep === 2 && formData.visibility === 'public') {
        nextStep = 4 // Skip to review
      }

      setCurrentStep(Math.min(nextStep, STEPS.length - 1))
    }
  }

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0))
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleLocationChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        [field]: value
      }
    }))

    // Clear location errors
    if (errors[`location${field.charAt(0).toUpperCase() + field.slice(1)}`]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[`location${field.charAt(0).toUpperCase() + field.slice(1)}`]
        return newErrors
      })
    }
  }

  const handleBringListChange = (enabled: boolean) => {
    setFormData(prev => ({
      ...prev,
      bringList: {
        enabled,
        items: enabled ? prev.bringList.items : []
      }
    }))
  }

  const addBringListItem = () => {
    setFormData(prev => ({
      ...prev,
      bringList: {
        ...prev.bringList,
        items: [
          ...prev.bringList.items,
          { item: '', quantity: 1 }
        ]
      }
    }))
  }

  const updateBringListItem = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      bringList: {
        ...prev.bringList,
        items: prev.bringList.items.map((item, i) =>
          i === index ? { ...item, [field]: value } : item
        )
      }
    }))
  }

  const removeBringListItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      bringList: {
        ...prev.bringList,
        items: prev.bringList.items.filter((_, i) => i !== index)
      }
    }))
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file')
        return
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB')
        return
      }

      setCoverImageFile(file)

      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setCoverImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async () => {
    if (!eventId || !user) return

    try {
      setIsSubmitting(true)

      // Prepare form data with invited members
      const eventData = {
        ...formData,
        invitedMembers: formData.visibility === 'private' ? selectedMembers : []
      }

      // Update the event
      await updateEvent(eventId, eventData)

      // Upload cover image if provided
      if (coverImageFile) {
        try {
          await uploadEventImage(eventId, coverImageFile, true)
        } catch (imageError) {
          console.warn('Failed to upload cover image:', imageError)
          // Don't fail the whole process for image upload issues
        }
      }

      toast.success('Event updated successfully!')

      // Navigate to the event details page
      navigate(`/events/${eventId}`)

    } catch (error: any) {
      console.error('Error updating event:', error)
      toast.error(error.message || 'Failed to update event. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true)
    setDeleteDialogStep('confirm')
  }

  const handleDeleteConfirm = () => {
    if (deleteDialogStep === 'confirm') {
      // Move to warning step
      setDeleteDialogStep('warning')
    } else {
      // Final confirmation - proceed with deletion
      handleDeleteEvent()
    }
  }

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false)
    setDeleteDialogStep('confirm')
  }

  const handleDeleteEvent = async () => {
    if (!eventId || !user) return

    try {
      setIsDeleting(true)

      await cancelEvent(eventId)

      toast.success('Event cancelled successfully!')
      navigate('/events')

    } catch (error: any) {
      console.error('Error cancelling event:', error)
      toast.error(error.message || 'Failed to cancel event. Please try again.')
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Basic Info
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Title *
              </label>
              <Input
                type="text"
                placeholder="e.g., Community Potluck Gathering"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                error={errors.title}
                maxLength={100}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-vertical"
                placeholder="Describe your event..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                maxLength={2000}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Event Type
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {EVENT_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => handleInputChange('type', type.value)}
                    className={`p-3 border rounded-lg text-left hover:border-orange-300 transition-colors ${
                      formData.type === type.value
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{type.icon}</span>
                      <span className="text-sm font-medium">{type.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )

      case 1: // Details
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date & Time *
                </label>
                <Input
                  type="datetime-local"
                  min={new Date().toISOString().slice(0, 16)}
                  value={formData.dateTime.toISOString().slice(0, 16)}
                  onChange={(e) => handleInputChange('dateTime', new Date(e.target.value))}
                  error={errors.dateTime}
                />
                <p className="mt-1 text-sm text-gray-500">
                  Event must be scheduled for a future date and time
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (minutes) *
                </label>
                <Input
                  type="number"
                  min="30"
                  max="1440"
                  value={formData.duration.toString()}
                  onChange={(e) => handleInputChange('duration', parseInt(e.target.value) || 120)}
                  error={errors.duration}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location Name *
              </label>
              <Input
                type="text"
                placeholder="e.g., Community Center"
                value={formData.location.name}
                onChange={(e) => handleLocationChange('name', e.target.value)}
                error={errors.locationName}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address *
              </label>
              <Input
                type="text"
                placeholder="Full address for directions"
                value={formData.location.address}
                onChange={(e) => handleLocationChange('address', e.target.value)}
                error={errors.locationAddress}
              />
            </div>

            {/* Location Preview Map */}
            {formData.location.address.trim() && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location Preview
                </label>
                <MapDisplay
                  address={formData.location.address}
                  locationName={formData.location.name}
                  coordinates={formData.location.coordinates}
                  height="200px"
                  className="border border-gray-200 rounded-lg"
                />
                <p className="mt-1 text-sm text-gray-500">
                  This is a preview of the event location on the map
                </p>
              </div>
            )}
          </div>
        )

      case 2: // Settings
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Visibility
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="visibility"
                    value="public"
                    checked={formData.visibility === 'public'}
                    onChange={(e) => handleInputChange('visibility', e.target.value as EventVisibility)}
                    className="text-orange-600 focus:ring-orange-500"
                  />
                  <span className="ml-2 text-sm">Public - Anyone can see and join</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="visibility"
                    value="private"
                    checked={formData.visibility === 'private'}
                    onChange={(e) => handleInputChange('visibility', e.target.value as EventVisibility)}
                    className="text-orange-600 focus:ring-orange-500"
                  />
                  <span className="ml-2 text-sm">Private - Invite only</span>
                </label>
              </div>
              {formData.visibility === 'private' && (
                <p className="mt-2 text-sm text-orange-600">
                  Private events require selecting specific members to invite.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Capacity (optional)
              </label>
              <Input
                type="number"
                min="1"
                placeholder="Leave empty for unlimited"
                value={formData.capacity?.toString() || ''}
                onChange={(e) => handleInputChange('capacity', e.target.value ? parseInt(e.target.value) : undefined)}
                error={errors.capacity}
              />
              <p className="mt-1 text-sm text-gray-500">
                Maximum number of attendees (excluding organizer)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cover Image (optional)
              </label>
              <div className="space-y-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                />
                {coverImagePreview && (
                  <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={coverImagePreview}
                      alt="Cover preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <p className="text-sm text-gray-500">
                  Recommended: 1200x600px, max 5MB
                </p>
              </div>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.bringList.enabled}
                  onChange={(e) => handleBringListChange(e.target.checked)}
                  className="text-orange-600 focus:ring-orange-500 rounded"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">
                  Enable bring list for attendees
                </span>
              </label>
              <p className="mt-1 text-sm text-gray-500">
                Allow attendees to sign up for items to bring
              </p>
            </div>

            {formData.bringList.enabled && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Bring List Items
                </label>
                <div className="space-y-3">
                  {formData.bringList.items.map((item, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <Input
                        type="text"
                        placeholder="Item name"
                        value={item.item}
                        onChange={(e) => updateBringListItem(index, 'item', e.target.value)}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity.toString()}
                        onChange={(e) => updateBringListItem(index, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-20"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeBringListItem(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addBringListItem}
                    className="w-full"
                  >
                    Add Item
                  </Button>
                </div>
              </div>
            )}
          </div>
        )

      case 3: // Invites (only for private events)
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Invite Members</h3>
              <p className="text-sm text-gray-600 mb-4">
                Select the community members you want to invite to this private event.
                Only invited members will be able to see and RSVP to the event.
              </p>
            </div>

            <MemberSelector
              selectedMembers={selectedMembers}
              onMembersChange={setSelectedMembers}
              maxSelections={50}
            />

            {selectedMembers.length === 0 && (
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> You haven't selected any members yet. Private events require at least one invited member.
                </p>
              </div>
            )}
          </div>
        )

      case 4: // Review
        return (
          <div className="space-y-6">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Summary</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Basic Information</h4>
                  <dl className="space-y-1 text-sm">
                    <div><dt className="inline font-medium">Title:</dt> <dd className="inline ml-2">{formData.title}</dd></div>
                    <div><dt className="inline font-medium">Type:</dt> <dd className="inline ml-2">{EVENT_TYPES.find(t => t.value === formData.type)?.label}</dd></div>
                    <div><dt className="inline font-medium">Visibility:</dt> <dd className="inline ml-2 capitalize">{formData.visibility}</dd></div>
                  </dl>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Date & Location</h4>
                  <dl className="space-y-1 text-sm">
                    <div><dt className="inline font-medium">Date:</dt> <dd className="inline ml-2">{formData.dateTime.toLocaleDateString()}</dd></div>
                    <div><dt className="inline font-medium">Time:</dt> <dd className="inline ml-2">{formData.dateTime.toLocaleTimeString()}</dd></div>
                    <div><dt className="inline font-medium">Duration:</dt> <dd className="inline ml-2">{formData.duration} minutes</dd></div>
                    <div><dt className="inline font-medium">Location:</dt> <dd className="inline ml-2">{formData.location.name}</dd></div>
                  </dl>
                </div>
              </div>

              {formData.capacity && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Capacity</h4>
                  <p className="text-sm">Maximum {formData.capacity} attendees</p>
                </div>
              )}

              {formData.bringList.enabled && formData.bringList.items.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Bring List</h4>
                  <ul className="text-sm space-y-1">
                    {formData.bringList.items.map((item, index) => (
                      <li key={index}>• {item.item} (x{item.quantity})</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Your changes will be saved and the event will be updated for all attendees.
                </p>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Edit Event</h1>
        <p className="mt-2 text-gray-600">Update your event details and settings</p>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center justify-center space-x-4">
        {STEPS.map((step, index) => {
          // Skip invites step in progress indicator if event is public
          if (step.id === 'invites' && formData.visibility === 'public') {
            return null
          }

          const adjustedIndex = step.id === 'invites' && formData.visibility === 'private' ? index :
                               step.id === 'review' && formData.visibility === 'public' ? index - 1 : index

          return (
            <React.Fragment key={step.id}>
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                index <= currentStep ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {adjustedIndex + 1}
              </div>
              {index < STEPS.length - 1 && step.id !== 'invites' && (
                <div className={`flex-1 h-1 ${
                  index < currentStep ? 'bg-orange-500' : 'bg-gray-200'
                }`} />
              )}
            </React.Fragment>
          )
        })}
      </div>

      {/* Step Titles */}
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900">{STEPS[currentStep].title}</h2>
        <p className="text-gray-600">{STEPS[currentStep].description}</p>
      </div>

      {/* Form Content */}
      <Card className="p-8">
        {renderStepContent()}
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 0}
        >
          Previous
        </Button>

        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={() => navigate(`/events/${eventId}`)}
          >
            Cancel
          </Button>

          <Button
            type="button"
            className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
            onClick={handleDeleteClick}
          >
            Cancel Event
          </Button>

          {currentStep < STEPS.length - 1 ? (
            <Button
              type="button"
              onClick={handleNext}
            >
              Next
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner className="w-4 h-4 mr-2" />
                  Saving Changes...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <EventDeleteDialog
        isOpen={isDeleteDialogOpen}
        eventTitle={formData.title}
        step={deleteDialogStep}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isLoading={isDeleting}
      />
    </div>
  )
}

export default EditEventPage