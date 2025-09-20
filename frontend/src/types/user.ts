export interface User {
  uid: string
  email: string
  displayName: string
  phoneNumber?: string
  whatsappNumber?: string
  bio?: string
  interests: string[]
  dietaryPreferences: string[]
  profileImage?: string
  address?: UserAddress
  privacy: UserPrivacySettings
  role: UserRole
  status: UserStatus
  defaultAvailability: UserAvailability
  createdAt: Date
  updatedAt: Date
}

export interface UserAddress {
  street: string
  city: string
  postalCode: string
}

export interface UserPrivacySettings {
  phoneVisible: boolean
  whatsappVisible: boolean
  addressVisible: boolean
}

export type UserRole = 'admin' | 'member'
export type UserStatus = 'pending' | 'approved' | 'suspended'

export interface UserAvailability {
  weekdays: boolean
  evenings: boolean
  weekends: boolean
}

// Form types for user registration and profile updates
export interface UserRegistrationForm {
  email: string
  displayName: string
  phoneNumber?: string
  whatsappNumber?: string
  bio?: string
  interests: string[]
  dietaryPreferences: string[]
  address?: UserAddress
  privacy: UserPrivacySettings
  defaultAvailability: UserAvailability
}

export interface UserProfileUpdateForm extends Partial<UserRegistrationForm> {
  profileImage?: File
}

// API response types
export interface UserProfile extends Omit<User, 'createdAt' | 'updatedAt' | 'address'> {
  address?: UserAddress
  createdAt: string
  updatedAt: string
}

export interface UserSummary {
  uid: string
  displayName: string
  profileImage?: string
  interests: string[]
  defaultAvailability: UserAvailability
}

// Admin types
export interface UserAdminView extends User {
  lastLogin?: Date
  eventCount: number
  rsvpCount: number
}

// Query and filter types
export interface UserFilters {
  status?: UserStatus
  role?: UserRole
}

export interface UserQueryResult {
  users: UserSummary[]
  hasMore: boolean
  lastDoc?: unknown
}