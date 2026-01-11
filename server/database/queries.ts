import { query, transaction } from './connection';
import { logger } from '../utils/logger';
import { Report, HazardType, SeverityLevel, ReportStatus } from '../../shared/types/report';
import { Alert, AlertStatus } from '../../shared/types/alert';
import { SystemStats } from '../../shared/types/api';

// Demo data for when database is not available
const demoReports: Report[] = [];
const demoAlerts: Alert[] = [];

// ============================================================================
// Report Queries
// ============================================================================

interface ReportRow {
  id: string;
  timestamp: Date;
  latitude: number;
  longitude: number;
  location_accuracy: number | null;
  address: string | null;
  region: string | null;
  source_type: string;
  original_text: string;
  translated_text: string | null;
  language: string;
  hazard_type: string | null;
  severity: string | null;
  confidence: number;
  status: string;
  ai_summary: string | null;
  device_info: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Date;
  updated_at: Date;
}

function mapRowToReport(row: ReportRow): Report {
  return {
    id: row.id,
    timestamp: row.timestamp,
    location: {
      latitude: parseFloat(String(row.latitude)),
      longitude: parseFloat(String(row.longitude)),
      accuracy: row.location_accuracy ? parseFloat(String(row.location_accuracy)) : undefined,
      address: row.address || undefined,
    },
    source: row.source_type as Report['source'],
    content: {
      originalText: row.original_text,
      translatedText: row.translated_text || undefined,
      language: row.language,
    },
    classification: {
      hazardType: row.hazard_type as HazardType | undefined,
      severity: row.severity as SeverityLevel | undefined,
      confidence: parseFloat(String(row.confidence)),
    },
    status: row.status as ReportStatus,
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

export async function getRecentReports(limit: number = 20): Promise<Report[]> {
  if (process.env.DEMO_MODE === 'true') {
    return demoReports.slice(0, limit);
  }

  const result = await query<ReportRow>(
    `SELECT * FROM reports ORDER BY timestamp DESC LIMIT $1`,
    [limit]
  );

  return result.rows.map(mapRowToReport);
}

export async function getReportById(id: string): Promise<Report | null> {
  if (process.env.DEMO_MODE === 'true') {
    return demoReports.find(r => r.id === id) || null;
  }

  const result = await query<ReportRow>(
    `SELECT * FROM reports WHERE id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapRowToReport(result.rows[0]);
}

export async function getReportsByLocation(
  latitude: number,
  longitude: number,
  radiusKm: number = 5
): Promise<Report[]> {
  if (process.env.DEMO_MODE === 'true') {
    // Simple distance calculation for demo mode
    return demoReports.filter(r => {
      const lat1 = r.location.latitude;
      const lon1 = r.location.longitude;
      const R = 6371; // Earth's radius in km
      const dLat = (latitude - lat1) * Math.PI / 180;
      const dLon = (longitude - lon1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(latitude * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;
      return distance <= radiusKm;
    });
  }

  const result = await query<ReportRow>(
    `SELECT * FROM reports 
     WHERE ST_DWithin(
       ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography,
       ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography,
       $3 * 1000
     )
     ORDER BY timestamp DESC`,
    [latitude, longitude, radiusKm]
  );

  return result.rows.map(mapRowToReport);
}

export async function getReportsPaginated(
  page: number = 1,
  limit: number = 20,
  filters?: {
    status?: ReportStatus;
    hazardType?: HazardType;
    severity?: SeverityLevel;
    region?: string;
    startDate?: Date;
    endDate?: Date;
  }
): Promise<{ reports: Report[]; total: number }> {
  if (process.env.DEMO_MODE === 'true') {
    let filtered = [...demoReports];
    if (filters?.status) filtered = filtered.filter(r => r.status === filters.status);
    if (filters?.hazardType) filtered = filtered.filter(r => r.classification.hazardType === filters.hazardType);
    if (filters?.severity) filtered = filtered.filter(r => r.classification.severity === filters.severity);
    if (filters?.region) filtered = filtered.filter(r => r.region.toLowerCase().includes(filters.region!.toLowerCase()));
    
    const start = (page - 1) * limit;
    return {
      reports: filtered.slice(start, start + limit),
      total: filtered.length,
    };
  }

  const conditions: string[] = [];
  const params: unknown[] = [];
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

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM reports ${whereClause}`,
    params
  );

  params.push(limit, offset);
  const result = await query<ReportRow>(
    `SELECT * FROM reports ${whereClause} ORDER BY timestamp DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    params
  );

  return {
    reports: result.rows.map(mapRowToReport),
    total: parseInt(countResult.rows[0]?.count || '0', 10),
  };
}

export async function createReport(report: Omit<Report, 'id' | 'createdAt' | 'updatedAt'>): Promise<Report> {
  if (process.env.DEMO_MODE === 'true') {
    const newReport: Report = {
      ...report,
      id: `demo-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    demoReports.unshift(newReport);
    return newReport;
  }

  const result = await query<ReportRow>(
    `INSERT INTO reports (
      timestamp, latitude, longitude, location_accuracy, address, region,
      source_type, original_text, translated_text, language,
      hazard_type, severity, confidence, status, ai_summary,
      device_info, ip_address, user_agent
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
    RETURNING *`,
    [
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
    ]
  );

  return mapRowToReport(result.rows[0]);
}

export async function updateReportStatus(
  id: string,
  status: ReportStatus,
  confidence?: number
): Promise<Report | null> {
  if (process.env.DEMO_MODE === 'true') {
    const report = demoReports.find(r => r.id === id);
    if (report) {
      report.status = status;
      if (confidence !== undefined) report.classification.confidence = confidence;
      report.updatedAt = new Date();
    }
    return report || null;
  }

  const params: unknown[] = [status, id];
  let confidenceClause = '';
  if (confidence !== undefined) {
    confidenceClause = ', confidence = $3';
    params.splice(1, 0, confidence);
  }

  const result = await query<ReportRow>(
    `UPDATE reports SET status = $1${confidenceClause} WHERE id = $${params.length} RETURNING *`,
    params
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapRowToReport(result.rows[0]);
}

// ============================================================================
// Alert Queries
// ============================================================================

interface AlertRow {
  id: string;
  incident_id: string | null;
  timestamp: Date;
  region_name: string;
  region_bounds: unknown;
  affected_population: number;
  hazard_type: string;
  severity: string;
  confidence: number;
  report_count: number;
  source_types: string[];
  time_window: string;
  geographic_spread: number;
  thresholds_met: string[];
  reasoning: string;
  related_reports: string[];
  status: string;
  ai_summary: string;
  created_at: Date;
  updated_at: Date;
}

function mapRowToAlert(row: AlertRow): Alert {
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
    hazardType: row.hazard_type as HazardType,
    severity: row.severity as SeverityLevel,
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
    status: row.status as AlertStatus,
    aiSummary: row.ai_summary,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getActiveAlerts(): Promise<Alert[]> {
  if (process.env.DEMO_MODE === 'true') {
    return demoAlerts.filter(a => a.status === 'active');
  }

  const result = await query<AlertRow>(
    `SELECT * FROM alerts WHERE status = 'active' ORDER BY confidence DESC, timestamp DESC`
  );

  return result.rows.map(mapRowToAlert);
}

export async function getAlertById(id: string): Promise<Alert | null> {
  if (process.env.DEMO_MODE === 'true') {
    return demoAlerts.find(a => a.id === id) || null;
  }

  const result = await query<AlertRow>(
    `SELECT * FROM alerts WHERE id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapRowToAlert(result.rows[0]);
}

export async function getAlertsPaginated(
  page: number = 1,
  limit: number = 20,
  filters?: {
    status?: AlertStatus;
    hazardType?: HazardType;
    severity?: SeverityLevel;
    region?: string;
    minConfidence?: number;
  }
): Promise<{ alerts: Alert[]; total: number }> {
  if (process.env.DEMO_MODE === 'true') {
    let filtered = [...demoAlerts];
    if (filters?.status) filtered = filtered.filter(a => a.status === filters.status);
    if (filters?.hazardType) filtered = filtered.filter(a => a.hazardType === filters.hazardType);
    if (filters?.severity) filtered = filtered.filter(a => a.severity === filters.severity);
    if (filters?.region) filtered = filtered.filter(a => a.region.name.toLowerCase().includes(filters.region!.toLowerCase()));
    if (filters?.minConfidence) filtered = filtered.filter(a => a.confidence >= filters.minConfidence!);
    
    const start = (page - 1) * limit;
    return {
      alerts: filtered.slice(start, start + limit),
      total: filtered.length,
    };
  }

  const conditions: string[] = [];
  const params: unknown[] = [];
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

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM alerts ${whereClause}`,
    params
  );

  params.push(limit, offset);
  const result = await query<AlertRow>(
    `SELECT * FROM alerts ${whereClause} ORDER BY confidence DESC, timestamp DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    params
  );

  return {
    alerts: result.rows.map(mapRowToAlert),
    total: parseInt(countResult.rows[0]?.count || '0', 10),
  };
}

export async function createAlert(alert: Omit<Alert, 'id' | 'createdAt' | 'updatedAt'>): Promise<Alert> {
  if (process.env.DEMO_MODE === 'true') {
    const newAlert: Alert = {
      ...alert,
      id: `demo-alert-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    demoAlerts.unshift(newAlert);
    return newAlert;
  }

  const result = await query<AlertRow>(
    `INSERT INTO alerts (
      incident_id, timestamp, region_name, affected_population,
      hazard_type, severity, confidence,
      report_count, source_types, time_window, geographic_spread, thresholds_met, reasoning,
      related_reports, status, ai_summary
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    RETURNING *`,
    [
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
    ]
  );

  return mapRowToAlert(result.rows[0]);
}

export async function updateAlertStatus(id: string, status: AlertStatus): Promise<Alert | null> {
  if (process.env.DEMO_MODE === 'true') {
    const alert = demoAlerts.find(a => a.id === id);
    if (alert) {
      alert.status = status;
      alert.updatedAt = new Date();
    }
    return alert || null;
  }

  const result = await query<AlertRow>(
    `UPDATE alerts SET status = $1 WHERE id = $2 RETURNING *`,
    [status, id]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapRowToAlert(result.rows[0]);
}

// ============================================================================
// Statistics Queries
// ============================================================================

export async function getSystemStats(): Promise<SystemStats> {
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
    query<{ count: string }>(`SELECT COUNT(*) as count FROM reports`),
    query<{ count: string }>(`SELECT COUNT(*) as count FROM alerts WHERE status = 'active'`),
    query<{ count: string }>(`SELECT COUNT(*) as count FROM reports WHERE status = 'verified'`),
    query<{ count: string }>(`SELECT COUNT(*) as count FROM reports WHERE status = 'pending'`),
    query<{ region: string; count: string }>(`SELECT region, COUNT(*) as count FROM reports WHERE region IS NOT NULL GROUP BY region`),
    query<{ hazard_type: string; count: string }>(`SELECT hazard_type, COUNT(*) as count FROM reports WHERE hazard_type IS NOT NULL GROUP BY hazard_type`),
  ]);

  const reportsByRegion: Record<string, number> = {};
  byRegionResult.rows.forEach(row => {
    reportsByRegion[row.region] = parseInt(row.count, 10);
  });

  const reportsByHazardType: Record<string, number> = {};
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

export async function healthCheck(): Promise<boolean> {
  if (process.env.DEMO_MODE === 'true') {
    return true;
  }

  try {
    await query('SELECT 1');
    return true;
  } catch (error) {
    logger.error('Database health check failed:', error);
    return false;
  }
}

export const dbQueries = {
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

export default dbQueries;
