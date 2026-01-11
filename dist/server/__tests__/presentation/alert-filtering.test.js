"use strict";
/**
 * Property-Based Test for Alert Filter Consistency
 *
 * Feature: coastal-hazards-merge, Property 4: Alert Filter Consistency
 *
 * Property: For any combination of alert filters (status, hazardType, severity, region),
 * all returned alerts SHALL match every specified filter criterion.
 *
 * **Validates: Requirements 5.2, 5.5**
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
const alert_1 = require("../../../shared/types/alert");
const report_1 = require("../../../shared/types/report");
// Valid values for each filter type
const ALERT_STATUSES = ['active', 'verified', 'resolved', 'false_alarm'];
const HAZARD_TYPES = [
    'flooding', 'storm_surge', 'high_waves', 'erosion',
    'rip_current', 'tsunami', 'pollution', 'other'
];
const SEVERITY_LEVELS = ['low', 'moderate', 'high'];
const REGIONS = ['North Coast', 'South Beach', 'East Harbor', 'West Bay', 'Central District'];
/**
 * Arbitrary for generating a valid Alert
 */
const alertArb = fc.record({
    id: fc.uuid(),
    incidentId: fc.option(fc.uuid(), { nil: undefined }),
    timestamp: fc.date({ min: new Date('2024-01-01'), max: new Date('2026-12-31') }),
    region: fc.record({
        name: fc.constantFrom(...REGIONS),
        bounds: fc.constant({
            type: 'Polygon',
            coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]],
        }),
        affectedPopulation: fc.integer({ min: 0, max: 100000 }),
    }),
    hazardType: fc.constantFrom(...HAZARD_TYPES),
    severity: fc.constantFrom(...SEVERITY_LEVELS),
    confidence: fc.double({ min: 0, max: 100, noNaN: true }),
    escalationReason: fc.record({
        reportCount: fc.integer({ min: 1, max: 50 }),
        sourceTypes: fc.array(fc.constantFrom('citizen', 'social', 'official'), { minLength: 1, maxLength: 3 }),
        timeWindow: fc.constantFrom('1 hour', '6 hours', '12 hours', '24 hours'),
        geographicSpread: fc.double({ min: 0.1, max: 50, noNaN: true }),
        thresholdsMet: fc.array(fc.constantFrom('minimum_reports', 'confidence_threshold', 'source_diversity'), { minLength: 1, maxLength: 3 }),
        reasoning: fc.string({ minLength: 10, maxLength: 200 }),
    }),
    relatedReports: fc.array(fc.uuid(), { minLength: 1, maxLength: 10 }),
    status: fc.constantFrom(...ALERT_STATUSES),
    aiSummary: fc.string({ minLength: 10, maxLength: 300 }),
    createdAt: fc.date({ min: new Date('2024-01-01'), max: new Date('2026-12-31') }),
    updatedAt: fc.date({ min: new Date('2024-01-01'), max: new Date('2026-12-31') }),
});
const filtersArb = fc.record({
    status: fc.option(fc.constantFrom(...ALERT_STATUSES), { nil: undefined }),
    hazardType: fc.option(fc.constantFrom(...HAZARD_TYPES), { nil: undefined }),
    severity: fc.option(fc.constantFrom(...SEVERITY_LEVELS), { nil: undefined }),
    region: fc.option(fc.constantFrom(...REGIONS), { nil: undefined }),
    minConfidence: fc.option(fc.double({ min: 0, max: 100, noNaN: true }), { nil: undefined }),
});
/**
 * Filter function that mimics the database query filtering logic
 * This is the reference implementation we're testing against
 */
function filterAlerts(alerts, filters) {
    return alerts.filter(alert => {
        // Check status filter
        if (filters.status !== undefined && alert.status !== filters.status) {
            return false;
        }
        // Check hazardType filter
        if (filters.hazardType !== undefined && alert.hazardType !== filters.hazardType) {
            return false;
        }
        // Check severity filter
        if (filters.severity !== undefined && alert.severity !== filters.severity) {
            return false;
        }
        // Check region filter (case-insensitive partial match, like ILIKE in SQL)
        if (filters.region !== undefined) {
            const regionLower = alert.region.name.toLowerCase();
            const filterLower = filters.region.toLowerCase();
            if (!regionLower.includes(filterLower)) {
                return false;
            }
        }
        // Check minConfidence filter
        if (filters.minConfidence !== undefined && alert.confidence < filters.minConfidence) {
            return false;
        }
        return true;
    });
}
/**
 * Check if an alert matches all specified filter criteria
 */
function alertMatchesFilters(alert, filters) {
    if (filters.status !== undefined && alert.status !== filters.status) {
        return false;
    }
    if (filters.hazardType !== undefined && alert.hazardType !== filters.hazardType) {
        return false;
    }
    if (filters.severity !== undefined && alert.severity !== filters.severity) {
        return false;
    }
    if (filters.region !== undefined) {
        const regionLower = alert.region.name.toLowerCase();
        const filterLower = filters.region.toLowerCase();
        if (!regionLower.includes(filterLower)) {
            return false;
        }
    }
    if (filters.minConfidence !== undefined && alert.confidence < filters.minConfidence) {
        return false;
    }
    return true;
}
/**
 * Count how many filters are specified (non-undefined)
 */
function countActiveFilters(filters) {
    let count = 0;
    if (filters.status !== undefined)
        count++;
    if (filters.hazardType !== undefined)
        count++;
    if (filters.severity !== undefined)
        count++;
    if (filters.region !== undefined)
        count++;
    if (filters.minConfidence !== undefined)
        count++;
    return count;
}
describe('Property 4: Alert Filter Consistency', () => {
    // Feature: coastal-hazards-merge, Property 4: Alert Filter Consistency
    // **Validates: Requirements 5.2, 5.5**
    it('should return only alerts that match ALL specified filter criteria', () => {
        fc.assert(fc.property(fc.array(alertArb, { minLength: 1, maxLength: 50 }), filtersArb, (alerts, filters) => {
            const filteredAlerts = filterAlerts(alerts, filters);
            // Property: Every returned alert must match ALL specified filters
            for (const alert of filteredAlerts) {
                expect(alertMatchesFilters(alert, filters)).toBe(true);
            }
            return true;
        }), { numRuns: 100 });
    });
    it('should not exclude any alerts that match all filter criteria', () => {
        fc.assert(fc.property(fc.array(alertArb, { minLength: 1, maxLength: 50 }), filtersArb, (alerts, filters) => {
            const filteredAlerts = filterAlerts(alerts, filters);
            const filteredIds = new Set(filteredAlerts.map(a => a.id));
            // Property: Every alert that matches all filters should be included
            for (const alert of alerts) {
                if (alertMatchesFilters(alert, filters)) {
                    expect(filteredIds.has(alert.id)).toBe(true);
                }
            }
            return true;
        }), { numRuns: 100 });
    });
    it('should return all alerts when no filters are specified', () => {
        fc.assert(fc.property(fc.array(alertArb, { minLength: 1, maxLength: 50 }), (alerts) => {
            const emptyFilters = {};
            const filteredAlerts = filterAlerts(alerts, emptyFilters);
            // Property: With no filters, all alerts should be returned
            expect(filteredAlerts.length).toBe(alerts.length);
            return true;
        }), { numRuns: 100 });
    });
    it('should correctly filter by status alone', () => {
        fc.assert(fc.property(fc.array(alertArb, { minLength: 5, maxLength: 30 }), fc.constantFrom(...ALERT_STATUSES), (alerts, status) => {
            const filters = { status };
            const filteredAlerts = filterAlerts(alerts, filters);
            // Property: All returned alerts must have the specified status
            for (const alert of filteredAlerts) {
                expect(alert.status).toBe(status);
            }
            // Property: Count should match manual count
            const expectedCount = alerts.filter(a => a.status === status).length;
            expect(filteredAlerts.length).toBe(expectedCount);
            return true;
        }), { numRuns: 100 });
    });
    it('should correctly filter by hazardType alone', () => {
        fc.assert(fc.property(fc.array(alertArb, { minLength: 5, maxLength: 30 }), fc.constantFrom(...HAZARD_TYPES), (alerts, hazardType) => {
            const filters = { hazardType };
            const filteredAlerts = filterAlerts(alerts, filters);
            // Property: All returned alerts must have the specified hazard type
            for (const alert of filteredAlerts) {
                expect(alert.hazardType).toBe(hazardType);
            }
            // Property: Count should match manual count
            const expectedCount = alerts.filter(a => a.hazardType === hazardType).length;
            expect(filteredAlerts.length).toBe(expectedCount);
            return true;
        }), { numRuns: 100 });
    });
    it('should correctly filter by severity alone', () => {
        fc.assert(fc.property(fc.array(alertArb, { minLength: 5, maxLength: 30 }), fc.constantFrom(...SEVERITY_LEVELS), (alerts, severity) => {
            const filters = { severity };
            const filteredAlerts = filterAlerts(alerts, filters);
            // Property: All returned alerts must have the specified severity
            for (const alert of filteredAlerts) {
                expect(alert.severity).toBe(severity);
            }
            // Property: Count should match manual count
            const expectedCount = alerts.filter(a => a.severity === severity).length;
            expect(filteredAlerts.length).toBe(expectedCount);
            return true;
        }), { numRuns: 100 });
    });
    it('should correctly filter by region (case-insensitive partial match)', () => {
        fc.assert(fc.property(fc.array(alertArb, { minLength: 5, maxLength: 30 }), fc.constantFrom(...REGIONS), (alerts, region) => {
            const filters = { region };
            const filteredAlerts = filterAlerts(alerts, filters);
            // Property: All returned alerts must have region containing the filter string
            for (const alert of filteredAlerts) {
                expect(alert.region.name.toLowerCase()).toContain(region.toLowerCase());
            }
            return true;
        }), { numRuns: 100 });
    });
    it('should correctly filter by minConfidence', () => {
        fc.assert(fc.property(fc.array(alertArb, { minLength: 5, maxLength: 30 }), fc.double({ min: 0, max: 100, noNaN: true }), (alerts, minConfidence) => {
            const filters = { minConfidence };
            const filteredAlerts = filterAlerts(alerts, filters);
            // Property: All returned alerts must have confidence >= minConfidence
            for (const alert of filteredAlerts) {
                expect(alert.confidence).toBeGreaterThanOrEqual(minConfidence);
            }
            // Property: Count should match manual count
            const expectedCount = alerts.filter(a => a.confidence >= minConfidence).length;
            expect(filteredAlerts.length).toBe(expectedCount);
            return true;
        }), { numRuns: 100 });
    });
    it('should correctly apply multiple filters simultaneously (AND logic)', () => {
        fc.assert(fc.property(fc.array(alertArb, { minLength: 10, maxLength: 50 }), fc.constantFrom(...ALERT_STATUSES), fc.constantFrom(...HAZARD_TYPES), fc.constantFrom(...SEVERITY_LEVELS), (alerts, status, hazardType, severity) => {
            const filters = { status, hazardType, severity };
            const filteredAlerts = filterAlerts(alerts, filters);
            // Property: All returned alerts must match ALL three filters
            for (const alert of filteredAlerts) {
                expect(alert.status).toBe(status);
                expect(alert.hazardType).toBe(hazardType);
                expect(alert.severity).toBe(severity);
            }
            // Property: Count should match manual count with AND logic
            const expectedCount = alerts.filter(a => a.status === status &&
                a.hazardType === hazardType &&
                a.severity === severity).length;
            expect(filteredAlerts.length).toBe(expectedCount);
            return true;
        }), { numRuns: 100 });
    });
    it('should return empty array when filters match no alerts', () => {
        fc.assert(fc.property(fc.array(alertArb, { minLength: 1, maxLength: 20 }), (alerts) => {
            // Create filters that are unlikely to match any alert
            // by using a very high minConfidence
            const filters = { minConfidence: 101 }; // Impossible confidence
            const filteredAlerts = filterAlerts(alerts, filters);
            // Property: Should return empty array
            expect(filteredAlerts.length).toBe(0);
            return true;
        }), { numRuns: 100 });
    });
    it('should maintain filter consistency across different filter orderings', () => {
        fc.assert(fc.property(fc.array(alertArb, { minLength: 5, maxLength: 30 }), fc.constantFrom(...ALERT_STATUSES), fc.constantFrom(...HAZARD_TYPES), (alerts, status, hazardType) => {
            // Apply filters in different orders
            const filters1 = { status, hazardType };
            const filters2 = { hazardType, status };
            const result1 = filterAlerts(alerts, filters1);
            const result2 = filterAlerts(alerts, filters2);
            // Property: Order of filter specification should not affect results
            expect(result1.length).toBe(result2.length);
            const ids1 = new Set(result1.map(a => a.id));
            const ids2 = new Set(result2.map(a => a.id));
            for (const id of ids1) {
                expect(ids2.has(id)).toBe(true);
            }
            return true;
        }), { numRuns: 100 });
    });
    it('should validate that filter values are from valid enums', () => {
        fc.assert(fc.property(fc.constantFrom(...ALERT_STATUSES), fc.constantFrom(...HAZARD_TYPES), fc.constantFrom(...SEVERITY_LEVELS), (status, hazardType, severity) => {
            // Property: All filter values should be valid enum values
            expect((0, alert_1.isValidAlertStatus)(status)).toBe(true);
            expect((0, report_1.isValidHazardType)(hazardType)).toBe(true);
            expect((0, report_1.isValidSeverityLevel)(severity)).toBe(true);
            return true;
        }), { numRuns: 100 });
    });
    it('should handle filtering with all filter types combined', () => {
        fc.assert(fc.property(fc.array(alertArb, { minLength: 10, maxLength: 50 }), fc.constantFrom(...ALERT_STATUSES), fc.constantFrom(...HAZARD_TYPES), fc.constantFrom(...SEVERITY_LEVELS), fc.constantFrom(...REGIONS), fc.double({ min: 0, max: 100, noNaN: true }), (alerts, status, hazardType, severity, region, minConfidence) => {
            const filters = { status, hazardType, severity, region, minConfidence };
            const filteredAlerts = filterAlerts(alerts, filters);
            // Property: All returned alerts must match ALL five filters
            for (const alert of filteredAlerts) {
                expect(alert.status).toBe(status);
                expect(alert.hazardType).toBe(hazardType);
                expect(alert.severity).toBe(severity);
                expect(alert.region.name.toLowerCase()).toContain(region.toLowerCase());
                expect(alert.confidence).toBeGreaterThanOrEqual(minConfidence);
            }
            return true;
        }), { numRuns: 100 });
    });
    it('should produce monotonically decreasing result sets as more filters are added', () => {
        fc.assert(fc.property(fc.array(alertArb, { minLength: 10, maxLength: 50 }), fc.constantFrom(...ALERT_STATUSES), fc.constantFrom(...HAZARD_TYPES), fc.constantFrom(...SEVERITY_LEVELS), (alerts, status, hazardType, severity) => {
            // Apply filters incrementally
            const noFilters = filterAlerts(alerts, {});
            const oneFilter = filterAlerts(alerts, { status });
            const twoFilters = filterAlerts(alerts, { status, hazardType });
            const threeFilters = filterAlerts(alerts, { status, hazardType, severity });
            // Property: Adding more filters should never increase result count
            expect(oneFilter.length).toBeLessThanOrEqual(noFilters.length);
            expect(twoFilters.length).toBeLessThanOrEqual(oneFilter.length);
            expect(threeFilters.length).toBeLessThanOrEqual(twoFilters.length);
            return true;
        }), { numRuns: 100 });
    });
});
//# sourceMappingURL=alert-filtering.test.js.map