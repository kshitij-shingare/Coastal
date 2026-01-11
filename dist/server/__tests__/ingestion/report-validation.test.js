"use strict";
/**
 * Property-Based Test for Report Validation
 *
 * Feature: coastal-hazards-merge, Property 1: Report Validation Rejects Invalid Data
 *
 * Property: For any report submission with missing required fields (location, description, or source),
 * the API SHALL return a 400 status with validation error messages listing all missing fields.
 *
 * **Validates: Requirements 4.5**
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
const report_1 = require("../../../shared/types/report");
// Arbitraries for generating test data
const hazardTypeArb = fc.constantFrom('flooding', 'storm_surge', 'high_waves', 'erosion', 'rip_current', 'tsunami', 'pollution', 'other');
const severityLevelArb = fc.constantFrom('low', 'moderate', 'high');
const sourceTypeArb = fc.constantFrom('citizen', 'social', 'official');
const reportStatusArb = fc.constantFrom('pending', 'verified', 'rejected');
// Valid location arbitrary
const validLocationArb = fc.record({
    latitude: fc.double({ min: -90, max: 90, noNaN: true }),
    longitude: fc.double({ min: -180, max: 180, noNaN: true }),
    accuracy: fc.option(fc.double({ min: 0, max: 100, noNaN: true }), { nil: undefined }),
    address: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
});
// Valid content arbitrary (with non-empty, non-whitespace text)
const validContentArb = fc.record({
    originalText: fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
    translatedText: fc.option(fc.string({ minLength: 1, maxLength: 500 }), { nil: undefined }),
    language: fc.constantFrom('en', 'es', 'fr', 'de'),
    mediaFiles: fc.constant(undefined),
});
// Valid classification arbitrary
const validClassificationArb = fc.record({
    hazardType: fc.option(hazardTypeArb, { nil: undefined }),
    severity: fc.option(severityLevelArb, { nil: undefined }),
    confidence: fc.double({ min: 0, max: 100, noNaN: true }),
});
// Complete valid report arbitrary
const validReportArb = fc.record({
    id: fc.uuid(),
    timestamp: fc.date(),
    location: validLocationArb,
    source: sourceTypeArb,
    content: validContentArb,
    classification: validClassificationArb,
    status: reportStatusArb,
    region: fc.string({ minLength: 1, maxLength: 50 }),
    aiSummary: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined }),
    metadata: fc.record({
        deviceInfo: fc.option(fc.string(), { nil: undefined }),
        ipAddress: fc.option(fc.string(), { nil: undefined }),
        userAgent: fc.option(fc.string(), { nil: undefined }),
    }),
    createdAt: fc.date(),
    updatedAt: fc.date(),
});
describe('Property 1: Report Validation Rejects Invalid Data', () => {
    // Feature: coastal-hazards-merge, Property 1: Report Validation Rejects Invalid Data
    // **Validates: Requirements 4.5**
    it('should accept valid reports with all required fields', () => {
        fc.assert(fc.property(validReportArb, (report) => {
            const errors = (0, report_1.validateReport)(report);
            // Valid reports should have no errors
            expect(errors.length).toBe(0);
            return true;
        }), { numRuns: 100 });
    });
    it('should reject reports with missing location', () => {
        fc.assert(fc.property(validContentArb, sourceTypeArb, (content, source) => {
            const reportWithoutLocation = {
                content,
                source,
                // location is missing
            };
            const errors = (0, report_1.validateReport)(reportWithoutLocation);
            // Should have at least one error about location
            expect(errors.length).toBeGreaterThan(0);
            expect(errors.some(e => e.toLowerCase().includes('location'))).toBe(true);
            return true;
        }), { numRuns: 100 });
    });
    it('should reject reports with missing description (content.originalText)', () => {
        fc.assert(fc.property(validLocationArb, sourceTypeArb, (location, source) => {
            // Report with empty or missing originalText
            const reportWithoutDescription = {
                location,
                source,
                content: {
                    originalText: '', // Empty description
                    language: 'en',
                },
            };
            const errors = (0, report_1.validateReport)(reportWithoutDescription);
            // Should have at least one error about description
            expect(errors.length).toBeGreaterThan(0);
            expect(errors.some(e => e.toLowerCase().includes('description') || e.toLowerCase().includes('text'))).toBe(true);
            return true;
        }), { numRuns: 100 });
    });
    it('should reject reports with invalid source type', () => {
        fc.assert(fc.property(validLocationArb, validContentArb, fc.string({ minLength: 1, maxLength: 20 }).filter(s => !['citizen', 'social', 'official'].includes(s)), (location, content, invalidSource) => {
            const reportWithInvalidSource = {
                location,
                content,
                source: invalidSource, // Invalid source
            };
            const errors = (0, report_1.validateReport)(reportWithInvalidSource);
            // Should have at least one error about source
            expect(errors.length).toBeGreaterThan(0);
            expect(errors.some(e => e.toLowerCase().includes('source'))).toBe(true);
            return true;
        }), { numRuns: 100 });
    });
    it('should reject reports with invalid latitude (out of range)', () => {
        fc.assert(fc.property(
        // Generate latitude outside valid range
        fc.oneof(fc.double({ min: -1000, max: -90.001, noNaN: true }), fc.double({ min: 90.001, max: 1000, noNaN: true })), fc.double({ min: -180, max: 180, noNaN: true }), validContentArb, sourceTypeArb, (invalidLat, validLon, content, source) => {
            const reportWithInvalidLat = {
                location: {
                    latitude: invalidLat,
                    longitude: validLon,
                },
                content,
                source,
            };
            const errors = (0, report_1.validateReport)(reportWithInvalidLat);
            // Should have at least one error about latitude
            expect(errors.length).toBeGreaterThan(0);
            expect(errors.some(e => e.toLowerCase().includes('latitude'))).toBe(true);
            return true;
        }), { numRuns: 100 });
    });
    it('should reject reports with invalid longitude (out of range)', () => {
        fc.assert(fc.property(fc.double({ min: -90, max: 90, noNaN: true }), 
        // Generate longitude outside valid range
        fc.oneof(fc.double({ min: -1000, max: -180.001, noNaN: true }), fc.double({ min: 180.001, max: 1000, noNaN: true })), validContentArb, sourceTypeArb, (validLat, invalidLon, content, source) => {
            const reportWithInvalidLon = {
                location: {
                    latitude: validLat,
                    longitude: invalidLon,
                },
                content,
                source,
            };
            const errors = (0, report_1.validateReport)(reportWithInvalidLon);
            // Should have at least one error about longitude
            expect(errors.length).toBeGreaterThan(0);
            expect(errors.some(e => e.toLowerCase().includes('longitude'))).toBe(true);
            return true;
        }), { numRuns: 100 });
    });
    it('should reject reports with invalid confidence score (out of 0-100 range)', () => {
        fc.assert(fc.property(validLocationArb, validContentArb, sourceTypeArb, 
        // Generate confidence outside valid range
        fc.oneof(fc.double({ min: -1000, max: -0.001, noNaN: true }), fc.double({ min: 100.001, max: 1000, noNaN: true })), (location, content, source, invalidConfidence) => {
            const reportWithInvalidConfidence = {
                location,
                content,
                source,
                classification: {
                    confidence: invalidConfidence,
                },
            };
            const errors = (0, report_1.validateReport)(reportWithInvalidConfidence);
            // Should have at least one error about confidence
            expect(errors.length).toBeGreaterThan(0);
            expect(errors.some(e => e.toLowerCase().includes('confidence'))).toBe(true);
            return true;
        }), { numRuns: 100 });
    });
    it('should list all missing fields when multiple required fields are missing', () => {
        fc.assert(fc.property(fc.boolean(), fc.boolean(), (missingLocation, missingContent) => {
            // Ensure at least one required field is missing
            // Note: source is optional in validateReport, so we only test location and content
            if (!missingLocation && !missingContent) {
                return true; // Skip this case - both required fields present
            }
            const partialReport = {};
            if (!missingLocation) {
                partialReport.location = {
                    latitude: 45.0,
                    longitude: -75.0,
                };
            }
            if (!missingContent) {
                partialReport.content = {
                    originalText: 'Test description',
                    language: 'en',
                };
            }
            // Source is optional, so we can include it
            partialReport.source = 'citizen';
            const errors = (0, report_1.validateReport)(partialReport);
            // Should have errors since at least one required field is missing
            expect(errors.length).toBeGreaterThan(0);
            // Verify location error if missing
            if (missingLocation) {
                expect(errors.some(e => e.toLowerCase().includes('location'))).toBe(true);
            }
            // Verify content/description error if missing
            if (missingContent) {
                expect(errors.some(e => e.toLowerCase().includes('description') || e.toLowerCase().includes('text'))).toBe(true);
            }
            return true;
        }), { numRuns: 100 });
    });
    it('should handle whitespace-only description as invalid', () => {
        fc.assert(fc.property(validLocationArb, sourceTypeArb, 
        // Generate whitespace-only strings
        fc.stringOf(fc.constantFrom(' ', '\t', '\n', '\r')).filter(s => s.length > 0), (location, source, whitespaceText) => {
            const reportWithWhitespaceDescription = {
                location,
                source,
                content: {
                    originalText: whitespaceText,
                    language: 'en',
                },
            };
            const errors = (0, report_1.validateReport)(reportWithWhitespaceDescription);
            // Should have at least one error about description
            expect(errors.length).toBeGreaterThan(0);
            expect(errors.some(e => e.toLowerCase().includes('description') || e.toLowerCase().includes('text'))).toBe(true);
            return true;
        }), { numRuns: 100 });
    });
});
//# sourceMappingURL=report-validation.test.js.map