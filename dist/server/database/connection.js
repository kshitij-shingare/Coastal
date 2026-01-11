"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDatabase = connectDatabase;
exports.getPool = getPool;
exports.getClient = getClient;
exports.query = query;
exports.transaction = transaction;
exports.healthCheck = healthCheck;
exports.closeDatabase = closeDatabase;
const pg_1 = require("pg");
const logger_1 = require("../utils/logger");
let pool = null;
let connectionRetries = 0;
const MAX_RETRIES = 5;
const RETRY_DELAY = 5000; // 5 seconds
// Database configuration from environment variables
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'coastal_hazard_intelligence',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection could not be established
};
// Create database pool
async function connectDatabase() {
    // Skip in demo mode
    if (process.env.DEMO_MODE === 'true') {
        logger_1.logger.info('Database connection skipped (DEMO MODE)');
        return null;
    }
    if (pool) {
        return pool;
    }
    try {
        pool = new pg_1.Pool(dbConfig);
        // Test the connection
        const client = await pool.connect();
        await client.query('SELECT NOW()');
        client.release();
        logger_1.logger.info('Database connected successfully', {
            host: dbConfig.host,
            port: dbConfig.port,
            database: dbConfig.database,
        });
        connectionRetries = 0;
        // Handle pool errors
        pool.on('error', (err) => {
            logger_1.logger.error('Unexpected database pool error:', err);
        });
        return pool;
    }
    catch (error) {
        connectionRetries++;
        logger_1.logger.error(`Database connection failed (attempt ${connectionRetries}/${MAX_RETRIES}):`, error);
        if (connectionRetries < MAX_RETRIES) {
            logger_1.logger.info(`Retrying database connection in ${RETRY_DELAY / 1000} seconds...`);
            await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
            return connectDatabase();
        }
        logger_1.logger.error('Max database connection retries reached');
        throw error;
    }
}
// Get database pool
function getPool() {
    return pool;
}
// Get a client from the pool
async function getClient() {
    if (process.env.DEMO_MODE === 'true' || !pool) {
        return null;
    }
    return pool.connect();
}
// Execute a query
async function query(text, params) {
    if (process.env.DEMO_MODE === 'true' || !pool) {
        logger_1.logger.debug('Query skipped (DEMO MODE or no pool):', { text });
        return { rows: [], rowCount: 0 };
    }
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;
        logger_1.logger.debug('Query executed', {
            text: text.substring(0, 100),
            duration: `${duration}ms`,
            rowCount: result.rowCount,
        });
        return { rows: result.rows, rowCount: result.rowCount };
    }
    catch (error) {
        logger_1.logger.error('Query error:', { text, error });
        throw error;
    }
}
// Execute a transaction
async function transaction(callback) {
    if (process.env.DEMO_MODE === 'true' || !pool) {
        logger_1.logger.debug('Transaction skipped (DEMO MODE or no pool)');
        return null;
    }
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    }
    catch (error) {
        await client.query('ROLLBACK');
        logger_1.logger.error('Transaction error:', error);
        throw error;
    }
    finally {
        client.release();
    }
}
// Health check
async function healthCheck() {
    if (process.env.DEMO_MODE === 'true') {
        return true;
    }
    if (!pool) {
        return false;
    }
    try {
        const client = await pool.connect();
        await client.query('SELECT 1');
        client.release();
        return true;
    }
    catch (error) {
        logger_1.logger.error('Database health check failed:', error);
        return false;
    }
}
// Close database connection
async function closeDatabase() {
    if (pool) {
        await pool.end();
        pool = null;
        logger_1.logger.info('Database connection closed');
    }
}
exports.default = {
    connectDatabase,
    getPool,
    getClient,
    query,
    transaction,
    healthCheck,
    closeDatabase,
};
//# sourceMappingURL=connection.js.map