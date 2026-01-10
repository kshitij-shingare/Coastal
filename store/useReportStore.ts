import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Report, NewReportInput, ReportStatus } from '@/types/report'
import type { SocialVerification, VerificationStatus, InputType } from '@/types/social'

// Visibility threshold constant
const VISIBILITY_THRESHOLD_VALUE = 75

// Helper to determine region from coordinates
function getRegionFromCoordinates(lat: number, lng: number): string {
  // Simple region mapping based on lat/lng ranges (demo purposes)
  if (lat > 13.1) return 'North Coast'
  if (lat < 12.9) return 'South Beach'
  if (lng > 80.3) return 'East Shore'
  if (lng < 80.2) return 'West Harbor'
  return 'Central Bay'
}

// Helper to generate unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

interface ReportStore {
  // State
  reports: Report[]
  socialVerifications: SocialVerification[]
  userLocation: { lat: number; lng: number } | null
  
  // Report Actions
  addReport: (input: NewReportInput) => Report
  updateReportStatus: (id: string, status: ReportStatus, confidence?: number) => void
  removeReport: (id: string) => void
  
  // Social Verification Actions
  addSocialVerification: (input: {
    inputType: InputType
    inputContent: string
    confidence: number
    status: VerificationStatus
    summary: string
  }) => SocialVerification
  
  // User Location
  setUserLocation: (location: { lat: number; lng: number } | null) => void
  
  // Clear Actions
  clearReports: () => void
  clearSocialVerifications: () => void
  clearAll: () => void
  
  // Selectors (computed values)
  getVerifiedReports: () => Report[]
  getVisibleReports: () => Report[]
  getHighRiskReports: () => Report[]
  getReportsByRegion: (region: string) => Report[]
  getReportsByHazardType: (hazardType: string) => Report[]
  getRecentVerifications: (limit?: number) => SocialVerification[]
}

export const useReportStore = create<ReportStore>()(
  persist(
    (set, get) => ({
      // Initial State
      reports: [],
      socialVerifications: [],
      userLocation: null,
      
      // Report Actions
      addReport: (input) => {
        const newReport: Report = {
          id: generateId(),
          hazardType: input.hazardType as Report['hazardType'],
          description: input.description,
          location: {
            lat: input.location.lat,
            lng: input.location.lng,
            name: input.location.address,
          },
          region: getRegionFromCoordinates(input.location.lat, input.location.lng),
          hasMedia: input.media.length > 0,
          mediaPreview: input.media.length > 0 ? URL.createObjectURL(input.media[0]) : undefined,
          timestamp: new Date().toISOString(),
          confidence: input.confidence,
          status: input.status === 'verified' ? 'verified' : input.status === 'rejected' ? 'rejected' : 'pending',
          severity: input.severity,
          aiSummary: input.aiSummary,
        }
        
        set((state) => ({
          reports: [newReport, ...state.reports],
        }))
        
        return newReport
      },
      
      updateReportStatus: (id, status, confidence) => {
        set((state) => ({
          reports: state.reports.map((report) =>
            report.id === id
              ? { ...report, status, ...(confidence !== undefined && { confidence }) }
              : report
          ),
        }))
      },
      
      removeReport: (id) => {
        set((state) => ({
          reports: state.reports.filter((report) => report.id !== id),
        }))
      },
      
      // Social Verification Actions
      addSocialVerification: (input) => {
        const newVerification: SocialVerification = {
          id: generateId(),
          inputType: input.inputType,
          inputContent: input.inputContent,
          confidence: input.confidence,
          status: input.status,
          summary: input.summary,
          timestamp: new Date().toISOString(),
        }
        
        set((state) => ({
          socialVerifications: [newVerification, ...state.socialVerifications],
        }))
        
        return newVerification
      },
      
      // User Location
      setUserLocation: (location) => {
        set({ userLocation: location })
      },
      
      // Clear Actions
      clearReports: () => set({ reports: [] }),
      clearSocialVerifications: () => set({ socialVerifications: [] }),
      clearAll: () => set({ reports: [], socialVerifications: [], userLocation: null }),
      
      // Selectors
      getVerifiedReports: () => {
        return get().reports.filter((report) => report.status === 'verified')
      },
      
      getVisibleReports: () => {
        return get().reports.filter(
          (report) => report.status === 'verified' && report.confidence >= VISIBILITY_THRESHOLD_VALUE
        )
      },
      
      getHighRiskReports: () => {
        return get().reports.filter(
          (report) => report.severity === 'high' && report.status === 'verified'
        )
      },
      
      getReportsByRegion: (region) => {
        if (region === 'All Regions') return get().getVisibleReports()
        return get().getVisibleReports().filter((report) => report.region === region)
      },
      
      getReportsByHazardType: (hazardType) => {
        if (hazardType === 'all') return get().getVisibleReports()
        return get().getVisibleReports().filter((report) => report.hazardType === hazardType)
      },
      
      getRecentVerifications: (limit = 5) => {
        return get().socialVerifications.slice(0, limit)
      },
    }),
    {
      name: 'coastal-hazard-store',
      partialize: (state) => ({
        reports: state.reports,
        socialVerifications: state.socialVerifications,
      }),
    }
  )
)

// Custom hooks for memoized selectors
export function useVerifiedReports() {
  return useReportStore((state) => state.getVerifiedReports())
}

export function useVisibleReports() {
  return useReportStore((state) => state.getVisibleReports())
}

export function useHighRiskReports() {
  return useReportStore((state) => state.getHighRiskReports())
}

export function useRecentVerifications(limit = 5) {
  return useReportStore((state) => state.getRecentVerifications(limit))
}
