import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'tp_portal',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
};

// Create connection pool
export const db = mysql.createPool(dbConfig);

// Test database connection
export const testConnection = async (): Promise<void> => {
  try {
    const connection = await db.getConnection();
    console.log('✅ Database connected successfully');
    console.log(`📊 Database: ${process.env.DB_NAME || 'tp_portal'}`);
    connection.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
};

// Execute query helper (returns all rows)
export const executeQuery = async <T = any>(
  sql: string,
  params?: any[]
): Promise<T[]> => {
  try {
    const [rows] = await db.execute(sql, params || []);
    return rows as T[];
  } catch (error: any) {
    console.error('❌ Database query error:', error.message);
    console.error('SQL:', sql);
    console.error('Params:', params);
    throw error;
  }
};

// Execute query and return first row
export const executeQueryOne = async <T = any>(
  sql: string,
  params?: any[]
): Promise<T | null> => {
  try {
    const rows = await executeQuery<T>(sql, params);
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    throw error;
  }
};

// Begin transaction
export const beginTransaction = async () => {
  const connection = await db.getConnection();
  await connection.beginTransaction();
  return connection;
};

// Get connection from pool (for transactions)
export const getConnection = async () => {
  return await db.getConnection();
};

// Initialize database (call this on server start)
export const initializeDatabase = async () => {
  try {
    await testConnection();

    // Import and initialize lookup cache
    const { initializeLookupCache } = await import('../utils/lookup.helper');
    await initializeLookupCache();

    console.log('✅ Database initialization complete');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
};

export default db;
