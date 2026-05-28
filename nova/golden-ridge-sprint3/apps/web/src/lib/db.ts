/**
 * Database Connection Module
 * Provides PostgreSQL connection pool
 * 
 * Note: Connection configuration via environment variables
 */

import { Pool, PoolClient, QueryResult } from 'pg';

// Database configuration from environment
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'golden_ridge',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  max: parseInt(process.env.DB_POOL_MAX || '10'),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Log pool errors
pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
});

/**
 * Database interface
 */
export const db = {
  /**
   * Execute a query
   */
  async query<T = any>(
    text: string,
    params?: any[]
  ): Promise<QueryResult<T>> {
    const start = Date.now();
    try {
      const result = await pool.query<T>(text, params);
      const duration = Date.now() - start;
      
      if (process.env.NODE_ENV === 'development' && duration > 100) {
        console.log('Slow query:', { text, duration, rows: result.rowCount });
      }
      
      return result;
    } catch (error) {
      console.error('Database query error:', { text, error });
      throw error;
    }
  },
  
  /**
   * Get a client from the pool (for transactions)
   */
  async getClient(): Promise<PoolClient> {
    return await pool.connect();
  },
  
  /**
   * Execute a transaction
   */
  async transaction<T>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },
  
  /**
   * Close the pool (for graceful shutdown)
   */
  async close(): Promise<void> {
    await pool.end();
  },
};

export default db;
