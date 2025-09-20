import { db } from './firebase'
import { doc, getDoc, setDoc, collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore'

// Cache configuration
const CACHE_CONFIG = {
  userProfile: { ttl: 5 * 60 * 1000 }, // 5 minutes
  events: { ttl: 2 * 60 * 1000 }, // 2 minutes
  eventDetails: { ttl: 10 * 60 * 1000 }, // 10 minutes
  notifications: { ttl: 1 * 60 * 1000 }, // 1 minute
  memberDirectory: { ttl: 15 * 60 * 1000 }, // 15 minutes
}

// Cache storage
interface CacheEntry<T = any> {
  data: T
  timestamp: number
  ttl: number
}

class CacheService {
  private cache = new Map<string, CacheEntry>()

  // Generate cache key
  private getCacheKey(type: string, id?: string, params?: Record<string, any>): string {
    const baseKey = id ? `${type}:${id}` : type
    if (params) {
      const paramString = Object.entries(params)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join('&')
      return `${baseKey}?${paramString}`
    }
    return baseKey
  }

  // Check if cache entry is valid
  private isValid(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp < entry.ttl
  }

  // Get cached data
  get<T>(type: string, id?: string, params?: Record<string, any>): T | null {
    const key = this.getCacheKey(type, id, params)
    const entry = this.cache.get(key)

    if (entry && this.isValid(entry)) {
      return entry.data
    }

    // Remove expired entry
    if (entry) {
      this.cache.delete(key)
    }

    return null
  }

  // Set cached data
  set<T>(type: string, data: T, id?: string, params?: Record<string, any>): void {
    const key = this.getCacheKey(type, id, params)
    const ttl = CACHE_CONFIG[type as keyof typeof CACHE_CONFIG]?.ttl || 5 * 60 * 1000

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  // Clear cache for specific type
  clear(type: string, id?: string): void {
    if (id) {
      // Clear specific item
      const key = this.getCacheKey(type, id)
      this.cache.delete(key)
    } else {
      // Clear all items of this type
      for (const [key] of this.cache) {
        if (key.startsWith(`${type}:`)) {
          this.cache.delete(key)
        }
      }
    }
  }

  // Clear all cache
  clearAll(): void {
    this.cache.clear()
  }

  // Get cache stats
  getStats(): { size: number; types: Record<string, number> } {
    const types = new Map<string, number>()

    for (const [key] of this.cache) {
      const type = key.split(':')[0] || 'unknown'
      const current = types.get(type) || 0
      types.set(type, current + 1)
    }

    const typesRecord: Record<string, number> = {}
    for (const [key, value] of types) {
      typesRecord[key] = value
    }

    return {
      size: this.cache.size,
      types: typesRecord
    }
  }
}

// Create singleton instance
export const cacheService = new CacheService()

// Offline queue for failed operations
interface QueuedOperation {
  id: string
  type: 'create' | 'update' | 'delete'
  collection: string
  data: any
  timestamp: number
  retryCount: number
}

class OfflineQueue {
  private queue: QueuedOperation[] = []
  private readonly MAX_RETRIES = 3
  private readonly STORAGE_KEY = 'lcc_assemble_offline_queue'

  constructor() {
    this.loadFromStorage()
    this.setupOnlineListener()
  }

  // Add operation to queue
  add(operation: Omit<QueuedOperation, 'id' | 'timestamp' | 'retryCount'>): void {
    const queuedOp: QueuedOperation = {
      ...operation,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0
    }

    this.queue.push(queuedOp)
    this.saveToStorage()

    // Try to process immediately if online
    if (navigator.onLine) {
      this.processQueue()
    }
  }

  // Process queued operations
  private async processQueue(): Promise<void> {
    if (!navigator.onLine || this.queue.length === 0) return

    const operationsToProcess = [...this.queue]

    for (const operation of operationsToProcess) {
      try {
        await this.executeOperation(operation)
        this.remove(operation.id)
      } catch (error) {
        console.error('Failed to process queued operation:', error)
        operation.retryCount++

        if (operation.retryCount >= this.MAX_RETRIES) {
          this.remove(operation.id)
          console.warn('Operation failed permanently:', operation)
        }
      }
    }
  }

  // Execute individual operation
  private async executeOperation(operation: QueuedOperation): Promise<void> {
    const { type, collection, data } = operation

    switch (type) {
      case 'create':
        await setDoc(doc(db, collection, data.id), data)
        break
      case 'update':
        await setDoc(doc(db, collection, data.id), data, { merge: true })
        break
      case 'delete':
        // Note: This is a simplified implementation
        // In a real app, you'd need to track the document ID
        break
      default:
        throw new Error(`Unknown operation type: ${type}`)
    }
  }

  // Remove operation from queue
  private remove(id: string): void {
    this.queue = this.queue.filter(op => op.id !== id)
    this.saveToStorage()
  }

  // Save queue to localStorage
  private saveToStorage(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.queue))
    } catch (error) {
      console.warn('Failed to save offline queue to storage:', error)
    }
  }

  // Load queue from localStorage
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (stored) {
        this.queue = JSON.parse(stored)
      }
    } catch (error) {
      console.warn('Failed to load offline queue from storage:', error)
    }
  }

  // Setup online/offline listeners
  private setupOnlineListener(): void {
    window.addEventListener('online', () => {
      console.log('Connection restored, processing offline queue...')
      this.processQueue()
    })

    window.addEventListener('offline', () => {
      console.log('Connection lost, operations will be queued')
    })
  }

  // Get queue status
  getStatus(): { queued: number; processing: boolean } {
    return {
      queued: this.queue.length,
      processing: navigator.onLine
    }
  }
}

// Create singleton instance
export const offlineQueue = new OfflineQueue()

// Enhanced service functions with caching and offline support
export const cachedGetDoc = async (collectionName: string, docId: string) => {
  // Try cache first
  const cached = cacheService.get(collectionName, docId)
  if (cached) {
    return cached
  }

  // Fetch from Firestore
  const docRef = doc(db, collectionName, docId)
  const docSnap = await getDoc(docRef)

  if (docSnap.exists()) {
    const data = { id: docSnap.id, ...docSnap.data() }
    // Cache the result
    cacheService.set(collectionName, data, docId)
    return data
  }

  return null
}

export const cachedGetCollection = async (
  collectionName: string,
  constraints: any[] = [],
  cacheKey?: string
) => {
  // Try cache first
  const cached = cacheService.get(collectionName, undefined, { constraints, cacheKey })
  if (cached) {
    return cached
  }

  // Build query
  let q: any = collection(db, collectionName)
  constraints.forEach(constraint => {
    q = query(q, constraint)
  })

  // Fetch from Firestore
  const querySnapshot = await getDocs(q)
  const data = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...(doc.data() || {})
  }))

  // Cache the result
  cacheService.set(collectionName, data, undefined, { constraints, cacheKey })
  return data
}

// Cache invalidation helpers
export const invalidateUserCache = (userId?: string) => {
  cacheService.clear('userProfile', userId)
  cacheService.clear('memberDirectory')
}

export const invalidateEventCache = (eventId?: string) => {
  cacheService.clear('events')
  if (eventId) {
    cacheService.clear('eventDetails', eventId)
  }
}

export const invalidateNotificationCache = () => {
  cacheService.clear('notifications')
}

// Connection status helpers
export const isOnline = (): boolean => navigator.onLine

export const getConnectionStatus = () => ({
  online: navigator.onLine,
  cacheStats: cacheService.getStats(),
  offlineQueue: offlineQueue.getStatus()
})