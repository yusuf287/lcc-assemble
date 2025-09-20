export interface BringItem {
  id: string
  eventId: string
  item: string
  quantity: number
  assignedTo?: string // User UID
  fulfilled: boolean
  createdAt: Date
  updatedAt: Date
}

// Form types for bring item management
export interface BringItemCreateRequest {
  eventId: string
  item: string
  quantity: number
}

export interface BringItemUpdateRequest {
  id: string
  item?: string
  quantity?: number
  assignedTo?: string
  fulfilled?: boolean
}

export interface BringItemClaimRequest {
  itemId: string
  userId: string
}

export interface BringItemUnclaimRequest {
  itemId: string
  userId: string
}

// API response types
export interface BringItemSummary {
  id: string
  item: string
  quantity: number
  assignedTo?: string
  fulfilled: boolean
  assigneeName?: string
  assigneeImage?: string
}

export interface BringItemDetail extends BringItemSummary {
  eventId: string
  createdAt: string
  updatedAt: string
}

// Bulk operations
export interface BringItemBulkCreateRequest {
  eventId: string
  items: Omit<BringItemCreateRequest, 'eventId'>[]
}

export interface BringItemBulkUpdateRequest {
  updates: BringItemUpdateRequest[]
}

// Query and filter types
export interface BringItemFilters {
  eventId?: string
  assignedTo?: string
  fulfilled?: boolean
  item?: string // partial match
}

export interface BringItemQueryResult {
  items: BringItemSummary[]
  totalCount: number
  fulfilledCount: number
  assignedCount: number
}

// Real-time subscription types
export interface BringItemSubscription {
  eventId: string
  onItemUpdate: (item: BringItemSummary) => void
  onItemClaimed: (item: BringItemSummary, userId: string) => void
  onItemUnclaimed: (item: BringItemSummary, userId: string) => void
  onError?: (error: Error) => void
}

// Statistics and analytics
export interface BringItemStatistics {
  totalItems: number
  fulfilledItems: number
  assignedItems: number
  unassignedItems: number
  fulfillmentRate: number
  mostPopularItems: Array<{
    item: string
    count: number
  }>
  topContributors: Array<{
    userId: string
    userName: string
    itemsCount: number
  }>
}

// Validation types
export interface BringItemValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export interface BringItemConflictCheck {
  hasConflict: boolean
  conflictingUser?: string
  message?: string
}

// UI state types
export interface BringItemUIState {
  isLoading: boolean
  isClaiming: boolean
  isUnclaiming: boolean
  error?: string
  lastUpdated?: Date
}

// Integration with RSVP
export interface RSVPBringItemSelection {
  rsvpStatus: 'going' | 'maybe'
  selectedItems: string[] // Bring item IDs
  customItems?: string[] // User can suggest additional items
}

// Admin types
export interface BringItemAdminView extends BringItem {
  assigneeProfile?: {
    uid: string
    displayName: string
    email: string
    profileImage?: string
  }
  eventTitle: string
  eventDate: string
}

// Notification integration
export interface BringItemNotificationData {
  itemId: string
  itemName: string
  eventId: string
  eventTitle: string
  assigneeId?: string
  assigneeName?: string
}

// Constants
export const MAX_BRING_ITEMS_PER_EVENT = 20
export const MAX_ITEM_NAME_LENGTH = 100
export const MAX_ITEM_QUANTITY = 100

// Utility functions
export const isBringItemAssigned = (item: BringItem): boolean => {
  return !!item.assignedTo
}

export const isBringItemFulfilled = (item: BringItem): boolean => {
  return item.fulfilled
}

export const canUserClaimItem = (item: BringItem, userId: string): boolean => {
  return !item.assignedTo || item.assignedTo === userId
}

export const canUserUnclaimItem = (item: BringItem, userId: string): boolean => {
  return item.assignedTo === userId && !item.fulfilled
}

export const getBringItemStatus = (item: BringItem): 'available' | 'assigned' | 'fulfilled' => {
  if (item.fulfilled) return 'fulfilled'
  if (item.assignedTo) return 'assigned'
  return 'available'
}

// Validation helpers
export const validateBringItemName = (name: string): BringItemValidationResult => {
  const errors: string[] = []
  const warnings: string[] = []

  if (!name.trim()) {
    errors.push('Item name is required')
  }

  if (name.length > MAX_ITEM_NAME_LENGTH) {
    errors.push(`Item name must be ${MAX_ITEM_NAME_LENGTH} characters or less`)
  }

  if (name.length < 2) {
    warnings.push('Item name is very short')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

export const validateBringItemQuantity = (quantity: number): BringItemValidationResult => {
  const errors: string[] = []
  const warnings: string[] = []

  if (quantity < 1) {
    errors.push('Quantity must be at least 1')
  }

  if (quantity > MAX_ITEM_QUANTITY) {
    errors.push(`Quantity cannot exceed ${MAX_ITEM_QUANTITY}`)
  }

  if (quantity > 10) {
    warnings.push('Large quantity may be difficult to fulfill')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}