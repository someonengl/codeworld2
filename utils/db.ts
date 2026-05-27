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

let pool: mysql.Pool;
if (databaseUrl) {
  try {
    const parsed = new URL(databaseUrl);
    const host = parsed.hostname;
    const port = parsed.port ? parseInt(parsed.port, 10) : 3306;
    const user = decodeURIComponent(parsed.username);
    const password = decodeURIComponent(parsed.password);
    const database = parsed.pathname.substring(1); // remove leading slash
    
    pool = mysql.createPool({
      host,
      port,
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 10000, // 10s connection timeout
      enableKeepAlive: true,
      keepAliveInitialDelay: 0
    });
  } catch (err) {
    console.warn("⚠️ Warning: DATABASE_URL could not be parsed as a URL object. Falling back to raw connection pool creation.", err);
    pool = mysql.createPool(databaseUrl);
  }
} else {
  pool = null as any;
}

export const db = globalForDb.db || pool;

if (process.env.NODE_ENV !== 'production' && db) globalForDb.db = db;
