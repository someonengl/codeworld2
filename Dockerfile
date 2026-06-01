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
# Override standard Linux network priority settings to drop IPv6 before booting services
# Force the internal Go network resolver to drop IPv6 results and resolve the domain over IPv4
# Enforce native IPv4 sockets and pass the explicit edge routing flag to clear out the loop
2026-06-01T11:20:15.059910441Z #15 16.77 
2026-06-01T11:20:15.059913201Z #15 16.77 ƒ Proxy (Middleware)
2026-06-01T11:20:15.059915831Z #15 16.77 
2026-06-01T11:20:15.059918821Z #15 16.77 ○  (Static)   prerendered as static content
2026-06-01T11:20:15.059921902Z #15 16.77 ƒ  (Dynamic)  server-rendered on demand
2026-06-01T11:20:15.059924592Z #15 16.77 
2026-06-01T11:20:15.10104044Z #15 DONE 17.0s
2026-06-01T11:20:15.693747044Z 
2026-06-01T11:20:15.693766616Z #16 [runner  6/10] COPY --from=builder /app/public ./public
2026-06-01T11:20:15.887914144Z #16 DONE 0.0s
2026-06-01T11:20:15.887931345Z 
2026-06-01T11:20:15.887935686Z #17 [runner  7/10] COPY --from=builder --chown=nonroot:nonroot /app/.next ./.next
2026-06-01T11:20:15.913258837Z #17 DONE 0.2s
2026-06-01T11:20:18.056251745Z 
2026-06-01T11:20:18.056277747Z #18 [runner  8/10] COPY --from=builder /app/node_modules ./node_modules
2026-06-01T11:20:26.503572576Z #18 DONE 8.4s
2026-06-01T11:20:26.656218747Z 
2026-06-01T11:20:26.656241589Z #19 [runner  9/10] COPY --from=builder /app/package.json ./package.json
2026-06-01T11:20:26.836071035Z #19 DONE 0.3s
2026-06-01T11:20:26.988064207Z 
2026-06-01T11:20:26.988088298Z #20 [runner 10/10] RUN chown -R nonroot:nonroot /app
2026-06-01T11:22:30.110425518Z #20 DONE 123.3s
2026-06-01T11:22:30.26355868Z 
2026-06-01T11:22:30.263582831Z #21 exporting to image
2026-06-01T11:22:30.263587072Z #21 exporting layers
2026-06-01T11:22:37.098798272Z #21 exporting layers 7.0s done
2026-06-01T11:22:37.268428047Z #21 exporting manifest sha256:4da619c71d7a25814001cd32e44fe6e35757f99565c560b42ba62fb42eafac30 done
2026-06-01T11:22:37.268444928Z #21 exporting config sha256:e63c17c3a6ab23581924d286c169cc96331239a85005577851253d1af5769f2a done
2026-06-01T11:22:37.268449288Z #21 pushing layers
2026-06-01T11:22:37.268452589Z #21 ...
2026-06-01T11:22:37.268455659Z 
2026-06-01T11:22:37.268459409Z #22 exporting cache to registry
2026-06-01T11:22:37.268463369Z #22 preparing build cache for export
2026-06-01T11:22:42.205384774Z #22 ...
2026-06-01T11:22:42.205408806Z 
2026-06-01T11:22:42.205414187Z #21 exporting to image
2026-06-01T11:22:42.205418787Z #21 pushing layers 5.1s done
2026-06-01T11:22:42.205423557Z #21 pushing manifest for image-registry-v2.aws-eu-central-1-1.internal.render.com/srv-d8cko06q1p3s738vqol0:bld-d8emlen7f7vs73et2hf0@sha256:4da619c71d7a25814001cd32e44fe6e35757f99565c560b42ba62fb42eafac30
2026-06-01T11:22:42.35246359Z #21 pushing manifest for image-registry-v2.aws-eu-central-1-1.internal.render.com/srv-d8cko06q1p3s738vqol0:bld-d8emlen7f7vs73et2hf0@sha256:4da619c71d7a25814001cd32e44fe6e35757f99565c560b42ba62fb42eafac30 0.1s done
2026-06-01T11:22:42.352480871Z #21 DONE 12.2s
2026-06-01T11:22:42.352485342Z 
2026-06-01T11:22:42.352491572Z #22 exporting cache to registry
2026-06-01T11:23:06.75613472Z #22 sending cache export
2026-06-01T11:23:16.73186623Z #22 writing cache image manifest sha256:0e6d5f741e293c7ae0aabafe4d25b52a803162549d28a2ccfc35838f010db097
2026-06-01T11:23:16.871225583Z #22 sending cache export 10.1s done
2026-06-01T11:23:16.871250515Z #22 writing cache image manifest sha256:0e6d5f741e293c7ae0aabafe4d25b52a803162549d28a2ccfc35838f010db097 0.1s done
2026-06-01T11:23:16.871258296Z #22 DONE 39.8s
2026-06-01T11:23:16.914923005Z ------
2026-06-01T11:23:16.914944827Z  > importing cache manifest from image-registry-v2.aws-eu-central-1-1.internal.render.com/srv-d8cko06q1p3s738vqol0:buildcache:
2026-06-01T11:23:16.914951837Z ------
2026-06-01T11:23:21.563773386Z ==> Deploying...
2026-06-01T11:23:21.768489946Z ==> Setting WEB_CONCURRENCY=1 by default, based on available CPUs in the instance
2026-06-01T11:23:42.437333317Z Incorrect Usage: flag provided but not defined: -edge-ip-version
2026-06-01T11:23:42.437379278Z 
2026-06-01T11:23:42.437393908Z NAME:
2026-06-01T11:23:42.437397968Z    cloudflared access tcp - 
2026-06-01T11:23:42.437400918Z 
2026-06-01T11:23:42.437404558Z USAGE:
2026-06-01T11:23:42.437412028Z    cloudflared access tcp [command options] [arguments...]
2026-06-01T11:23:42.437414988Z 
2026-06-01T11:23:42.437417628Z DESCRIPTION:
2026-06-01T11:23:42.43750826Z    The tcp subcommand sends data over a proxy to the Cloudflare edge.
2026-06-01T11:23:42.43751687Z 
2026-06-01T11:23:42.437520421Z OPTIONS:
2026-06-01T11:23:42.437562051Z    --hostname value, --tunnel-host value, -T value  specify the hostname of your application. [$TUNNEL_SERVICE_HOSTNAME]
2026-06-01T11:23:42.437569262Z    --destination value                              specify the destination address of your SSH server. [$TUNNEL_SERVICE_DESTINATION]
2026-06-01T11:23:42.437572231Z    --url value, --listener value, -L value          specify the host:port to forward data to Cloudflare edge. [$TUNNEL_SERVICE_URL]
2026-06-01T11:23:42.437579192Z    --header value, -H value                         specify additional headers you wish to send.  (accepts multiple inputs)
2026-06-01T11:23:42.437582152Z    --service-token-id value, --id value             specify an Access service token ID you wish to use. [$TUNNEL_SERVICE_TOKEN_ID]
2026-06-01T11:23:42.437585182Z    --service-token-secret value, --secret value     specify an Access service token secret you wish to use. [$TUNNEL_SERVICE_TOKEN_SECRET]
2026-06-01T11:23:42.437592372Z    --logfile value                                  Save application log to this file for reporting issues.
2026-06-01T11:23:42.437598952Z    --log-directory value                            Save application log to this directory for reporting issues.
2026-06-01T11:23:42.437605202Z    --log-level value, --loglevel value              Application logging level {debug, info, warn, error, fatal}.
2026-06-01T11:23:42.437611842Z    --help, -h                                       show help (default: false)
2026-06-01T11:23:42.437617962Z    
2026-06-01T11:23:45.533331364Z 
2026-06-01T11:23:45.533366284Z > codeworld@0.1.0 start
2026-06-01T11:23:45.533369635Z > next start
2026-06-01T11:23:45.533372205Z 
2026-06-01T11:23:48.620974631Z ▲ Next.js 16.2.6
2026-06-01T11:23:48.621297787Z - Local:         http://localhost:10000
2026-06-01T11:23:48.621320147Z - Network:       http://10.25.130.226:10000
2026-06-01T11:23:48.621830887Z ✓ Ready in 1987ms
2026-06-01T11:23:51.126813957Z === RENDER_DB_BOOT_LOG ===
2026-06-01T11:23:51.126866388Z   NODE_ENV: production
2026-06-01T11:23:51.127394658Z   DATABASE_URL defined: true
2026-06-01T11:23:51.127548921Z   DATABASE_URL value: mysql://nextcloud:***@127.0.0.1:3306/my_migrated_app
2026-06-01T11:23:51.127679684Z ===========================
2026-06-01T11:23:52.432542812Z === RENDER_DB_BOOT_LOG ===
2026-06-01T11:23:52.432589533Z   NODE_ENV: production
2026-06-01T11:23:52.432647314Z   DATABASE_URL defined: true
2026-06-01T11:23:52.432763887Z   DATABASE_URL value: mysql://nextcloud:***@127.0.0.1:3306/my_migrated_app
2026-06-01T11:23:52.432868869Z ===========================
2026-06-01T11:23:53.623010588Z ==> Your service is live 🎉
2026-06-01T11:23:53.855498441Z ==> 
2026-06-01T11:23:53.857266796Z ==> ///////////////////////////////////////////////////////////
2026-06-01T11:23:53.859618619Z ==> 
2026-06-01T11:23:53.861640165Z ==> Available at your primary URL https://codeworld-j9sp.onrender.com
2026-06-01T11:23:53.864076915Z ==> 
2026-06-01T11:23:53.866768045Z ==> ///////////////////////////////////////////////////////////