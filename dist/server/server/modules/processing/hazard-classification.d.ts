/**
 * Hazard Classification Service
 *
 * AI-powered classification of hazard reports using OpenAI.
 * Validates: Requirements 7.1, 7.2, 7.3, 7.5
 */
import { HazardType, SeverityLevel, Report } from '../../../shared/types/report';
export interface ClassificationResult {
    hazardType: HazardType;
    severity: SeverityLevel;
    confidence: number;
    reasoning?: string;
    keywords?: string[];
    suggestedActions?: string[];
}
/**
 * Main classification function - uses OpenAI with keyword fallback
 */
export declare function classifyHazard(text: string, mediaUrls?: string[], options?: {
    forceKeywords?: boolean;
}): Promise<ClassificationResult>;
/**
 * Batch classify multiple reports
 */
export declare function classifyReportsBatch(reports: Array<{
    id: string;
    text: string;
    mediaUrls?: string[];
}>): Promise<Map<string, ClassificationResult>>;
/**
 * Generate AI summary for a report
 */
export declare function generateReportSummary(report: Report): Promise<string>;
export declare const hazardClassificationService: {
    classifyHazard: typeof classifyHazard;
    classifyReportsBatch: typeof classifyReportsBatch;
    generateReportSummary: typeof generateReportSummary;
};
export default hazardClassificationService;
//# sourceMappingURL=hazard-classification.d.ts.map