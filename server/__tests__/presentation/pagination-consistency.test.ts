/**
 * Property-Based Test for Pagination Consistency
 * 
 * Feature: coastal-hazards-merge, Property 2: Pagination Consistency
 * 
 * Property: For any paginated API endpoint and any page number within the valid range,
 * requesting page N and then page N+1 SHALL return non-overlapping results,
 * and the total count SHALL remain consistent across requests.
 * 
 * **Validates: Requirements 4.2, 5.1**
 */

import * as fc from 'fast-check';
import { Report, HazardType, SeverityLevel, SourceType, ReportStatus } from '../../../shared/types/report';
import { Alert, AlertStatus } from '../../../shared/types/alert';

// ============================================================================
// Test Data Generators
// ============================================================================

const hazardTypeArb = fc.constantFrom<HazardType>(
  'flooding', 'storm_surge', 'high_waves', 'erosion', 'rip_current', 'tsunami', 'pollution', 'other'
);

const severityLevelArb = fc.constantFrom<SeverityLevel>('low', 'moderate', 'high');
const sourceTypeArb = fc.constantFrom<SourceType>('citizen', 'social', 'official');
const reportStatusArb = fc.constantFrom<ReportStatus>('pending', 'verified', 'rejected');
const alertStatusArb = fc.constantFrom<AlertStatus>('active', 'verified', 'resolved', 'false_alarm');

// Generate a valid report
const reportArb: fc.Arbitrary<Report> = fc.record({
  id: fc.uuid(),
  timestamp: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
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
  region: fc.constantFrom('North Coast', 'South Coast', 'East Coast', 'West Coast', 'Central'),
  aiSummary: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined }),
  metadata: fc.record({
    deviceInfo: fc.option(fc.string(), { nil: undefined }),
    ipAddress: fc.option(fc.string(), { nil: undefined }),
    userAgent: fc.option(fc.string(), { nil: undefined }),
  }),
  createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
  updatedAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
});

// Generate a valid alert
const alertArb: fc.Arbitrary<Alert> = fc.record({
  id: fc.uuid(),
  incidentId: fc.option(fc.uuid(), { nil: undefined }),
  timestamp: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
  region: fc.record({
    name: fc.constantFrom('North Coast', 'South Coast', 'East Coast', 'West Coast', 'Central'),
    bounds: fc.constant({ type: 'Polygon' as const, coordinates: [] }),
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
    thresholdsMet: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 0, maxLength: 5 }),
    reasoning: fc.string({ minLength: 1, maxLength: 200 }),
  }),
  relatedReports: fc.array(fc.uuid(), { minLength: 0, maxLength: 10 }),
  status: alertStatusArb,
  aiSummary: fc.string({ minLength: 1, maxLength: 200 }),
  createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
  updatedAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
});

// ============================================================================
// Pure Pagination Functions (mirrors demo mode logic in queries.ts)
// ============================================================================

interface PaginationResult<T> {
  items: T[];
  total: number;
}

interface ReportFilters {
  status?: ReportStatus;
  hazardType?: HazardType;
  severity?: SeverityLevel;
  region?: string;
}

interface AlertFilters {
  status?: AlertStatus;
  hazardType?: HazardType;
  severity?: SeverityLevel;
  region?: string;
  minConfidence?: number;
}

/**
 * Pure pagination function for reports (mirrors getReportsPaginated demo mode)
 */
function paginateReports(
  allReports: Report[],
  page: number,
  limit: number,
  filters?: ReportFilters
): PaginationResult<Report> {
  // Apply filters
  let filtered = [...allReports];
  
  if (filters?.status) {
    filtered = filtered.filter(r => r.status === filters.status);
  }
  if (filters?.hazardType) {
    filtered = filtered.filter(r => r.classification.hazardType === filters.hazardType);
  }
  if (filters?.severity) {
    filtered = filtered.filter(r => r.classification.severity === filters.severity);
  }
  if (filters?.region) {
    filtered = filtered.filter(r => r.region.toLowerCase().includes(filters.region!.toLowerCase()));
  }

  // Sort by timestamp descending (consistent ordering)
  filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  // Calculate pagination
  const start = (page - 1) * limit;
  const items = filtered.slice(start, start + limit);

  return {
    items,
    total: filtered.length,
  };
}

/**
 * Pure pagination function for alerts (mirrors getAlertsPaginated demo mode)
 */
function paginateAlerts(
  allAlerts: Alert[],
  page: number,
  limit: number,
  filters?: AlertFilters
): PaginationResult<Alert> {
  // Apply filters
  let filtered = [...allAlerts];
  
  if (filters?.status) {
    filtered = filtered.filter(a => a.status === filters.status);
  }
  if (filters?.hazardType) {
    filtered = filtered.filter(a => a.hazardType === filters.hazardType);
  }
  if (filters?.severity) {
    filtered = filtered.filter(a => a.severity === filters.severity);
  }
  if (filters?.region) {
    filtered = filtered.filter(a => a.region.name.toLowerCase().includes(filters.region!.toLowerCase()));
  }
  if (filters?.minConfidence !== undefined) {
    filtered = filtered.filter(a => a.confidence >= filters.minConfidence!);
  }

  // Sort by confidence desc, then timestamp desc (consistent ordering)
  filtered.sort((a, b) => {
    if (b.confidence !== a.confidence) {
      return b.confidence - a.confidence;
    }
    return b.timestamp.getTime() - a.timestamp.getTime();
  });

  // Calculate pagination
  const start = (page - 1) * limit;
  const items = filtered.slice(start, start + limit);

  return {
    items,
    total: filtered.length,
  };
}

// ============================================================================
// Property Tests
// ============================================================================

describe('Property 2: Pagination Consistency', () => {
  // Feature: coastal-hazards-merge, Property 2: Pagination Consistency
  // **Validates: Requirements 4.2, 5.1**

  describe('Reports Pagination', () => {
    it('should return non-overlapping results between consecutive pages', () => {
      fc.assert(
        fc.property(
          // Generate array of reports
          fc.array(reportArb, { minLength: 1, maxLength: 100 }),
          // Generate page size (limit)
          fc.integer({ min: 1, max: 20 }),
          // Generate starting page number
          fc.integer({ min: 1, max: 10 }),
          (reports, limit, startPage) => {
            // Get results for page N
            const pageN = paginateReports(reports, startPage, limit);
            
            // Calculate if there's a next page
            const totalPages = Math.ceil(pageN.total / limit);
            if (startPage >= totalPages) {
              // No next page to compare, property trivially holds
              return true;
            }

            // Get results for page N+1
            const pageNPlus1 = paginateReports(reports, startPage + 1, limit);

            // Property: No item should appear in both pages
            const pageNIds = new Set(pageN.items.map(r => r.id));
            const pageNPlus1Ids = new Set(pageNPlus1.items.map(r => r.id));

            for (const id of pageNPlus1Ids) {
              expect(pageNIds.has(id)).toBe(false);
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain consistent total count across page requests', () => {
      fc.assert(
        fc.property(
          // Generate array of reports
          fc.array(reportArb, { minLength: 0, maxLength: 100 }),
          // Generate page size
          fc.integer({ min: 1, max: 20 }),
          // Generate two different page numbers
          fc.integer({ min: 1, max: 10 }),
          fc.integer({ min: 1, max: 10 }),
          (reports, limit, page1, page2) => {
            const result1 = paginateReports(reports, page1, limit);
            const result2 = paginateReports(reports, page2, limit);

            // Property: Total count should be the same regardless of page requested
            expect(result1.total).toBe(result2.total);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return correct number of items per page', () => {
      fc.assert(
        fc.property(
          fc.array(reportArb, { minLength: 0, maxLength: 100 }),
          fc.integer({ min: 1, max: 20 }),
          fc.integer({ min: 1, max: 10 }),
          (reports, limit, page) => {
            const result = paginateReports(reports, page, limit);
            const totalPages = Math.ceil(result.total / limit);

            if (page > totalPages) {
              // Page beyond total pages should return empty
              expect(result.items.length).toBe(0);
            } else if (page === totalPages && result.total % limit !== 0) {
              // Last page may have fewer items
              expect(result.items.length).toBe(result.total % limit);
            } else if (page <= totalPages) {
              // Full page
              expect(result.items.length).toBe(Math.min(limit, result.total));
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain consistent total when filters are applied', () => {
      fc.assert(
        fc.property(
          fc.array(reportArb, { minLength: 0, maxLength: 100 }),
          fc.integer({ min: 1, max: 20 }),
          fc.integer({ min: 1, max: 5 }),
          fc.integer({ min: 1, max: 5 }),
          reportStatusArb,
          (reports, limit, page1, page2, statusFilter) => {
            const filters: ReportFilters = { status: statusFilter };
            
            const result1 = paginateReports(reports, page1, limit, filters);
            const result2 = paginateReports(reports, page2, limit, filters);

            // Property: Total count should be consistent with same filters
            expect(result1.total).toBe(result2.total);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should cover all items when iterating through all pages', () => {
      fc.assert(
        fc.property(
          fc.array(reportArb, { minLength: 1, maxLength: 50 }),
          fc.integer({ min: 1, max: 10 }),
          (reports, limit) => {
            const firstPageResult = paginateReports(reports, 1, limit);
            const totalPages = Math.ceil(firstPageResult.total / limit);
            
            // Collect all items from all pages
            const allCollectedIds = new Set<string>();
            
            for (let page = 1; page <= totalPages; page++) {
              const result = paginateReports(reports, page, limit);
              for (const item of result.items) {
                allCollectedIds.add(item.id);
              }
            }

            // Property: All items should be covered exactly once
            expect(allCollectedIds.size).toBe(firstPageResult.total);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Alerts Pagination', () => {
    it('should return non-overlapping results between consecutive pages', () => {
      fc.assert(
        fc.property(
          fc.array(alertArb, { minLength: 1, maxLength: 100 }),
          fc.integer({ min: 1, max: 20 }),
          fc.integer({ min: 1, max: 10 }),
          (alerts, limit, startPage) => {
            const pageN = paginateAlerts(alerts, startPage, limit);
            const totalPages = Math.ceil(pageN.total / limit);
            
            if (startPage >= totalPages) {
              return true;
            }

            const pageNPlus1 = paginateAlerts(alerts, startPage + 1, limit);

            // Property: No item should appear in both pages
            const pageNIds = new Set(pageN.items.map(a => a.id));
            const pageNPlus1Ids = new Set(pageNPlus1.items.map(a => a.id));

            for (const id of pageNPlus1Ids) {
              expect(pageNIds.has(id)).toBe(false);
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain consistent total count across page requests', () => {
      fc.assert(
        fc.property(
          fc.array(alertArb, { minLength: 0, maxLength: 100 }),
          fc.integer({ min: 1, max: 20 }),
          fc.integer({ min: 1, max: 10 }),
          fc.integer({ min: 1, max: 10 }),
          (alerts, limit, page1, page2) => {
            const result1 = paginateAlerts(alerts, page1, limit);
            const result2 = paginateAlerts(alerts, page2, limit);

            // Property: Total count should be the same
            expect(result1.total).toBe(result2.total);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain consistent total when filters are applied', () => {
      fc.assert(
        fc.property(
          fc.array(alertArb, { minLength: 0, maxLength: 100 }),
          fc.integer({ min: 1, max: 20 }),
          fc.integer({ min: 1, max: 5 }),
          fc.integer({ min: 1, max: 5 }),
          alertStatusArb,
          (alerts, limit, page1, page2, statusFilter) => {
            const filters: AlertFilters = { status: statusFilter };
            
            const result1 = paginateAlerts(alerts, page1, limit, filters);
            const result2 = paginateAlerts(alerts, page2, limit, filters);

            // Property: Total count should be consistent with same filters
            expect(result1.total).toBe(result2.total);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should cover all items when iterating through all pages', () => {
      fc.assert(
        fc.property(
          fc.array(alertArb, { minLength: 1, maxLength: 50 }),
          fc.integer({ min: 1, max: 10 }),
          (alerts, limit) => {
            const firstPageResult = paginateAlerts(alerts, 1, limit);
            const totalPages = Math.ceil(firstPageResult.total / limit);
            
            const allCollectedIds = new Set<string>();
            
            for (let page = 1; page <= totalPages; page++) {
              const result = paginateAlerts(alerts, page, limit);
              for (const item of result.items) {
                allCollectedIds.add(item.id);
              }
            }

            // Property: All items should be covered exactly once
            expect(allCollectedIds.size).toBe(firstPageResult.total);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should filter by minConfidence correctly across pages', () => {
      fc.assert(
        fc.property(
          fc.array(alertArb, { minLength: 1, maxLength: 50 }),
          fc.integer({ min: 1, max: 10 }),
          fc.double({ min: 0, max: 100, noNaN: true }),
          (alerts, limit, minConfidence) => {
            const filters: AlertFilters = { minConfidence };
            const result = paginateAlerts(alerts, 1, limit, filters);

            // Property: All returned items should have confidence >= minConfidence
            for (const alert of result.items) {
              expect(alert.confidence).toBeGreaterThanOrEqual(minConfidence);
            }

            // Property: Total should match count of alerts meeting criteria
            const expectedTotal = alerts.filter(a => a.confidence >= minConfidence).length;
            expect(result.total).toBe(expectedTotal);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
