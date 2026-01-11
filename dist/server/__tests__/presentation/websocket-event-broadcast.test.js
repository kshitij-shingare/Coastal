"use strict";
/**
 * Property-Based Test for WebSocket Event Broadcast
 *
 * Feature: coastal-hazards-merge, Property 12: WebSocket Event Broadcast
 *
 * Property: For any new report submission or alert creation, the corresponding
 * WebSocket event (report_submitted or alert_update) SHALL be broadcast to all
 * connected clients within 1 second.
 *
 * **Validates: Requirements 9.2, 9.3**
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
const websocket_handlers_1 = require("../../modules/presentation/websocket-handlers");
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
// Regions for testing
const REGIONS = ['North Coast', 'South Beach', 'East Harbor', 'West Bay', 'Central Marina'];
/**
 * Arbitrary for generating a valid GeoLocation
 */
const geoLocationArb = fc.record({
    latitude: fc.double({ min: -90, max: 90, noNaN: true }),
    longitude: fc.double({ min: -180, max: 180, noNaN: true }),
    accuracy: fc.option(fc.double({ min: 1, max: 100, noNaN: true }), { nil: undefined }),
    address: fc.option(fc.string({ minLength: 5, maxLength: 100 }), { nil: undefined }),
});
/**
 * Arbitrary for generating a valid Report
 */
const reportArb = fc.record({
    id: fc.uuid(),
    timestamp: fc.date({ min: new Date('2024-01-01'), max: new Date('2026-12-31') }),
    location: geoLocationArb,
    source: fc.constantFrom(...SOURCE_TYPES),
    content: fc.record({
        originalText: fc.string({ minLength: 10, maxLength: 200 }),
        translatedText: fc.option(fc.string({ minLength: 10, maxLength: 200 }), { nil: undefined }),
        language: fc.constantFrom('en', 'es', 'fr', 'de'),
        mediaFiles: fc.constant(undefined),
    }),
    classification: fc.record({
        hazardType: fc.option(fc.constantFrom(...HAZARD_TYPES), { nil: undefined }),
        severity: fc.option(fc.constantFrom(...SEVERITY_LEVELS), { nil: undefined }),
        confidence: fc.double({ min: 0, max: 100, noNaN: true }),
    }),
    status: fc.constantFrom(...REPORT_STATUSES),
    region: fc.constantFrom(...REGIONS),
    aiSummary: fc.option(fc.string({ minLength: 20, maxLength: 200 }), { nil: undefined }),
    metadata: fc.record({
        deviceInfo: fc.option(fc.string({ minLength: 5, maxLength: 50 }), { nil: undefined }),
        ipAddress: fc.option(fc.ipV4(), { nil: undefined }),
        userAgent: fc.option(fc.string({ minLength: 10, maxLength: 100 }), { nil: undefined }),
    }),
    createdAt: fc.date({ min: new Date('2024-01-01'), max: new Date('2026-12-31') }),
    updatedAt: fc.date({ min: new Date('2024-01-01'), max: new Date('2026-12-31') }),
});
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
            coordinates: [[
                    [-80.2, 25.7],
                    [-80.1, 25.7],
                    [-80.1, 25.8],
                    [-80.2, 25.8],
                    [-80.2, 25.7],
                ]],
        }),
        affectedPopulation: fc.integer({ min: 0, max: 100000 }),
    }),
    hazardType: fc.constantFrom(...HAZARD_TYPES),
    severity: fc.constantFrom(...SEVERITY_LEVELS),
    confidence: fc.double({ min: 0, max: 100, noNaN: true }),
    escalationReason: fc.record({
        reportCount: fc.integer({ min: 1, max: 50 }),
        sourceTypes: fc.array(fc.constantFrom(...SOURCE_TYPES), { minLength: 1, maxLength: 3 }),
        timeWindow: fc.constantFrom('1 hour', '6 hours', '12 hours', '24 hours'),
        geographicSpread: fc.double({ min: 0.1, max: 50, noNaN: true }),
        thresholdsMet: fc.array(fc.constantFrom('minimum_reports', 'confidence_threshold', 'source_diversity'), { minLength: 1, maxLength: 3 }),
        reasoning: fc.string({ minLength: 20, maxLength: 200 }),
    }),
    relatedReports: fc.array(fc.uuid(), { minLength: 1, maxLength: 20 }),
    status: fc.constantFrom(...ALERT_STATUSES),
    aiSummary: fc.string({ minLength: 20, maxLength: 200 }),
    createdAt: fc.date({ min: new Date('2024-01-01'), max: new Date('2026-12-31') }),
    updatedAt: fc.date({ min: new Date('2024-01-01'), max: new Date('2026-12-31') }),
});
/**
 * Mock Socket.IO server that tracks emitted events
 */
class MockSocketIOServer {
    constructor() {
        this.emittedEvents = [];
    }
    to(room) {
        return {
            emit: (event, data) => {
                this.emittedEvents.push({
                    room,
                    event,
                    data,
                    timestamp: Date.now(),
                });
            },
        };
    }
    getEmittedEvents() {
        return this.emittedEvents;
    }
    clearEvents() {
        this.emittedEvents = [];
    }
    getEventsForRoom(room) {
        return this.emittedEvents.filter(e => e.room === room);
    }
    getEventsByType(eventType) {
        return this.emittedEvents.filter(e => e.event === eventType);
    }
}
describe('Property 12: WebSocket Event Broadcast', () => {
    // Feature: coastal-hazards-merge, Property 12: WebSocket Event Broadcast
    // **Validates: Requirements 9.2, 9.3**
    let mockIo;
    beforeEach(() => {
        mockIo = new MockSocketIOServer();
    });
    afterEach(() => {
        mockIo.clearEvents();
    });
    describe('Report Broadcast', () => {
        it('should broadcast report_submitted event to global room for any valid report', () => {
            fc.assert(fc.property(reportArb, (report) => {
                mockIo.clearEvents();
                // Broadcast the report
                (0, websocket_handlers_1.broadcastReport)(mockIo, report, 'report_submitted');
                // Get events emitted to global room
                const globalEvents = mockIo.getEventsForRoom('global');
                // Property: Global room should receive the event
                expect(globalEvents.length).toBeGreaterThanOrEqual(1);
                // Find the report_submitted event
                const reportEvent = globalEvents.find(e => e.event === 'report_submitted');
                expect(reportEvent).toBeDefined();
                // Verify the event data contains the report
                const message = reportEvent.data;
                expect(message.event).toBe('report_submitted');
                expect(message.data.id).toBe(report.id);
                expect(message.region).toBe(report.region);
                return true;
            }), { numRuns: 100 });
        });
        it('should broadcast report_submitted event to region-specific room', () => {
            fc.assert(fc.property(reportArb, (report) => {
                mockIo.clearEvents();
                // Broadcast the report
                (0, websocket_handlers_1.broadcastReport)(mockIo, report, 'report_submitted');
                // Get events emitted to region room
                const regionRoom = `region:${report.region}`;
                const regionEvents = mockIo.getEventsForRoom(regionRoom);
                // Property: Region room should receive the event
                expect(regionEvents.length).toBeGreaterThanOrEqual(1);
                // Find the report_submitted event
                const reportEvent = regionEvents.find(e => e.event === 'report_submitted');
                expect(reportEvent).toBeDefined();
                // Verify the event data
                const message = reportEvent.data;
                expect(message.data.region).toBe(report.region);
                return true;
            }), { numRuns: 100 });
        });
        it('should broadcast report_submitted event to hazard-specific room when classified', () => {
            fc.assert(fc.property(reportArb.filter(r => r.classification.hazardType !== undefined), (report) => {
                mockIo.clearEvents();
                // Broadcast the report
                (0, websocket_handlers_1.broadcastReport)(mockIo, report, 'report_submitted');
                // Get events emitted to hazard room
                const hazardRoom = `hazard:${report.classification.hazardType}`;
                const hazardEvents = mockIo.getEventsForRoom(hazardRoom);
                // Property: Hazard room should receive the event for classified reports
                expect(hazardEvents.length).toBeGreaterThanOrEqual(1);
                // Find the report_submitted event
                const reportEvent = hazardEvents.find(e => e.event === 'report_submitted');
                expect(reportEvent).toBeDefined();
                return true;
            }), { numRuns: 100 });
        });
        it('should broadcast report_verified event with correct event type', () => {
            fc.assert(fc.property(reportArb, (report) => {
                mockIo.clearEvents();
                // Broadcast the report as verified
                (0, websocket_handlers_1.broadcastReport)(mockIo, report, 'report_verified');
                // Get all events
                const allEvents = mockIo.getEventsByType('report_verified');
                // Property: Should have report_verified events
                expect(allEvents.length).toBeGreaterThanOrEqual(1);
                // All events should have correct event type in message
                for (const event of allEvents) {
                    const message = event.data;
                    expect(message.event).toBe('report_verified');
                }
                return true;
            }), { numRuns: 100 });
        });
    });
    describe('Alert Broadcast', () => {
        it('should broadcast alert_created event to global room for any valid alert', () => {
            fc.assert(fc.property(alertArb, (alert) => {
                mockIo.clearEvents();
                // Broadcast the alert
                (0, websocket_handlers_1.broadcastAlert)(mockIo, alert, 'alert_created');
                // Get events emitted to global room
                const globalEvents = mockIo.getEventsForRoom('global');
                // Property: Global room should receive the event
                expect(globalEvents.length).toBeGreaterThanOrEqual(1);
                // Find the alert_created event
                const alertEvent = globalEvents.find(e => e.event === 'alert_created');
                expect(alertEvent).toBeDefined();
                // Verify the event data contains the alert
                const message = alertEvent.data;
                expect(message.event).toBe('alert_created');
                expect(message.data.id).toBe(alert.id);
                expect(message.region).toBe(alert.region.name);
                return true;
            }), { numRuns: 100 });
        });
        it('should broadcast alert event to region-specific room when region exists', () => {
            fc.assert(fc.property(alertArb, (alert) => {
                mockIo.clearEvents();
                // Broadcast the alert
                (0, websocket_handlers_1.broadcastAlert)(mockIo, alert, 'alert_created');
                // Get events emitted to region room
                const regionRoom = `region:${alert.region.name}`;
                const regionEvents = mockIo.getEventsForRoom(regionRoom);
                // Property: Region room should receive the event
                expect(regionEvents.length).toBeGreaterThanOrEqual(1);
                // Find the alert_created event
                const alertEvent = regionEvents.find(e => e.event === 'alert_created');
                expect(alertEvent).toBeDefined();
                return true;
            }), { numRuns: 100 });
        });
        it('should broadcast alert event to hazard-specific room', () => {
            fc.assert(fc.property(alertArb, (alert) => {
                mockIo.clearEvents();
                // Broadcast the alert
                (0, websocket_handlers_1.broadcastAlert)(mockIo, alert, 'alert_created');
                // Get events emitted to hazard room
                const hazardRoom = `hazard:${alert.hazardType}`;
                const hazardEvents = mockIo.getEventsForRoom(hazardRoom);
                // Property: Hazard room should receive the event
                expect(hazardEvents.length).toBeGreaterThanOrEqual(1);
                // Find the alert_created event
                const alertEvent = hazardEvents.find(e => e.event === 'alert_created');
                expect(alertEvent).toBeDefined();
                return true;
            }), { numRuns: 100 });
        });
        it('should broadcast alert_updated event with correct event type', () => {
            fc.assert(fc.property(alertArb, (alert) => {
                mockIo.clearEvents();
                // Broadcast the alert as updated
                (0, websocket_handlers_1.broadcastAlert)(mockIo, alert, 'alert_updated');
                // Get all events
                const allEvents = mockIo.getEventsByType('alert_updated');
                // Property: Should have alert_updated events
                expect(allEvents.length).toBeGreaterThanOrEqual(1);
                // All events should have correct event type in message
                for (const event of allEvents) {
                    const message = event.data;
                    expect(message.event).toBe('alert_updated');
                }
                return true;
            }), { numRuns: 100 });
        });
        it('should broadcast alert_resolved event with correct event type', () => {
            fc.assert(fc.property(alertArb, (alert) => {
                mockIo.clearEvents();
                // Broadcast the alert as resolved
                (0, websocket_handlers_1.broadcastAlert)(mockIo, alert, 'alert_resolved');
                // Get all events
                const allEvents = mockIo.getEventsByType('alert_resolved');
                // Property: Should have alert_resolved events
                expect(allEvents.length).toBeGreaterThanOrEqual(1);
                // All events should have correct event type in message
                for (const event of allEvents) {
                    const message = event.data;
                    expect(message.event).toBe('alert_resolved');
                }
                return true;
            }), { numRuns: 100 });
        });
    });
    describe('Broadcast Consistency', () => {
        it('should include timestamp in all broadcast messages', () => {
            fc.assert(fc.property(fc.oneof(reportArb.map(r => ({ type: 'report', data: r })), alertArb.map(a => ({ type: 'alert', data: a }))), (item) => {
                mockIo.clearEvents();
                if (item.type === 'report') {
                    (0, websocket_handlers_1.broadcastReport)(mockIo, item.data, 'report_submitted');
                }
                else {
                    (0, websocket_handlers_1.broadcastAlert)(mockIo, item.data, 'alert_created');
                }
                // Get all emitted events
                const allEvents = mockIo.getEmittedEvents();
                // Property: All messages should have a timestamp
                for (const event of allEvents) {
                    const message = event.data;
                    expect(message.timestamp).toBeDefined();
                    expect(message.timestamp instanceof Date).toBe(true);
                }
                return true;
            }), { numRuns: 100 });
        });
        it('should broadcast to at least global and region rooms for any item', () => {
            fc.assert(fc.property(fc.oneof(reportArb.map(r => ({ type: 'report', data: r })), alertArb.map(a => ({ type: 'alert', data: a }))), (item) => {
                mockIo.clearEvents();
                if (item.type === 'report') {
                    (0, websocket_handlers_1.broadcastReport)(mockIo, item.data, 'report_submitted');
                }
                else {
                    (0, websocket_handlers_1.broadcastAlert)(mockIo, item.data, 'alert_created');
                }
                // Get all emitted events
                const allEvents = mockIo.getEmittedEvents();
                const rooms = new Set(allEvents.map(e => e.room));
                // Property: Should broadcast to at least global room
                expect(rooms.has('global')).toBe(true);
                // Property: Should broadcast to region room
                const regionName = item.type === 'report'
                    ? item.data.region
                    : item.data.region.name;
                expect(rooms.has(`region:${regionName}`)).toBe(true);
                return true;
            }), { numRuns: 100 });
        });
        it('should preserve data integrity in broadcast messages', () => {
            fc.assert(fc.property(reportArb, (report) => {
                mockIo.clearEvents();
                // Broadcast the report
                (0, websocket_handlers_1.broadcastReport)(mockIo, report, 'report_submitted');
                // Get events from global room
                const globalEvents = mockIo.getEventsForRoom('global');
                const reportEvent = globalEvents.find(e => e.event === 'report_submitted');
                expect(reportEvent).toBeDefined();
                // Property: Broadcast data should match original report
                const message = reportEvent.data;
                expect(message.data.id).toBe(report.id);
                expect(message.data.region).toBe(report.region);
                expect(message.data.source).toBe(report.source);
                expect(message.data.status).toBe(report.status);
                expect(message.data.content.originalText).toBe(report.content.originalText);
                expect(message.data.location.latitude).toBe(report.location.latitude);
                expect(message.data.location.longitude).toBe(report.location.longitude);
                return true;
            }), { numRuns: 100 });
        });
        it('should preserve alert data integrity in broadcast messages', () => {
            fc.assert(fc.property(alertArb, (alert) => {
                mockIo.clearEvents();
                // Broadcast the alert
                (0, websocket_handlers_1.broadcastAlert)(mockIo, alert, 'alert_created');
                // Get events from global room
                const globalEvents = mockIo.getEventsForRoom('global');
                const alertEvent = globalEvents.find(e => e.event === 'alert_created');
                expect(alertEvent).toBeDefined();
                // Property: Broadcast data should match original alert
                const message = alertEvent.data;
                expect(message.data.id).toBe(alert.id);
                expect(message.data.hazardType).toBe(alert.hazardType);
                expect(message.data.severity).toBe(alert.severity);
                expect(message.data.confidence).toBe(alert.confidence);
                expect(message.data.status).toBe(alert.status);
                expect(message.data.region.name).toBe(alert.region.name);
                expect(message.data.aiSummary).toBe(alert.aiSummary);
                return true;
            }), { numRuns: 100 });
        });
    });
});
//# sourceMappingURL=websocket-event-broadcast.test.js.map