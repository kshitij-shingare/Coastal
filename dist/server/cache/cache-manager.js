"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheManager = void 0;
exports.getActiveAlerts = getActiveAlerts;
exports.cacheActiveAlerts = cacheActiveAlerts;
exports.getAlert = getAlert;
exports.cacheAlert = cacheAlert;
exports.invalidateAlert = invalidateAlert;
exports.invalidateActiveAlerts = invalidateActiveAlerts;
exports.invalidateAllAlerts = invalidateAllAlerts;
exports.getRecentReports = getRecentReports;
exports.cacheRecentReports = cacheRecentReports;
exports.getReport = getReport;
exports.cacheReport = cacheReport;
exports.invalidateReport = invalidateReport;
exports.invalidateRecentReports = invalidateRecentReports;
exports.invalidateAllReports = invalidateAllReports;
exports.getDashboardData = getDashboardData;
exports.cacheDashboardData = cacheDashboardData;
exports.invalidateDashboardData = invalidateDashboardData;
exports.getSystemStats = getSystemStats;
exports.cacheSystemStats = cacheSystemStats;
exports.invalidateSystemStats = invalidateSystemStats;
exports.invalidateAll = invalidateAll;
exports.healthCheck = healthCheck;
const redis_1 = require("./redis");
const logger_1 = require("../utils/logger");
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
const memoryCache = new Map();
// Memory cache operations
function memoryGet(key) {
    const item = memoryCache.get(key);
    if (!item)
        return null;
    if (Date.now() > item.expiry) {
        memoryCache.delete(key);
        return null;
    }
    return item.value;
}
function memorySet(key, value, ttlSeconds) {
    memoryCache.set(key, {
        value,
        expiry: Date.now() + ttlSeconds * 1000,
    });
}
function memoryDel(key) {
    memoryCache.delete(key);
}
function memoryDelPattern(pattern) {
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
async function getActiveAlerts() {
    if ((0, redis_1.isRedisAvailable)()) {
        return (0, redis_1.get)(CACHE_KEYS.ACTIVE_ALERTS);
    }
    return memoryGet(CACHE_KEYS.ACTIVE_ALERTS);
}
async function cacheActiveAlerts(alerts) {
    if ((0, redis_1.isRedisAvailable)()) {
        await (0, redis_1.set)(CACHE_KEYS.ACTIVE_ALERTS, alerts, DEFAULT_TTL.ALERTS);
    }
    else {
        memorySet(CACHE_KEYS.ACTIVE_ALERTS, alerts, DEFAULT_TTL.ALERTS);
    }
    logger_1.logger.debug('Cached active alerts', { count: alerts.length });
}
async function getAlert(id) {
    const key = `${CACHE_KEYS.ALERT_PREFIX}${id}`;
    if ((0, redis_1.isRedisAvailable)()) {
        return (0, redis_1.get)(key);
    }
    return memoryGet(key);
}
async function cacheAlert(alert) {
    const key = `${CACHE_KEYS.ALERT_PREFIX}${alert.id}`;
    if ((0, redis_1.isRedisAvailable)()) {
        await (0, redis_1.set)(key, alert, DEFAULT_TTL.SINGLE_ITEM);
    }
    else {
        memorySet(key, alert, DEFAULT_TTL.SINGLE_ITEM);
    }
}
async function invalidateAlert(id) {
    const key = `${CACHE_KEYS.ALERT_PREFIX}${id}`;
    if ((0, redis_1.isRedisAvailable)()) {
        await (0, redis_1.del)(key);
    }
    else {
        memoryDel(key);
    }
    // Also invalidate active alerts list
    await invalidateActiveAlerts();
}
async function invalidateActiveAlerts() {
    if ((0, redis_1.isRedisAvailable)()) {
        await (0, redis_1.del)(CACHE_KEYS.ACTIVE_ALERTS);
    }
    else {
        memoryDel(CACHE_KEYS.ACTIVE_ALERTS);
    }
    logger_1.logger.debug('Invalidated active alerts cache');
}
async function invalidateAllAlerts() {
    if ((0, redis_1.isRedisAvailable)()) {
        await (0, redis_1.delPattern)(`${CACHE_KEYS.ALERT_PREFIX}*`);
        await (0, redis_1.del)(CACHE_KEYS.ACTIVE_ALERTS);
    }
    else {
        memoryDelPattern(`${CACHE_KEYS.ALERT_PREFIX}*`);
        memoryDel(CACHE_KEYS.ACTIVE_ALERTS);
    }
    logger_1.logger.debug('Invalidated all alerts cache');
}
// ============================================================================
// Report Cache Operations
// ============================================================================
async function getRecentReports() {
    if ((0, redis_1.isRedisAvailable)()) {
        return (0, redis_1.get)(CACHE_KEYS.RECENT_REPORTS);
    }
    return memoryGet(CACHE_KEYS.RECENT_REPORTS);
}
async function cacheRecentReports(reports) {
    if ((0, redis_1.isRedisAvailable)()) {
        await (0, redis_1.set)(CACHE_KEYS.RECENT_REPORTS, reports, DEFAULT_TTL.REPORTS);
    }
    else {
        memorySet(CACHE_KEYS.RECENT_REPORTS, reports, DEFAULT_TTL.REPORTS);
    }
    logger_1.logger.debug('Cached recent reports', { count: reports.length });
}
async function getReport(id) {
    const key = `${CACHE_KEYS.REPORT_PREFIX}${id}`;
    if ((0, redis_1.isRedisAvailable)()) {
        return (0, redis_1.get)(key);
    }
    return memoryGet(key);
}
async function cacheReport(report) {
    const key = `${CACHE_KEYS.REPORT_PREFIX}${report.id}`;
    if ((0, redis_1.isRedisAvailable)()) {
        await (0, redis_1.set)(key, report, DEFAULT_TTL.SINGLE_ITEM);
    }
    else {
        memorySet(key, report, DEFAULT_TTL.SINGLE_ITEM);
    }
}
async function invalidateReport(id) {
    const key = `${CACHE_KEYS.REPORT_PREFIX}${id}`;
    if ((0, redis_1.isRedisAvailable)()) {
        await (0, redis_1.del)(key);
    }
    else {
        memoryDel(key);
    }
    // Also invalidate recent reports list
    await invalidateRecentReports();
}
async function invalidateRecentReports() {
    if ((0, redis_1.isRedisAvailable)()) {
        await (0, redis_1.del)(CACHE_KEYS.RECENT_REPORTS);
    }
    else {
        memoryDel(CACHE_KEYS.RECENT_REPORTS);
    }
    logger_1.logger.debug('Invalidated recent reports cache');
}
async function invalidateAllReports() {
    if ((0, redis_1.isRedisAvailable)()) {
        await (0, redis_1.delPattern)(`${CACHE_KEYS.REPORT_PREFIX}*`);
        await (0, redis_1.del)(CACHE_KEYS.RECENT_REPORTS);
    }
    else {
        memoryDelPattern(`${CACHE_KEYS.REPORT_PREFIX}*`);
        memoryDel(CACHE_KEYS.RECENT_REPORTS);
    }
    logger_1.logger.debug('Invalidated all reports cache');
}
// ============================================================================
// Dashboard Cache Operations
// ============================================================================
async function getDashboardData() {
    if ((0, redis_1.isRedisAvailable)()) {
        return (0, redis_1.get)(CACHE_KEYS.DASHBOARD_DATA);
    }
    return memoryGet(CACHE_KEYS.DASHBOARD_DATA);
}
async function cacheDashboardData(data) {
    if ((0, redis_1.isRedisAvailable)()) {
        await (0, redis_1.set)(CACHE_KEYS.DASHBOARD_DATA, data, DEFAULT_TTL.DASHBOARD);
    }
    else {
        memorySet(CACHE_KEYS.DASHBOARD_DATA, data, DEFAULT_TTL.DASHBOARD);
    }
    logger_1.logger.debug('Cached dashboard data');
}
async function invalidateDashboardData() {
    if ((0, redis_1.isRedisAvailable)()) {
        await (0, redis_1.del)(CACHE_KEYS.DASHBOARD_DATA);
    }
    else {
        memoryDel(CACHE_KEYS.DASHBOARD_DATA);
    }
    logger_1.logger.debug('Invalidated dashboard cache');
}
// ============================================================================
// Stats Cache Operations
// ============================================================================
async function getSystemStats() {
    if ((0, redis_1.isRedisAvailable)()) {
        return (0, redis_1.get)(CACHE_KEYS.SYSTEM_STATS);
    }
    return memoryGet(CACHE_KEYS.SYSTEM_STATS);
}
async function cacheSystemStats(stats) {
    if ((0, redis_1.isRedisAvailable)()) {
        await (0, redis_1.set)(CACHE_KEYS.SYSTEM_STATS, stats, DEFAULT_TTL.STATS);
    }
    else {
        memorySet(CACHE_KEYS.SYSTEM_STATS, stats, DEFAULT_TTL.STATS);
    }
    logger_1.logger.debug('Cached system stats');
}
async function invalidateSystemStats() {
    if ((0, redis_1.isRedisAvailable)()) {
        await (0, redis_1.del)(CACHE_KEYS.SYSTEM_STATS);
    }
    else {
        memoryDel(CACHE_KEYS.SYSTEM_STATS);
    }
    logger_1.logger.debug('Invalidated system stats cache');
}
// ============================================================================
// Utility Operations
// ============================================================================
async function invalidateAll() {
    await Promise.all([
        invalidateAllAlerts(),
        invalidateAllReports(),
        invalidateDashboardData(),
        invalidateSystemStats(),
    ]);
    logger_1.logger.info('Invalidated all caches');
}
async function healthCheck() {
    if (process.env.DEMO_MODE === 'true') {
        return true;
    }
    return (0, redis_1.healthCheck)();
}
exports.cacheManager = {
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
exports.default = exports.cacheManager;
//# sourceMappingURL=cache-manager.js.map