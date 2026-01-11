/**
 * Data Transformers
 * Transform data between backend and frontend formats
 * Requirements: 11.2
 */

import { 
  Report as BackendReport, 
  HazardType as BackendHazardType,
  SeverityLevel as BackendSeverityLevel,
  ReportStatus as BackendReportStatus 
} from '../shared/types/report';
import { 
  Alert as BackendAlert,
  AlertStatus as BackendAlertStatus 
} from '../shared/types/alert';
import { 
  Report as FrontendReport, 
  HazardType as FrontendHazardType,
  Severity as FrontendSeverity,
  ReportStatus as FrontendReportStatus 
} from '../types/report';

// ============================================================================
// Hazard Type Mapping
// ============================================================================

const backendToFrontendHazardType: Record<BackendHazardType, FrontendHazardType> = {
  'flooding': 'flood',
  'storm_surge': 'storm-surge',
  'high_waves': 'rip-current',
  'erosion': 'erosion',
  'rip_current': 'rip-current',
  'tsunami': 'tsunami',
  'pollution': 'pollution',
  'other': 'flood', // Default fallback
};

const frontendToBackendHazardType: Record<FrontendHazardType, BackendHazardType> = {
  'flood': 'flooding',
  'storm-surge': 'storm_surge',
  'rip-current': 'rip_current',
  'erosion': 'erosion',
  'tsunami': 'tsunami',
  'pollution': 'pollution',
};

/**
 * Convert backend hazard type to frontend format
 */
export function mapHazardTypeToFrontend(backendType?: BackendHazardType): FrontendHazardType {
  if (!backendType) return 'flood';
  return backendToFrontendHazardType[backendType] || 'flood';
}

/**
 * Convert frontend hazard type to backend format
 */
export function mapHazardTypeToBackend(frontendType: FrontendHazardType): BackendHazardType {
  return frontendToBackendHazardType[frontendType] || 'flooding';
}

// ============================================================================
// Severity Level Mapping
// ============================================================================

const backendToFrontendSeverity: Record<BackendSeverityLevel, FrontendSeverity> = {
  'low': 'low',
  'moderate': 'medium',
  'high': 'high',
};

const frontendToBackendSeverity: Record<FrontendSeverity, BackendSeverityLevel> = {
  'low': 'low',
  'medium': 'moderate',
  'high': 'high',
};

/**
 * Convert backend severity to frontend format
 */
export function mapSeverityToFrontend(backendSeverity?: BackendSeverityLevel): FrontendSeverity {
  if (!backendSeverity) return 'low';
  return backendToFrontendSeverity[backendSeverity] || 'low';
}

/**
 * Convert frontend severity to backend format
 */
export function mapSeverityToBackend(frontendSeverity: FrontendSeverity): BackendSeverityLevel {
  return frontendToBackendSeverity[frontendSeverity] || 'low';
}

// ============================================================================
// Report Status Mapping
// ============================================================================

/**
 * Convert backend report status to frontend format
 * Both use the same values: 'pending' | 'verified' | 'rejected'
 */
export function mapReportStatusToFrontend(backendStatus: BackendReportStatus): FrontendReportStatus {
  return backendStatus as FrontendReportStatus;
}

/**
 * Convert frontend report status to backend format
 */
export function mapReportStatusToBackend(frontendStatus: FrontendReportStatus): BackendReportStatus {
  return frontendStatus as BackendReportStatus;
}

// ============================================================================
// Report Transformation
// ============================================================================

/**
 * Transform backend report to frontend format
 */
export function transformBackendReport(backendReport: BackendReport): FrontendReport {
  return {
    id: backendReport.id,
    hazardType: mapHazardTypeToFrontend(backendReport.classification.hazardType),
    description: backendReport.content.originalText,
    location: {
      lat: backendReport.location.latitude,
      lng: backendReport.location.longitude,
      name: backendReport.location.address || '',
    },
    region: backendReport.region,
    hasMedia: (backendReport.content.mediaFiles?.length || 0) > 0,
    mediaPreview: backendReport.content.mediaFiles?.[0]?.filePath,
    timestamp: backendReport.timestamp instanceof Date 
      ? backendReport.timestamp.toISOString() 
      : String(backendReport.timestamp),
    confidence: backendReport.classification.confidence,
    status: mapReportStatusToFrontend(backendReport.status),
    severity: mapSeverityToFrontend(backendReport.classification.severity),
    aiSummary: backendReport.aiSummary || '',
  };
}

/**
 * Transform multiple backend reports to frontend format
 */
export function transformBackendReports(backendReports: BackendReport[]): FrontendReport[] {
  return backendReports.map(transformBackendReport);
}

/**
 * Transform frontend report input to backend format for submission
 */
export function transformFrontendReportInput(frontendInput: {
  hazardType: string;
  description: string;
  location: { lat: number; lng: number; address: string };
  media?: File[];
}): {
  location: { latitude: number; longitude: number; address?: string };
  content: { originalText: string; language?: string };
  source: 'citizen';
  mediaFiles?: File[];
} {
  return {
    location: {
      latitude: frontendInput.location.lat,
      longitude: frontendInput.location.lng,
      address: frontendInput.location.address || undefined,
    },
    content: {
      originalText: frontendInput.description,
      language: 'en',
    },
    source: 'citizen',
    mediaFiles: frontendInput.media,
  };
}

// ============================================================================
// Alert Transformation
// ============================================================================

/**
 * Frontend alert type (simplified for UI)
 */
export interface FrontendAlert {
  id: string;
  hazardType: FrontendHazardType;
  severity: FrontendSeverity;
  region: string;
  confidence: number;
  status: 'active' | 'verified' | 'resolved' | 'false_alarm';
  summary: string;
  reportCount: number;
  timestamp: string;
  location?: {
    lat: number;
    lng: number;
  };
}

/**
 * Transform backend alert to frontend format
 */
export function transformBackendAlert(backendAlert: BackendAlert): FrontendAlert {
  // Calculate center point from region bounds if available
  let location: { lat: number; lng: number } | undefined;
  if (backendAlert.region.bounds?.coordinates?.[0]) {
    const coords = backendAlert.region.bounds.coordinates[0];
    if (coords.length > 0) {
      const sumLat = coords.reduce((sum, coord) => sum + coord[1], 0);
      const sumLng = coords.reduce((sum, coord) => sum + coord[0], 0);
      location = {
        lat: sumLat / coords.length,
        lng: sumLng / coords.length,
      };
    }
  }

  return {
    id: backendAlert.id,
    hazardType: mapHazardTypeToFrontend(backendAlert.hazardType),
    severity: mapSeverityToFrontend(backendAlert.severity),
    region: backendAlert.region.name,
    confidence: backendAlert.confidence,
    status: backendAlert.status,
    summary: backendAlert.aiSummary,
    reportCount: backendAlert.escalationReason.reportCount,
    timestamp: backendAlert.timestamp instanceof Date 
      ? backendAlert.timestamp.toISOString() 
      : String(backendAlert.timestamp),
    location,
  };
}

/**
 * Transform multiple backend alerts to frontend format
 */
export function transformBackendAlerts(backendAlerts: BackendAlert[]): FrontendAlert[] {
  return backendAlerts.map(transformBackendAlert);
}

// ============================================================================
// Dashboard Data Transformation
// ============================================================================

/**
 * Frontend dashboard stats type
 */
export interface FrontendDashboardStats {
  totalReports: number;
  activeAlerts: number;
  verifiedReports: number;
  pendingReports: number;
  reportsByRegion: { region: string; count: number }[];
  reportsByHazardType: { type: FrontendHazardType; count: number }[];
}

/**
 * Transform backend dashboard stats to frontend format
 */
export function transformDashboardStats(backendStats: {
  totalReports: number;
  activeAlerts: number;
  verifiedReports: number;
  pendingReports: number;
  reportsByRegion: Record<string, number>;
  reportsByHazardType: Record<string, number>;
}): FrontendDashboardStats {
  return {
    totalReports: backendStats.totalReports,
    activeAlerts: backendStats.activeAlerts,
    verifiedReports: backendStats.verifiedReports,
    pendingReports: backendStats.pendingReports,
    reportsByRegion: Object.entries(backendStats.reportsByRegion).map(([region, count]) => ({
      region,
      count,
    })),
    reportsByHazardType: Object.entries(backendStats.reportsByHazardType).map(([type, count]) => ({
      type: mapHazardTypeToFrontend(type as BackendHazardType),
      count,
    })),
  };
}

// ============================================================================
// Map Data Transformation
// ============================================================================

/**
 * Frontend map marker type
 */
export interface FrontendMapMarker {
  id: string;
  lat: number;
  lng: number;
  type: 'report' | 'alert';
  hazardType: FrontendHazardType;
  severity: FrontendSeverity;
  confidence?: number;
}

/**
 * Transform backend report to map marker
 */
export function transformReportToMapMarker(report: BackendReport): FrontendMapMarker {
  return {
    id: report.id,
    lat: report.location.latitude,
    lng: report.location.longitude,
    type: 'report',
    hazardType: mapHazardTypeToFrontend(report.classification.hazardType),
    severity: mapSeverityToFrontend(report.classification.severity),
    confidence: report.classification.confidence,
  };
}

/**
 * Transform backend alert to map marker
 */
export function transformAlertToMapMarker(alert: BackendAlert): FrontendMapMarker | null {
  // Calculate center point from region bounds
  if (!alert.region.bounds?.coordinates?.[0]) {
    return null;
  }

  const coords = alert.region.bounds.coordinates[0];
  if (coords.length === 0) {
    return null;
  }

  const sumLat = coords.reduce((sum, coord) => sum + coord[1], 0);
  const sumLng = coords.reduce((sum, coord) => sum + coord[0], 0);

  return {
    id: alert.id,
    lat: sumLat / coords.length,
    lng: sumLng / coords.length,
    type: 'alert',
    hazardType: mapHazardTypeToFrontend(alert.hazardType),
    severity: mapSeverityToFrontend(alert.severity),
    confidence: alert.confidence,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format timestamp for display
 */
export function formatTimestamp(timestamp: string | Date): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  return date.toLocaleString();
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(timestamp: string | Date): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  return date.toLocaleDateString();
}

/**
 * Get severity color for UI
 */
export function getSeverityColor(severity: FrontendSeverity): string {
  switch (severity) {
    case 'high': return '#ef4444'; // red-500
    case 'medium': return '#f59e0b'; // amber-500
    case 'low': return '#22c55e'; // green-500
    default: return '#6b7280'; // gray-500
  }
}

/**
 * Get hazard type icon name
 */
export function getHazardTypeIcon(hazardType: FrontendHazardType): string {
  switch (hazardType) {
    case 'flood': return 'water';
    case 'storm-surge': return 'cloud-lightning';
    case 'rip-current': return 'waves';
    case 'erosion': return 'mountain';
    case 'tsunami': return 'wave';
    case 'pollution': return 'alert-triangle';
    default: return 'alert-circle';
  }
}

/**
 * Get hazard type display name
 */
export function getHazardTypeDisplayName(hazardType: FrontendHazardType): string {
  switch (hazardType) {
    case 'flood': return 'Flooding';
    case 'storm-surge': return 'Storm Surge';
    case 'rip-current': return 'Rip Current';
    case 'erosion': return 'Erosion';
    case 'tsunami': return 'Tsunami';
    case 'pollution': return 'Pollution';
    default: return 'Unknown';
  }
}

// Default export with all transformers
const transformers = {
  // Hazard type mapping
  mapHazardTypeToFrontend,
  mapHazardTypeToBackend,
  // Severity mapping
  mapSeverityToFrontend,
  mapSeverityToBackend,
  // Status mapping
  mapReportStatusToFrontend,
  mapReportStatusToBackend,
  // Report transformation
  transformBackendReport,
  transformBackendReports,
  transformFrontendReportInput,
  // Alert transformation
  transformBackendAlert,
  transformBackendAlerts,
  // Dashboard transformation
  transformDashboardStats,
  // Map transformation
  transformReportToMapMarker,
  transformAlertToMapMarker,
  // Utilities
  formatTimestamp,
  formatRelativeTime,
  getSeverityColor,
  getHazardTypeIcon,
  getHazardTypeDisplayName,
};

export default transformers;
