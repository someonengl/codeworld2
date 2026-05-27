#!/bin/bash
# =============================================================================
# CodeWorld Production Start Script
# Launches cloudflared tunnel sidecar + Next.js server on Render
# =============================================================================

# Only launch cloudflared in production when service tokens are configured
if [ -n "$CF_CLIENT_ID" ] && [ -n "$CF_CLIENT_SECRET" ]; then
  echo "🔒 Production mode: Starting Cloudflare Tunnel sidecar..."
  echo "   Tunnel hostname: $CF_TUNNEL_HOSTNAME"

  # Launch cloudflared TCP proxy in the background
  # This listens on 127.0.0.1:3306 and tunnels traffic to the remote database
  # with Cloudflare Access service token authentication
  cloudflared access tcp \
    --hostname "$CF_TUNNEL_HOSTNAME" \
    --url localhost:3306 \
    --service-token-id "$CF_CLIENT_ID" \
    --service-token-secret "$CF_CLIENT_SECRET" &

  CLOUDFLARED_PID=$!
  echo "✅ cloudflared started (PID: $CLOUDFLARED_PID), waiting for tunnel to initialize..."

  # Give cloudflared time to bind to the local port and establish the tunnel
  sleep 5

  # Verify it's still running
  if kill -0 $CLOUDFLARED_PID 2>/dev/null; then
    echo "✅ Cloudflare Tunnel sidecar is healthy and listening on localhost:3306"
  else
    echo "❌ WARNING: cloudflared exited unexpectedly. Database connections will fail."
    echo "   Check CF_CLIENT_ID, CF_CLIENT_SECRET, and CF_TUNNEL_HOSTNAME values."
  fi
else
  echo "ℹ️  No CF_CLIENT_ID/CF_CLIENT_SECRET found. Running without tunnel sidecar (local dev mode)."
fi

# Start the Next.js production server
echo "🚀 Starting Next.js production server..."
exec npm run start
