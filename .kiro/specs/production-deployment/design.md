# Design Document: Production Deployment

## Overview

This document describes the technical design for deploying the two Vyntrize Next.js applications to a production IONOS VPS running Ubuntu 22.04 LTS. CI already builds and pushes Docker images to GHCR on every push to `main`. This feature adds the server-side orchestration, reverse proxy, TLS termination, and a CD step that completes the push-to-production pipeline.

The deployment stack is:

- **Caddy** — reverse proxy with automatic Let's Encrypt TLS, routing `www.vyntrise.com` → website (port 3013) and `crm.vyntrise.com` → CRM (port 3014)
- **Docker Compose** — orchestrates all three containers (caddy, vyntrize-website, vyntrize-crm) on the production server
- **GitHub Actions `deploy` job** — SSHes into the server after the `docker` job and runs `docker compose pull && docker compose up -d`

Files introduced by this feature:

| File | Purpose |
|------|---------|
| `deploy/Caddyfile` | Reverse proxy routing rules — single source of truth |
| `deploy/docker-compose.yml` | Full stack definition for the production server |
| `deploy/bootstrap.sh` | One-time server setup script for a fresh Ubuntu 22.04 VPS |
| `.env.production.example` | Template listing all required production env vars |
| `.github/workflows/ci.yml` | Updated to add the `deploy` job after `docker` |

The `apps/vyntrize-website/app/api/health/route.ts` health endpoint already exists and matches the required pattern — no changes needed.

---

## Architecture

```mermaid
graph TD
    subgraph Internet
        USER[Browser / Client]
    end

    subgraph IONOS VPS - Ubuntu 22.04
        subgraph Docker Network: vyntrize-net
            CADDY[caddy\nports 80, 443]
            WEB[vyntrize-website\nport 3013 internal]
            CRM[vyntrize-crm\nport 3014 internal]
        end
        VOL[(caddy-data\nLet's Encrypt certs)]
        ENV[/etc/vyntrize/.env]
    end

    subgraph GitHub
        CI[CI: validate → docker → deploy]
        GHCR[GHCR\nghcr.io/repo/vyntrize-*:latest]
    end

    USER -->|HTTPS 443| CADDY
    USER -->|HTTP 80 → 301| CADDY
    CADDY -->|www.vyntrise.com| WEB
    CADDY -->|crm.vyntrise.com| CRM
    CADDY --- VOL
    WEB --- ENV
    CRM --- ENV
    CI -->|docker compose pull + up -d via SSH| CADDY
    CI -->|push images| GHCR
    GHCR -->|docker compose pull| WEB
    GHCR -->|docker compose pull| CRM
```

### Key Design Decisions

**Caddy over Nginx or Traefik**

Caddy is chosen for its zero-configuration TLS. A two-site Caddyfile is under 10 lines — no `ssl_certificate` directives, no cron jobs for renewal, no certbot. Caddy handles ACME challenges, certificate issuance, and renewal automatically. Nginx requires manual certificate management or a separate certbot container. Traefik is powerful but adds complexity (labels, providers, dashboard) that is unnecessary for two static upstreams.

**`latest` tag for rolling updates**

Using `latest` keeps the deployment command simple: `docker compose pull && docker compose up -d`. The CI workflow already tags images with both `latest` and the commit SHA, so `latest` always points to the most recent successful build on `main`. SHA-pinned tags would require the deploy job to pass the SHA to the server, adding complexity with no benefit for this use case.

**Shallow health checks (no database probe)**

The `/api/health` endpoint returns `{"status":"ok"}` unconditionally without checking the database. If the health check probed the database, a database outage would cause Docker to mark the container unhealthy and restart it in a loop — which cannot fix a database problem and creates unnecessary churn. The health check's purpose is to confirm the Node.js process started and the HTTP server is accepting connections. Database connectivity is a separate concern monitored separately.

**Zero-downtime with Docker Compose**

Docker Compose's `up -d` with a `healthcheck` defined achieves rolling updates within a single-container-per-service model:

1. `docker compose pull` fetches the new image layers
2. `docker compose up -d` creates a new container from the new image
3. Docker waits for the new container's health check to pass (up to `start_period` + `retries × interval`)
4. Once healthy, the old container is stopped and removed
5. Caddy's upstream is the service name (`vyntrize-website`, `vyntrize-crm`) — Docker's internal DNS resolves this to the healthy container

In-flight requests to the old container complete normally during the health check window. New requests are routed to the new container once it is healthy.

**GHCR auth on the server**

The production server authenticates with GHCR using a GitHub PAT with `read:packages` scope. This PAT is stored as a Docker credential (via `docker login ghcr.io`) during bootstrap — not in any file in the repository. It is separate from the SSH deploy key, which has no GHCR permissions.

---

## Components and Interfaces

### Caddy (`deploy/Caddyfile`)

Caddy is configured with two site blocks. Each block names a domain and declares a single `reverse_proxy` directive pointing to the upstream container by its Docker Compose service name and internal port. Caddy's automatic HTTPS handles:

- ACME HTTP-01 challenge on port 80
- Certificate issuance and storage in the `caddy-data` named volume
- HTTP → HTTPS redirect (built-in, no explicit directive needed)
- Certificate renewal (background goroutine, no restart required)

The Caddyfile is mounted read-only into the Caddy container at `/etc/caddy/Caddyfile`.

### Docker Compose (`deploy/docker-compose.yml`)

Three services on a shared bridge network `vyntrize-net`:

| Service | Image | Internal port | Host ports |
|---------|-------|---------------|------------|
| `caddy` | `caddy:2-alpine` | — | 80, 443 |
| `vyntrize-website` | `ghcr.io/{repo}/vyntrize-website:latest` | 3013 | none |
| `vyntrize-crm` | `ghcr.io/{repo}/vyntrize-crm:latest` | 3014 | none |

App containers are not bound to host ports — they are only reachable via the internal network, which Caddy uses to proxy requests. This prevents direct external access to the app ports.

### GitHub Actions `deploy` job

Added to `.github/workflows/ci.yml` after the `docker` job. Uses `appleboy/ssh-action@v1` to SSH into the production server and run the update commands. The job:

1. Requires `docker` to complete successfully (`needs: [docker]`)
2. Only runs on pushes to `main` (same condition as `docker`)
3. SSHes using `DEPLOY_SSH_KEY` secret (ED25519 private key)
4. Runs `docker compose pull && docker compose up -d --remove-orphans` in `DEPLOY_PATH`

### Bootstrap Script (`deploy/bootstrap.sh`)

A bash script for one-time server setup. Idempotent — safe to re-run. Steps:

1. Check if Docker is installed; if not, install Docker Engine + Compose plugin via the official apt repository
2. Create `/etc/vyntrize/` directory
3. Prompt for GHCR PAT and run `docker login ghcr.io`
4. Copy `deploy/Caddyfile` and `deploy/docker-compose.yml` to the server
5. Run `docker compose up -d` to start the stack for the first time

---

## Data Models

### File: `deploy/Caddyfile`

```caddyfile
www.vyntrise.com {
    reverse_proxy vyntrize-website:3013
}

crm.vyntrise.com {
    reverse_proxy vyntrize-crm:3014
}
```

Caddy's automatic HTTPS is enabled by default for any site block with a domain name (not `localhost` or an IP). The HTTP → HTTPS redirect is implicit. No `tls` directive is needed — Caddy uses Let's Encrypt with the HTTP-01 challenge on port 80.

The upstream hostnames `vyntrize-website` and `vyntrize-crm` are Docker Compose service names. Docker's embedded DNS resolves them to the container IP on the `vyntrize-net` network.

### File: `deploy/docker-compose.yml`

```yaml
services:
  caddy:
    image: caddy:2-alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy-data:/data
      - caddy-config:/config
    networks:
      - vyntrize-net

  vyntrize-website:
    image: ghcr.io/${GITHUB_REPOSITORY}/vyntrize-website:latest
    restart: unless-stopped
    env_file:
      - /etc/vyntrize/.env
    expose:
      - "3013"
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3013/api/health"]
      interval: 10s
      timeout: 5s
      retries: 3
      start_period: 30s
    networks:
      - vyntrize-net

  vyntrize-crm:
    image: ghcr.io/${GITHUB_REPOSITORY}/vyntrize-crm:latest
    restart: unless-stopped
    env_file:
      - /etc/vyntrize/.env
    expose:
      - "3014"
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3014/api/health"]
      interval: 10s
      timeout: 5s
      retries: 3
      start_period: 30s
    networks:
      - vyntrize-net

volumes:
  caddy-data:
  caddy-config:

networks:
  vyntrize-net:
    driver: bridge
```

**Notes:**

- `expose` (not `ports`) makes the port available on the internal network only — no host binding.
- `wget` is used for the health check because the `node:20-alpine` base image includes it but not `curl`. The `-qO-` flags suppress output and write to stdout (exit code 0 on success, non-zero on failure).
- `GITHUB_REPOSITORY` is set in the `.env` file on the server (e.g., `myorg/vyntrize`) so the image reference resolves correctly.
- `caddy-config` volume stores Caddy's runtime configuration cache (separate from certificate data in `caddy-data`).

### File: `deploy/bootstrap.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail

# ─── Colours ─────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()  { echo -e "${GREEN}[bootstrap]${NC} $*"; }
warn()  { echo -e "${YELLOW}[bootstrap]${NC} $*"; }

# ─── 1. Install Docker Engine + Compose plugin ───────────────────────────────
if command -v docker &>/dev/null; then
    warn "Docker already installed ($(docker --version)). Skipping."
else
    info "Installing Docker Engine..."
    apt-get update -qq
    apt-get install -y -qq ca-certificates curl gnupg lsb-release

    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
        | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg

    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
      https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" \
      | tee /etc/apt/sources.list.d/docker.list > /dev/null

    apt-get update -qq
    apt-get install -y -qq docker-ce docker-ce-cli containerd.io \
        docker-buildx-plugin docker-compose-plugin

    systemctl enable --now docker
    info "Docker installed: $(docker --version)"
fi

# ─── 2. Create env directory ─────────────────────────────────────────────────
info "Creating /etc/vyntrize/ ..."
mkdir -p /etc/vyntrize
chmod 700 /etc/vyntrize

if [[ ! -f /etc/vyntrize/.env ]]; then
    warn "/etc/vyntrize/.env does not exist."
    warn "Copy .env.production.example to /etc/vyntrize/.env and fill in real values before starting the stack."
fi

# ─── 3. Authenticate with GHCR ───────────────────────────────────────────────
info "Logging in to ghcr.io ..."
read -rsp "Enter your GitHub PAT (read:packages scope): " GHCR_PAT
echo
echo "${GHCR_PAT}" | docker login ghcr.io -u "$(id -un)" --password-stdin
info "GHCR login successful."

# ─── 4. Copy deploy files ────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="/opt/vyntrize"

info "Copying deploy files to ${DEPLOY_DIR} ..."
mkdir -p "${DEPLOY_DIR}"
cp "${SCRIPT_DIR}/Caddyfile"         "${DEPLOY_DIR}/Caddyfile"
cp "${SCRIPT_DIR}/docker-compose.yml" "${DEPLOY_DIR}/docker-compose.yml"

# ─── 5. Start the stack ──────────────────────────────────────────────────────
info "Starting the stack ..."
cd "${DEPLOY_DIR}"
docker compose pull
docker compose up -d

info "Stack is up. Check status with: docker compose ps"
```

**Design notes:**

- `set -euo pipefail` ensures the script exits immediately on any error, unset variable, or pipe failure.
- The Docker installation check (`command -v docker`) makes the script idempotent — re-running on a server with Docker already installed skips the installation block.
- The PAT is read interactively with `-s` (silent, no echo) and piped directly to `docker login --password-stdin` — it is never written to disk or echoed to the terminal.
- Deploy files are copied to `/opt/vyntrize/` (not the repo checkout) so the stack can be managed independently of any git operations.
- The script must be run as root (or with sudo) because it installs packages and writes to `/etc/` and `/opt/`.

### File: `.env.production.example`

```dotenv
# ─── REQUIRED: Copy this file to /etc/vyntrize/.env on the production server ─
# Fill in real values. Never commit this file with real secrets.

# ─── Docker image repository ─────────────────────────────────────────────────
# The GitHub repository slug (owner/repo) used to construct GHCR image URLs.
# Example: myorg/vyntrize
GITHUB_REPOSITORY=your-github-org/vyntrize

# ─── Database ─────────────────────────────────────────────────────────────────
# Shared Postgres database URL used by vyntrize-website.
VYNTRIZE_DATABASE_URL=postgresql://vyntrize_user:CHANGE_ME@db-host:5432/vyntrize_db?sslmode=require

# CRM Postgres database URL used by vyntrize-crm.
CRM_DATABASE_URL=postgresql://vyntrize_user:CHANGE_ME@db-host:5432/vyntrize_db?sslmode=require

# ─── vyntrize-crm ─────────────────────────────────────────────────────────────
# Session secret for iron-session. Must be at least 32 random characters.
# Generate with: openssl rand -hex 32
SESSION_SECRET=CHANGE_ME_generate_with_openssl_rand_hex_32

# ─── Runtime ──────────────────────────────────────────────────────────────────
NODE_ENV=production
```

### File: `apps/vyntrize-website/app/api/health/route.ts`

This file already exists and matches the required pattern. No changes needed.

```typescript
import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({ status: 'ok' });
}
```

The endpoint is intentionally shallow — it does not import or query the database. This ensures a database outage cannot cause the container to be marked unhealthy and restarted in a loop.

### Updated: `.github/workflows/ci.yml`

The `deploy` job is appended after the existing `docker` job:

```yaml
  deploy:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: [docker]
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'

    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1.2.0
        with:
          host: ${{ secrets.DEPLOY_HOST }}
          username: ${{ secrets.DEPLOY_USER }}
          key: ${{ secrets.DEPLOY_SSH_KEY }}
          script: |
            cd ${{ secrets.DEPLOY_PATH }}
            docker compose pull
            docker compose up -d --remove-orphans
```

**Required GitHub Actions secrets:**

| Secret | Description |
|--------|-------------|
| `DEPLOY_HOST` | Hostname or IP of the production server |
| `DEPLOY_USER` | SSH username on the production server (e.g., `deploy` or `root`) |
| `DEPLOY_SSH_KEY` | ED25519 private key whose public key is in the server's `authorized_keys` |
| `DEPLOY_PATH` | Absolute path to the directory containing `docker-compose.yml` on the server (e.g., `/opt/vyntrize`) |

**Design notes:**

- `needs: [docker]` ensures the deploy job only runs after both images are successfully pushed to GHCR.
- `--remove-orphans` cleans up containers for services that were removed from the Compose file.
- `appleboy/ssh-action@v1.2.0` is pinned to a specific version to prevent supply-chain surprises.
- The SSH key is never written to disk in the workflow — `appleboy/ssh-action` handles key injection internally.
- If `docker compose pull` or `docker compose up -d` exits non-zero, the step fails, the job fails, and GitHub Actions marks the workflow run as failed. The previous containers remain running.

---

## Error Handling

### Missing `/etc/vyntrize/.env`

If the env file is absent when `docker compose up -d` runs, Docker Compose will start the containers but the apps will fail to connect to the database. The health check will fail after `start_period` (30s) + `retries × interval` (30s) = 60s, and Docker will mark the containers unhealthy. The deploy job will succeed (the SSH command exits 0 after `up -d`), but the containers will be in an unhealthy state visible via `docker compose ps`.

**Mitigation**: The bootstrap script warns if `/etc/vyntrize/.env` does not exist before starting the stack. The `.env.production.example` file documents all required variables.

### GHCR Pull Failure

If `docker compose pull` fails (expired PAT, network issue, image not found), the command exits non-zero, the deploy job fails, and the existing containers continue running. No downtime occurs.

**Mitigation**: Ensure the GHCR PAT is refreshed before expiry. The bootstrap script's `docker login` step stores credentials in Docker's credential store, which persists across reboots.

### Health Check Failure After Deploy

If the new container fails its health check (bad image, missing env var, startup crash), Docker marks it unhealthy but does not automatically roll back. The unhealthy container replaces the old one.

**Mitigation**: Monitor `docker compose ps` after deployments. For a rollback, SSH into the server and run:
```bash
docker compose pull  # pulls the previous SHA-tagged image
# edit docker-compose.yml to pin the image to the last-known-good SHA
docker compose up -d
```

### TLS Certificate Failure

If Let's Encrypt cannot issue a certificate (DNS not propagated, port 80 blocked), Caddy serves the site over HTTP only and logs the ACME error. Caddy retries certificate issuance automatically.

**Mitigation**: Ensure DNS A records for both domains point to the server IP before first startup. Ensure port 80 is open in the server's firewall.

### Bootstrap Script Failures

The script uses `set -euo pipefail` — any failed command aborts the script with a non-zero exit code and a clear error message. Common failure points:

- `apt-get` failures: network connectivity or package repository issues
- `docker login` failure: invalid PAT or wrong username
- `docker compose pull` failure: GHCR auth not set up, image not yet pushed

---

## Testing Strategy

### PBT Applicability Assessment

This feature is entirely infrastructure configuration: a Caddyfile, a Docker Compose YAML, a bash script, and a GitHub Actions workflow. There are no pure functions, parsers, serializers, or data transformation algorithms. The acceptance criteria are almost entirely SMOKE tests (configuration checks) and INTEGRATION tests (infrastructure wiring). Property-based testing is not applicable.

The health endpoints (`/api/health`) are trivial one-liners that always return the same response — there is no input space to explore with PBT.

### Unit Tests

**Health endpoint correctness** (for both apps):

```typescript
// apps/vyntrize-crm/app/api/health/route.test.ts
import { GET } from './route';

test('GET /api/health returns 200 with {"status":"ok"}', async () => {
  const response = await GET();
  expect(response.status).toBe(200);
  const body = await response.json();
  expect(body).toEqual({ status: 'ok' });
});
```

Same test for `apps/vyntrize-website/app/api/health/route.test.ts`.

**Health endpoint does not import database** (static analysis / import check):

Verify that `route.ts` does not import `@platform/vyntrize-db` or `prisma` — ensuring the shallow health check design is maintained.

### Smoke Tests (Manual, Run Once After Bootstrap)

Run these checks after running `bootstrap.sh` and before going live:

1. `docker compose ps` — all three services show `healthy` or `running`
2. `curl -I http://www.vyntrise.com` — returns `301 Moved Permanently` with `Location: https://www.vyntrise.com`
3. `curl https://www.vyntrise.com/api/health` — returns `{"status":"ok"}`
4. `curl https://crm.vyntrise.com/api/health` — returns `{"status":"ok"}`
5. `openssl s_client -connect www.vyntrise.com:443 -brief` — shows valid Let's Encrypt certificate
6. `openssl s_client -connect crm.vyntrise.com:443 -brief` — shows valid Let's Encrypt certificate
7. Re-run `bootstrap.sh` on the same server — Docker installation is skipped without error

### Integration Tests (Verify After Each Deploy)

After each CD pipeline run:

1. GitHub Actions workflow shows green for `validate → docker → deploy`
2. `docker compose ps` on the server shows both app containers as `healthy`
3. `curl https://www.vyntrise.com/api/health` returns `{"status":"ok"}`
4. `curl https://crm.vyntrise.com/api/health` returns `{"status":"ok"}`

### Configuration Validation (CI)

Consider adding a `docker compose config` step to the CI workflow to validate the `docker-compose.yml` syntax before deploying:

```yaml
- name: Validate docker-compose.yml
  run: docker compose -f deploy/docker-compose.yml config --quiet
```

This catches YAML syntax errors and invalid Compose directives before they reach the server.
