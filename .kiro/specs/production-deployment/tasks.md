# Implementation Plan: Production Deployment

## Overview

Create the production deployment infrastructure for the Vyntrize monorepo: a health endpoint for the website app, Caddy reverse proxy config, Docker Compose stack definition, a server bootstrap script, a production env var template, `.gitignore` exclusions, and a CD job in the existing GitHub Actions workflow. Tasks are ordered so each file is in place before the files that depend on it.

## Tasks

- [ ] 1. Add health endpoint to `vyntrize-website`
  - Create `apps/vyntrize-website/app/api/health/route.ts` matching the CRM's existing pattern: a single `GET` handler that returns `NextResponse.json({ status: 'ok' })` with no database import
  - The endpoint must be intentionally shallow — do not import Prisma or any database client
  - _Requirements: 8.2, 8.3_

  - [ ]* 1.1 Write unit test for the website health endpoint
    - Create `apps/vyntrize-website/app/api/health/route.test.ts`
    - Assert `GET()` returns HTTP 200 and body `{ status: 'ok' }`
    - Assert the route file does not import any database module (static import check)
    - _Requirements: 8.2, 8.3_

- [ ] 2. Create `deploy/Caddyfile`
  - Write two site blocks: `www.vyntrise.com` proxying to `vyntrize-website:3013` and `crm.vyntrise.com` proxying to `vyntrize-crm:3014`
  - No explicit `tls` directive — Caddy's automatic HTTPS handles Let's Encrypt issuance, HTTP→HTTPS redirect, and renewal
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 6.3_

- [ ] 3. Create `deploy/docker-compose.yml`
  - Define three services on a shared bridge network `vyntrize-net`: `caddy`, `vyntrize-website`, `vyntrize-crm`
  - `caddy` service: image `caddy:2-alpine`, bind host ports 80 and 443, mount `./Caddyfile` read-only at `/etc/caddy/Caddyfile`, named volumes `caddy-data` and `caddy-config`, `restart: unless-stopped`
  - `vyntrize-website` service: image `ghcr.io/${GITHUB_REPOSITORY}/vyntrize-website:latest`, `expose: ["3013"]` (no host binding), `env_file: /etc/vyntrize/.env`, `restart: unless-stopped`, healthcheck probing `http://localhost:3013/api/health` with `interval: 10s`, `timeout: 5s`, `retries: 3`, `start_period: 30s`
  - `vyntrize-crm` service: same pattern as website but port 3014 and CRM image
  - Declare named volumes `caddy-data` and `caddy-config`
  - Use `wget -qO-` for health check commands (available in the alpine base image without curl)
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 4.1, 4.2, 4.3, 4.4, 5.2, 8.4_

- [ ] 4. Create `deploy/bootstrap.sh`
  - Make the script executable (`#!/usr/bin/env bash`) with `set -euo pipefail`
  - Step 1 — Docker install: check `command -v docker`; if absent, install Docker Engine + Compose plugin via the official apt repository for Ubuntu 22.04; if present, print a skip message (idempotent)
  - Step 2 — Env directory: `mkdir -p /etc/vyntrize && chmod 700 /etc/vyntrize`; warn if `/etc/vyntrize/.env` does not yet exist
  - Step 3 — GHCR auth: prompt for a GitHub PAT with `-rsp` (silent), pipe to `docker login ghcr.io --password-stdin`
  - Step 4 — Copy deploy files: copy `Caddyfile` and `docker-compose.yml` from the script's directory to `/opt/vyntrize/`
  - Step 5 — Start stack: `cd /opt/vyntrize && docker compose pull && docker compose up -d`
  - _Requirements: 6.1, 6.2, 6.4, 6.5, 7.1, 7.2, 7.3, 7.4_

- [ ] 5. Create `.env.production.example`
  - Place at the repository root
  - Include a header comment explaining the file must be copied to `/etc/vyntrize/.env` on the production server and never committed with real values
  - Document all required variables with placeholder values and inline descriptions:
    - `GITHUB_REPOSITORY` — GitHub org/repo slug used to construct GHCR image URLs
    - `VYNTRIZE_DATABASE_URL` — Postgres connection string for the website app
    - `CRM_DATABASE_URL` — Postgres connection string for the CRM app
    - `SESSION_SECRET` — iron-session secret, minimum 32 random characters; include `openssl rand -hex 32` generation hint
    - `NODE_ENV=production`
  - _Requirements: 5.3, 5.4_

- [ ] 6. Update root `.gitignore`
  - Add `.env.production` and `*.env.production` exclusion entries to the root `.gitignore`
  - Add a comment line above the entries, e.g., `# Production env files — never commit real secrets`
  - _Requirements: 5.5_

- [ ] 7. Checkpoint — verify deploy files are consistent
  - Confirm the service names in `Caddyfile` (`vyntrize-website`, `vyntrize-crm`) match the service names in `docker-compose.yml`
  - Confirm the ports in `Caddyfile` (3013, 3014) match the `expose` values in `docker-compose.yml`
  - Confirm `docker-compose.yml` references `./Caddyfile` and that file exists at `deploy/Caddyfile`
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Add `deploy` job to `.github/workflows/ci.yml`
  - Append the `deploy` job after the existing `docker` job in `ci.yml`
  - Job config: `needs: [docker]`, same `if` condition as `docker` (`github.ref == 'refs/heads/main' && github.event_name == 'push'`), `runs-on: ubuntu-latest`
  - Single step using `appleboy/ssh-action@v1.2.0` (pinned version) with secrets `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`
  - SSH script: `cd ${{ secrets.DEPLOY_PATH }} && docker compose pull && docker compose up -d --remove-orphans`
  - Do not store the SSH key in any file; `appleboy/ssh-action` handles key injection internally
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [ ] 9. Final checkpoint — ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Tasks are ordered so each file exists before the files that reference it (health endpoint → deploy files → CI workflow)
- The website health endpoint (task 1) must exist before `docker-compose.yml` (task 3) references it in the healthcheck
- All deploy files (tasks 2–6) must be committed before the CI `deploy` job (task 8) can run successfully on the server
- The SSH deploy key and GHCR PAT are separate credentials with separate scopes — see Requirements 7.4 and 3.6
