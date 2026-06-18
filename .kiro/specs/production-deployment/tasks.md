# Implementation Plan: Production Deployment

> **Status**: Complete — all tasks done  
> **Last Updated**: 2026-06-18  
> **Stack**: Caddy v2 · Docker Compose · GitHub Actions (SSH deploy) · Let's Encrypt (automatic HTTPS)  
> **Scope**: Production infra only — no application logic changes

---

## ✅ Done — All Tasks Complete

> The production deployment stack is fully in place. The website and CRM apps run behind Caddy with automatic HTTPS, Docker Compose manages the full stack, and CD deploys to the server on every push to `main`.

---

### 1. Website Health Endpoint
**Why**: Docker Compose needs a health check URL to determine when the website container is actually ready to serve traffic — not just started. A shallow endpoint with no DB dependency ensures it stays green even if the database is temporarily unreachable.

- [x] Created `apps/vyntrize-website/app/api/health/route.ts`
- [x] Single `GET` handler returning `NextResponse.json({ status: 'ok' })`
- [x] Intentionally shallow — no Prisma import, no database call
- [x] _Requirements: 8.2, 8.3_

  - [ ]* **1.1** Unit test for the website health endpoint _(optional)_
    - Assert `GET()` returns HTTP 200 and `{ status: 'ok' }`
    - Assert route file has no database imports (static import check)
    - `apps/vyntrize-website/app/api/health/route.test.ts`
    - _Requirements: 8.2, 8.3_

---

### 2. `deploy/Caddyfile`
**Why**: Caddy handles TLS automatically via Let's Encrypt — no manual certificate management. Two site blocks route `www.vyntrise.com` to the website container and `crm.vyntrise.com` to the CRM container by internal Docker DNS name.

- [x] Site block for `www.vyntrise.com` — proxies to `vyntrize-website:3013`
- [x] Site block for `crm.vyntrise.com` — proxies to `vyntrize-crm:3014`
- [x] No explicit `tls` directive — Caddy's automatic HTTPS handles Let's Encrypt issuance, HTTP→HTTPS redirect, and renewal
- [x] _Requirements: 1.1–1.5, 6.3_

---

### 3. `deploy/docker-compose.yml`
**Why**: Defines the full production stack as code — three services on a shared bridge network so Caddy can reach the app containers by hostname. Apps use `expose` (not `ports`) to keep them off the public internet; only Caddy binds 80/443.

- [x] Three services on shared bridge network `vyntrize-net`: `caddy`, `vyntrize-website`, `vyntrize-crm`
- [x] `caddy` — `caddy:2-alpine`, ports 80+443 bound to host, `./Caddyfile` mounted read-only, named volumes `caddy-data` + `caddy-config`, `restart: unless-stopped`
- [x] `vyntrize-website` — GHCR image, `expose: ["3013"]` (no host binding), `env_file: /etc/vyntrize/.env`, `restart: unless-stopped`, healthcheck on `http://localhost:3013/api/health` (`interval: 10s`, `timeout: 5s`, `retries: 3`, `start_period: 30s`)
- [x] `vyntrize-crm` — same pattern as website but port 3014 and CRM image, healthcheck on `/api/health`
- [x] Named volumes `caddy-data` and `caddy-config` declared
- [x] Health check commands use `wget -qO-` (available in alpine without curl)
- [x] _Requirements: 2.1–2.8, 4.1–4.4, 5.2, 8.4_

---

### 4. `deploy/bootstrap.sh`
**Why**: New server setup is error-prone and easy to forget steps. This idempotent script automates Docker Engine installation, env directory creation, GHCR authentication, deploy file copying, and stack startup — runnable multiple times safely.

- [x] `#!/usr/bin/env bash` with `set -euo pipefail`
- [x] Step 1 — Docker install: checks `command -v docker`; if absent, installs Docker Engine + Compose plugin via official Ubuntu 22.04 apt repo; if present, prints skip message
- [x] Step 2 — Env directory: `mkdir -p /etc/vyntrize && chmod 700 /etc/vyntrize`; warns if `.env` file doesn't yet exist
- [x] Step 3 — GHCR auth: prompts for GitHub PAT (silent `-rsp`), pipes to `docker login ghcr.io --password-stdin`
- [x] Step 4 — Copy deploy files: copies `Caddyfile` and `docker-compose.yml` from script directory to `/opt/vyntrize/`
- [x] Step 5 — Start stack: `cd /opt/vyntrize && docker compose pull && docker compose up -d`
- [x] _Requirements: 6.1, 6.2, 6.4, 6.5, 7.1–7.4_

---

### 5. `.env.production.example`
**Why**: Documents every env var needed on the production server so there's a clear checklist before first deployment. Never contains real values — lives in the repo root as a safe template.

- [x] Placed at repository root as `.env.production.example`
- [x] Header comment explaining: copy to `/etc/vyntrize/.env` on the production server, never commit with real values
- [x] All required variables with placeholders and inline descriptions:
  - `GITHUB_REPOSITORY` — org/repo slug for GHCR image URLs
  - `VYNTRIZE_DATABASE_URL` — Postgres connection string for website app
  - `CRM_DATABASE_URL` — Postgres connection string for CRM app
  - `SESSION_SECRET` — iron-session secret, min 32 chars; includes `openssl rand -hex 32` generation hint
  - `NODE_ENV=production`
- [x] _Requirements: 5.3, 5.4_

---

### 6. Root `.gitignore` — Production Env Exclusions
**Why**: Prevents `.env.production` files with real secrets from being accidentally committed.

- [x] Added `.env.production` and `*.env.production` exclusion entries
- [x] Added comment line `# Production env files — never commit real secrets` above the entries
- [x] _Requirements: 5.5_

---

### 7. Checkpoint — Deploy File Consistency
**Why**: Caddy proxies by Docker service hostname — if the names in `Caddyfile` don't match `docker-compose.yml`, traffic silently fails to route.

- [x] Service names in `Caddyfile` (`vyntrize-website`, `vyntrize-crm`) match service names in `docker-compose.yml`
- [x] Ports in `Caddyfile` (3013, 3014) match `expose` values in `docker-compose.yml`
- [x] `docker-compose.yml` references `./Caddyfile` and that file exists at `deploy/Caddyfile`

---

### 8. CD Job in `.github/workflows/ci.yml`
**Why**: After Docker images are built and pushed to GHCR, the server needs to pull the new images and restart the stack. The `appleboy/ssh-action` handles key injection — the private key never touches a file on disk.

- [x] Appended `deploy` job after the existing `docker` job in `ci.yml`
- [x] `needs: [docker]`, same `if` condition as `docker` (`github.ref == 'refs/heads/main' && github.event_name == 'push'`), `runs-on: ubuntu-latest`
- [x] Single step using `appleboy/ssh-action@v1.2.0` (pinned) with secrets `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`
- [x] SSH script: `cd ${{ secrets.DEPLOY_PATH }} && docker compose pull && docker compose up -d --remove-orphans`
- [x] SSH key is never written to a file — `appleboy/ssh-action` injects it internally
- [x] _Requirements: 3.1–3.6_

---

### 9. Final Checkpoint

- [x] All deploy files committed and consistent
- [x] `docker compose pull && docker compose up -d` succeeds on the production server
- [x] Both apps are reachable via their domains with valid TLS certificates
- [x] Health checks pass in `docker ps` output (status: healthy)

---

## Notes

- Tasks marked `*` are optional and can be skipped for MVP
- File dependency order: health endpoint (task 1) → deploy files (tasks 2–6) → CI deploy job (task 8)
- The health endpoint must exist before `docker-compose.yml` references it in the healthcheck
- The SSH deploy key and the GHCR PAT are separate credentials with different scopes — see Requirements 7.4 and 3.6
- Caddy's automatic HTTPS requires ports 80 and 443 to be reachable from the internet — ensure firewall rules allow both
- `/etc/vyntrize/.env` on the server is bind-mounted into both app containers via `env_file` — it is the single source of truth for production secrets
