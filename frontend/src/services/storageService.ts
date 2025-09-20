import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll,
  getMetadata,
  updateMetadata
} from 'firebase/storage'
import { storage } from './firebase'

// Storage paths
export const STORAGE_PATHS = {
  users: {
    profile: (userId: string) => `users/${userId}/profile`,
    documents: (userId: string) => `users/${userId}/documents`
  },
  events: {
    cover: (eventId: string) => `events/${eventId}/cover`,
    images: (eventId: string) => `events/${eventId}/images`,
    documents: (eventId: string) => `events/${eventId}/documents`
  },
  system: {
    backups: 'system/backups',
    logs: 'system/logs'
  }
} as const

// File validation
export interface FileValidationOptions {
  maxSize?: number // in bytes
  allowedTypes?: string[] // MIME types
  maxFiles?: number
}

export interface FileValidationResult {
  isValid: boolean
  error?: string
}

export const validateFile = (
  file: File,
  options: FileValidationOptions = {}
): FileValidationResult => {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    maxFiles = 1
  } = options

  // Check file size
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`
    }
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`
    }
  }

  return { isValid: true }
}

// Upload single file
export const uploadFile = async (
  path: string,
  file: File,
  metadata?: { [key: string]: string }
): Promise<string> => {
  try {
    const fileRef = ref(storage, `${path}/${file.name}`)
    const uploadResult = await uploadBytes(fileRef, file, { customMetadata: metadata })
    const downloadURL = await getDownloadURL(uploadResult.ref)
    return downloadURL
  } catch (error) {
    console.error('Error uploading file:', error)
    throw new Error('Failed to upload file')
  }
}

// Upload multiple files
export const uploadFiles = async (
  path: string,
  files: File[],
  metadata?: { [key: string]: string }
): Promise<string[]> => {
  try {
    const uploadPromises = files.map(file => uploadFile(path, file, metadata))
    return await Promise.all(uploadPromises)
  } catch (error) {
    console.error('Error uploading files:', error)
    throw new Error('Failed to upload files')
  }
}

// Delete file
export const deleteFile = async (url: string): Promise<void> => {
  try {
    const fileRef = ref(storage, url)
    await deleteObject(fileRef)
  } catch (error) {
    console.error('Error deleting file:', error)
    throw new Error('Failed to delete file')
  }
}

// Delete multiple files
export const deleteFiles = async (urls: string[]): Promise<void> => {
  try {
    const deletePromises = urls.map(url => deleteFile(url))
    await Promise.all(deletePromises)
  } catch (error) {
    console.error('Error deleting files:', error)
    throw new Error('Failed to delete files')
  }
}

// Get file metadata
export const getFileMetadata = async (url: string): Promise<any> => {
  try {
    const fileRef = ref(storage, url)
    return await getMetadata(fileRef)
  } catch (error) {
    console.error('Error getting file metadata:', error)
    throw new Error('Failed to get file metadata')
  }
}

// Update file metadata
export const updateFileMetadata = async (
  url: string,
  metadata: { [key: string]: string }
): Promise<void> => {
  try {
    const fileRef = ref(storage, url)
    await updateMetadata(fileRef, { customMetadata: metadata })
  } catch (error) {
    console.error('Error updating file metadata:', error)
    throw new Error('Failed to update file metadata')
  }
}

// List files in directory
export const listFiles = async (path: string): Promise<string[]> => {
  try {
    const directoryRef = ref(storage, path)
    const result = await listAll(directoryRef)
    const downloadURLs = await Promise.all(
      result.items.map(item => getDownloadURL(item))
    )
    return downloadURLs
  } catch (error) {
    console.error('Error listing files:', error)
    throw new Error('Failed to list files')
  }
}

// User profile image operations
export const uploadProfileImage = async (userId: string, file: File): Promise<string> => {
  const validation = validateFile(file, {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
  })

  if (!validation.isValid) {
    throw new Error(validation.error)
  }

  const path = STORAGE_PATHS.users.profile(userId)
  return await uploadFile(path, file, {
    uploadedBy: userId,
    uploadType: 'profile_image',
    originalName: file.name
  })
}

export const deleteProfileImage = async (userId: string, imageName: string): Promise<void> => {
  const path = `${STORAGE_PATHS.users.profile(userId)}/${imageName}`
  const fileRef = ref(storage, path)
  await deleteObject(fileRef)
}

// Event image operations
export const uploadEventCoverImage = async (eventId: string, file: File): Promise<string> => {
  const validation = validateFile(file, {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
  })

  if (!validation.isValid) {
    throw new Error(validation.error)
  }

  const path = STORAGE_PATHS.events.cover(eventId)
  return await uploadFile(path, file, {
    uploadedBy: 'system', // Would be actual user ID
    uploadType: 'event_cover',
    originalName: file.name
  })
}

export const uploadEventImages = async (eventId: string, files: File[]): Promise<string[]> => {
  const validationPromises = files.map(file =>
    validateFile(file, {
      maxSize: 10 * 1024 * 1024, // 10MB per image
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
    })
  )

  const validations = await Promise.all(validationPromises)
  const invalidFiles = validations.filter(v => !v.isValid)

  if (invalidFiles.length > 0) {
    throw new Error(invalidFiles[0].error || 'File validation failed')
  }

  const path = STORAGE_PATHS.events.images(eventId)
  return await uploadFiles(path, files, {
    uploadedBy: 'system', // Would be actual user ID
    uploadType: 'event_image'
  })
}

export const deleteEventImage = async (eventId: string, imageName: string): Promise<void> => {
  const path = `${STORAGE_PATHS.events.images(eventId)}/${imageName}`
  const fileRef = ref(storage, path)
  await deleteObject(fileRef)
}

// Bulk operations for events
export const cleanupEventImages = async (eventId: string): Promise<void> => {
  try {
    const coverPath = STORAGE_PATHS.events.cover(eventId)
    const imagesPath = STORAGE_PATHS.events.images(eventId)

    // Delete cover image if exists
    try {
      const coverFiles = await listFiles(coverPath)
      if (coverFiles.length > 0) {
        await deleteFiles(coverFiles)
      }
    } catch (error) {
      // Cover image might not exist, continue
    }

    // Delete all event images
    try {
      const imageFiles = await listFiles(imagesPath)
      if (imageFiles.length > 0) {
        await deleteFiles(imageFiles)
      }
    } catch (error) {
      // Images might not exist, continue
    }
  } catch (error) {
    console.error('Error cleaning up event images:', error)
    throw new Error('Failed to cleanup event images')
  }
}

// Storage quota monitoring
export const getStorageUsage = async (userId: string): Promise<{
  totalSize: number
  fileCount: number
  files: Array<{
    name: string
    size: number
    url: string
    uploadedAt: string
  }>
}> => {
  try {
    const profilePath = STORAGE_PATHS.users.profile(userId)
    const documentsPath = STORAGE_PATHS.users.documents(userId)

    const [profileFiles, documentFiles] = await Promise.all([
      listFiles(profilePath).catch(() => []),
      listFiles(documentsPath).catch(() => [])
    ])

    const allFiles = [...profileFiles, ...documentFiles]
    let totalSize = 0
    const fileDetails: Array<{
      name: string
      size: number
      url: string
      uploadedAt: string
    }> = []

    for (const url of allFiles) {
      try {
        const metadata = await getFileMetadata(url)
        const size = metadata.size || 0
        totalSize += size

        fileDetails.push({
          name: metadata.name || 'Unknown',
          size,
          url,
          uploadedAt: metadata.timeCreated || new Date().toISOString()
        })
      } catch (error) {
        // Skip files with metadata errors
        continue
      }
    }

    return {
      totalSize,
      fileCount: fileDetails.length,
      files: fileDetails
    }
  } catch (error) {
    console.error('Error getting storage usage:', error)
    throw new Error('Failed to get storage usage')
  }
}

// Image optimization utilities
export const optimizeImage = (file: File, maxWidth: number = 1920, quality: number = 0.8): Promise<File> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img
      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }

      canvas.width = width
      canvas.height = height

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const optimizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            })
            resolve(optimizedFile)
          } else {
            reject(new Error('Failed to optimize image'))
          }
        },
        file.type,
        quality
      )
    }

    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = URL.createObjectURL(file)
  })
}

// Batch upload with progress tracking
export const uploadFilesWithProgress = async (
  path: string,
  files: File[],
  onProgress?: (completed: number, total: number) => void,
  metadata?: { [key: string]: string }
): Promise<string[]> => {
  const results: string[] = []
  let completed = 0

  for (const file of files) {
    try {
      const url = await uploadFile(path, file, metadata)
      results.push(url)
      completed++
      onProgress?.(completed, files.length)
    } catch (error) {
      console.error(`Failed to upload ${file.name}:`, error)
      // Continue with other files
      completed++
      onProgress?.(completed, files.length)
    }
  }

  return results
}