import fs from 'fs';
import path from 'path';
import { getPool } from './connection';
import { logger } from '../utils/logger';

// Initialize database schema
export async function initializeDatabase(): Promise<void> {
  // Skip in demo mode
  if (process.env.DEMO_MODE === 'true') {
    logger.info('Database initialization skipped (DEMO MODE)');
    return;
  }

  const pool = getPool();
  if (!pool) {
    logger.warn('No database pool available for initialization');
    return;
  }

  try {
    // Read schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Execute schema
    await pool.query(schema);
    logger.info('Database schema initialized successfully');

    // Verify tables exist
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    const tables = tablesResult.rows.map((row: { table_name: string }) => row.table_name);
    logger.info('Database tables:', { tables });

    // Verify PostGIS extension
    const postgisResult = await pool.query(`
      SELECT extname, extversion 
      FROM pg_extension 
      WHERE extname = 'postgis'
    `);

    if (postgisResult.rows.length > 0) {
      logger.info('PostGIS extension enabled:', postgisResult.rows[0]);
    } else {
      logger.warn('PostGIS extension not found - geographic queries may not work');
    }

  } catch (error) {
    logger.error('Database initialization failed:', error);
    throw error;
  }
}

// Check if database is initialized
export async function isDatabaseInitialized(): Promise<boolean> {
  if (process.env.DEMO_MODE === 'true') {
    return true;
  }

  const pool = getPool();
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
  } catch (error) {
    logger.error('Error checking database initialization:', error);
    return false;
  }
}

// Reset database (for testing/development)
export async function resetDatabase(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Cannot reset database in production');
  }

  if (process.env.DEMO_MODE === 'true') {
    logger.info('Database reset skipped (DEMO MODE)');
    return;
  }

  const pool = getPool();
  if (!pool) {
    logger.warn('No database pool available for reset');
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

    logger.info('Database tables dropped');

    // Re-initialize
    await initializeDatabase();
    logger.info('Database reset complete');
  } catch (error) {
    logger.error('Database reset failed:', error);
    throw error;
  }
}

export default {
  initializeDatabase,
  isDatabaseInitialized,
  resetDatabase,
};
