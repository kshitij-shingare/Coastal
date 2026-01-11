"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabase = initializeDatabase;
exports.isDatabaseInitialized = isDatabaseInitialized;
exports.resetDatabase = resetDatabase;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const connection_1 = require("./connection");
const logger_1 = require("../utils/logger");
// Initialize database schema
async function initializeDatabase() {
    // Skip in demo mode
    if (process.env.DEMO_MODE === 'true') {
        logger_1.logger.info('Database initialization skipped (DEMO MODE)');
        return;
    }
    const pool = (0, connection_1.getPool)();
    if (!pool) {
        logger_1.logger.warn('No database pool available for initialization');
        return;
    }
    try {
        // Read schema file
        const schemaPath = path_1.default.join(__dirname, 'schema.sql');
        const schema = fs_1.default.readFileSync(schemaPath, 'utf8');
        // Execute schema
        await pool.query(schema);
        logger_1.logger.info('Database schema initialized successfully');
        // Verify tables exist
        const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
        const tables = tablesResult.rows.map((row) => row.table_name);
        logger_1.logger.info('Database tables:', { tables });
        // Verify PostGIS extension
        const postgisResult = await pool.query(`
      SELECT extname, extversion 
      FROM pg_extension 
      WHERE extname = 'postgis'
    `);
        if (postgisResult.rows.length > 0) {
            logger_1.logger.info('PostGIS extension enabled:', postgisResult.rows[0]);
        }
        else {
            logger_1.logger.warn('PostGIS extension not found - geographic queries may not work');
        }
    }
    catch (error) {
        logger_1.logger.error('Database initialization failed:', error);
        throw error;
    }
}
// Check if database is initialized
async function isDatabaseInitialized() {
    if (process.env.DEMO_MODE === 'true') {
        return true;
    }
    const pool = (0, connection_1.getPool)();
    if (!pool) {
        return false;
    }
    try {
        const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'reports'
      )
    `);
        return result.rows[0].exists;
    }
    catch (error) {
        logger_1.logger.error('Error checking database initialization:', error);
        return false;
    }
}
// Reset database (for testing/development)
async function resetDatabase() {
    if (process.env.NODE_ENV === 'production') {
        throw new Error('Cannot reset database in production');
    }
    if (process.env.DEMO_MODE === 'true') {
        logger_1.logger.info('Database reset skipped (DEMO MODE)');
        return;
    }
    const pool = (0, connection_1.getPool)();
    if (!pool) {
        logger_1.logger.warn('No database pool available for reset');
        return;
    }
    try {
        // Drop all tables
        await pool.query(`
      DROP TABLE IF EXISTS audit_log CASCADE;
      DROP TABLE IF EXISTS media_files CASCADE;
      DROP TABLE IF EXISTS alerts CASCADE;
      DROP TABLE IF EXISTS reports CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
      DROP TABLE IF EXISTS system_config CASCADE;
    `);
        logger_1.logger.info('Database tables dropped');
        // Re-initialize
        await initializeDatabase();
        logger_1.logger.info('Database reset complete');
    }
    catch (error) {
        logger_1.logger.error('Database reset failed:', error);
        throw error;
    }
}
exports.default = {
    initializeDatabase,
    isDatabaseInitialized,
    resetDatabase,
};
//# sourceMappingURL=init.js.map