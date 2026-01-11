/**
 * Language Processing Service
 *
 * Text analysis, language detection, and multilingual support.
 * Validates: Requirements 7.4
 */
export interface LanguageDetectionResult {
    language: string;
    confidence: number;
    script?: string;
}
export interface TextAnalysisResult {
    language: LanguageDetectionResult;
    wordCount: number;
    sentenceCount: number;
    keywords: string[];
    sentiment?: 'positive' | 'negative' | 'neutral';
    urgencyLevel?: 'low' | 'medium' | 'high';
}
/**
 * Detect language of input text
 */
export declare function detectLanguage(text: string): LanguageDetectionResult;
/**
 * Extract keywords from text
 */
export declare function extractKeywords(text: string, language?: string): string[];
/**
 * Determine urgency level from text
 */
export declare function determineUrgency(text: string): 'low' | 'medium' | 'high';
/**
 * Analyze text comprehensively
 */
export declare function analyzeText(text: string): TextAnalysisResult;
/**
 * Translate hazard type to local language (for display)
 */
export declare function translateHazardType(hazardType: string, targetLanguage: string): string;
export declare const languageProcessingService: {
    detectLanguage: typeof detectLanguage;
    extractKeywords: typeof extractKeywords;
    determineUrgency: typeof determineUrgency;
    analyzeText: typeof analyzeText;
    translateHazardType: typeof translateHazardType;
};
export default languageProcessingService;
//# sourceMappingURL=language-processing.d.ts.map