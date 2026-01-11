// Alert type definitions - shared between frontend and backend

import { HazardType, SeverityLevel } from './report';

export type AlertStatus = 'active' | 'verified' | 'resolved' | 'false_alarm';

export interface GeoPolygon {
  type: 'Polygon';
  coordinates: number[][][];
}

export interface AlertRegion {
  name: string;
  bounds: GeoPolygon;
  affectedPopulation: number;
}

export interface EscalationReason {
  reportCount: number;
  sourceTypes: string[];
  timeWindow: string;
  geographicSpread: number;
  thresholdsMet: string[];
  reasoning: string;
}

export interface Alert {
  id: string;
  incidentId?: string;
  timestamp: Date;
  region: AlertRegion;
  hazardType: HazardType;
  severity: SeverityLevel;
  confidence: number;
  escalationReason: EscalationReason;
  relatedReports: string[];
  status: AlertStatus;
  aiSummary: string;
  createdAt: Date;
  updatedAt: Date;
}

// Validation functions
export function validateAlert(alert: Partial<Alert>): string[] {
  const errors: string[] = [];

  if (!alert.region?.name || alert.region.name.trim().length === 0) {
    errors.push('Region name is required');
  }

  if (!alert.hazardType || !['flooding', 'storm_surge', 'high_waves', 'erosion', 'rip_current', 'tsunami', 'pollution', 'other'].includes(alert.hazardType)) {
    errors.push('Valid hazard type is required');
  }

  if (!alert.severity || !['low', 'moderate', 'high'].includes(alert.severity)) {
    errors.push('Valid severity level is required');
  }

  if (typeof alert.confidence !== 'number' || alert.confidence < 0 || alert.confidence > 100) {
    errors.push('Confidence score must be between 0 and 100');
  }

  if (!alert.aiSummary || alert.aiSummary.trim().length === 0) {
    errors.push('AI summary is required');
  }

  if (!alert.escalationReason) {
    errors.push('Escalation reason is required');
  } else {
    if (typeof alert.escalationReason.reportCount !== 'number' || alert.escalationReason.reportCount < 1) {
      errors.push('Report count must be at least 1');
    }
    if (!Array.isArray(alert.escalationReason.sourceTypes) || alert.escalationReason.sourceTypes.length === 0) {
      errors.push('At least one source type is required');
    }
  }

  return errors;
}

export function isValidAlertStatus(status: string): status is AlertStatus {
  return ['active', 'verified', 'resolved', 'false_alarm'].includes(status);
}

export function calculateAlertPriority(alert: Alert): number {
  let priority = alert.confidence;
  
  // Handle NaN or invalid confidence values
  if (isNaN(priority) || priority < 0 || priority > 100) {
    priority = 0;
  }
  
  // Boost priority based on severity
  switch (alert.severity) {
    case 'high':
      priority += 20;
      break;
    case 'moderate':
      priority += 10;
      break;
    case 'low':
      priority += 0;
      break;
  }

  // Boost priority based on report count
  const reportBoost = Math.min(alert.escalationReason.reportCount * 2, 20);
  if (!isNaN(reportBoost)) {
    priority += reportBoost;
  }

  // Cap at 100 and ensure it's a valid number
  const finalPriority = Math.min(priority, 100);
  return isNaN(finalPriority) ? 0 : finalPriority;
}
