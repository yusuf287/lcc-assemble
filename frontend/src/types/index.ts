// Core entity types
export * from './user'
export * from './event'
export * from './notification'
export * from './bringItem'

// Common utility types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  totalCount: number
  hasMore: boolean
  nextCursor?: string
}

export interface SearchFilters {
  query?: string
  limit?: number
  offset?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface DateRange {
  start: Date
  end: Date
}

export interface Coordinates {
  lat: number
  lng: number
}

// Form validation types
export interface ValidationResult {
  isValid: boolean
  errors: Record<string, string>
  warnings?: Record<string, string>
}

export interface FormField<T = unknown> {
  value: T
  error?: string
  touched: boolean
  validating: boolean
}

// Loading and error states
export interface LoadingState {
  isLoading: boolean
  error?: string
  retry?: () => void
}

export interface AsyncState<T> {
  data?: T
  isLoading: boolean
  error?: string
  lastUpdated?: Date
}

// Firebase specific types
export interface FirebaseTimestamp {
  seconds: number
  nanoseconds: number
}

export interface FirebaseGeoPoint {
  latitude: number
  longitude: number
}

// UI component types
export interface SelectOption {
  value: string | number
  label: string
  disabled?: boolean
}

export interface TableColumn<T = Record<string, unknown>> {
  key: keyof T
  label: string
  sortable?: boolean
  width?: string | number
  render?: (value: unknown, item: T) => React.ReactNode
}

// Notification and messaging types
export interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

// File upload types
export interface FileUploadResult {
  success: boolean
  url?: string
  error?: string
  fileName: string
  fileSize: number
}

export interface ImageUploadConstraints {
  maxSize: number // bytes
  allowedTypes: string[]
  maxWidth?: number
  maxHeight?: number
  quality?: number
}

// Real-time subscription types
export interface Subscription<T> {
  data: T
  isConnected: boolean
  error?: string
  unsubscribe: () => void
}

// Admin and moderation types
export interface ModerationAction {
  id: string
  type: 'approve' | 'reject' | 'suspend' | 'delete' | 'warn'
  reason: string
  performedBy: string
  performedAt: Date
  targetId: string
  targetType: 'user' | 'event' | 'comment'
}

export interface AuditLogEntry {
  id: string
  action: string
  performedBy: string
  performedAt: Date
  targetId?: string
  targetType?: string
  details?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}

// Analytics and reporting types
export interface AnalyticsData {
  period: DateRange
  metrics: Record<string, number>
  trends: Record<string, number[]>
  breakdowns: Record<string, Record<string, number>>
}

export interface ReportData {
  title: string
  generatedAt: Date
  data: AnalyticsData
  filters?: Record<string, unknown>
}

// Constants
export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 100
export const DEFAULT_TIMEOUT = 30000 // 30 seconds

// Type guards
export const isApiResponse = <T>(obj: unknown): obj is ApiResponse<T> => {
  const o = obj as Record<string, unknown>
  return obj !== null && typeof obj === 'object' && 'success' in o && typeof o.success === 'boolean'
}

export const isPaginatedResponse = <T>(obj: unknown): obj is PaginatedResponse<T> => {
  const o = obj as Record<string, unknown>
  return obj !== null && typeof obj === 'object' &&
    'items' in o && Array.isArray(o.items) &&
    'totalCount' in o && typeof o.totalCount === 'number'
}

export const isValidationResult = (obj: unknown): obj is ValidationResult => {
  const o = obj as Record<string, unknown>
  return obj !== null && typeof obj === 'object' &&
    'isValid' in o && typeof o.isValid === 'boolean' &&
    'errors' in o && typeof o.errors === 'object'
}

// Utility type helpers
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

// React specific types
export type ComponentProps<T> = T extends React.ComponentType<infer P> ? P : never
export type EventHandler<T = Element, E = Event> = (event: E & { currentTarget: T }) => void