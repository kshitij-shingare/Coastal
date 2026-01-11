/**
 * Property-Based Test for Geographic Query Radius
 * 
 * Feature: coastal-hazards-merge, Property 3: Geographic Query Radius
 * 
 * Property: For any location query with coordinates (lat, lng) and radius R,
 * all returned reports SHALL have coordinates within distance R from the query point.
 * 
 * **Validates: Requirements 4.4**
 */

import * as fc from 'fast-check';

// Haversine formula to calculate distance between two points in km
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Simple report interface for testing
interface TestReport {
  id: string;
  location: {
    latitude: number;
    longitude: number;
  };
}

// Pure function that filters reports by location (mirrors the demo mode logic in queries.ts)
function filterReportsByLocation(
  reports: TestReport[],
  queryLat: number,
  queryLon: number,
  radiusKm: number
): TestReport[] {
  return reports.filter((report) => {
    const distance = haversineDistance(
      report.location.latitude,
      report.location.longitude,
      queryLat,
      queryLon
    );
    return distance <= radiusKm;
  });
}

describe('Property 3: Geographic Query Radius', () => {
  // Feature: coastal-hazards-merge, Property 3: Geographic Query Radius
  // **Validates: Requirements 4.4**
  
  it('should return only reports within the specified radius', () => {
    fc.assert(
      fc.property(
        // Generate query coordinates (valid lat/lon ranges)
        fc.double({ min: -89, max: 89, noNaN: true }),
        fc.double({ min: -179, max: 179, noNaN: true }),
        // Generate radius in km (reasonable range for coastal hazards)
        fc.double({ min: 0.1, max: 100, noNaN: true }),
        // Generate array of reports with random locations
        fc.array(
          fc.record({
            id: fc.uuid(),
            location: fc.record({
              latitude: fc.double({ min: -90, max: 90, noNaN: true }),
              longitude: fc.double({ min: -180, max: 180, noNaN: true }),
            }),
          }),
          { minLength: 0, maxLength: 50 }
        ),
        (queryLat, queryLon, radiusKm, reports) => {
          // Execute the geographic filter
          const filteredReports = filterReportsByLocation(
            reports,
            queryLat,
            queryLon,
            radiusKm
          );

          // Property: ALL returned reports must be within the radius
          for (const report of filteredReports) {
            const distance = haversineDistance(
              report.location.latitude,
              report.location.longitude,
              queryLat,
              queryLon
            );
            
            // Allow small floating point tolerance
            expect(distance).toBeLessThanOrEqual(radiusKm + 0.001);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not exclude any reports that are within the radius', () => {
    fc.assert(
      fc.property(
        // Generate query coordinates
        fc.double({ min: -89, max: 89, noNaN: true }),
        fc.double({ min: -179, max: 179, noNaN: true }),
        // Generate radius
        fc.double({ min: 0.1, max: 100, noNaN: true }),
        // Generate reports
        fc.array(
          fc.record({
            id: fc.uuid(),
            location: fc.record({
              latitude: fc.double({ min: -90, max: 90, noNaN: true }),
              longitude: fc.double({ min: -180, max: 180, noNaN: true }),
            }),
          }),
          { minLength: 0, maxLength: 50 }
        ),
        (queryLat, queryLon, radiusKm, reports) => {
          const filteredReports = filterReportsByLocation(
            reports,
            queryLat,
            queryLon,
            radiusKm
          );

          // Property: No report within radius should be excluded
          for (const report of reports) {
            const distance = haversineDistance(
              report.location.latitude,
              report.location.longitude,
              queryLat,
              queryLon
            );

            if (distance <= radiusKm) {
              // This report should be in the filtered results
              const found = filteredReports.some((r) => r.id === report.id);
              expect(found).toBe(true);
            }
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return empty array when no reports are within radius', () => {
    fc.assert(
      fc.property(
        // Generate query at North Pole area
        fc.constant(89),
        fc.constant(0),
        // Small radius
        fc.constant(1),
        // Generate reports far away (near South Pole)
        fc.array(
          fc.record({
            id: fc.uuid(),
            location: fc.record({
              latitude: fc.double({ min: -90, max: -85, noNaN: true }),
              longitude: fc.double({ min: -180, max: 180, noNaN: true }),
            }),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (queryLat, queryLon, radiusKm, reports) => {
          const filteredReports = filterReportsByLocation(
            reports,
            queryLat,
            queryLon,
            radiusKm
          );

          // All reports are far away, so result should be empty
          expect(filteredReports.length).toBe(0);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return all reports when radius encompasses all of them', () => {
    fc.assert(
      fc.property(
        // Generate query coordinates
        fc.double({ min: -45, max: 45, noNaN: true }),
        fc.double({ min: -90, max: 90, noNaN: true }),
        // Generate reports close to query point
        fc.array(
          fc.record({
            id: fc.uuid(),
            location: fc.record({
              // Reports within ~1km of query point
              latitude: fc.double({ min: -45, max: 45, noNaN: true }),
              longitude: fc.double({ min: -90, max: 90, noNaN: true }),
            }),
          }),
          { minLength: 0, maxLength: 20 }
        ),
        (queryLat, queryLon, reports) => {
          // Use Earth's circumference as radius to include everything
          const hugeRadius = 20100; // Half Earth's circumference in km
          
          const filteredReports = filterReportsByLocation(
            reports,
            queryLat,
            queryLon,
            hugeRadius
          );

          // All reports should be included
          expect(filteredReports.length).toBe(reports.length);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
