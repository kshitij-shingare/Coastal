import { Pool, PoolClient } from 'pg';
import { logger } from '../utils/logger';

let pool: Pool | null = null;
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
export async function connectDatabase(): Promise<Pool | null> {
  // Skip in demo mode
  if (process.env.DEMO_MODE === 'true') {
    logger.info('Database connection skipped (DEMO MODE)');
    return null;
  }

  if (pool) {
    return pool;
  }

  try {
    pool = new Pool(dbConfig);

    // Test the connection
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();

    logger.info('Database connected successfully', {
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database,
    });

    connectionRetries = 0;

    // Handle pool errors
    pool.on('error', (err) => {
      logger.error('Unexpected database pool error:', err);
    });

    return pool;
  } catch (error) {
    connectionRetries++;
    logger.error(`Database connection failed (attempt ${connectionRetries}/${MAX_RETRIES}):`, error);

    if (connectionRetries < MAX_RETRIES) {
      logger.info(`Retrying database connection in ${RETRY_DELAY / 1000} seconds...`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
      return connectDatabase();
    }

    logger.error('Max database connection retries reached');
    throw error;
  }
}

// Get database pool
export function getPool(): Pool | null {
  return pool;
}

// Get a client from the pool
export async function getClient(): Promise<PoolClient | null> {
  if (process.env.DEMO_MODE === 'true' || !pool) {
    return null;
  }
  return pool.connect();
}

// Execute a query
export async function query<T = unknown>(
  text: string,
  params?: unknown[]
): Promise<{ rows: T[]; rowCount: number | null }> {
  if (process.env.DEMO_MODE === 'true' || !pool) {
    logger.debug('Query skipped (DEMO MODE or no pool):', { text });
    return { rows: [], rowCount: 0 };
  }

  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    logger.debug('Query executed', {
      text: text.substring(0, 100),
      duration: `${duration}ms`,
      rowCount: result.rowCount,
    });

    return { rows: result.rows as T[], rowCount: result.rowCount };
  } catch (error) {
    logger.error('Query error:', { text, error });
    throw error;
  }
}

// Execute a transaction
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T | null> {
  if (process.env.DEMO_MODE === 'true' || !pool) {
    logger.debug('Transaction skipped (DEMO MODE or no pool)');
    return null;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Transaction error:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Health check
export async function healthCheck(): Promise<boolean> {
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
  } catch (error) {
    logger.error('Database health check failed:', error);
    return false;
  }
}

// Close database connection
export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    logger.info('Database connection closed');
  }
}

export default {
  connectDatabase,
  getPool,
  getClient,
  query,
  transaction,
  healthCheck,
  closeDatabase,
};
