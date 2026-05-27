import mysql from 'mysql2/promise';

const globalForDb = global as unknown as { db: mysql.Pool | undefined };

const databaseUrl = process.env.DATABASE_URL;

// ============ RENDER DEBUG BOOT LOG ============
console.log("=== RENDER_DB_BOOT_LOG ===");
console.log("  NODE_ENV:", process.env.NODE_ENV);
console.log("  DATABASE_URL defined:", !!databaseUrl);
console.log("  DATABASE_URL value:", databaseUrl ? databaseUrl.replace(/:[^:@]+@/, ':***@') : 'MISSING');
console.log("  CF_CLIENT_ID defined:", !!process.env.CF_CLIENT_ID);
console.log("  CF_CLIENT_SECRET defined:", !!process.env.CF_CLIENT_SECRET);
console.log("  CF_TUNNEL_HOSTNAME:", process.env.CF_TUNNEL_HOSTNAME || 'MISSING');
console.log("===========================");

if (!databaseUrl) {
  if (process.env.NODE_ENV === 'production') {
    console.warn("⚠️ Warning: DATABASE_URL environment variable is not defined in production environment!");
  } else {
    console.warn("⚠️ Warning: DATABASE_URL environment variable is missing inside .env.local");
  }
}

let pool: mysql.Pool = null as any;

if (databaseUrl) {
  try {
    const parsed = new URL(databaseUrl);
    let host = parsed.hostname;
    let port = parsed.port ? parseInt(parsed.port, 10) : 3306;
    const user = decodeURIComponent(parsed.username);
    const password = decodeURIComponent(parsed.password);
    const database = parsed.pathname.substring(1); // remove leading slash

    // In production on Render, cloudflared sidecar listens on 127.0.0.1:3306
    // Override the host to route through the local tunnel bridge
    if (process.env.CF_CLIENT_ID && process.env.CF_CLIENT_SECRET) {
      console.log("🔒 Production tunnel detected: routing database traffic through cloudflared sidecar at 127.0.0.1:3306");
      host = '127.0.0.1';
      port = 3306;
    }

    console.log("=== RENDER_DB_POOL_CONFIG ===");
    console.log("  Connecting to host:", host);
    console.log("  Port:", port);
    console.log("  User:", user);
    console.log("  Database:", database);
    console.log("=============================");

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

    console.log("✅ Database pool created successfully.");
  } catch (err) {
    console.error("=== RENDER_DB_POOL_CREATION_CRASH ===", err);
    // Attempt raw fallback — do NOT let this crash the boot
    try {
      pool = mysql.createPool(databaseUrl);
      console.log("✅ Fallback pool created from raw DATABASE_URL.");
    } catch (fallbackErr) {
      console.error("=== RENDER_DB_FALLBACK_CRASH ===", fallbackErr);
      pool = null as any;
    }
  }
}

export const db = globalForDb.db || pool;

if (process.env.NODE_ENV !== 'production' && db) globalForDb.db = db;
