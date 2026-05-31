# --- Build Stage ---
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci
COPY . .

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# --- Production Runner Stage ---
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 1. Install curl to fetch the binary
RUN apk add --no-cache curl

# 2. Download cloudflared and place it where UID 65532 can execute it
RUN curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /usr/local/bin/cloudflared \
    && chmod +x /usr/local/bin/cloudflared

# 3. Explicitly define user 65532 (nonroot) inside this layer
RUN addgroup -g 65532 nonroot && adduser -D -u 65532 -G nonroot nonroot

# Copy build artifacts and grant explicit ownership to our nonroot user
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nonroot:nonroot /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

RUN chown -R nonroot:nonroot /app

# Switch to the exact user matching your local environment configuration
USER nonroot

EXPOSE 3000

# 4. Run both processes concurrently in the foreground to prevent thread execution cuts
# Boot cloudflared natively, pause for handshake, then execute Next.js in the foreground
# Force IPv4 connection routing to match Render's network restrictions
# Force IPv4 connection routing to match Render's network restrictions
# Force cloudflared to use IPv4 only and ignore the unreachable IPv6 address

# Route cloudflared safely past the IPv6 block using standard Go runtime overrides
# Force cloudflared to route requests directly over Cloudflare's IPv4 edge network interface
CMD /usr/local/bin/cloudflared access tcp --hostname db.nobasstorage.online --destination 172.66.43.190:443 --listener 127.0.0.1:3306 --id "$CF_CLIENT_ID" --secret "$CF_CLIENT_SECRET" & sleep 2 && exec npm run start