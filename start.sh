#!/bin/bash
# =============================================================================
# CodeWorld Production Start Script
# =============================================================================

echo "🚀 Starting Next.js production server..."
echo "   NODE_ENV: $NODE_ENV"
echo "   DB_BRIDGE_URL defined: $([ -n \"$DB_BRIDGE_URL\" ] && echo 'yes' || echo 'no')"

exec npm run start
