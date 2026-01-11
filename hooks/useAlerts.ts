'use client'

import { useState, useEffect, useCallback } from 'react'
import { alertsApi, ApiError } from '@/lib/api'
import { Alert, AlertStatus } from '@/shared/types/alert'
import { HazardType, SeverityLevel } from '@/shared/types/report'
import { AlertQueryParams, PaginationInfo } from '@/shared/types/api'
import { getWebSocketClient } from '@/lib/websocket'

// Frontend alert type for compatibility with existing components
export interface FrontendAlert {
  id: string
  hazardType: 'flood' | 'erosion' | 'rip-current' | 'storm-surge' | 'tsunami' | 'pollution'
  region: string
  severity: 'high' | 'medium' | 'low'
  confidence: number
  summary: string
  timestamp: string
  status: AlertStatus
  reportCount: number
  affectedPopulation: number
}

// Map backend hazard types to frontend types
function mapHazardType(backendType?: HazardType): FrontendAlert['hazardType'] {
  const mapping: Record<string, FrontendAlert['hazardType']> = {
    'flooding': 'flood',
    'storm_surge': 'storm-surge',
    'high_waves': 'rip-current',
    'erosion': 'erosion',
    'rip_current': 'rip-current',
    'tsunami': 'tsunami',
    'pollution': 'pollution',
    'other': 'flood',
  }
  return mapping[backendType || ''] || 'flood'
}

// Map backend severity to frontend severity
function mapSeverity(backendSeverity?: SeverityLevel): FrontendAlert['severity'] {
  const mapping: Record<string, FrontendAlert['severity']> = {
    'high': 'high',
    'moderate': 'medium',
    'low': 'low',
  }
  return mapping[backendSeverity || ''] || 'low'
}

// Transform backend alert to frontend format
function transformAlert(alert: Alert): FrontendAlert {
  return {
    id: alert.id,
    hazardType: mapHazardType(alert.hazardType),
    region: alert.region?.name || 'Unknown',
    severity: mapSeverity(alert.severity),
    confidence: alert.confidence || 0,
    summary: alert.aiSummary || '',
    timestamp: alert.timestamp instanceof Date ? alert.timestamp.toISOString() : String(alert.timestamp),
    status: alert.status,
    reportCount: alert.escalationReason?.reportCount || 0,
    affectedPopulation: alert.region?.affectedPopulation || 0,
  }
}

export interface AlertFilters {
  status?: AlertStatus
  hazardType?: HazardType
  severity?: SeverityLevel
  region?: string
  minConfidence?: number
}

export interface UseAlertsOptions {
  autoFetch?: boolean
  initialFilters?: AlertFilters
  enableRealtime?: boolean
  activeOnly?: boolean
}

export interface UseAlertsReturn {
  alerts: FrontendAlert[]
  rawAlerts: Alert[]
  activeAlerts: FrontendAlert[]
  loading: boolean
  error: string | null
  pagination: PaginationInfo | null
  fetchAlerts: (params?: AlertQueryParams) => Promise<void>
  fetchActiveAlerts: () => Promise<void>
  fetchAlertById: (id: string) => Promise<Alert | null>
  verifyAlert: (id: string, action: 'verify' | 'dispute', reason?: string) => Promise<Alert | null>
  refresh: () => Promise<void>
  setFilters: (filters: Partial<AlertFilters>) => void
  filters: AlertFilters
}

export function useAlerts(options: UseAlertsOptions = {}): UseAlertsReturn {
  const { autoFetch = true, initialFilters = {}, enableRealtime = true, activeOnly = false } = options

  const [alerts, setAlerts] = useState<FrontendAlert[]>([])
  const [rawAlerts, setRawAlerts] = useState<Alert[]>([])
  const [activeAlerts, setActiveAlerts] = useState<FrontendAlert[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [filters, setFiltersState] = useState<AlertFilters>(initialFilters)


  // Fetch alerts from API
  const fetchAlerts = useCallback(async (params?: AlertQueryParams) => {
    setLoading(true)
    setError(null)

    try {
      const queryParams: AlertQueryParams = { ...filters, ...params }
      const response = await alertsApi.getAll(queryParams)

      if (response.success && response.data) {
        const { items, pagination: paginationInfo } = response.data
        setRawAlerts(items)
        setAlerts(items.map(transformAlert))
        setPagination(paginationInfo)
        
        // Update active alerts
        const active = items.filter(a => a.status === 'active')
        setActiveAlerts(active.map(transformAlert))
      } else {
        setError(response.error?.message || 'Failed to fetch alerts')
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('An unexpected error occurred')
      }
    } finally {
      setLoading(false)
    }
  }, [filters])

  // Fetch only active alerts
  const fetchActiveAlerts = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await alertsApi.getActive()

      if (response.success && response.data) {
        const items = response.data
        setActiveAlerts(items.map(transformAlert))
        
        // Also update main alerts if activeOnly mode
        if (activeOnly) {
          setRawAlerts(items)
          setAlerts(items.map(transformAlert))
        }
      } else {
        setError(response.error?.message || 'Failed to fetch active alerts')
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('An unexpected error occurred')
      }
    } finally {
      setLoading(false)
    }
  }, [activeOnly])

  // Fetch a single alert by ID
  const fetchAlertById = useCallback(async (id: string): Promise<Alert | null> => {
    try {
      const response = await alertsApi.getById(id)
      if (response.success && response.data) {
        return response.data
      }
      return null
    } catch {
      return null
    }
  }, [])

  // Verify or dispute an alert
  const verifyAlert = useCallback(async (
    id: string, 
    action: 'verify' | 'dispute', 
    reason?: string
  ): Promise<Alert | null> => {
    setLoading(true)
    setError(null)

    try {
      const response = await alertsApi.verify(id, action, reason)

      if (response.success && response.data) {
        const updatedAlert = response.data
        
        // Update the alert in our lists
        setRawAlerts(prev => 
          prev.map(a => a.id === id ? updatedAlert : a)
        )
        setAlerts(prev => 
          prev.map(a => a.id === id ? transformAlert(updatedAlert) : a)
        )
        
        // Update active alerts
        if (updatedAlert.status === 'active') {
          setActiveAlerts(prev => {
            const exists = prev.some(a => a.id === id)
            if (exists) {
              return prev.map(a => a.id === id ? transformAlert(updatedAlert) : a)
            }
            return [...prev, transformAlert(updatedAlert)]
          })
        } else {
          setActiveAlerts(prev => prev.filter(a => a.id !== id))
        }
        
        return updatedAlert
      } else {
        setError(response.error?.message || 'Failed to verify alert')
        return null
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('An unexpected error occurred')
      }
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Refresh alerts
  const refresh = useCallback(async () => {
    if (activeOnly) {
      await fetchActiveAlerts()
    } else {
      await fetchAlerts()
    }
  }, [activeOnly, fetchAlerts, fetchActiveAlerts])

  // Update filters
  const setFilters = useCallback((newFilters: Partial<AlertFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }))
  }, [])

  // Auto-fetch on mount and when filters change
  useEffect(() => {
    if (autoFetch) {
      if (activeOnly) {
        fetchActiveAlerts()
      } else {
        fetchAlerts()
      }
    }
  }, [autoFetch, activeOnly, fetchAlerts, fetchActiveAlerts])

  // Set up real-time updates via WebSocket
  useEffect(() => {
    if (!enableRealtime) return

    const wsClient = getWebSocketClient()
    
    // Connect if not already connected
    if (!wsClient.isConnected()) {
      wsClient.connect()
    }

    // Listen for new alerts
    const unsubscribeCreated = wsClient.onAlertCreated((message) => {
      const newAlert = message.data
      setRawAlerts(prev => {
        if (prev.some(a => a.id === newAlert.id)) return prev
        return [newAlert, ...prev]
      })
      setAlerts(prev => {
        if (prev.some(a => a.id === newAlert.id)) return prev
        return [transformAlert(newAlert), ...prev]
      })
      if (newAlert.status === 'active') {
        setActiveAlerts(prev => {
          if (prev.some(a => a.id === newAlert.id)) return prev
          return [transformAlert(newAlert), ...prev]
        })
      }
    })

    // Listen for updated alerts
    const unsubscribeUpdated = wsClient.onAlertUpdated((message) => {
      const updatedAlert = message.data
      setRawAlerts(prev => 
        prev.map(a => a.id === updatedAlert.id ? updatedAlert : a)
      )
      setAlerts(prev => 
        prev.map(a => a.id === updatedAlert.id ? transformAlert(updatedAlert) : a)
      )
      // Update active alerts based on status
      if (updatedAlert.status === 'active') {
        setActiveAlerts(prev => {
          const exists = prev.some(a => a.id === updatedAlert.id)
          if (exists) {
            return prev.map(a => a.id === updatedAlert.id ? transformAlert(updatedAlert) : a)
          }
          return [transformAlert(updatedAlert), ...prev]
        })
      } else {
        setActiveAlerts(prev => prev.filter(a => a.id !== updatedAlert.id))
      }
    })

    // Listen for resolved alerts
    const unsubscribeResolved = wsClient.onAlertResolved((message) => {
      const resolvedAlert = message.data
      setRawAlerts(prev => 
        prev.map(a => a.id === resolvedAlert.id ? resolvedAlert : a)
      )
      setAlerts(prev => 
        prev.map(a => a.id === resolvedAlert.id ? transformAlert(resolvedAlert) : a)
      )
      // Remove from active alerts
      setActiveAlerts(prev => prev.filter(a => a.id !== resolvedAlert.id))
    })

    return () => {
      unsubscribeCreated()
      unsubscribeUpdated()
      unsubscribeResolved()
    }
  }, [enableRealtime])

  return {
    alerts,
    rawAlerts,
    activeAlerts,
    loading,
    error,
    pagination,
    fetchAlerts,
    fetchActiveAlerts,
    fetchAlertById,
    verifyAlert,
    refresh,
    setFilters,
    filters,
  }
}

export default useAlerts
