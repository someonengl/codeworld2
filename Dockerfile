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

# Create a non-root system user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy essential build artifacts from the builder layer
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER nextjs

EXPOSE 3000

CMD ["npm", "run", "start"]
