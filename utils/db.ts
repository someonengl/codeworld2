import mysql from 'mysql2/promise';

const globalForDb = global as unknown as { db: mysql.Pool | undefined };

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  if (process.env.NODE_ENV === 'production') {
    console.warn("⚠️ Warning: DATABASE_URL environment variable is not defined in production environment!");
  } else {
    console.warn("⚠️ Warning: DATABASE_URL environment variable is missing inside .env.local");
  }
}

export const db =
  globalForDb.db ||
  (databaseUrl ? mysql.createPool(databaseUrl) : null as any);

if (process.env.NODE_ENV !== 'production' && db) globalForDb.db = db;
