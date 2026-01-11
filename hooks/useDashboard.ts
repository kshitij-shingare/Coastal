'use client'

import { useState, useEffect, useCallback } from 'react'
import { dashboardApi, ApiError } from '@/lib/api'
import { DashboardData, SystemStats, MapData, MapDataPoint, AlertMarker } from '@/shared/types/api'

export type TimeFilter = '24h' | '7d' | '30d'

export interface DashboardStats {
  totalReports: number
  activeAlerts: number
  verifiedReports: number
  pendingReports: number
  reportsByRegion: Record<string, number>
  reportsByHazardType: Record<string, number>
  averageResponseTime?: number
}

export interface UseDashboardOptions {
  autoFetch?: boolean
  initialTimeFilter?: TimeFilter
  refreshInterval?: number // in milliseconds, 0 to disable
}

export interface UseDashboardReturn {
  // Data
  dashboardData: DashboardData | null
  stats: DashboardStats | null
  mapData: MapData | null
  heatmapPoints: MapDataPoint[]
  alertMarkers: AlertMarker[]
  
  // State
  loading: boolean
  error: string | null
  timeFilter: TimeFilter
  lastUpdated: Date | null
  
  // Actions
  fetchDashboard: () => Promise<void>
  fetchStats: () => Promise<void>
  fetchMapData: () => Promise<void>
  refresh: () => Promise<void>
  setTimeFilter: (filter: TimeFilter) => void
}

export function useDashboard(options: UseDashboardOptions = {}): UseDashboardReturn {
  const { 
    autoFetch = true, 
    initialTimeFilter = '24h',
    refreshInterval = 0 
  } = options

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [mapData, setMapData] = useState<MapData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [timeFilter, setTimeFilterState] = useState<TimeFilter>(initialTimeFilter)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Fetch combined dashboard data
  const fetchDashboard = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await dashboardApi.getData(timeFilter)

      if (response.success && response.data) {
        setDashboardData(response.data)
        setStats(response.data.systemStats)
        if (response.data.mapData) {
          setMapData({
            heatmapPoints: response.data.mapData.heatmapPoints || [],
            alertMarkers: response.data.mapData.alertMarkers || [],
            lastUpdated: new Date().toISOString(),
          })
        }
        setLastUpdated(new Date())
      } else {
        setError(response.error?.message || 'Failed to fetch dashboard data')
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
  }, [timeFilter])

  // Fetch only stats
  const fetchStats = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await dashboardApi.getStats(timeFilter)

      if (response.success && response.data) {
        setStats(response.data)
        setLastUpdated(new Date())
      } else {
        setError(response.error?.message || 'Failed to fetch stats')
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
  }, [timeFilter])

  // Fetch only map data
  const fetchMapData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await dashboardApi.getMapData()

      if (response.success && response.data) {
        setMapData(response.data)
        setLastUpdated(new Date())
      } else {
        setError(response.error?.message || 'Failed to fetch map data')
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
  }, [])

  // Refresh all data
  const refresh = useCallback(async () => {
    await fetchDashboard()
  }, [fetchDashboard])

  // Update time filter
  const setTimeFilter = useCallback((filter: TimeFilter) => {
    setTimeFilterState(filter)
  }, [])

  // Auto-fetch on mount and when time filter changes
  useEffect(() => {
    if (autoFetch) {
      fetchDashboard()
    }
  }, [autoFetch, fetchDashboard])

  // Set up refresh interval
  useEffect(() => {
    if (refreshInterval <= 0) return

    const intervalId = setInterval(() => {
      fetchDashboard()
    }, refreshInterval)

    return () => clearInterval(intervalId)
  }, [refreshInterval, fetchDashboard])

  // Derived data
  const heatmapPoints = mapData?.heatmapPoints || []
  const alertMarkers = mapData?.alertMarkers || []

  return {
    dashboardData,
    stats,
    mapData,
    heatmapPoints,
    alertMarkers,
    loading,
    error,
    timeFilter,
    lastUpdated,
    fetchDashboard,
    fetchStats,
    fetchMapData,
    refresh,
    setTimeFilter,
  }
}

export default useDashboard
