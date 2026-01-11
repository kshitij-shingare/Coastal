"use strict";
/**
 * Property-Based Test for Classification Output Validity
 *
 * Feature: coastal-hazards-merge, Property 7: Classification Output Validity
 *
 * Property: For any report processed by the AI service, the classification output SHALL contain
 * a valid hazardType (from the defined enum), a valid severity level (low, moderate, high),
 * and a confidence score between 0 and 100.
 *
 * **Validates: Requirements 7.1, 7.2, 7.3**
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fc = __importStar(require("fast-check"));
const hazard_classification_1 = require("../../modules/processing/hazard-classification");
const report_1 = require("../../../shared/types/report");
// Valid hazard types as defined in the shared types
const VALID_HAZARD_TYPES = [
    'flooding', 'storm_surge', 'high_waves', 'erosion',
    'rip_current', 'tsunami', 'pollution', 'other'
];
// Valid severity levels as defined in the shared types
const VALID_SEVERITY_LEVELS = ['low', 'moderate', 'high'];
// Arbitrary for generating random report text
const reportTextArb = fc.string({ minLength: 5, maxLength: 500 }).filter(s => s.trim().length > 0);
// Arbitrary for generating report text with hazard keywords
const hazardKeywordTextArb = fc.oneof(fc.constant('There is severe flooding in the coastal area'), fc.constant('Storm surge warning issued for the beach'), fc.constant('High waves detected near the shore'), fc.constant('Erosion observed along the cliff'), fc.constant('Dangerous rip current reported by swimmers'), fc.constant('Tsunami alert for the coastal region'), fc.constant('Oil pollution spotted in the water'), fc.constant('Minor water level rise observed'), fc.constant('Moderate storm conditions expected'), fc.constant('Critical emergency situation developing'), 
// Random text that may or may not contain keywords
reportTextArb);
// Arbitrary for generating optional media URLs
const mediaUrlsArb = fc.option(fc.array(fc.webUrl(), { minLength: 0, maxLength: 3 }), { nil: undefined });
/**
 * Helper function to validate classification result structure
 */
function isValidClassificationResult(result) {
    // Check hazardType is valid
    if (!(0, report_1.isValidHazardType)(result.hazardType)) {
        return false;
    }
    // Check severity is valid
    if (!(0, report_1.isValidSeverityLevel)(result.severity)) {
        return false;
    }
    // Check confidence is a number between 0 and 100
    if (typeof result.confidence !== 'number' ||
        isNaN(result.confidence) ||
        result.confidence < 0 ||
        result.confidence > 100) {
        return false;
    }
    return true;
}
describe('Property 7: Classification Output Validity', () => {
    // Feature: coastal-hazards-merge, Property 7: Classification Output Validity
    // **Validates: Requirements 7.1, 7.2, 7.3**
    it('should always return a valid hazardType from the defined enum', async () => {
        await fc.assert(fc.asyncProperty(hazardKeywordTextArb, async (text) => {
            // Force keyword-based classification to avoid external API calls
            const result = await (0, hazard_classification_1.classifyHazard)(text, undefined, { forceKeywords: true });
            // Verify hazardType is one of the valid types
            expect(VALID_HAZARD_TYPES).toContain(result.hazardType);
            expect((0, report_1.isValidHazardType)(result.hazardType)).toBe(true);
            return true;
        }), { numRuns: 100 });
    });
    it('should always return a valid severity level (low, moderate, high)', async () => {
        await fc.assert(fc.asyncProperty(hazardKeywordTextArb, async (text) => {
            // Force keyword-based classification to avoid external API calls
            const result = await (0, hazard_classification_1.classifyHazard)(text, undefined, { forceKeywords: true });
            // Verify severity is one of the valid levels
            expect(VALID_SEVERITY_LEVELS).toContain(result.severity);
            expect((0, report_1.isValidSeverityLevel)(result.severity)).toBe(true);
            return true;
        }), { numRuns: 100 });
    });
    it('should always return a confidence score between 0 and 100', async () => {
        await fc.assert(fc.asyncProperty(hazardKeywordTextArb, async (text) => {
            // Force keyword-based classification to avoid external API calls
            const result = await (0, hazard_classification_1.classifyHazard)(text, undefined, { forceKeywords: true });
            // Verify confidence is a number between 0 and 100
            expect(typeof result.confidence).toBe('number');
            expect(result.confidence).toBeGreaterThanOrEqual(0);
            expect(result.confidence).toBeLessThanOrEqual(100);
            expect(Number.isNaN(result.confidence)).toBe(false);
            return true;
        }), { numRuns: 100 });
    });
    it('should return a complete valid classification result for any input text', async () => {
        await fc.assert(fc.asyncProperty(hazardKeywordTextArb, mediaUrlsArb, async (text, mediaUrls) => {
            // Force keyword-based classification to avoid external API calls
            const result = await (0, hazard_classification_1.classifyHazard)(text, mediaUrls, { forceKeywords: true });
            // Verify the complete result is valid
            expect(isValidClassificationResult(result)).toBe(true);
            // Verify all required fields are present
            expect(result).toHaveProperty('hazardType');
            expect(result).toHaveProperty('severity');
            expect(result).toHaveProperty('confidence');
            return true;
        }), { numRuns: 100 });
    });
    it('should correctly classify text containing flooding keywords', async () => {
        await fc.assert(fc.asyncProperty(fc.constantFrom('flood water rising in the streets', 'severe flooding reported downtown', 'water submerged the parking lot', 'inundation of coastal properties'), async (floodText) => {
            const result = await (0, hazard_classification_1.classifyHazard)(floodText, undefined, { forceKeywords: true });
            // Should classify as flooding
            expect(result.hazardType).toBe('flooding');
            expect(isValidClassificationResult(result)).toBe(true);
            return true;
        }), { numRuns: 20 });
    });
    it('should correctly classify text containing storm surge keywords', async () => {
        await fc.assert(fc.asyncProperty(fc.constantFrom('storm surge warning issued', 'coastal storm surge expected', 'storm tide approaching the shore'), async (surgeText) => {
            const result = await (0, hazard_classification_1.classifyHazard)(surgeText, undefined, { forceKeywords: true });
            // Should classify as storm_surge
            expect(result.hazardType).toBe('storm_surge');
            expect(isValidClassificationResult(result)).toBe(true);
            return true;
        }), { numRuns: 20 });
    });
    it('should assign high severity for text with severe/critical indicators', async () => {
        await fc.assert(fc.asyncProperty(fc.constantFrom('severe flooding emergency', 'extreme wave conditions', 'dangerous critical situation', 'life-threatening storm surge'), async (severeText) => {
            const result = await (0, hazard_classification_1.classifyHazard)(severeText, undefined, { forceKeywords: true });
            // Should assign high severity
            expect(result.severity).toBe('high');
            expect(isValidClassificationResult(result)).toBe(true);
            return true;
        }), { numRuns: 20 });
    });
    it('should assign low severity for text with minor/minimal indicators', async () => {
        await fc.assert(fc.asyncProperty(fc.constantFrom('minor flooding observed', 'small wave activity', 'slight erosion noticed', 'minimal water level change'), async (minorText) => {
            const result = await (0, hazard_classification_1.classifyHazard)(minorText, undefined, { forceKeywords: true });
            // Should assign low severity
            expect(result.severity).toBe('low');
            expect(isValidClassificationResult(result)).toBe(true);
            return true;
        }), { numRuns: 20 });
    });
    it('should default to "other" hazard type for text without recognizable keywords', async () => {
        await fc.assert(fc.asyncProperty(fc.constantFrom('something happened at the beach', 'unusual activity observed', 'report from coastal area', 'situation developing nearby', 'general observation noted', 'incident reported today'), async (genericText) => {
            const result = await (0, hazard_classification_1.classifyHazard)(genericText, undefined, { forceKeywords: true });
            // Should default to 'other' when no keywords match
            expect(result.hazardType).toBe('other');
            expect(isValidClassificationResult(result)).toBe(true);
            return true;
        }), { numRuns: 20 });
    });
    it('should handle empty or whitespace-only text gracefully', async () => {
        await fc.assert(fc.asyncProperty(fc.constantFrom('', '   ', '\t\n', '  \n  '), async (emptyText) => {
            const result = await (0, hazard_classification_1.classifyHazard)(emptyText, undefined, { forceKeywords: true });
            // Should still return a valid result structure
            expect(isValidClassificationResult(result)).toBe(true);
            // Should default to 'other' for empty text
            expect(result.hazardType).toBe('other');
            return true;
        }), { numRuns: 10 });
    });
    it('should increase confidence with more keyword matches', async () => {
        // Single keyword should have lower confidence than multiple keywords
        const singleKeywordResult = await (0, hazard_classification_1.classifyHazard)('flood', undefined, { forceKeywords: true });
        const multipleKeywordResult = await (0, hazard_classification_1.classifyHazard)('flood water rising overflow', undefined, { forceKeywords: true });
        // Both should be valid
        expect(isValidClassificationResult(singleKeywordResult)).toBe(true);
        expect(isValidClassificationResult(multipleKeywordResult)).toBe(true);
        // Multiple keywords should have higher or equal confidence
        expect(multipleKeywordResult.confidence).toBeGreaterThanOrEqual(singleKeywordResult.confidence);
    });
});
//# sourceMappingURL=classification-output.test.js.map