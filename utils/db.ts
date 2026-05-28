import mysql from 'mysql2/promise';
import { WebSocket, createWebSocketStream } from 'ws';

const globalForDb = global as unknown as { db: any };

const databaseUrl = process.env.DATABASE_URL;
const tunnelHostname = process.env.CF_TUNNEL_HOSTNAME || 'db.nobasstorage.online';

// ============ RENDER DEBUG BOOT LOG ============
console.log("=== RENDER_DB_BOOT_LOG ===");
console.log("  NODE_ENV:", process.env.NODE_ENV);
console.log("  DATABASE_URL defined:", !!databaseUrl);
console.log("  DATABASE_URL value:", databaseUrl ? databaseUrl.replace(/:[^:@]+@/, ':***@') : 'MISSING');
console.log("  CF_ACCESS_CLIENT_ID defined:", !!process.env.CF_ACCESS_CLIENT_ID);
console.log("  CF_ACCESS_CLIENT_SECRET defined:", !!process.env.CF_ACCESS_CLIENT_SECRET);
console.log("  CF_CLIENT_ID defined:", !!process.env.CF_CLIENT_ID);
console.log("  CF_CLIENT_SECRET defined:", !!process.env.CF_CLIENT_SECRET);
console.log("  CF_TUNNEL_HOSTNAME:", tunnelHostname);
console.log("===========================");

// ---------------------------------------------------------------------------
// Parse DATABASE_URL into individual connection tokens (used by both modes)
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
// PRODUCTION: WebSocket Tunnel Pool
// Creates authenticated WebSocket connections through Cloudflare Access,
// wraps them in Duplex streams, and passes them to mysql2 as the transport.
// Each query gets its own tunnel connection for correctness.
// ---------------------------------------------------------------------------
function createWebSocketTunnelPool() {
  console.log("🔒 Production mode: WebSocket tunnel pool");
  console.log("   Tunnel target: wss://db.nobasstorage.online:443");

  /**
   * Opens a single authenticated WebSocket tunnel to Cloudflare Access,
   * wraps it in a Duplex stream, and creates a mysql2 connection over it.
   */
  async function createTunnelConnection(): Promise<mysql.Connection> {
    return new Promise((resolve, reject) => {
      console.log("  🌐 Opening WebSocket tunnel to: wss://db.nobasstorage.online:443");

      const ws = new WebSocket('wss://db.nobasstorage.online:443', {
        headers: {
          'CF-Access-Client-Id': process.env.CF_ACCESS_CLIENT_ID || process.env.CF_CLIENT_ID || '',
          'CF-Access-Client-Secret': process.env.CF_ACCESS_CLIENT_SECRET || process.env.CF_CLIENT_SECRET || '',
        },
        // Ensure binary framing for MySQL protocol bytes
        perMessageDeflate: false,
      });

      const timeout = setTimeout(() => {
        ws.terminate();
        reject(new Error('WebSocket tunnel connection timed out after 15s'));
      }, 15000);

      ws.on('error', (err) => {
        clearTimeout(timeout);
        console.error("  ❌ WebSocket tunnel error:", err.message);
        reject(err);
      });

      ws.on('open', async () => {
        clearTimeout(timeout);
        console.log("  ✅ WebSocket tunnel opened successfully");

        try {
          // Wrap the WebSocket in a Node.js Duplex stream
          const duplex = createWebSocketStream(ws, { decodeStrings: false });

          // Create a mysql2 connection using the WebSocket stream as transport
          const conn = await mysql.createConnection({
            user: dbUser,
            password: dbPassword,
            database: dbDatabase,
            stream: duplex as any,
            connectTimeout: 10000,
          });

          console.log("  ✅ MySQL handshake completed over WebSocket tunnel");
          resolve(conn);
        } catch (err: any) {
          console.error("  ❌ MySQL handshake over tunnel failed:", err.message);
          ws.terminate();
          reject(err);
        }
      });
    });
  }

  // Return a pool-compatible interface
  return {
    async query(sql: string, values?: any[]) {
      let conn: mysql.Connection | null = null;
      try {
        conn = await createTunnelConnection();
        const result = await conn.query(sql, values);
        return result;
      } catch (err: any) {
        console.error("=== TUNNEL_QUERY_FAILURE ===", err.message);
        throw err;
      } finally {
        if (conn) {
          try { await conn.end(); } catch { /* ignore cleanup errors */ }
        }
      }
    },

    // Compatibility stubs
    async getConnection() {
      const conn = await createTunnelConnection();
      return {
        query: conn.query.bind(conn),
        release: () => conn.end().catch(() => {}),
      };
    },
    async end() { /* no-op */ },
  };
}

// ---------------------------------------------------------------------------
// LOCAL: Standard mysql2 Connection Pool
// Direct TCP connection to MariaDB on the local network.
// ---------------------------------------------------------------------------
function createLocalPool(): mysql.Pool {
  console.log("=== LOCAL_DB_POOL_CONFIG ===");
  console.log("  Host:", dbHost);
  console.log("  Port:", dbPort);
  console.log("  User:", dbUser);
  console.log("  Database:", dbDatabase);
  console.log("===========================");

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
let pool: any = null;

function getPool() {
  if (globalForDb.db) return globalForDb.db;
  if (pool) return pool;

  const activeClientId = process.env.CF_ACCESS_CLIENT_ID || process.env.CF_CLIENT_ID;
  const activeClientSecret = process.env.CF_ACCESS_CLIENT_SECRET || process.env.CF_CLIENT_SECRET;

  if (activeClientId && activeClientSecret) {
    // PRODUCTION: WebSocket tunnel through Cloudflare Access
    try {
      pool = createWebSocketTunnelPool();
      console.log("✅ WebSocket tunnel pool lazily initialized for production.");
    } catch (err) {
      console.error("=== LAZY_TUNNEL_POOL_INIT_CRASH ===", err);
    }
  } else {
    // LOCAL fallback: Standard mysql2 TCP pool
    try {
      pool = createLocalPool();
      console.log("✅ Local database pool lazily created successfully.");
    } catch (err) {
      console.error("=== LAZY_LOCAL_DB_POOL_CRASH ===", err);
      if (databaseUrl) {
        try {
          pool = mysql.createPool(databaseUrl);
          console.log("✅ Lazy: Fallback pool created from raw DATABASE_URL.");
        } catch (fallbackErr) {
          console.error("=== LAZY_LOCAL_DB_FALLBACK_CRASH ===", fallbackErr);
        }
      } else {
        console.warn("⚠️ No DATABASE_URL or CF tokens defined. Database will not be available.");
      }
    }
  }

  if (process.env.NODE_ENV !== 'production' && pool) {
    globalForDb.db = pool;
  }
  return pool;
}

export const db = {
  async query(sql: string, values?: any[]) {
    const activePool = getPool();
    if (!activePool) throw new Error("Database pool is not initialized.");
    return activePool.query(sql, values);
  },
  async getConnection() {
    const activePool = getPool();
    if (!activePool) throw new Error("Database pool is not initialized.");
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
