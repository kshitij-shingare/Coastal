export type HazardType = 'flooding' | 'storm_surge' | 'high_waves' | 'erosion' | 'rip_current' | 'tsunami' | 'pollution' | 'other';
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
export declare function validateReport(report: Partial<Report>): string[];
export declare function isValidHazardType(type: string): type is HazardType;
export declare function isValidSeverityLevel(level: string): level is SeverityLevel;
export declare function isValidSourceType(source: string): source is SourceType;
export declare function isValidReportStatus(status: string): status is ReportStatus;
//# sourceMappingURL=report.d.ts.map