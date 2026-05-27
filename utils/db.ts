import mysql from 'mysql2/promise';

const globalForDb = global as unknown as { db: mysql.Pool | undefined };

const databaseUrl = process.env.DATABASE_URL;

// ============ RENDER DEBUG BOOT LOG ============
console.log("=== RENDER_DB_BOOT_LOG ===");
console.log("  NODE_ENV:", process.env.NODE_ENV);
console.log("  DATABASE_URL defined:", !!databaseUrl);
console.log("  DATABASE_URL value:", databaseUrl ? databaseUrl.replace(/:[^:@]+@/, ':***@') : 'MISSING');
console.log("  DB_BRIDGE_URL defined:", !!process.env.DB_BRIDGE_URL);
console.log("  BRIDGE_SECRET defined:", !!process.env.BRIDGE_SECRET);
console.log("  CF_CLIENT_ID defined:", !!process.env.CF_CLIENT_ID);
console.log("  CF_CLIENT_SECRET defined:", !!process.env.CF_CLIENT_SECRET);
console.log("===========================");

// ---------------------------------------------------------------------------
// PRODUCTION: HTTPS Database Bridge
// When DB_BRIDGE_URL is set, queries are sent via HTTP POST to the bridge
// server running on the home network (exposed via Cloudflare Tunnel).
// The Cloudflare Access service token headers are injected automatically.
// ---------------------------------------------------------------------------
function createHttpBridge() {
  const bridgeUrl = process.env.DB_BRIDGE_URL!;        // e.g. https://nobasstorage.online/query
  const bridgeSecret = process.env.BRIDGE_SECRET || '';
  const cfClientId = process.env.CF_CLIENT_ID || '';
  const cfClientSecret = process.env.CF_CLIENT_SECRET || '';

  console.log("🌉 Production mode: Using HTTPS Database Bridge");
  console.log("   Bridge URL:", bridgeUrl);

  const bridge = {
    async query(sql: string, values?: any[]): Promise<[any[], any[]]> {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Bridge-Secret': bridgeSecret,
      };

      // Inject Cloudflare Access service token headers if available
      if (cfClientId) headers['CF-Access-Client-Id'] = cfClientId;
      if (cfClientSecret) headers['CF-Access-Client-Secret'] = cfClientSecret;

      const response = await fetch(bridgeUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ sql, values: values || [] }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error("=== BRIDGE_QUERY_FAILURE ===", response.status, errorBody);
        throw new Error(`Bridge query failed (${response.status}): ${errorBody}`);
      }

      const result = await response.json();

      if (result.error) {
        throw new Error(`Bridge DB error: ${result.error}`);
      }

      // Return in mysql2-compatible format: [rows, fields]
      return [result.rows, result.fields || []];
    },

    // Pool-compatible methods used by the codebase
    async getConnection() {
      return { query: bridge.query, release: () => {} };
    },
    async end() { /* no-op for HTTP bridge */ }
  };

  return bridge;
}

// ---------------------------------------------------------------------------
// LOCAL: Standard mysql2 Connection Pool
// When running locally, connect directly to MariaDB via TCP.
// ---------------------------------------------------------------------------
function createLocalPool(url: string): mysql.Pool {
  const parsed = new URL(url);
  const host = parsed.hostname;
  const port = parsed.port ? parseInt(parsed.port, 10) : 3306;
  const user = decodeURIComponent(parsed.username);
  const password = decodeURIComponent(parsed.password);
  const database = parsed.pathname.substring(1);

  console.log("=== DB_POOL_CONFIG ===");
  console.log("  Host:", host);
  console.log("  Port:", port);
  console.log("  User:", user);
  console.log("  Database:", database);
  console.log("======================");

  return mysql.createPool({
    host,
    port,
    user,
    password,
    database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 10000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
  });
}

// ---------------------------------------------------------------------------
// INITIALIZATION: Choose the right driver based on environment
// ---------------------------------------------------------------------------
let pool: any = null;

if (process.env.DB_BRIDGE_URL) {
  // PRODUCTION: Use the HTTPS bridge (Render → Cloudflare → Home Server)
  try {
    pool = createHttpBridge();
    console.log("✅ HTTPS Database Bridge initialized.");
  } catch (err) {
    console.error("=== BRIDGE_INIT_CRASH ===", err);
  }
} else if (databaseUrl) {
  // LOCAL: Use standard mysql2 pool (direct LAN connection)
  try {
    pool = createLocalPool(databaseUrl);
    console.log("✅ Local database pool created successfully.");
  } catch (err) {
    console.error("=== LOCAL_DB_POOL_CRASH ===", err);
    try {
      pool = mysql.createPool(databaseUrl);
      console.log("✅ Fallback pool created from raw DATABASE_URL.");
    } catch (fallbackErr) {
      console.error("=== LOCAL_DB_FALLBACK_CRASH ===", fallbackErr);
    }
  }
} else {
  console.warn("⚠️ No DATABASE_URL or DB_BRIDGE_URL defined. Database will not be available.");
}

export const db = globalForDb.db || pool;

if (process.env.NODE_ENV !== 'production' && db) globalForDb.db = db;
