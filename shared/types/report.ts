// Report type definitions - shared between frontend and backend

export type HazardType = 
  | 'flooding' 
  | 'storm_surge' 
  | 'high_waves' 
  | 'erosion'
  | 'rip_current'
  | 'tsunami'
  | 'pollution'
  | 'other';

export type SeverityLevel = 'low' | 'moderate' | 'high';
export type SourceType = 'citizen' | 'social' | 'official';
export type ReportStatus = 'pending' | 'verified' | 'rejected';

export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  address?: string;
}

export interface MediaFile {
  id: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  mimeType: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface ReportContent {
  originalText: string;
  translatedText?: string;
  language: string;
  mediaFiles?: MediaFile[];
}

export interface ReportClassification {
  hazardType?: HazardType;
  severity?: SeverityLevel;
  confidence: number;
}

export interface ReportMetadata {
  deviceInfo?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface Report {
  id: string;
  timestamp: Date;
  location: GeoLocation;
  source: SourceType;
  content: ReportContent;
  classification: ReportClassification;
  status: ReportStatus;
  region: string;
  aiSummary?: string;
  metadata: ReportMetadata;
  createdAt: Date;
  updatedAt: Date;
}

// Input type for creating new reports
export interface NewReportInput {
  location: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    address?: string;
  };
  content: {
    originalText: string;
    language?: string;
  };
  source?: SourceType;
  mediaFiles?: File[];
}

// Validation functions
export function validateReport(report: Partial<Report>): string[] {
  const errors: string[] = [];

  if (!report.location) {
    errors.push('Location is required');
  } else {
    if (typeof report.location.latitude !== 'number' || 
        report.location.latitude < -90 || report.location.latitude > 90) {
      errors.push('Valid latitude is required (-90 to 90)');
    }
    if (typeof report.location.longitude !== 'number' || 
        report.location.longitude < -180 || report.location.longitude > 180) {
      errors.push('Valid longitude is required (-180 to 180)');
    }
  }

  if (!report.content?.originalText || report.content.originalText.trim().length === 0) {
    errors.push('Description text is required');
  }

  if (report.source && !['citizen', 'social', 'official'].includes(report.source)) {
    errors.push('Valid source type is required (citizen, social, official)');
  }

  if (report.classification?.confidence !== undefined) {
    if (typeof report.classification.confidence !== 'number' || 
        report.classification.confidence < 0 || report.classification.confidence > 100) {
      errors.push('Confidence score must be between 0 and 100');
    }
  }

  return errors;
}

export function isValidHazardType(type: string): type is HazardType {
  return ['flooding', 'storm_surge', 'high_waves', 'erosion', 'rip_current', 'tsunami', 'pollution', 'other'].includes(type);
}

export function isValidSeverityLevel(level: string): level is SeverityLevel {
  return ['low', 'moderate', 'high'].includes(level);
}

export function isValidSourceType(source: string): source is SourceType {
  return ['citizen', 'social', 'official'].includes(source);
}

export function isValidReportStatus(status: string): status is ReportStatus {
  return ['pending', 'verified', 'rejected'].includes(status);
}
