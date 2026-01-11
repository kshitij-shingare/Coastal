"use strict";
/**
 * Property-Based Test for Alert Deduplication
 *
 * Feature: coastal-hazards-merge, Property 11: Alert Deduplication
 *
 * Property: For any incident (defined by location and time window), at most one
 * active alert SHALL exist at any time.
 *
 * **Validates: Requirements 8.5**
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
const uuid_1 = require("uuid");
// Valid source types
const SOURCE_TYPES = ['citizen', 'social', 'official'];
// Valid hazard types
const HAZARD_TYPES = [
    'flooding', 'storm_surge', 'high_waves', 'erosion',
    'rip_current', 'tsunami', 'pollution', 'other'
];
// Valid severity levels
const SEVERITY_LEVELS = ['low', 'moderate', 'high'];
// Valid report statuses
const REPORT_STATUSES = ['pending', 'verified', 'rejected'];
// Valid alert statuses
const ALERT_STATUSES = ['active', 'verified', 'resolved', 'false_alarm'];
// Clustering configuration (matching fusion-engine.ts)
const CLUSTERING_CONFIG = {
    spatialRadiusKm: 10,
    temporalWindowHours: 24,
    deduplicationWindowHours: 48,
};
/**
 * Calculate Haversine distance between two points in km
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
/**
 * Check if two alerts represent the same incident
 * (same hazard type, same region, within temporal window)
 */
function alertsRepresentSameIncident(alert1, alert2) {
    // Must be same hazard type
    if (alert1.hazardType !== alert2.hazardType)
        return false;
    // Must be same region
    if (alert1.region.name !== alert2.region.name)
        return false;
    // Must be within temporal window
    const time1 = new Date(alert1.timestamp).getTime();
    const time2 = new Date(alert2.timestamp).getTime();
    const hoursDiff = Math.abs(time1 - time2) / (1000 * 60 * 60);
    return hoursDiff <= CLUSTERING_CONFIG.deduplicationWindowHours;
}
/**
 * Arbitrary for generating a valid GeoLocation within a small area
 */
const geoLocationArb = (baseLat, baseLng, spreadKm = 5) => {
    const degPerKm = 0.009;
    const spread = spreadKm * degPerKm;
    return fc.record({
        latitude: fc.double({ min: baseLat - spread, max: baseLat + spread, noNaN: true }),
        longitude: fc.double({ min: baseLng - spread, max: baseLng + spread, noNaN: true }),
        accuracy: fc.option(fc.double({ min: 1, max: 100, noNaN: true }), { nil: undefined }),
        address: fc.option(fc.string({ minLength: 5, maxLength: 100 }), { nil: undefined }),
    });
};
/**
 * Arbitrary for generating a valid Report
 */
const reportArb = (hazardType, region, baseTimestamp, baseLat, baseLng) => {
    return fc.record({
        id: fc.uuid(),
        timestamp: fc.date({
            min: new Date(baseTimestamp.getTime() - 3600000),
            max: new Date(baseTimestamp.getTime() + 3600000)
        }),
        location: geoLocationArb(baseLat, baseLng),
        source: fc.constantFrom(...SOURCE_TYPES),
        content: fc.record({
            originalText: fc.string({ minLength: 10, maxLength: 200 }),
            translatedText: fc.option(fc.string({ minLength: 10, maxLength: 200 }), { nil: undefined }),
            language: fc.constantFrom('en', 'es', 'fr', 'de'),
            mediaFiles: fc.constant(undefined),
        }),
        classification: fc.record({
            hazardType: fc.constant(hazardType),
            severity: fc.constantFrom(...SEVERITY_LEVELS),
            confidence: fc.double({ min: 40, max: 100, noNaN: true }),
        }),
        status: fc.constant('pending'),
        region: fc.constant(region),
        aiSummary: fc.option(fc.string({ minLength: 20, maxLength: 200 }), { nil: undefined }),
        metadata: fc.record({
            deviceInfo: fc.option(fc.string({ minLength: 5, maxLength: 50 }), { nil: undefined }),
            ipAddress: fc.option(fc.ipV4(), { nil: undefined }),
            userAgent: fc.option(fc.string({ minLength: 10, maxLength: 100 }), { nil: undefined }),
        }),
        createdAt: fc.date(),
        updatedAt: fc.date(),
    });
};
/**
 * Arbitrary for generating a valid Alert
 */
const alertArb = (hazardType, region, baseTimestamp, baseLat, baseLng) => {
    return fc.record({
        id: fc.uuid(),
        incidentId: fc.option(fc.uuid(), { nil: undefined }),
        timestamp: fc.date({
            min: new Date(baseTimestamp.getTime() - CLUSTERING_CONFIG.deduplicationWindowHours * 3600000 / 2),
            max: new Date(baseTimestamp.getTime() + CLUSTERING_CONFIG.deduplicationWindowHours * 3600000 / 2)
        }),
        region: fc.record({
            name: fc.constant(region),
            bounds: fc.constant({
                type: 'Polygon',
                coordinates: [[
                        [baseLng - 0.1, baseLat - 0.1],
                        [baseLng + 0.1, baseLat - 0.1],
                        [baseLng + 0.1, baseLat + 0.1],
                        [baseLng - 0.1, baseLat + 0.1],
                        [baseLng - 0.1, baseLat - 0.1],
                    ]],
            }),
            affectedPopulation: fc.integer({ min: 0, max: 100000 }),
        }),
        hazardType: fc.constant(hazardType),
        severity: fc.constantFrom(...SEVERITY_LEVELS),
        confidence: fc.double({ min: 40, max: 100, noNaN: true }),
        escalationReason: fc.record({
            reportCount: fc.integer({ min: 2, max: 20 }),
            sourceTypes: fc.array(fc.constantFrom(...SOURCE_TYPES), { minLength: 1, maxLength: 3 }),
            timeWindow: fc.constant('24 hours'),
            geographicSpread: fc.double({ min: 1, max: 10, noNaN: true }),
            thresholdsMet: fc.constant(['minimum_reports', 'confidence_threshold']),
            reasoning: fc.string({ minLength: 20, maxLength: 200 }),
        }),
        relatedReports: fc.array(fc.uuid(), { minLength: 2, maxLength: 10 }),
        status: fc.constant('active'),
        aiSummary: fc.string({ minLength: 20, maxLength: 200 }),
        createdAt: fc.date(),
        updatedAt: fc.date(),
    });
};
/**
 * Simulates the deduplication logic from fusion-engine.ts
 * Returns true if a new alert should be created, false if it should be deduplicated
 */
function shouldCreateNewAlert(existingAlerts, newAlertCandidate) {
    for (const existing of existingAlerts) {
        // Only consider active alerts for deduplication
        if (existing.status !== 'active')
            continue;
        // Check if same hazard type
        if (existing.hazardType !== newAlertCandidate.hazardType)
            continue;
        // Check if same region
        if (existing.region.name !== newAlertCandidate.region)
            continue;
        // Check temporal overlap
        const existingTime = new Date(existing.timestamp).getTime();
        const newTime = newAlertCandidate.timestamp.getTime();
        const hoursDiff = Math.abs(existingTime - newTime) / (1000 * 60 * 60);
        if (hoursDiff <= CLUSTERING_CONFIG.deduplicationWindowHours) {
            return false; // Should deduplicate (update existing)
        }
    }
    return true; // No matching alert, create new
}
/**
 * Simulates processing multiple report clusters and generating alerts
 * with deduplication logic
 */
function processReportClustersWithDeduplication(clusters) {
    const alerts = [];
    for (const cluster of clusters) {
        if (shouldCreateNewAlert(alerts, cluster)) {
            // Create new alert
            const newAlert = {
                id: (0, uuid_1.v4)(),
                timestamp: cluster.timestamp,
                region: {
                    name: cluster.region,
                    bounds: { type: 'Polygon', coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]] },
                    affectedPopulation: 0,
                },
                hazardType: cluster.hazardType,
                severity: 'moderate',
                confidence: 60,
                escalationReason: {
                    reportCount: cluster.reportIds.length,
                    sourceTypes: ['citizen'],
                    timeWindow: '24 hours',
                    geographicSpread: 5,
                    thresholdsMet: ['minimum_reports'],
                    reasoning: 'Test alert',
                },
                relatedReports: cluster.reportIds,
                status: 'active',
                aiSummary: 'Test summary',
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            alerts.push(newAlert);
        }
        else {
            // Find and update existing alert
            const existingAlert = alerts.find(a => a.status === 'active' &&
                a.hazardType === cluster.hazardType &&
                a.region.name === cluster.region);
            if (existingAlert) {
                existingAlert.relatedReports = [
                    ...new Set([...existingAlert.relatedReports, ...cluster.reportIds])
                ];
                existingAlert.updatedAt = new Date();
            }
        }
    }
    return alerts;
}
describe('Property 11: Alert Deduplication', () => {
    // Feature: coastal-hazards-merge, Property 11: Alert Deduplication
    // **Validates: Requirements 8.5**
    const baseTimestamp = new Date();
    const baseLat = 25.7617;
    const baseLng = -80.1918;
    it('should have at most one active alert per incident (same hazard type, region, and time window)', () => {
        fc.assert(fc.property(
        // Generate a hazard type and region for the incident
        fc.constantFrom(...HAZARD_TYPES), fc.constantFrom('North Coast', 'South Beach', 'East Harbor', 'West Bay'), 
        // Generate multiple clusters for the same incident
        fc.integer({ min: 2, max: 5 }), (hazardType, region, clusterCount) => {
            // Create multiple clusters that should be deduplicated
            const clusters = Array.from({ length: clusterCount }, (_, i) => ({
                hazardType,
                region,
                timestamp: new Date(baseTimestamp.getTime() + i * 3600000), // 1 hour apart
                reportIds: [(0, uuid_1.v4)(), (0, uuid_1.v4)()],
            }));
            // Process clusters with deduplication
            const alerts = processReportClustersWithDeduplication(clusters);
            // Count active alerts for this incident
            const activeAlertsForIncident = alerts.filter(a => a.status === 'active' &&
                a.hazardType === hazardType &&
                a.region.name === region);
            // Property: At most one active alert per incident
            expect(activeAlertsForIncident.length).toBeLessThanOrEqual(1);
            return true;
        }), { numRuns: 100 });
    });
    it('should allow separate alerts for different hazard types in the same region', () => {
        fc.assert(fc.property(fc.constantFrom('North Coast', 'South Beach', 'East Harbor', 'West Bay'), fc.array(fc.constantFrom(...HAZARD_TYPES), { minLength: 2, maxLength: 4 }), (region, hazardTypes) => {
            // Get unique hazard types
            const uniqueHazardTypes = [...new Set(hazardTypes)];
            // Create one cluster per hazard type
            const clusters = uniqueHazardTypes.map(hazardType => ({
                hazardType,
                region,
                timestamp: baseTimestamp,
                reportIds: [(0, uuid_1.v4)(), (0, uuid_1.v4)()],
            }));
            // Process clusters
            const alerts = processReportClustersWithDeduplication(clusters);
            // Should have one alert per unique hazard type
            const activeAlerts = alerts.filter(a => a.status === 'active');
            expect(activeAlerts.length).toBe(uniqueHazardTypes.length);
            // Each hazard type should have exactly one alert
            for (const hazardType of uniqueHazardTypes) {
                const alertsForType = activeAlerts.filter(a => a.hazardType === hazardType);
                expect(alertsForType.length).toBe(1);
            }
            return true;
        }), { numRuns: 100 });
    });
    it('should allow separate alerts for different regions with the same hazard type', () => {
        fc.assert(fc.property(fc.constantFrom(...HAZARD_TYPES), fc.array(fc.constantFrom('North Coast', 'South Beach', 'East Harbor', 'West Bay'), { minLength: 2, maxLength: 4 }), (hazardType, regions) => {
            // Get unique regions
            const uniqueRegions = [...new Set(regions)];
            // Create one cluster per region
            const clusters = uniqueRegions.map(region => ({
                hazardType,
                region,
                timestamp: baseTimestamp,
                reportIds: [(0, uuid_1.v4)(), (0, uuid_1.v4)()],
            }));
            // Process clusters
            const alerts = processReportClustersWithDeduplication(clusters);
            // Should have one alert per unique region
            const activeAlerts = alerts.filter(a => a.status === 'active');
            expect(activeAlerts.length).toBe(uniqueRegions.length);
            // Each region should have exactly one alert
            for (const region of uniqueRegions) {
                const alertsForRegion = activeAlerts.filter(a => a.region.name === region);
                expect(alertsForRegion.length).toBe(1);
            }
            return true;
        }), { numRuns: 100 });
    });
    it('should allow new alert after deduplication window expires', () => {
        fc.assert(fc.property(fc.constantFrom(...HAZARD_TYPES), fc.constantFrom('North Coast', 'South Beach', 'East Harbor', 'West Bay'), (hazardType, region) => {
            // Create first cluster
            const cluster1 = {
                hazardType,
                region,
                timestamp: baseTimestamp,
                reportIds: [(0, uuid_1.v4)(), (0, uuid_1.v4)()],
            };
            // Create second cluster outside deduplication window (49 hours later)
            const cluster2 = {
                hazardType,
                region,
                timestamp: new Date(baseTimestamp.getTime() + 49 * 3600000),
                reportIds: [(0, uuid_1.v4)(), (0, uuid_1.v4)()],
            };
            // Process clusters
            const alerts = processReportClustersWithDeduplication([cluster1, cluster2]);
            // Should have two separate alerts (outside deduplication window)
            const activeAlerts = alerts.filter(a => a.status === 'active' &&
                a.hazardType === hazardType &&
                a.region.name === region);
            expect(activeAlerts.length).toBe(2);
            return true;
        }), { numRuns: 100 });
    });
    it('should merge related reports when deduplicating alerts', () => {
        fc.assert(fc.property(fc.constantFrom(...HAZARD_TYPES), fc.constantFrom('North Coast', 'South Beach', 'East Harbor', 'West Bay'), fc.integer({ min: 2, max: 5 }), (hazardType, region, clusterCount) => {
            // Create multiple clusters with unique report IDs
            const allReportIds = [];
            const clusters = Array.from({ length: clusterCount }, (_, i) => {
                const reportIds = [(0, uuid_1.v4)(), (0, uuid_1.v4)()];
                allReportIds.push(...reportIds);
                return {
                    hazardType,
                    region,
                    timestamp: new Date(baseTimestamp.getTime() + i * 3600000),
                    reportIds,
                };
            });
            // Process clusters
            const alerts = processReportClustersWithDeduplication(clusters);
            // Should have exactly one active alert
            const activeAlerts = alerts.filter(a => a.status === 'active' &&
                a.hazardType === hazardType &&
                a.region.name === region);
            expect(activeAlerts.length).toBe(1);
            // The single alert should contain all report IDs
            const alert = activeAlerts[0];
            const uniqueReportIds = new Set(allReportIds);
            for (const reportId of uniqueReportIds) {
                expect(alert.relatedReports).toContain(reportId);
            }
            return true;
        }), { numRuns: 100 });
    });
    it('should correctly identify same incident based on all criteria', () => {
        fc.assert(fc.property(
        // Generate two alerts
        fc.constantFrom(...HAZARD_TYPES), fc.constantFrom(...HAZARD_TYPES), fc.constantFrom('North Coast', 'South Beach', 'East Harbor', 'West Bay'), fc.constantFrom('North Coast', 'South Beach', 'East Harbor', 'West Bay'), fc.integer({ min: 0, max: 100 }), // hours apart
        (hazardType1, hazardType2, region1, region2, hoursDiff) => {
            const alert1 = {
                id: (0, uuid_1.v4)(),
                timestamp: baseTimestamp,
                region: {
                    name: region1,
                    bounds: { type: 'Polygon', coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]] },
                    affectedPopulation: 0,
                },
                hazardType: hazardType1,
                severity: 'moderate',
                confidence: 60,
                escalationReason: {
                    reportCount: 2,
                    sourceTypes: ['citizen'],
                    timeWindow: '24 hours',
                    geographicSpread: 5,
                    thresholdsMet: ['minimum_reports'],
                    reasoning: 'Test',
                },
                relatedReports: [(0, uuid_1.v4)()],
                status: 'active',
                aiSummary: 'Test',
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            const alert2 = {
                ...alert1,
                id: (0, uuid_1.v4)(),
                timestamp: new Date(baseTimestamp.getTime() + hoursDiff * 3600000),
                region: { ...alert1.region, name: region2 },
                hazardType: hazardType2,
            };
            const isSameIncident = alertsRepresentSameIncident(alert1, alert2);
            // Should be same incident only if all criteria match
            const expectedSameIncident = hazardType1 === hazardType2 &&
                region1 === region2 &&
                hoursDiff <= CLUSTERING_CONFIG.deduplicationWindowHours;
            expect(isSameIncident).toBe(expectedSameIncident);
            return true;
        }), { numRuns: 100 });
    });
    it('should not deduplicate resolved or false_alarm alerts', () => {
        fc.assert(fc.property(fc.constantFrom(...HAZARD_TYPES), fc.constantFrom('North Coast', 'South Beach', 'East Harbor', 'West Bay'), fc.constantFrom('resolved', 'false_alarm'), (hazardType, region, inactiveStatus) => {
            // Create an existing "inactive" alert
            const existingAlerts = [{
                    id: (0, uuid_1.v4)(),
                    timestamp: baseTimestamp,
                    region: {
                        name: region,
                        bounds: { type: 'Polygon', coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]] },
                        affectedPopulation: 0,
                    },
                    hazardType,
                    severity: 'moderate',
                    confidence: 60,
                    escalationReason: {
                        reportCount: 2,
                        sourceTypes: ['citizen'],
                        timeWindow: '24 hours',
                        geographicSpread: 5,
                        thresholdsMet: ['minimum_reports'],
                        reasoning: 'Test',
                    },
                    relatedReports: [(0, uuid_1.v4)()],
                    status: inactiveStatus,
                    aiSummary: 'Test',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }];
            // New alert candidate for same incident
            const newCandidate = {
                hazardType,
                region,
                timestamp: new Date(baseTimestamp.getTime() + 3600000), // 1 hour later
            };
            // Should create new alert (not deduplicate with resolved/false_alarm)
            const shouldCreate = shouldCreateNewAlert(existingAlerts, newCandidate);
            expect(shouldCreate).toBe(true);
            return true;
        }), { numRuns: 100 });
    });
});
//# sourceMappingURL=alert-deduplication.test.js.map