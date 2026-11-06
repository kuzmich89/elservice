# ── Stage 1: build static files ──────────────────────────────────────────────
FROM python:3.11-slim AS builder
WORKDIR /app
COPY . .
RUN python3 scripts/build.py

# ── Stage 2: serve with Caddy ─────────────────────────────────────────────────
FROM caddy:2-alpine
COPY --from=builder /app/dist /srv
COPY Caddyfile /etc/caddy/Caddyfile
EXPOSE 80
