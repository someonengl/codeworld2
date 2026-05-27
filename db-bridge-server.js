#!/usr/bin/env node
// =============================================================================
// CodeWorld Database Bridge Server
// Runs on YOUR HOME SERVER alongside MariaDB.
// Accepts SQL queries over HTTP and executes them against the local database.
// Cloudflare Tunnel exposes this as an HTTPS endpoint.
// =============================================================================

const http = require('http');
const mysql = require('mysql2/promise');

const PORT = process.env.BRIDGE_PORT || 8787;
const DB_URL = process.env.DATABASE_URL || 'mysql://nextcloud:cloud_1q2w3e4r5t@127.0.0.1:3306/my_migrated_app';

// A shared secret so only our own app can execute queries
const BRIDGE_SECRET = process.env.BRIDGE_SECRET || 'codeworld_bridge_secret_key_2026';

const pool = mysql.createPool({
  uri: DB_URL,
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  connectTimeout: 10000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

const server = http.createServer(async (req, res) => {
  // Health check
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
    return;
  }

  // Only accept POST to /query
  if (req.method !== 'POST' || req.url !== '/query') {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
    return;
  }

  // Verify bridge secret
  const authHeader = req.headers['x-bridge-secret'];
  if (authHeader !== BRIDGE_SECRET) {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Forbidden: invalid bridge secret' }));
    return;
  }

  // Parse body
  let body = '';
  for await (const chunk of req) body += chunk;

  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid JSON body' }));
    return;
  }

  const { sql, values } = parsed;
  if (!sql) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Missing sql field' }));
    return;
  }

  try {
    const [rows, fields] = await pool.query(sql, values || []);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ rows, fields: fields?.map(f => ({ name: f.name, type: f.type })) }));
  } catch (err) {
    console.error('❌ Bridge query error:', err.message);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message, code: err.code }));
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🌉 CodeWorld DB Bridge Server listening on port ${PORT}`);
  console.log(`   Database: ${DB_URL.replace(/:[^:@]+@/, ':***@')}`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
  console.log(`   Query endpoint: http://localhost:${PORT}/query`);
});
