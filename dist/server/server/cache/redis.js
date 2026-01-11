"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectRedis = connectRedis;
exports.getRedisClient = getRedisClient;
exports.isRedisAvailable = isRedisAvailable;
exports.healthCheck = healthCheck;
exports.closeRedis = closeRedis;
exports.get = get;
exports.set = set;
exports.del = del;
exports.delPattern = delPattern;
const redis_1 = require("redis");
const logger_1 = require("../utils/logger");
let redisClient = null;
let connectionRetries = 0;
const MAX_RETRIES = 5;
const RETRY_DELAY = 5000;
// Create Redis client
async function connectRedis() {
    // Skip in demo mode
    if (process.env.DEMO_MODE === 'true') {
        logger_1.logger.info('Redis connection skipped (DEMO MODE)');
        return null;
    }
    if (redisClient && redisClient.isOpen) {
        return redisClient;
    }
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    try {
        redisClient = (0, redis_1.createClient)({
            url: redisUrl,
            socket: {
                reconnectStrategy: (retries) => {
                    if (retries > MAX_RETRIES) {
                        logger_1.logger.error('Max Redis reconnection attempts reached');
                        return new Error('Max reconnection attempts reached');
                    }
                    const delay = Math.min(retries * 1000, 10000);
                    logger_1.logger.info(`Redis reconnecting in ${delay}ms (attempt ${retries})`);
                    return delay;
                },
            },
        });
        redisClient.on('error', (err) => {
            logger_1.logger.error('Redis client error:', err);
        });
        redisClient.on('connect', () => {
            logger_1.logger.info('Redis client connecting...');
        });
        redisClient.on('ready', () => {
            logger_1.logger.info('Redis client ready');
            connectionRetries = 0;
        });
        redisClient.on('end', () => {
            logger_1.logger.info('Redis client disconnected');
        });
        await redisClient.connect();
        logger_1.logger.info('Redis connected successfully', { url: redisUrl.replace(/\/\/.*@/, '//***@') });
        return redisClient;
    }
    catch (error) {
        connectionRetries++;
        logger_1.logger.error(`Redis connection failed (attempt ${connectionRetries}/${MAX_RETRIES}):`, error);
        if (connectionRetries < MAX_RETRIES) {
            logger_1.logger.info(`Retrying Redis connection in ${RETRY_DELAY / 1000} seconds...`);
            await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
            return connectRedis();
        }
        logger_1.logger.warn('Redis unavailable - falling back to in-memory cache');
        return null;
    }
}
// Get Redis client
function getRedisClient() {
    return redisClient;
}
// Check if Redis is available
function isRedisAvailable() {
    return redisClient !== null && redisClient.isOpen;
}
// Health check
async function healthCheck() {
    if (process.env.DEMO_MODE === 'true') {
        return true;
    }
    if (!redisClient || !redisClient.isOpen) {
        return false;
    }
    try {
        await redisClient.ping();
        return true;
    }
    catch (error) {
        logger_1.logger.error('Redis health check failed:', error);
        return false;
    }
}
// Close Redis connection
async function closeRedis() {
    if (redisClient && redisClient.isOpen) {
        await redisClient.quit();
        redisClient = null;
        logger_1.logger.info('Redis connection closed');
    }
}
// Generic cache operations
async function get(key) {
    if (!redisClient || !redisClient.isOpen) {
        return null;
    }
    try {
        const value = await redisClient.get(key);
        if (value) {
            return JSON.parse(value);
        }
        return null;
    }
    catch (error) {
        logger_1.logger.error('Redis get error:', { key, error });
        return null;
    }
}
async function set(key, value, ttlSeconds) {
    if (!redisClient || !redisClient.isOpen) {
        return false;
    }
    try {
        const serialized = JSON.stringify(value);
        if (ttlSeconds) {
            await redisClient.setEx(key, ttlSeconds, serialized);
        }
        else {
            await redisClient.set(key, serialized);
        }
        return true;
    }
    catch (error) {
        logger_1.logger.error('Redis set error:', { key, error });
        return false;
    }
}
async function del(key) {
    if (!redisClient || !redisClient.isOpen) {
        return false;
    }
    try {
        await redisClient.del(key);
        return true;
    }
    catch (error) {
        logger_1.logger.error('Redis del error:', { key, error });
        return false;
    }
}
async function delPattern(pattern) {
    if (!redisClient || !redisClient.isOpen) {
        return false;
    }
    try {
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
            await redisClient.del(keys);
        }
        return true;
    }
    catch (error) {
        logger_1.logger.error('Redis delPattern error:', { pattern, error });
        return false;
    }
}
exports.default = {
    connectRedis,
    getRedisClient,
    isRedisAvailable,
    healthCheck,
    closeRedis,
    get,
    set,
    del,
    delPattern,
};
//# sourceMappingURL=redis.js.map