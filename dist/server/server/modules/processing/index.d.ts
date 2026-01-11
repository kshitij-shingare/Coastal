/**
 * Processing Module Index
 *
 * Exports AI processing services for hazard classification and language analysis.
 */
export { classifyHazard, classifyReportsBatch, generateReportSummary, hazardClassificationService, } from './hazard-classification';
export type { ClassificationResult, } from './hazard-classification';
export { detectLanguage, extractKeywords, determineUrgency, analyzeText, translateHazardType, languageProcessingService, } from './language-processing';
export type { LanguageDetectionResult, TextAnalysisResult, } from './language-processing';
//# sourceMappingURL=index.d.ts.map