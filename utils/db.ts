import mysql from 'mysql2/promise';
import { WebSocket, createWebSocketStream } from 'ws';

const globalForDb = global as unknown as { db: any };

const databaseUrl = process.env.DATABASE_URL;
const cfClientId = process.env.CF_ACCESS_CLIENT_ID || process.env.CF_CLIENT_ID;
const cfClientSecret = process.env.CF_ACCESS_CLIENT_SECRET || process.env.CF_CLIENT_SECRET;
const tunnelHostname = process.env.CF_TUNNEL_HOSTNAME || 'nobasstorage.online';

// ============ RENDER DEBUG BOOT LOG ============
console.log("=== RENDER_DB_BOOT_LOG ===");
console.log("  NODE_ENV:", process.env.NODE_ENV);
console.log("  DATABASE_URL defined:", !!databaseUrl);
console.log("  DATABASE_URL value:", databaseUrl ? databaseUrl.replace(/:[^:@]+@/, ':***@') : 'MISSING');
console.log("  CF_ACCESS_CLIENT_ID/CF_CLIENT_ID defined:", !!cfClientId);
console.log("  CF_ACCESS_CLIENT_SECRET/CF_CLIENT_SECRET defined:", !!cfClientSecret);
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
  console.log("   Tunnel target: wss://db.nobasstorage.online/cdn-cgi/access/cli");

  /**
   * Opens a single authenticated WebSocket tunnel to Cloudflare Access,
   * wraps it in a Duplex stream, and creates a mysql2 connection over it.
   */
  async function createTunnelConnection(): Promise<mysql.Connection> {
    return new Promise((resolve, reject) => {
      const wsUrl = 'wss://db.nobasstorage.online/cdn-cgi/access/cli';

      console.log("  🌐 Opening WebSocket tunnel to:", wsUrl);

      const ws = new WebSocket(wsUrl, {
        headers: {
          'CF-Access-Client-Id': cfClientId!,
          'CF-Access-Client-Secret': cfClientSecret!,
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
// INITIALIZATION: Choose the right driver based on environment
// ---------------------------------------------------------------------------
let pool: any = null;

if (cfClientId && cfClientSecret) {
  // PRODUCTION: WebSocket tunnel through Cloudflare Access
  try {
    pool = createWebSocketTunnelPool();
    console.log("✅ WebSocket tunnel pool initialized for production.");
  } catch (err) {
    console.error("=== TUNNEL_POOL_INIT_CRASH ===", err);
  }
} else {
  // LOCAL: Standard mysql2 TCP pool
  try {
    pool = createLocalPool();
    console.log("✅ Local database pool created successfully.");
  } catch (err) {
    console.error("=== LOCAL_DB_POOL_CRASH ===", err);
    if (databaseUrl) {
      try {
        pool = mysql.createPool(databaseUrl);
        console.log("✅ Fallback pool created from raw DATABASE_URL.");
      } catch (fallbackErr) {
        console.error("=== LOCAL_DB_FALLBACK_CRASH ===", fallbackErr);
      }
    } else {
      console.warn("⚠️ No DATABASE_URL or CF tokens defined. Database will not be available.");
    }
  }
}

export const db = globalForDb.db || pool;

if (process.env.NODE_ENV !== 'production' && db) globalForDb.db = db;
