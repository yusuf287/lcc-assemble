import { z } from 'zod'

// User validation schemas
export const userRegistrationSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  displayName: z
    .string()
    .min(2, 'Display name must be at least 2 characters')
    .max(50, 'Display name must be less than 50 characters')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Display name can only contain letters, numbers, spaces, hyphens, and underscores'),
  phoneNumber: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^\+?[\d\s\-\(\)]{10,}$/.test(val),
      'Please enter a valid phone number'
    ),
  whatsappNumber: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^\+?[\d\s\-\(\)]{10,}$/.test(val),
      'Please enter a valid WhatsApp number'
    ),
  bio: z
    .string()
    .max(500, 'Bio must be less than 500 characters')
    .optional(),
  interests: z
    .array(z.string())
    .max(10, 'You can select up to 10 interests'),
  dietaryPreferences: z
    .array(z.string())
    .max(10, 'You can select up to 10 dietary preferences'),
  address: z
    .object({
      street: z.string().min(1, 'Street address is required'),
      city: z.string().min(1, 'City is required'),
      postalCode: z.string().min(1, 'Postal code is required')
    })
    .optional(),
  privacy: z.object({
    phoneVisible: z.boolean(),
    whatsappVisible: z.boolean(),
    addressVisible: z.boolean()
  })
})

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must be less than 100 characters')
})

export const passwordResetSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
})

// Event validation schemas
export const eventCreationSchema = z.object({
  title: z
    .string()
    .min(3, 'Event title must be at least 3 characters')
    .max(100, 'Event title must be less than 100 characters'),
  description: z
    .string()
    .min(10, 'Event description must be at least 10 characters')
    .max(2000, 'Event description must be less than 2000 characters'),
  type: z.enum(['birthday', 'potluck', 'farewell', 'celebration', 'other']),
  visibility: z.enum(['public', 'private']),
  dateTime: z
    .date()
    .min(new Date(), 'Event date and time must be in the future'),
  duration: z
    .number()
    .min(15, 'Event duration must be at least 15 minutes')
    .max(480, 'Event duration cannot exceed 8 hours'),
  location: z.object({
    name: z
      .string()
      .min(1, 'Location name is required')
      .max(100, 'Location name must be less than 100 characters'),
    address: z
      .string()
      .min(1, 'Address is required')
      .max(200, 'Address must be less than 200 characters'),
    coordinates: z
      .object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180)
      })
      .optional()
  }),
  capacity: z
    .number()
    .min(1, 'Capacity must be at least 1')
    .max(1000, 'Capacity cannot exceed 1000')
    .optional(),
  bringList: z.object({
    enabled: z.boolean(),
    items: z
      .array(
        z.object({
          item: z
            .string()
            .min(1, 'Item name is required')
            .max(50, 'Item name must be less than 50 characters'),
          quantity: z
            .number()
            .min(1, 'Quantity must be at least 1')
            .max(100, 'Quantity cannot exceed 100')
        })
      )
      .max(20, 'Cannot have more than 20 items on bring list')
  })
})

export const eventUpdateSchema = eventCreationSchema.partial().extend({
  status: z.enum(['draft', 'published', 'cancelled', 'completed']).optional()
})

// RSVP validation schema
export const rsvpSchema = z.object({
  status: z.enum(['going', 'maybe', 'not_going']),
  guestCount: z
    .number()
    .min(0, 'Guest count cannot be negative')
    .max(10, 'Cannot bring more than 10 guests')
    .default(0),
  bringItems: z
    .array(z.string())
    .max(10, 'Cannot claim more than 10 items')
    .optional()
})

// Profile update validation schema
export const profileUpdateSchema = z.object({
  displayName: z
    .string()
    .min(2, 'Display name must be at least 2 characters')
    .max(50, 'Display name must be less than 50 characters')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Display name can only contain letters, numbers, spaces, hyphens, and underscores')
    .optional(),
  phoneNumber: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^\+?[\d\s\-\(\)]{10,}$/.test(val),
      'Please enter a valid phone number'
    ),
  whatsappNumber: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^\+?[\d\s\-\(\)]{10,}$/.test(val),
      'Please enter a valid WhatsApp number'
    ),
  bio: z
    .string()
    .max(500, 'Bio must be less than 500 characters')
    .optional(),
  interests: z
    .array(z.string())
    .max(10, 'You can select up to 10 interests')
    .optional(),
  dietaryPreferences: z
    .array(z.string())
    .max(10, 'You can select up to 10 dietary preferences')
    .optional(),
  address: z
    .object({
      street: z.string().min(1, 'Street address is required'),
      city: z.string().min(1, 'City is required'),
      postalCode: z.string().min(1, 'Postal code is required')
    })
    .optional(),
  privacy: z.object({
    phoneVisible: z.boolean(),
    whatsappVisible: z.boolean(),
    addressVisible: z.boolean()
  }).optional()
})

// Search and filter validation schemas
export const userSearchSchema = z.object({
  query: z
    .string()
    .max(100, 'Search query must be less than 100 characters')
    .optional(),
  interests: z
    .array(z.string())
    .max(10, 'Cannot filter by more than 10 interests')
    .optional(),
  availability: z
    .array(z.enum(['weekdays', 'evenings', 'weekends']))
    .max(3)
    .optional()
})

export const eventSearchSchema = z.object({
  query: z
    .string()
    .max(100, 'Search query must be less than 100 characters')
    .optional(),
  type: z
    .array(z.enum(['birthday', 'potluck', 'farewell', 'celebration', 'other']))
    .max(5)
    .optional(),
  dateRange: z
    .object({
      start: z.date(),
      end: z.date()
    })
    .optional(),
  location: z
    .string()
    .max(100, 'Location must be less than 100 characters')
    .optional(),
  status: z
    .array(z.enum(['draft', 'published', 'cancelled', 'completed']))
    .max(4)
    .optional(),
  visibility: z
    .array(z.enum(['public', 'private']))
    .max(2)
    .optional()
})

// Admin validation schemas
export const adminUserActionSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  action: z.enum(['approve', 'suspend', 'activate']),
  reason: z
    .string()
    .max(500, 'Reason must be less than 500 characters')
    .optional()
})

export const adminEventActionSchema = z.object({
  eventId: z.string().min(1, 'Event ID is required'),
  action: z.enum(['publish', 'cancel', 'feature']),
  reason: z
    .string()
    .max(500, 'Reason must be less than 500 characters')
    .optional()
})

// Notification validation schema
export const notificationPreferencesSchema = z.object({
  email: z.object({
    eventInvites: z.boolean(),
    eventUpdates: z.boolean(),
    eventReminders: z.boolean(),
    systemMessages: z.boolean()
  }),
  inApp: z.object({
    eventInvites: z.boolean(),
    eventUpdates: z.boolean(),
    eventReminders: z.boolean(),
    systemMessages: z.boolean()
  }),
  push: z.object({
    eventInvites: z.boolean(),
    eventUpdates: z.boolean(),
    eventReminders: z.boolean(),
    systemMessages: z.boolean()
  })
})

// Type exports for use in components
export type UserRegistrationForm = z.infer<typeof userRegistrationSchema>
export type LoginForm = z.infer<typeof loginSchema>
export type PasswordResetForm = z.infer<typeof passwordResetSchema>
export type EventCreationForm = z.infer<typeof eventCreationSchema>
export type EventUpdateForm = z.infer<typeof eventUpdateSchema>
export type RSVPForm = z.infer<typeof rsvpSchema>
export type ProfileUpdateForm = z.infer<typeof profileUpdateSchema>
export type UserSearchForm = z.infer<typeof userSearchSchema>
export type EventSearchForm = z.infer<typeof eventSearchSchema>
export type AdminUserActionForm = z.infer<typeof adminUserActionSchema>
export type AdminEventActionForm = z.infer<typeof adminEventActionSchema>
export type NotificationPreferencesForm = z.infer<typeof notificationPreferencesSchema>