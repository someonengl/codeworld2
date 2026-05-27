import mysql from 'mysql2/promise';

const globalForDb = global as unknown as { db: mysql.Pool | undefined };

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is missing inside .env.local');
}

export const db =
  globalForDb.db ||
  mysql.createPool(process.env.DATABASE_URL);

if (process.env.NODE_ENV !== 'production') globalForDb.db = db;
