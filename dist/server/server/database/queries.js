"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbQueries = void 0;
exports.getRecentReports = getRecentReports;
exports.getReportById = getReportById;
exports.getReportsByLocation = getReportsByLocation;
exports.getReportsPaginated = getReportsPaginated;
exports.createReport = createReport;
exports.updateReportStatus = updateReportStatus;
exports.getActiveAlerts = getActiveAlerts;
exports.getAlertById = getAlertById;
exports.getAlertsPaginated = getAlertsPaginated;
exports.createAlert = createAlert;
exports.updateAlertStatus = updateAlertStatus;
exports.getSystemStats = getSystemStats;
exports.healthCheck = healthCheck;
const connection_1 = require("./connection");
const logger_1 = require("../utils/logger");
// Demo data for when database is not available
const demoReports = [];
const demoAlerts = [];
function mapRowToReport(row) {
    return {
        id: row.id,
        timestamp: row.timestamp,
        location: {
            latitude: parseFloat(String(row.latitude)),
            longitude: parseFloat(String(row.longitude)),
            accuracy: row.location_accuracy ? parseFloat(String(row.location_accuracy)) : undefined,
            address: row.address || undefined,
        },
        source: row.source_type,
        content: {
            originalText: row.original_text,
            translatedText: row.translated_text || undefined,
            language: row.language,
        },
        classification: {
            hazardType: row.hazard_type,
            severity: row.severity,
            confidence: parseFloat(String(row.confidence)),
        },
        status: row.status,
        region: row.region || 'Unknown',
        aiSummary: row.ai_summary || undefined,
        metadata: {
            deviceInfo: row.device_info || undefined,
            ipAddress: row.ip_address || undefined,
            userAgent: row.user_agent || undefined,
        },
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
async function getRecentReports(limit = 20) {
    if (process.env.DEMO_MODE === 'true') {
        return demoReports.slice(0, limit);
    }
    const result = await (0, connection_1.query)(`SELECT * FROM reports ORDER BY timestamp DESC LIMIT $1`, [limit]);
    return result.rows.map(mapRowToReport);
}
async function getReportById(id) {
    if (process.env.DEMO_MODE === 'true') {
        return demoReports.find(r => r.id === id) || null;
    }
    const result = await (0, connection_1.query)(`SELECT * FROM reports WHERE id = $1`, [id]);
    if (result.rows.length === 0) {
        return null;
    }
    return mapRowToReport(result.rows[0]);
}
async function getReportsByLocation(latitude, longitude, radiusKm = 5) {
    if (process.env.DEMO_MODE === 'true') {
        // Simple distance calculation for demo mode
        return demoReports.filter(r => {
            const lat1 = r.location.latitude;
            const lon1 = r.location.longitude;
            const R = 6371; // Earth's radius in km
            const dLat = (latitude - lat1) * Math.PI / 180;
            const dLon = (longitude - lon1) * Math.PI / 180;
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(latitude * Math.PI / 180) *
                    Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distance = R * c;
            return distance <= radiusKm;
        });
    }
    const result = await (0, connection_1.query)(`SELECT * FROM reports 
     WHERE ST_DWithin(
       ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography,
       ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography,
       $3 * 1000
     )
     ORDER BY timestamp DESC`, [latitude, longitude, radiusKm]);
    return result.rows.map(mapRowToReport);
}
async function getReportsPaginated(page = 1, limit = 20, filters) {
    if (process.env.DEMO_MODE === 'true') {
        let filtered = [...demoReports];
        if (filters?.status)
            filtered = filtered.filter(r => r.status === filters.status);
        if (filters?.hazardType)
            filtered = filtered.filter(r => r.classification.hazardType === filters.hazardType);
        if (filters?.severity)
            filtered = filtered.filter(r => r.classification.severity === filters.severity);
        if (filters?.region)
            filtered = filtered.filter(r => r.region.toLowerCase().includes(filters.region.toLowerCase()));
        const start = (page - 1) * limit;
        return {
            reports: filtered.slice(start, start + limit),
            total: filtered.length,
        };
    }
    const conditions = [];
    const params = [];
    let paramIndex = 1;
    if (filters?.status) {
        conditions.push(`status = $${paramIndex++}`);
        params.push(filters.status);
    }
    if (filters?.hazardType) {
        conditions.push(`hazard_type = $${paramIndex++}`);
        params.push(filters.hazardType);
    }
    if (filters?.severity) {
        conditions.push(`severity = $${paramIndex++}`);
        params.push(filters.severity);
    }
    if (filters?.region) {
        conditions.push(`region ILIKE $${paramIndex++}`);
        params.push(`%${filters.region}%`);
    }
    if (filters?.startDate) {
        conditions.push(`timestamp >= $${paramIndex++}`);
        params.push(filters.startDate);
    }
    if (filters?.endDate) {
        conditions.push(`timestamp <= $${paramIndex++}`);
        params.push(filters.endDate);
    }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * limit;
    const countResult = await (0, connection_1.query)(`SELECT COUNT(*) as count FROM reports ${whereClause}`, params);
    params.push(limit, offset);
    const result = await (0, connection_1.query)(`SELECT * FROM reports ${whereClause} ORDER BY timestamp DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`, params);
    return {
        reports: result.rows.map(mapRowToReport),
        total: parseInt(countResult.rows[0]?.count || '0', 10),
    };
}
async function createReport(report) {
    if (process.env.DEMO_MODE === 'true') {
        const newReport = {
            ...report,
            id: `demo-${Date.now()}`,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        demoReports.unshift(newReport);
        return newReport;
    }
    const result = await (0, connection_1.query)(`INSERT INTO reports (
      timestamp, latitude, longitude, location_accuracy, address, region,
      source_type, original_text, translated_text, language,
      hazard_type, severity, confidence, status, ai_summary,
      device_info, ip_address, user_agent
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
    RETURNING *`, [
        report.timestamp,
        report.location.latitude,
        report.location.longitude,
        report.location.accuracy,
        report.location.address,
        report.region,
        report.source,
        report.content.originalText,
        report.content.translatedText,
        report.content.language,
        report.classification.hazardType,
        report.classification.severity,
        report.classification.confidence,
        report.status,
        report.aiSummary,
        report.metadata.deviceInfo,
        report.metadata.ipAddress,
        report.metadata.userAgent,
    ]);
    return mapRowToReport(result.rows[0]);
}
async function updateReportStatus(id, status, confidence) {
    if (process.env.DEMO_MODE === 'true') {
        const report = demoReports.find(r => r.id === id);
        if (report) {
            report.status = status;
            if (confidence !== undefined)
                report.classification.confidence = confidence;
            report.updatedAt = new Date();
        }
        return report || null;
    }
    const params = [status, id];
    let confidenceClause = '';
    if (confidence !== undefined) {
        confidenceClause = ', confidence = $3';
        params.splice(1, 0, confidence);
    }
    const result = await (0, connection_1.query)(`UPDATE reports SET status = $1${confidenceClause} WHERE id = $${params.length} RETURNING *`, params);
    if (result.rows.length === 0) {
        return null;
    }
    return mapRowToReport(result.rows[0]);
}
function mapRowToAlert(row) {
    return {
        id: row.id,
        incidentId: row.incident_id || undefined,
        timestamp: row.timestamp,
        region: {
            name: row.region_name,
            bounds: {
                type: 'Polygon',
                coordinates: [], // Would parse from PostGIS geometry
            },
            affectedPopulation: row.affected_population,
        },
        hazardType: row.hazard_type,
        severity: row.severity,
        confidence: parseFloat(String(row.confidence)),
        escalationReason: {
            reportCount: row.report_count,
            sourceTypes: row.source_types || [],
            timeWindow: row.time_window || '',
            geographicSpread: parseFloat(String(row.geographic_spread)) || 0,
            thresholdsMet: row.thresholds_met || [],
            reasoning: row.reasoning || '',
        },
        relatedReports: row.related_reports || [],
        status: row.status,
        aiSummary: row.ai_summary,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
async function getActiveAlerts() {
    if (process.env.DEMO_MODE === 'true') {
        return demoAlerts.filter(a => a.status === 'active');
    }
    const result = await (0, connection_1.query)(`SELECT * FROM alerts WHERE status = 'active' ORDER BY confidence DESC, timestamp DESC`);
    return result.rows.map(mapRowToAlert);
}
async function getAlertById(id) {
    if (process.env.DEMO_MODE === 'true') {
        return demoAlerts.find(a => a.id === id) || null;
    }
    const result = await (0, connection_1.query)(`SELECT * FROM alerts WHERE id = $1`, [id]);
    if (result.rows.length === 0) {
        return null;
    }
    return mapRowToAlert(result.rows[0]);
}
async function getAlertsPaginated(page = 1, limit = 20, filters) {
    if (process.env.DEMO_MODE === 'true') {
        let filtered = [...demoAlerts];
        if (filters?.status)
            filtered = filtered.filter(a => a.status === filters.status);
        if (filters?.hazardType)
            filtered = filtered.filter(a => a.hazardType === filters.hazardType);
        if (filters?.severity)
            filtered = filtered.filter(a => a.severity === filters.severity);
        if (filters?.region)
            filtered = filtered.filter(a => a.region.name.toLowerCase().includes(filters.region.toLowerCase()));
        if (filters?.minConfidence)
            filtered = filtered.filter(a => a.confidence >= filters.minConfidence);
        const start = (page - 1) * limit;
        return {
            alerts: filtered.slice(start, start + limit),
            total: filtered.length,
        };
    }
    const conditions = [];
    const params = [];
    let paramIndex = 1;
    if (filters?.status) {
        conditions.push(`status = $${paramIndex++}`);
        params.push(filters.status);
    }
    if (filters?.hazardType) {
        conditions.push(`hazard_type = $${paramIndex++}`);
        params.push(filters.hazardType);
    }
    if (filters?.severity) {
        conditions.push(`severity = $${paramIndex++}`);
        params.push(filters.severity);
    }
    if (filters?.region) {
        conditions.push(`region_name ILIKE $${paramIndex++}`);
        params.push(`%${filters.region}%`);
    }
    if (filters?.minConfidence !== undefined) {
        conditions.push(`confidence >= $${paramIndex++}`);
        params.push(filters.minConfidence);
    }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * limit;
    const countResult = await (0, connection_1.query)(`SELECT COUNT(*) as count FROM alerts ${whereClause}`, params);
    params.push(limit, offset);
    const result = await (0, connection_1.query)(`SELECT * FROM alerts ${whereClause} ORDER BY confidence DESC, timestamp DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`, params);
    return {
        alerts: result.rows.map(mapRowToAlert),
        total: parseInt(countResult.rows[0]?.count || '0', 10),
    };
}
async function createAlert(alert) {
    if (process.env.DEMO_MODE === 'true') {
        const newAlert = {
            ...alert,
            id: `demo-alert-${Date.now()}`,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        demoAlerts.unshift(newAlert);
        return newAlert;
    }
    const result = await (0, connection_1.query)(`INSERT INTO alerts (
      incident_id, timestamp, region_name, affected_population,
      hazard_type, severity, confidence,
      report_count, source_types, time_window, geographic_spread, thresholds_met, reasoning,
      related_reports, status, ai_summary
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    RETURNING *`, [
        alert.incidentId,
        alert.timestamp,
        alert.region.name,
        alert.region.affectedPopulation,
        alert.hazardType,
        alert.severity,
        alert.confidence,
        alert.escalationReason.reportCount,
        alert.escalationReason.sourceTypes,
        alert.escalationReason.timeWindow,
        alert.escalationReason.geographicSpread,
        alert.escalationReason.thresholdsMet,
        alert.escalationReason.reasoning,
        alert.relatedReports,
        alert.status,
        alert.aiSummary,
    ]);
    return mapRowToAlert(result.rows[0]);
}
async function updateAlertStatus(id, status) {
    if (process.env.DEMO_MODE === 'true') {
        const alert = demoAlerts.find(a => a.id === id);
        if (alert) {
            alert.status = status;
            alert.updatedAt = new Date();
        }
        return alert || null;
    }
    const result = await (0, connection_1.query)(`UPDATE alerts SET status = $1 WHERE id = $2 RETURNING *`, [status, id]);
    if (result.rows.length === 0) {
        return null;
    }
    return mapRowToAlert(result.rows[0]);
}
// ============================================================================
// Statistics Queries
// ============================================================================
async function getSystemStats() {
    if (process.env.DEMO_MODE === 'true') {
        return {
            totalReports: demoReports.length,
            activeAlerts: demoAlerts.filter(a => a.status === 'active').length,
            verifiedReports: demoReports.filter(r => r.status === 'verified').length,
            pendingReports: demoReports.filter(r => r.status === 'pending').length,
            reportsByRegion: {},
            reportsByHazardType: {},
        };
    }
    const [totalResult, activeAlertsResult, verifiedResult, pendingResult, byRegionResult, byTypeResult] = await Promise.all([
        (0, connection_1.query)(`SELECT COUNT(*) as count FROM reports`),
        (0, connection_1.query)(`SELECT COUNT(*) as count FROM alerts WHERE status = 'active'`),
        (0, connection_1.query)(`SELECT COUNT(*) as count FROM reports WHERE status = 'verified'`),
        (0, connection_1.query)(`SELECT COUNT(*) as count FROM reports WHERE status = 'pending'`),
        (0, connection_1.query)(`SELECT region, COUNT(*) as count FROM reports WHERE region IS NOT NULL GROUP BY region`),
        (0, connection_1.query)(`SELECT hazard_type, COUNT(*) as count FROM reports WHERE hazard_type IS NOT NULL GROUP BY hazard_type`),
    ]);
    const reportsByRegion = {};
    byRegionResult.rows.forEach(row => {
        reportsByRegion[row.region] = parseInt(row.count, 10);
    });
    const reportsByHazardType = {};
    byTypeResult.rows.forEach(row => {
        reportsByHazardType[row.hazard_type] = parseInt(row.count, 10);
    });
    return {
        totalReports: parseInt(totalResult.rows[0]?.count || '0', 10),
        activeAlerts: parseInt(activeAlertsResult.rows[0]?.count || '0', 10),
        verifiedReports: parseInt(verifiedResult.rows[0]?.count || '0', 10),
        pendingReports: parseInt(pendingResult.rows[0]?.count || '0', 10),
        reportsByRegion,
        reportsByHazardType,
    };
}
// ============================================================================
// Health Check
// ============================================================================
async function healthCheck() {
    if (process.env.DEMO_MODE === 'true') {
        return true;
    }
    try {
        await (0, connection_1.query)('SELECT 1');
        return true;
    }
    catch (error) {
        logger_1.logger.error('Database health check failed:', error);
        return false;
    }
}
exports.dbQueries = {
    // Reports
    getRecentReports,
    getReportById,
    getReportsByLocation,
    getReportsPaginated,
    createReport,
    updateReportStatus,
    // Alerts
    getActiveAlerts,
    getAlertById,
    getAlertsPaginated,
    createAlert,
    updateAlertStatus,
    // Stats
    getSystemStats,
    // Health
    healthCheck,
};
exports.default = exports.dbQueries;
//# sourceMappingURL=queries.js.map