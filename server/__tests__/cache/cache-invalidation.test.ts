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

import * as fc from 'fast-check';
import {
  cacheReport,
  getReport,
  invalidateReport,
  cacheAlert,
  getAlert,
  invalidateAlert,
  cacheRecentReports,
  getRecentReports,
  invalidateRecentReports,
  cacheActiveAlerts,
  getActiveAlerts,
  invalidateActiveAlerts,
  invalidateAll,
} from '../../cache/cache-manager';
import { Report, HazardType, SeverityLevel, SourceType, ReportStatus } from '../../../shared/types/report';
import { Alert, AlertStatus } from '../../../shared/types/alert';

// Arbitraries for generating test data
const hazardTypeArb = fc.constantFrom<HazardType>(
  'flooding', 'storm_surge', 'high_waves', 'erosion', 'rip_current', 'tsunami', 'pollution', 'other'
);

const severityLevelArb = fc.constantFrom<SeverityLevel>('low', 'moderate', 'high');
const sourceTypeArb = fc.constantFrom<SourceType>('citizen', 'social', 'official');
const reportStatusArb = fc.constantFrom<ReportStatus>('pending', 'verified', 'rejected');
const alertStatusArb = fc.constantFrom<AlertStatus>('active', 'verified', 'resolved', 'false_alarm');

const reportArb: fc.Arbitrary<Report> = fc.record({
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

const alertArb: fc.Arbitrary<Alert> = fc.record({
  id: fc.uuid(),
  incidentId: fc.option(fc.uuid(), { nil: undefined }),
  timestamp: fc.date(),
  region: fc.record({
    name: fc.string({ minLength: 1, maxLength: 50 }),
    bounds: fc.constant({
      type: 'Polygon' as const,
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
    await invalidateAll();
  });

  describe('Report Cache Invalidation', () => {
    it('should return null after invalidating a cached report', async () => {
      await fc.assert(
        fc.asyncProperty(reportArb, async (report) => {
          // Cache the report
          await cacheReport(report);
          
          // Verify it's cached
          const cachedReport = await getReport(report.id);
          expect(cachedReport).not.toBeNull();
          expect(cachedReport?.id).toBe(report.id);
          
          // Invalidate the report
          await invalidateReport(report.id);
          
          // Verify cache returns null after invalidation
          const afterInvalidation = await getReport(report.id);
          expect(afterInvalidation).toBeNull();
          
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should invalidate recent reports list when a single report is invalidated', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(reportArb, { minLength: 1, maxLength: 10 }),
          async (reports) => {
            // Cache the recent reports list
            await cacheRecentReports(reports);
            
            // Verify it's cached
            const cachedReports = await getRecentReports();
            expect(cachedReports).not.toBeNull();
            expect(cachedReports?.length).toBe(reports.length);
            
            // Invalidate a single report (which should also invalidate the list)
            await invalidateReport(reports[0].id);
            
            // Verify recent reports list is also invalidated
            const afterInvalidation = await getRecentReports();
            expect(afterInvalidation).toBeNull();
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow re-caching after invalidation with new data', async () => {
      await fc.assert(
        fc.asyncProperty(reportArb, reportArb, async (originalReport, updatedReport) => {
          // Use the same ID for both
          const reportId = originalReport.id;
          updatedReport = { ...updatedReport, id: reportId };
          
          // Cache original report
          await cacheReport(originalReport);
          
          // Invalidate
          await invalidateReport(reportId);
          
          // Cache updated report
          await cacheReport(updatedReport);
          
          // Verify we get the updated data
          const cachedReport = await getReport(reportId);
          expect(cachedReport).not.toBeNull();
          expect(cachedReport?.content.originalText).toBe(updatedReport.content.originalText);
          
          return true;
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Alert Cache Invalidation', () => {
    it('should return null after invalidating a cached alert', async () => {
      await fc.assert(
        fc.asyncProperty(alertArb, async (alert) => {
          // Cache the alert
          await cacheAlert(alert);
          
          // Verify it's cached
          const cachedAlert = await getAlert(alert.id);
          expect(cachedAlert).not.toBeNull();
          expect(cachedAlert?.id).toBe(alert.id);
          
          // Invalidate the alert
          await invalidateAlert(alert.id);
          
          // Verify cache returns null after invalidation
          const afterInvalidation = await getAlert(alert.id);
          expect(afterInvalidation).toBeNull();
          
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should invalidate active alerts list when a single alert is invalidated', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(alertArb, { minLength: 1, maxLength: 10 }),
          async (alerts) => {
            // Cache the active alerts list
            await cacheActiveAlerts(alerts);
            
            // Verify it's cached
            const cachedAlerts = await getActiveAlerts();
            expect(cachedAlerts).not.toBeNull();
            expect(cachedAlerts?.length).toBe(alerts.length);
            
            // Invalidate a single alert (which should also invalidate the list)
            await invalidateAlert(alerts[0].id);
            
            // Verify active alerts list is also invalidated
            const afterInvalidation = await getActiveAlerts();
            expect(afterInvalidation).toBeNull();
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow re-caching after invalidation with new data', async () => {
      await fc.assert(
        fc.asyncProperty(alertArb, alertArb, async (originalAlert, updatedAlert) => {
          // Use the same ID for both
          const alertId = originalAlert.id;
          updatedAlert = { ...updatedAlert, id: alertId };
          
          // Cache original alert
          await cacheAlert(originalAlert);
          
          // Invalidate
          await invalidateAlert(alertId);
          
          // Cache updated alert
          await cacheAlert(updatedAlert);
          
          // Verify we get the updated data
          const cachedAlert = await getAlert(alertId);
          expect(cachedAlert).not.toBeNull();
          expect(cachedAlert?.aiSummary).toBe(updatedAlert.aiSummary);
          
          return true;
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Bulk Invalidation', () => {
    it('should invalidate all caches when invalidateAll is called', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(reportArb, { minLength: 1, maxLength: 5 }),
          fc.array(alertArb, { minLength: 1, maxLength: 5 }),
          async (reports, alerts) => {
            // Cache reports and alerts
            await cacheRecentReports(reports);
            await cacheActiveAlerts(alerts);
            
            for (const report of reports) {
              await cacheReport(report);
            }
            for (const alert of alerts) {
              await cacheAlert(alert);
            }
            
            // Verify caches are populated
            expect(await getRecentReports()).not.toBeNull();
            expect(await getActiveAlerts()).not.toBeNull();
            
            // Invalidate all
            await invalidateAll();
            
            // Verify all caches are cleared
            expect(await getRecentReports()).toBeNull();
            expect(await getActiveAlerts()).toBeNull();
            
            for (const report of reports) {
              expect(await getReport(report.id)).toBeNull();
            }
            for (const alert of alerts) {
              expect(await getAlert(alert.id)).toBeNull();
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
