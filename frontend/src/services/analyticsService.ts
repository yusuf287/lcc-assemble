import { getAnalytics, logEvent, setUserProperties, setUserId } from 'firebase/analytics'
import { getApp } from 'firebase/app'

// Initialize Analytics (only if supported)
let analytics: any = null
try {
  analytics = getAnalytics(getApp())
} catch (error) {
  console.warn('Firebase Analytics not available:', error)
}

// Analytics service
class AnalyticsService {
  // Track page views
  trackPageView(pageName: string, properties?: Record<string, any>) {
    if (!analytics) return

    logEvent(analytics, 'page_view', {
      page_title: pageName,
      page_location: window.location.href,
      ...properties
    })
  }

  // Track user actions
  trackEvent(eventName: string, properties?: Record<string, any>) {
    if (!analytics) return

    logEvent(analytics, eventName, properties)
  }

  // Track user authentication
  trackAuth(action: 'login' | 'register' | 'logout', method?: string) {
    if (!analytics) return

    logEvent(analytics, 'login', {
      method: method || 'email',
      action
    })
  }

  // Track event interactions
  trackEventInteraction(
    eventId: string,
    action: 'view' | 'create' | 'edit' | 'delete' | 'rsvp' | 'share',
    properties?: Record<string, any>
  ) {
    if (!analytics) return

    logEvent(analytics, 'event_interaction', {
      event_id: eventId,
      action,
      ...properties
    })
  }

  // Track RSVP actions
  trackRSVP(eventId: string, status: string, guestCount?: number) {
    if (!analytics) return

    logEvent(analytics, 'rsvp_action', {
      event_id: eventId,
      rsvp_status: status,
      guest_count: guestCount || 0
    })
  }

  // Track bring list interactions
  trackBringListInteraction(
    eventId: string,
    action: 'view' | 'claim' | 'unclaim' | 'add_item',
    itemId?: string
  ) {
    if (!analytics) return

    logEvent(analytics, 'bring_list_interaction', {
      event_id: eventId,
      action,
      item_id: itemId
    })
  }

  // Track member directory usage
  trackMemberSearch(query?: string, filters?: Record<string, any>) {
    if (!analytics) return

    logEvent(analytics, 'member_search', {
      search_query: query || '',
      filters_applied: Object.keys(filters || {}).length,
      ...filters
    })
  }

  // Track notification interactions
  trackNotificationInteraction(
    notificationId: string,
    action: 'view' | 'click' | 'dismiss',
    type?: string
  ) {
    if (!analytics) return

    logEvent(analytics, 'notification_interaction', {
      notification_id: notificationId,
      action,
      notification_type: type
    })
  }

  // Track file uploads
  trackFileUpload(type: 'profile_image' | 'event_image' | 'document', size: number) {
    if (!analytics) return

    logEvent(analytics, 'file_upload', {
      file_type: type,
      file_size: size,
      file_size_mb: Math.round(size / 1024 / 1024 * 100) / 100
    })
  }

  // Track errors
  trackError(error: Error, context?: Record<string, any>) {
    if (!analytics) return

    logEvent(analytics, 'error_occurred', {
      error_message: error.message,
      error_stack: error.stack?.substring(0, 500), // Limit stack trace
      ...context
    })
  }

  // Track performance metrics
  trackPerformance(metric: string, value: number, unit: string = 'ms') {
    if (!analytics) return

    logEvent(analytics, 'performance_metric', {
      metric_name: metric,
      metric_value: value,
      metric_unit: unit
    })
  }

  // Set user properties
  setUserProperties(properties: Record<string, any>) {
    if (!analytics) return

    setUserProperties(analytics, properties)
  }

  // Set user ID for tracking
  setUserId(userId: string) {
    if (!analytics) return

    setUserId(analytics, userId)
  }

  // Track feature usage
  trackFeatureUsage(feature: string, action?: string, properties?: Record<string, any>) {
    if (!analytics) return

    logEvent(analytics, 'feature_usage', {
      feature_name: feature,
      action: action || 'used',
      ...properties
    })
  }

  // Track conversion events
  trackConversion(eventName: string, value?: number, currency?: string) {
    if (!analytics) return

    logEvent(analytics, 'conversion', {
      conversion_name: eventName,
      value,
      currency: currency || 'USD'
    })
  }

  // Track time spent on page/feature
  trackTimeSpent(feature: string, timeSpent: number) {
    if (!analytics) return

    logEvent(analytics, 'time_spent', {
      feature_name: feature,
      time_spent_seconds: Math.round(timeSpent / 1000)
    })
  }
}

// Create singleton instance
export const analyticsService = new AnalyticsService()

// Performance monitoring utilities
export class PerformanceMonitor {
  private marks = new Map<string, number>()

  // Start timing
  start(markName: string) {
    this.marks.set(markName, performance.now())
  }

  // End timing and track
  end(markName: string, additionalData?: Record<string, any>) {
    const startTime = this.marks.get(markName)
    if (!startTime) return

    const duration = performance.now() - startTime
    this.marks.delete(markName)

    // Track performance metric
    analyticsService.trackPerformance(markName, duration)

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Performance: ${markName} took ${duration.toFixed(2)}ms`)
    }

    return duration
  }

  // Track navigation timing
  trackNavigation() {
    if ('performance' in window && 'getEntriesByType' in performance) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming

      if (navigation) {
        analyticsService.trackPerformance('navigation_dom_content_loaded', navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart)
        analyticsService.trackPerformance('navigation_load_complete', navigation.loadEventEnd - navigation.loadEventStart)
        analyticsService.trackPerformance('navigation_first_paint', navigation.responseStart - navigation.fetchStart)
      }
    }
  }

  // Track resource loading
  trackResourceLoading() {
    if ('performance' in window && 'getEntriesByType' in performance) {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]

      resources.forEach(resource => {
        if (resource.duration > 1000) { // Only track slow resources
          analyticsService.trackPerformance(`resource_${resource.name.split('/').pop()}`, resource.duration)
        }
      })
    }
  }

  // Monitor Core Web Vitals
  monitorWebVitals() {
    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1]
          if (lastEntry) {
            analyticsService.trackPerformance('lcp', lastEntry.startTime)
          }
        })
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })

        // First Input Delay (FID)
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach(entry => {
            analyticsService.trackPerformance('fid', (entry as any).processingStart - entry.startTime)
          })
        })
        fidObserver.observe({ entryTypes: ['first-input'] })

        // Cumulative Layout Shift (CLS)
        let clsValue = 0
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach(entry => {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value
            }
          })
          analyticsService.trackPerformance('cls', clsValue)
        })
        clsObserver.observe({ entryTypes: ['layout-shift'] })
      } catch (error) {
        console.warn('Web Vitals monitoring not supported:', error)
      }
    }
  }
}

// Create performance monitor instance
export const performanceMonitor = new PerformanceMonitor()

// Error tracking utilities
export class ErrorTracker {
  trackError(error: Error, context?: Record<string, any>) {
    // Track in analytics
    analyticsService.trackError(error, context)

    // Log to console
    console.error('Tracked error:', error, context)

    // In production, you might want to send to error reporting service
    // sendToErrorReportingService(error, context)
  }

  trackUnhandledError(event: ErrorEvent) {
    this.trackError(event.error || new Error(event.message), {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      type: 'unhandled_error'
    })
  }

  trackUnhandledRejection(event: PromiseRejectionEvent) {
    this.trackError(event.reason || new Error('Unhandled promise rejection'), {
      type: 'unhandled_rejection'
    })
  }

  setupGlobalErrorTracking() {
    window.addEventListener('error', this.trackUnhandledError.bind(this))
    window.addEventListener('unhandledrejection', this.trackUnhandledRejection.bind(this))
  }
}

// Create error tracker instance
export const errorTracker = new ErrorTracker()

// Usage tracking utilities
export class UsageTracker {
  private featureStartTimes = new Map<string, number>()

  startFeature(featureName: string) {
    this.featureStartTimes.set(featureName, Date.now())
    analyticsService.trackFeatureUsage(featureName, 'started')
  }

  endFeature(featureName: string) {
    const startTime = this.featureStartTimes.get(featureName)
    if (startTime) {
      const timeSpent = Date.now() - startTime
      analyticsService.trackTimeSpent(featureName, timeSpent)
      this.featureStartTimes.delete(featureName)
    }
    analyticsService.trackFeatureUsage(featureName, 'completed')
  }

  trackFeature(featureName: string, action?: string, properties?: Record<string, any>) {
    analyticsService.trackFeatureUsage(featureName, action, properties)
  }
}

// Create usage tracker instance
export const usageTracker = new UsageTracker()

// Initialize monitoring
export const initializeMonitoring = () => {
  // Setup error tracking
  errorTracker.setupGlobalErrorTracking()

  // Setup performance monitoring
  performanceMonitor.monitorWebVitals()

  // Track initial page load
  window.addEventListener('load', () => {
    performanceMonitor.trackNavigation()
    performanceMonitor.trackResourceLoading()
  })
}