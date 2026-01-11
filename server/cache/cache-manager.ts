import { get, set, del, delPattern, isRedisAvailable, healthCheck as redisHealthCheck } from './redis';
import { logger } from '../utils/logger';
import { Report } from '../../shared/types/report';
import { Alert } from '../../shared/types/alert';
import { SystemStats, DashboardData } from '../../shared/types/api';

// Cache keys
const CACHE_KEYS = {
  ACTIVE_ALERTS: 'alerts:active',
  RECENT_REPORTS: 'reports:recent',
  DASHBOARD_DATA: 'dashboard:data',
  SYSTEM_STATS: 'stats:system',
  REPORT_PREFIX: 'report:',
  ALERT_PREFIX: 'alert:',
};

// Default TTL values (in seconds)
const DEFAULT_TTL = {
  ALERTS: 60, // 1 minute
  REPORTS: 120, // 2 minutes
  DASHBOARD: 30, // 30 seconds
  STATS: 60, // 1 minute
  SINGLE_ITEM: 300, // 5 minutes
};

// In-memory fallback cache
const memoryCache = new Map<string, { value: unknown; expiry: number }>();

// Memory cache operations
function memoryGet<T>(key: string): T | null {
  const item = memoryCache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiry) {
    memoryCache.delete(key);
    return null;
  }
  return item.value as T;
}

function memorySet(key: string, value: unknown, ttlSeconds: number): void {
  memoryCache.set(key, {
    value,
    expiry: Date.now() + ttlSeconds * 1000,
  });
}

function memoryDel(key: string): void {
  memoryCache.delete(key);
}

function memoryDelPattern(pattern: string): void {
  const regex = new RegExp(pattern.replace('*', '.*'));
  for (const key of memoryCache.keys()) {
    if (regex.test(key)) {
      memoryCache.delete(key);
    }
  }
}

// ============================================================================
// Alert Cache Operations
// ============================================================================

export async function getActiveAlerts(): Promise<Alert[] | null> {
  if (isRedisAvailable()) {
    return get<Alert[]>(CACHE_KEYS.ACTIVE_ALERTS);
  }
  return memoryGet<Alert[]>(CACHE_KEYS.ACTIVE_ALERTS);
}

export async function cacheActiveAlerts(alerts: Alert[]): Promise<void> {
  if (isRedisAvailable()) {
    await set(CACHE_KEYS.ACTIVE_ALERTS, alerts, DEFAULT_TTL.ALERTS);
  } else {
    memorySet(CACHE_KEYS.ACTIVE_ALERTS, alerts, DEFAULT_TTL.ALERTS);
  }
  logger.debug('Cached active alerts', { count: alerts.length });
}

export async function getAlert(id: string): Promise<Alert | null> {
  const key = `${CACHE_KEYS.ALERT_PREFIX}${id}`;
  if (isRedisAvailable()) {
    return get<Alert>(key);
  }
  return memoryGet<Alert>(key);
}

export async function cacheAlert(alert: Alert): Promise<void> {
  const key = `${CACHE_KEYS.ALERT_PREFIX}${alert.id}`;
  if (isRedisAvailable()) {
    await set(key, alert, DEFAULT_TTL.SINGLE_ITEM);
  } else {
    memorySet(key, alert, DEFAULT_TTL.SINGLE_ITEM);
  }
}

export async function invalidateAlert(id: string): Promise<void> {
  const key = `${CACHE_KEYS.ALERT_PREFIX}${id}`;
  if (isRedisAvailable()) {
    await del(key);
  } else {
    memoryDel(key);
  }
  // Also invalidate active alerts list
  await invalidateActiveAlerts();
}

export async function invalidateActiveAlerts(): Promise<void> {
  if (isRedisAvailable()) {
    await del(CACHE_KEYS.ACTIVE_ALERTS);
  } else {
    memoryDel(CACHE_KEYS.ACTIVE_ALERTS);
  }
  logger.debug('Invalidated active alerts cache');
}

export async function invalidateAllAlerts(): Promise<void> {
  if (isRedisAvailable()) {
    await delPattern(`${CACHE_KEYS.ALERT_PREFIX}*`);
    await del(CACHE_KEYS.ACTIVE_ALERTS);
  } else {
    memoryDelPattern(`${CACHE_KEYS.ALERT_PREFIX}*`);
    memoryDel(CACHE_KEYS.ACTIVE_ALERTS);
  }
  logger.debug('Invalidated all alerts cache');
}

// ============================================================================
// Report Cache Operations
// ============================================================================

export async function getRecentReports(): Promise<Report[] | null> {
  if (isRedisAvailable()) {
    return get<Report[]>(CACHE_KEYS.RECENT_REPORTS);
  }
  return memoryGet<Report[]>(CACHE_KEYS.RECENT_REPORTS);
}

export async function cacheRecentReports(reports: Report[]): Promise<void> {
  if (isRedisAvailable()) {
    await set(CACHE_KEYS.RECENT_REPORTS, reports, DEFAULT_TTL.REPORTS);
  } else {
    memorySet(CACHE_KEYS.RECENT_REPORTS, reports, DEFAULT_TTL.REPORTS);
  }
  logger.debug('Cached recent reports', { count: reports.length });
}

export async function getReport(id: string): Promise<Report | null> {
  const key = `${CACHE_KEYS.REPORT_PREFIX}${id}`;
  if (isRedisAvailable()) {
    return get<Report>(key);
  }
  return memoryGet<Report>(key);
}

export async function cacheReport(report: Report): Promise<void> {
  const key = `${CACHE_KEYS.REPORT_PREFIX}${report.id}`;
  if (isRedisAvailable()) {
    await set(key, report, DEFAULT_TTL.SINGLE_ITEM);
  } else {
    memorySet(key, report, DEFAULT_TTL.SINGLE_ITEM);
  }
}

export async function invalidateReport(id: string): Promise<void> {
  const key = `${CACHE_KEYS.REPORT_PREFIX}${id}`;
  if (isRedisAvailable()) {
    await del(key);
  } else {
    memoryDel(key);
  }
  // Also invalidate recent reports list
  await invalidateRecentReports();
}

export async function invalidateRecentReports(): Promise<void> {
  if (isRedisAvailable()) {
    await del(CACHE_KEYS.RECENT_REPORTS);
  } else {
    memoryDel(CACHE_KEYS.RECENT_REPORTS);
  }
  logger.debug('Invalidated recent reports cache');
}

export async function invalidateAllReports(): Promise<void> {
  if (isRedisAvailable()) {
    await delPattern(`${CACHE_KEYS.REPORT_PREFIX}*`);
    await del(CACHE_KEYS.RECENT_REPORTS);
  } else {
    memoryDelPattern(`${CACHE_KEYS.REPORT_PREFIX}*`);
    memoryDel(CACHE_KEYS.RECENT_REPORTS);
  }
  logger.debug('Invalidated all reports cache');
}

// ============================================================================
// Dashboard Cache Operations
// ============================================================================

export async function getDashboardData(): Promise<DashboardData | null> {
  if (isRedisAvailable()) {
    return get<DashboardData>(CACHE_KEYS.DASHBOARD_DATA);
  }
  return memoryGet<DashboardData>(CACHE_KEYS.DASHBOARD_DATA);
}

export async function cacheDashboardData(data: DashboardData): Promise<void> {
  if (isRedisAvailable()) {
    await set(CACHE_KEYS.DASHBOARD_DATA, data, DEFAULT_TTL.DASHBOARD);
  } else {
    memorySet(CACHE_KEYS.DASHBOARD_DATA, data, DEFAULT_TTL.DASHBOARD);
  }
  logger.debug('Cached dashboard data');
}

export async function invalidateDashboardData(): Promise<void> {
  if (isRedisAvailable()) {
    await del(CACHE_KEYS.DASHBOARD_DATA);
  } else {
    memoryDel(CACHE_KEYS.DASHBOARD_DATA);
  }
  logger.debug('Invalidated dashboard cache');
}

// ============================================================================
// Stats Cache Operations
// ============================================================================

export async function getSystemStats(): Promise<SystemStats | null> {
  if (isRedisAvailable()) {
    return get<SystemStats>(CACHE_KEYS.SYSTEM_STATS);
  }
  return memoryGet<SystemStats>(CACHE_KEYS.SYSTEM_STATS);
}

export async function cacheSystemStats(stats: SystemStats): Promise<void> {
  if (isRedisAvailable()) {
    await set(CACHE_KEYS.SYSTEM_STATS, stats, DEFAULT_TTL.STATS);
  } else {
    memorySet(CACHE_KEYS.SYSTEM_STATS, stats, DEFAULT_TTL.STATS);
  }
  logger.debug('Cached system stats');
}

export async function invalidateSystemStats(): Promise<void> {
  if (isRedisAvailable()) {
    await del(CACHE_KEYS.SYSTEM_STATS);
  } else {
    memoryDel(CACHE_KEYS.SYSTEM_STATS);
  }
  logger.debug('Invalidated system stats cache');
}

// ============================================================================
// Utility Operations
// ============================================================================

export async function invalidateAll(): Promise<void> {
  await Promise.all([
    invalidateAllAlerts(),
    invalidateAllReports(),
    invalidateDashboardData(),
    invalidateSystemStats(),
  ]);
  logger.info('Invalidated all caches');
}

export async function healthCheck(): Promise<boolean> {
  if (process.env.DEMO_MODE === 'true') {
    return true;
  }
  return redisHealthCheck();
}

export const cacheManager = {
  // Alerts
  getActiveAlerts,
  cacheActiveAlerts,
  getAlert,
  cacheAlert,
  invalidateAlert,
  invalidateActiveAlerts,
  invalidateAllAlerts,
  // Reports
  getRecentReports,
  cacheRecentReports,
  getReport,
  cacheReport,
  invalidateReport,
  invalidateRecentReports,
  invalidateAllReports,
  // Dashboard
  getDashboardData,
  cacheDashboardData,
  invalidateDashboardData,
  // Stats
  getSystemStats,
  cacheSystemStats,
  invalidateSystemStats,
  // Utility
  invalidateAll,
  healthCheck,
};

export default cacheManager;
