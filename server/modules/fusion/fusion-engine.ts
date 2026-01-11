/**
 * Fusion Engine
 * 
 * Clusters reports, generates alerts, and handles deduplication.
 * Validates: Requirements 8.1, 8.3, 8.4, 8.5
 */

import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../utils/logger';
import { Report, HazardType, SeverityLevel } from '../../../shared/types/report';
import { Alert, AlertStatus } from '../../../shared/types/alert';
import { calculateConfidenceScore, determineSeverity, confidenceScoringService } from './confidence-scoring';
import { dbQueries } from '../../database/queries';
import { cacheManager } from '../../cache/cache-manager';

// Clustering configuration
const CLUSTERING_CONFIG = {
  spatialRadiusKm: 10,        // Reports within 10km are considered same cluster
  temporalWindowHours: 24,    // Reports within 24 hours are considered same event
  minReportsForAlert: 2,      // Minimum reports to generate alert
  minConfidenceForAlert: 40,  // Minimum confidence to generate alert
};

export interface ReportCluster {
  id: string;
  reports: Report[];
  centroid: { latitude: number; longitude: number };
  hazardType: HazardType;
  severity: SeverityLevel;
  confidence: number;
  region: string;
  startTime: Date;
  endTime: Date;
}

export interface FusionResult {
  clusters: ReportCluster[];
  newAlerts: Alert[];
  updatedAlerts: Alert[];
  processedReportIds: string[];
}

/**
 * Calculate distance between two points using Haversine formula
 */
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  return confidenceScoringService.haversineDistance(lat1, lon1, lat2, lon2);
}

/**
 * Check if two reports are within clustering thresholds
 */
function areReportsRelated(r1: Report, r2: Report): boolean {
  // Check spatial proximity
  const distance = haversineDistance(
    r1.location.latitude, r1.location.longitude,
    r2.location.latitude, r2.location.longitude
  );
  
  if (distance > CLUSTERING_CONFIG.spatialRadiusKm) return false;

  // Check temporal proximity
  const timeDiff = Math.abs(
    new Date(r1.timestamp).getTime() - new Date(r2.timestamp).getTime()
  );
  const hoursDiff = timeDiff / (1000 * 60 * 60);
  
  if (hoursDiff > CLUSTERING_CONFIG.temporalWindowHours) return false;

  // Check hazard type compatibility
  if (r1.classification.hazardType && r2.classification.hazardType) {
    if (r1.classification.hazardType !== r2.classification.hazardType) return false;
  }

  return true;
}


/**
 * Cluster reports using DBSCAN-like algorithm
 */
function clusterReports(reports: Report[]): ReportCluster[] {
  const clusters: ReportCluster[] = [];
  const visited = new Set<string>();
  const clustered = new Set<string>();

  for (const report of reports) {
    if (visited.has(report.id)) continue;
    visited.add(report.id);

    // Find all related reports
    const neighbors = reports.filter(r => 
      r.id !== report.id && 
      !clustered.has(r.id) && 
      areReportsRelated(report, r)
    );

    if (neighbors.length >= CLUSTERING_CONFIG.minReportsForAlert - 1) {
      // Create cluster
      const clusterReports = [report, ...neighbors];
      clusterReports.forEach(r => clustered.add(r.id));

      const cluster = createCluster(clusterReports);
      clusters.push(cluster);
    }
  }

  return clusters;
}

/**
 * Create a cluster from a set of reports
 */
function createCluster(reports: Report[]): ReportCluster {
  // Calculate centroid
  const lats = reports.map(r => r.location.latitude);
  const lngs = reports.map(r => r.location.longitude);
  const centroid = {
    latitude: lats.reduce((a, b) => a + b, 0) / lats.length,
    longitude: lngs.reduce((a, b) => a + b, 0) / lngs.length,
  };

  // Determine dominant hazard type
  const hazardCounts: Record<string, number> = {};
  for (const report of reports) {
    const type = report.classification.hazardType || 'other';
    hazardCounts[type] = (hazardCounts[type] || 0) + 1;
  }
  const hazardType = Object.entries(hazardCounts)
    .sort((a, b) => b[1] - a[1])[0][0] as HazardType;

  // Calculate confidence
  const confidenceResult = calculateConfidenceScore(reports);
  
  // Determine severity
  const severity = determineSeverity(reports, confidenceResult.overall);

  // Get time range
  const timestamps = reports.map(r => new Date(r.timestamp).getTime());
  const startTime = new Date(Math.min(...timestamps));
  const endTime = new Date(Math.max(...timestamps));

  // Get region (most common)
  const regionCounts: Record<string, number> = {};
  for (const report of reports) {
    regionCounts[report.region] = (regionCounts[report.region] || 0) + 1;
  }
  const region = Object.entries(regionCounts)
    .sort((a, b) => b[1] - a[1])[0][0];

  return {
    id: uuidv4(),
    reports,
    centroid,
    hazardType,
    severity,
    confidence: confidenceResult.overall,
    region,
    startTime,
    endTime,
  };
}

/**
 * Check if cluster matches an existing alert (for deduplication)
 */
async function findMatchingAlert(cluster: ReportCluster): Promise<Alert | null> {
  try {
    const existingAlerts = await dbQueries.getActiveAlerts();
    
    for (const alert of existingAlerts) {
      // Check if same hazard type
      if (alert.hazardType !== cluster.hazardType) continue;
      
      // Check if same region
      if (alert.region?.name !== cluster.region) continue;
      
      // Check temporal overlap (within 48 hours)
      const alertTime = new Date(alert.timestamp).getTime();
      const clusterTime = cluster.startTime.getTime();
      const hoursDiff = Math.abs(alertTime - clusterTime) / (1000 * 60 * 60);
      
      if (hoursDiff <= 48) {
        return alert;
      }
    }
    
    return null;
  } catch (error) {
    logger.error('Error finding matching alert:', error);
    return null;
  }
}


/**
 * Create alert from cluster
 */
function createAlertFromCluster(cluster: ReportCluster): Alert {
  return {
    id: uuidv4(),
    timestamp: new Date(),
    hazardType: cluster.hazardType,
    severity: cluster.severity,
    confidence: cluster.confidence,
    region: {
      name: cluster.region,
      bounds: {
        type: 'Polygon',
        coordinates: [[
          [cluster.centroid.longitude - 0.1, cluster.centroid.latitude - 0.1],
          [cluster.centroid.longitude + 0.1, cluster.centroid.latitude - 0.1],
          [cluster.centroid.longitude + 0.1, cluster.centroid.latitude + 0.1],
          [cluster.centroid.longitude - 0.1, cluster.centroid.latitude + 0.1],
          [cluster.centroid.longitude - 0.1, cluster.centroid.latitude - 0.1],
        ]],
      },
      affectedPopulation: 0,
    },
    relatedReports: cluster.reports.map(r => r.id),
    status: 'active' as AlertStatus,
    aiSummary: `${cluster.severity.charAt(0).toUpperCase() + cluster.severity.slice(1)} ${cluster.hazardType.replace('_', ' ')} alert: ${cluster.reports.length} reports in ${cluster.region}`,
    escalationReason: {
      reportCount: cluster.reports.length,
      sourceTypes: [...new Set(cluster.reports.map(r => r.source))],
      timeWindow: `${Math.round((cluster.endTime.getTime() - cluster.startTime.getTime()) / (1000 * 60 * 60))} hours`,
      geographicSpread: CLUSTERING_CONFIG.spatialRadiusKm,
      thresholdsMet: ['minimum_reports', 'confidence_threshold'],
      reasoning: `Clustered ${cluster.reports.length} reports within ${CLUSTERING_CONFIG.spatialRadiusKm}km radius`,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Generate safety recommendations based on hazard type and severity
 */
function generateRecommendations(hazardType: HazardType, severity: SeverityLevel): string[] {
  const recommendations: Record<HazardType, Record<SeverityLevel, string[]>> = {
    flooding: {
      high: ['Evacuate low-lying areas immediately', 'Move to higher ground', 'Avoid walking or driving through flood waters', 'Contact emergency services if trapped'],
      moderate: ['Monitor water levels', 'Prepare emergency supplies', 'Avoid flood-prone areas', 'Stay informed through official channels'],
      low: ['Be aware of rising water levels', 'Avoid unnecessary travel in affected areas'],
    },
    storm_surge: {
      high: ['Evacuate coastal areas immediately', 'Move inland to higher ground', 'Do not return until authorities declare safe'],
      moderate: ['Prepare for possible evacuation', 'Secure loose outdoor items', 'Stay away from beaches'],
      low: ['Monitor weather updates', 'Avoid coastal areas during high tide'],
    },
    high_waves: {
      high: ['Stay away from beaches and coastal areas', 'Do not attempt water activities', 'Heed all warning signs'],
      moderate: ['Exercise caution near water', 'Avoid swimming', 'Keep children away from shoreline'],
      low: ['Be cautious near water', 'Check conditions before water activities'],
    },
    erosion: {
      high: ['Evacuate cliff-top areas', 'Stay away from eroding coastline', 'Report any structural damage'],
      moderate: ['Avoid walking near cliff edges', 'Monitor for signs of land movement'],
      low: ['Be aware of unstable ground', 'Report any visible erosion'],
    },
    rip_current: {
      high: ['Do not enter the water', 'If caught, swim parallel to shore', 'Signal for help if needed'],
      moderate: ['Swim only in designated areas', 'Stay close to shore', 'Swim with a buddy'],
      low: ['Be aware of current conditions', 'Know how to escape rip currents'],
    },
    tsunami: {
      high: ['Move to high ground immediately', 'Do not wait for official warning', 'Stay away from coast until all-clear'],
      moderate: ['Be prepared to evacuate', 'Know your evacuation route', 'Monitor official channels'],
      low: ['Be aware of tsunami signs', 'Know evacuation procedures'],
    },
    pollution: {
      high: ['Avoid contact with affected water', 'Do not consume seafood from area', 'Report to environmental authorities'],
      moderate: ['Limit exposure to affected areas', 'Wash thoroughly after any contact'],
      low: ['Be aware of water quality', 'Follow local advisories'],
    },
    other: {
      high: ['Follow official guidance', 'Stay informed', 'Prepare emergency supplies'],
      moderate: ['Monitor situation', 'Be prepared to act'],
      low: ['Stay aware of conditions'],
    },
  };

  return recommendations[hazardType]?.[severity] || recommendations.other[severity];
}

/**
 * Main fusion process - cluster reports and generate/update alerts
 */
export async function processReports(reports: Report[]): Promise<FusionResult> {
  const result: FusionResult = {
    clusters: [],
    newAlerts: [],
    updatedAlerts: [],
    processedReportIds: [],
  };

  if (reports.length === 0) return result;

  try {
    // Filter to only pending/unprocessed reports
    const pendingReports = reports.filter(r => r.status === 'pending');
    
    if (pendingReports.length === 0) {
      logger.debug('No pending reports to process');
      return result;
    }

    // Cluster reports
    const clusters = clusterReports(pendingReports);
    result.clusters = clusters;

    logger.info(`Created ${clusters.length} clusters from ${pendingReports.length} reports`);

    // Process each cluster
    for (const cluster of clusters) {
      // Check confidence threshold
      if (cluster.confidence < CLUSTERING_CONFIG.minConfidenceForAlert) {
        logger.debug(`Cluster ${cluster.id} below confidence threshold (${cluster.confidence})`);
        continue;
      }

      // Check for existing matching alert (deduplication)
      const existingAlert = await findMatchingAlert(cluster);

      if (existingAlert) {
        // Update existing alert
        const updatedRelatedReports = [...new Set([...existingAlert.relatedReports, ...cluster.reports.map(r => r.id)])];
        const newConfidence = Math.max(existingAlert.confidence, cluster.confidence);
        
        // Update alert status in database
        await dbQueries.updateAlertStatus(existingAlert.id, existingAlert.status);

        result.updatedAlerts.push({ ...existingAlert, relatedReports: updatedRelatedReports, confidence: newConfidence });
        logger.info(`Updated existing alert ${existingAlert.id} with ${cluster.reports.length} new reports`);
      } else {
        // Create new alert
        const newAlert = createAlertFromCluster(cluster);
        await dbQueries.createAlert(newAlert);
        result.newAlerts.push(newAlert);
        logger.info(`Created new alert ${newAlert.id} for ${cluster.hazardType} in ${cluster.region}`);
      }

      // Mark reports as processed
      for (const report of cluster.reports) {
        await dbQueries.updateReportStatus(report.id, 'verified');
        result.processedReportIds.push(report.id);
      }
    }

    // Invalidate caches
    await cacheManager.invalidateActiveAlerts();
    await cacheManager.invalidateDashboardData();

    return result;
  } catch (error) {
    logger.error('Fusion process error:', error);
    throw error;
  }
}

/**
 * Run fusion on recent unprocessed reports
 */
export async function runFusionCycle(): Promise<FusionResult> {
  try {
    const recentReports = await dbQueries.getRecentReports(100);
    const pendingReports = recentReports.filter(r => r.status === 'pending');
    
    if (pendingReports.length === 0) {
      return { clusters: [], newAlerts: [], updatedAlerts: [], processedReportIds: [] };
    }

    return await processReports(pendingReports);
  } catch (error) {
    logger.error('Fusion cycle error:', error);
    throw error;
  }
}

export const fusionEngine = {
  processReports,
  runFusionCycle,
  clusterReports,
  createAlertFromCluster,
  generateRecommendations,
};

export default fusionEngine;
