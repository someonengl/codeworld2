# --- Build Stage ---
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies first (leverages Docker caching)
COPY package*.json ./
RUN npm ci

# Copy the rest of your application code
COPY . .

# Set production environment variables for the build phase
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Run the next build
RUN npm run build

# --- Production Runner Stage ---
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 1. Install curl to download cloudflared (Alpine uses apk)
RUN apk add --no-cache curl

# 2. Download cloudflared and make it executable globally
RUN curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /usr/local/bin/cloudflared \
    && chmod +x /usr/local/bin/cloudflared

# Create a non-root system user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy essential build artifacts from the builder layer
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Give our non-root user ownership permissions over the execution directory if needed
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

# 3. Start cloudflared background tunnel, pause 2s for handshake, then boot Next.js
CMD /usr/local/bin/cloudflared access tcp --hostname db.nobasstorage.online --listener 127.0.0.1:3306 >/dev/null 2>&1 & sleep 2 && npm run start