"use strict";
/**
 * Property-Based Test for Cache Invalidation on Update
 *
 * Feature: coastal-hazards-merge, Property 16: Cache Invalidation on Update
 *
 * Property: For any report or alert that is created, updated, or deleted,
 * the corresponding cache entries SHALL be invalidated, and subsequent reads
 * SHALL return fresh data from the database.
 *
 * **Validates: Requirements 3.5**
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
const cache_manager_1 = require("../../cache/cache-manager");
// Arbitraries for generating test data
const hazardTypeArb = fc.constantFrom('flooding', 'storm_surge', 'high_waves', 'erosion', 'rip_current', 'tsunami', 'pollution', 'other');
const severityLevelArb = fc.constantFrom('low', 'moderate', 'high');
const sourceTypeArb = fc.constantFrom('citizen', 'social', 'official');
const reportStatusArb = fc.constantFrom('pending', 'verified', 'rejected');
const alertStatusArb = fc.constantFrom('active', 'verified', 'resolved', 'false_alarm');
const reportArb = fc.record({
    id: fc.uuid(),
    timestamp: fc.date(),
    location: fc.record({
        latitude: fc.double({ min: -90, max: 90, noNaN: true }),
        longitude: fc.double({ min: -180, max: 180, noNaN: true }),
        accuracy: fc.option(fc.double({ min: 0, max: 100, noNaN: true }), { nil: undefined }),
        address: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
    }),
    source: sourceTypeArb,
    content: fc.record({
        originalText: fc.string({ minLength: 1, maxLength: 500 }),
        translatedText: fc.option(fc.string({ minLength: 1, maxLength: 500 }), { nil: undefined }),
        language: fc.constantFrom('en', 'es', 'fr', 'de'),
        mediaFiles: fc.constant(undefined),
    }),
    classification: fc.record({
        hazardType: fc.option(hazardTypeArb, { nil: undefined }),
        severity: fc.option(severityLevelArb, { nil: undefined }),
        confidence: fc.double({ min: 0, max: 100, noNaN: true }),
    }),
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
const alertArb = fc.record({
    id: fc.uuid(),
    incidentId: fc.option(fc.uuid(), { nil: undefined }),
    timestamp: fc.date(),
    region: fc.record({
        name: fc.string({ minLength: 1, maxLength: 50 }),
        bounds: fc.constant({
            type: 'Polygon',
            coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]],
        }),
        affectedPopulation: fc.integer({ min: 0, max: 1000000 }),
    }),
    hazardType: hazardTypeArb,
    severity: severityLevelArb,
    confidence: fc.double({ min: 0, max: 100, noNaN: true }),
    escalationReason: fc.record({
        reportCount: fc.integer({ min: 1, max: 100 }),
        sourceTypes: fc.array(fc.constantFrom('citizen', 'social', 'official'), { minLength: 1, maxLength: 3 }),
        timeWindow: fc.constantFrom('1h', '6h', '24h'),
        geographicSpread: fc.double({ min: 0, max: 100, noNaN: true }),
        thresholdsMet: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 0, maxLength: 5 }),
        reasoning: fc.string({ minLength: 1, maxLength: 200 }),
    }),
    relatedReports: fc.array(fc.uuid(), { minLength: 0, maxLength: 10 }),
    status: alertStatusArb,
    aiSummary: fc.string({ minLength: 1, maxLength: 200 }),
    createdAt: fc.date(),
    updatedAt: fc.date(),
});
describe('Property 16: Cache Invalidation on Update', () => {
    // Feature: coastal-hazards-merge, Property 16: Cache Invalidation on Update
    // **Validates: Requirements 3.5**
    beforeEach(async () => {
        // Clear all caches before each test
        await (0, cache_manager_1.invalidateAll)();
    });
    describe('Report Cache Invalidation', () => {
        it('should return null after invalidating a cached report', async () => {
            await fc.assert(fc.asyncProperty(reportArb, async (report) => {
                // Cache the report
                await (0, cache_manager_1.cacheReport)(report);
                // Verify it's cached
                const cachedReport = await (0, cache_manager_1.getReport)(report.id);
                expect(cachedReport).not.toBeNull();
                expect(cachedReport?.id).toBe(report.id);
                // Invalidate the report
                await (0, cache_manager_1.invalidateReport)(report.id);
                // Verify cache returns null after invalidation
                const afterInvalidation = await (0, cache_manager_1.getReport)(report.id);
                expect(afterInvalidation).toBeNull();
                return true;
            }), { numRuns: 100 });
        });
        it('should invalidate recent reports list when a single report is invalidated', async () => {
            await fc.assert(fc.asyncProperty(fc.array(reportArb, { minLength: 1, maxLength: 10 }), async (reports) => {
                // Cache the recent reports list
                await (0, cache_manager_1.cacheRecentReports)(reports);
                // Verify it's cached
                const cachedReports = await (0, cache_manager_1.getRecentReports)();
                expect(cachedReports).not.toBeNull();
                expect(cachedReports?.length).toBe(reports.length);
                // Invalidate a single report (which should also invalidate the list)
                await (0, cache_manager_1.invalidateReport)(reports[0].id);
                // Verify recent reports list is also invalidated
                const afterInvalidation = await (0, cache_manager_1.getRecentReports)();
                expect(afterInvalidation).toBeNull();
                return true;
            }), { numRuns: 100 });
        });
        it('should allow re-caching after invalidation with new data', async () => {
            await fc.assert(fc.asyncProperty(reportArb, reportArb, async (originalReport, updatedReport) => {
                // Use the same ID for both
                const reportId = originalReport.id;
                updatedReport = { ...updatedReport, id: reportId };
                // Cache original report
                await (0, cache_manager_1.cacheReport)(originalReport);
                // Invalidate
                await (0, cache_manager_1.invalidateReport)(reportId);
                // Cache updated report
                await (0, cache_manager_1.cacheReport)(updatedReport);
                // Verify we get the updated data
                const cachedReport = await (0, cache_manager_1.getReport)(reportId);
                expect(cachedReport).not.toBeNull();
                expect(cachedReport?.content.originalText).toBe(updatedReport.content.originalText);
                return true;
            }), { numRuns: 100 });
        });
    });
    describe('Alert Cache Invalidation', () => {
        it('should return null after invalidating a cached alert', async () => {
            await fc.assert(fc.asyncProperty(alertArb, async (alert) => {
                // Cache the alert
                await (0, cache_manager_1.cacheAlert)(alert);
                // Verify it's cached
                const cachedAlert = await (0, cache_manager_1.getAlert)(alert.id);
                expect(cachedAlert).not.toBeNull();
                expect(cachedAlert?.id).toBe(alert.id);
                // Invalidate the alert
                await (0, cache_manager_1.invalidateAlert)(alert.id);
                // Verify cache returns null after invalidation
                const afterInvalidation = await (0, cache_manager_1.getAlert)(alert.id);
                expect(afterInvalidation).toBeNull();
                return true;
            }), { numRuns: 100 });
        });
        it('should invalidate active alerts list when a single alert is invalidated', async () => {
            await fc.assert(fc.asyncProperty(fc.array(alertArb, { minLength: 1, maxLength: 10 }), async (alerts) => {
                // Cache the active alerts list
                await (0, cache_manager_1.cacheActiveAlerts)(alerts);
                // Verify it's cached
                const cachedAlerts = await (0, cache_manager_1.getActiveAlerts)();
                expect(cachedAlerts).not.toBeNull();
                expect(cachedAlerts?.length).toBe(alerts.length);
                // Invalidate a single alert (which should also invalidate the list)
                await (0, cache_manager_1.invalidateAlert)(alerts[0].id);
                // Verify active alerts list is also invalidated
                const afterInvalidation = await (0, cache_manager_1.getActiveAlerts)();
                expect(afterInvalidation).toBeNull();
                return true;
            }), { numRuns: 100 });
        });
        it('should allow re-caching after invalidation with new data', async () => {
            await fc.assert(fc.asyncProperty(alertArb, alertArb, async (originalAlert, updatedAlert) => {
                // Use the same ID for both
                const alertId = originalAlert.id;
                updatedAlert = { ...updatedAlert, id: alertId };
                // Cache original alert
                await (0, cache_manager_1.cacheAlert)(originalAlert);
                // Invalidate
                await (0, cache_manager_1.invalidateAlert)(alertId);
                // Cache updated alert
                await (0, cache_manager_1.cacheAlert)(updatedAlert);
                // Verify we get the updated data
                const cachedAlert = await (0, cache_manager_1.getAlert)(alertId);
                expect(cachedAlert).not.toBeNull();
                expect(cachedAlert?.aiSummary).toBe(updatedAlert.aiSummary);
                return true;
            }), { numRuns: 100 });
        });
    });
    describe('Bulk Invalidation', () => {
        it('should invalidate all caches when invalidateAll is called', async () => {
            await fc.assert(fc.asyncProperty(fc.array(reportArb, { minLength: 1, maxLength: 5 }), fc.array(alertArb, { minLength: 1, maxLength: 5 }), async (reports, alerts) => {
                // Cache reports and alerts
                await (0, cache_manager_1.cacheRecentReports)(reports);
                await (0, cache_manager_1.cacheActiveAlerts)(alerts);
                for (const report of reports) {
                    await (0, cache_manager_1.cacheReport)(report);
                }
                for (const alert of alerts) {
                    await (0, cache_manager_1.cacheAlert)(alert);
                }
                // Verify caches are populated
                expect(await (0, cache_manager_1.getRecentReports)()).not.toBeNull();
                expect(await (0, cache_manager_1.getActiveAlerts)()).not.toBeNull();
                // Invalidate all
                await (0, cache_manager_1.invalidateAll)();
                // Verify all caches are cleared
                expect(await (0, cache_manager_1.getRecentReports)()).toBeNull();
                expect(await (0, cache_manager_1.getActiveAlerts)()).toBeNull();
                for (const report of reports) {
                    expect(await (0, cache_manager_1.getReport)(report.id)).toBeNull();
                }
                for (const alert of alerts) {
                    expect(await (0, cache_manager_1.getAlert)(alert.id)).toBeNull();
                }
                return true;
            }), { numRuns: 100 });
        });
    });
});
//# sourceMappingURL=cache-invalidation.test.js.map