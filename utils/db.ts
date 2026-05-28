import mysql from 'mysql2/promise';

const globalForDb = global as unknown as { db: any };

const databaseUrl = process.env.DATABASE_URL;

// ============ RENDER DEBUG BOOT LOG ============
console.log("=== RENDER_DB_BOOT_LOG ===");
console.log("  NODE_ENV:", process.env.NODE_ENV);
console.log("  DATABASE_URL defined:", !!databaseUrl);
console.log("  DATABASE_URL value:", databaseUrl ? databaseUrl.replace(/:[^:@]+@/, ':***@') : 'MISSING');
console.log("===========================");

// ---------------------------------------------------------------------------
// Parse DATABASE_URL into individual connection tokens
// ---------------------------------------------------------------------------
let dbUser = '';
let dbPassword = '';
let dbDatabase = '';
let dbHost = '127.0.0.1';
let dbPort = 3306;

if (databaseUrl) {
  try {
    const parsed = new URL(databaseUrl);
    dbHost = parsed.hostname;
    dbPort = parsed.port ? parseInt(parsed.port, 10) : 3306;
    dbUser = decodeURIComponent(parsed.username);
    dbPassword = decodeURIComponent(parsed.password);
    dbDatabase = parsed.pathname.substring(1);
  } catch (err) {
    console.error("=== DATABASE_URL_PARSE_ERROR ===", err);
  }
}

// ---------------------------------------------------------------------------
// Database Connection Pool
// Direct TCP connection to MariaDB.
// ---------------------------------------------------------------------------
function createDbPool(): mysql.Pool {
  console.log("=== DB_POOL_CONFIG ===");
  console.log("  Host:", dbHost);
  console.log("  Port:", dbPort);
  console.log("  User:", dbUser);
  console.log("  Database:", dbDatabase);
  console.log("======================");

  return mysql.createPool({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: dbDatabase,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 10000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  });
}

// ---------------------------------------------------------------------------
// LAZY INITIALIZATION: Dynamically choose the driver based on active environment variables at query time
// ---------------------------------------------------------------------------
let pool: mysql.Pool | null = null;

function getPool(): mysql.Pool {
  if (globalForDb.db) return globalForDb.db;
  if (pool) return pool;

  try {
    pool = createDbPool();
    console.log("✅ Database connection pool lazily created successfully.");
  } catch (err) {
    console.error("=== DB_POOL_CRASH ===", err);
    if (databaseUrl) {
      try {
        pool = mysql.createPool(databaseUrl);
        console.log("✅ Fallback pool created from raw DATABASE_URL.");
      } catch (fallbackErr) {
        console.error("=== DB_FALLBACK_CRASH ===", fallbackErr);
      }
    }
  }

  if (process.env.NODE_ENV !== 'production' && pool) {
    globalForDb.db = pool;
  }

  if (!pool) {
    throw new Error("Failed to initialize database pool.");
  }

  return pool;
}

export const db = {
  async query(sql: string, values?: any[]) {
    const activePool = getPool();
    return activePool.query(sql, values);
  },
  async getConnection() {
    const activePool = getPool();
    return activePool.getConnection();
  },
  async end() {
    if (pool) {
      await pool.end();
      pool = null;
    }
    if (globalForDb.db) {
      await globalForDb.db.end();
      globalForDb.db = null;
    }
  }
};
