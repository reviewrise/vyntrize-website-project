# Requirements Document

## Introduction

The Vyntrize monorepo currently has a CI pipeline that builds and pushes Docker images to GitHub Container Registry (GHCR) on every push to `main`. The images are:

- `ghcr.io/{repo}/vyntrize-crm` — the CRM app (Next.js 15, port 3014)
- `ghcr.io/{repo}/vyntrize-website` — the marketing website (Next.js 15, port 3013)

This feature covers the production deployment infrastructure needed to serve those images at:

- `https://www.vyntrise.com` → `vyntrize-website` (port 3013)
- `https://crm.vyntrise.com` → `vyntrize-crm` (port 3014)

The scope includes: server-side Docker Compose orchestration, a reverse proxy with automatic SSL/TLS termination, a CD step in the existing GitHub Actions workflow that deploys on every push to `main`, environment variable management in production, and a zero-downtime rolling update strategy.

---

## Glossary

- **Production_Server**: The Linux VPS or cloud VM that hosts the running containers.
- **Reverse_Proxy**: The Caddy server that terminates TLS, routes traffic by hostname, and forwards requests to the appropriate container.
- **Caddy**: The chosen reverse proxy. Caddy automatically obtains and renews Let's Encrypt certificates with zero configuration.
- **Docker_Compose**: The container orchestration tool used on the Production_Server to manage the two app containers and the Reverse_Proxy container.
- **GHCR**: GitHub Container Registry — the OCI registry where CI pushes Docker images.
- **Deploy_Job**: The GitHub Actions job that SSHes into the Production_Server and triggers a rolling update after CI pushes new images.
- **Rolling_Update**: A deployment strategy where the new container is started and health-checked before the old container is stopped, avoiding downtime.
- **Health_Check**: An HTTP probe against `/api/health` that confirms a container is ready to serve traffic before it receives live requests.
- **Let's_Encrypt**: The free, automated certificate authority used by Caddy to issue and renew TLS certificates.
- **SSH_Deploy_Key**: An ED25519 key pair whose public key is added to the Production_Server's `authorized_keys` and whose private key is stored as a GitHub Actions secret.
- **Env_File**: A `.env` file on the Production_Server that holds runtime secrets injected into containers by Docker Compose.
- **Stack_File**: The `docker-compose.yml` file on the Production_Server that defines all services, networks, and volume mounts.

---

## Requirements

### Requirement 1: Reverse Proxy and TLS Termination

**User Story:** As a user, I want both applications served over HTTPS with valid certificates, so that my connection is encrypted and browsers do not show security warnings.

#### Acceptance Criteria

1. THE Reverse_Proxy SHALL route requests for `www.vyntrise.com` to the `vyntrize-website` container on port 3013.
2. THE Reverse_Proxy SHALL route requests for `crm.vyntrise.com` to the `vyntrize-crm` container on port 3014.
3. WHEN a browser sends an HTTP request to `www.vyntrise.com` or `crm.vyntrise.com`, THE Reverse_Proxy SHALL redirect it to HTTPS with a 301 status code.
4. THE Reverse_Proxy SHALL obtain a TLS certificate from Let's_Encrypt for each domain automatically on first startup.
5. WHEN a Let's_Encrypt certificate is within 30 days of expiry, THE Reverse_Proxy SHALL renew it automatically without manual intervention or service restart.
6. THE Reverse_Proxy SHALL store Let's_Encrypt certificate data in a named Docker volume so certificates survive container restarts.

---

### Requirement 2: Docker Compose Stack on the Production Server

**User Story:** As a DevOps engineer, I want all services defined in a single Docker Compose file, so that the entire stack can be started, stopped, and updated with one command.

#### Acceptance Criteria

1. THE Stack_File SHALL define three services: `caddy` (Reverse_Proxy), `vyntrize-website`, and `vyntrize-crm`.
2. THE Stack_File SHALL configure the `vyntrize-website` service to use the GHCR image tagged with `latest` and expose port 3013 on the internal Docker network only (not bound to the host).
3. THE Stack_File SHALL configure the `vyntrize-crm` service to use the GHCR image tagged with `latest` and expose port 3014 on the internal Docker network only (not bound to the host).
4. THE Stack_File SHALL configure the `caddy` service to bind host ports 80 and 443 and to read its routing rules from a `Caddyfile` mounted as a volume.
5. THE Stack_File SHALL define a Health_Check for each app service that probes `GET /api/health` and marks the container healthy only when the endpoint returns HTTP 200.
6. THE Stack_File SHALL configure each app service with `restart: unless-stopped` so containers recover automatically after a crash or server reboot.
7. THE Stack_File SHALL load runtime secrets for each app service from the Env_File on the Production_Server using Docker Compose's `env_file` directive.
8. THE Stack_File SHALL place all services on a shared internal Docker network so the Reverse_Proxy can reach app containers by service name.

---

### Requirement 3: Continuous Deployment via GitHub Actions

**User Story:** As a developer, I want every push to `main` to automatically deploy the new images to the Production_Server, so that production is always in sync with the latest build.

#### Acceptance Criteria

1. THE Deploy_Job SHALL run in the existing `ci.yml` workflow after the `docker` job completes successfully.
2. WHEN the `docker` job pushes new images to GHCR, THE Deploy_Job SHALL SSH into the Production_Server using the SSH_Deploy_Key stored as a GitHub Actions secret.
3. WHEN connected to the Production_Server, THE Deploy_Job SHALL pull the latest images from GHCR and perform a Rolling_Update using `docker compose pull && docker compose up -d`.
4. THE Deploy_Job SHALL use a GitHub Actions secret named `DEPLOY_HOST` for the server hostname, `DEPLOY_USER` for the SSH username, and `DEPLOY_SSH_KEY` for the private key.
5. IF the Rolling_Update fails (non-zero exit code), THE Deploy_Job SHALL fail the workflow run and leave the previous containers running.
6. THE Deploy_Job SHALL NOT store the SSH_Deploy_Key in any file committed to the repository.

---

### Requirement 4: Zero-Downtime Rolling Updates

**User Story:** As a user, I want deployments to complete without any visible downtime, so that in-flight requests are not dropped when a new version is released.

#### Acceptance Criteria

1. THE Stack_File SHALL configure a `healthcheck` for each app service so Docker knows when a new container is ready before routing traffic to it.
2. WHEN `docker compose up -d` is run with a new image, THE Docker_Compose SHALL start the new container and wait for its Health_Check to pass before stopping the old container.
3. THE Reverse_Proxy SHALL continue forwarding requests to the running container during the Health_Check interval of the new container.
4. WHEN a Health_Check fails after the configured number of retries, THE Docker_Compose SHALL mark the container as unhealthy and THE Deploy_Job SHALL report a failure.

---

### Requirement 5: Environment Variable Management in Production

**User Story:** As a DevOps engineer, I want production secrets stored securely on the server and never committed to the repository, so that credentials are not exposed in version control.

#### Acceptance Criteria

1. THE Production_Server SHALL store all runtime secrets in an Env_File located at a path outside the repository checkout (e.g., `/etc/vyntrize/.env`).
2. THE Stack_File SHALL reference the Env_File path using Docker Compose's `env_file` directive so secrets are injected at container start time.
3. THE repository SHALL contain an `.env.production.example` file listing all required production environment variables with placeholder values and descriptions, but no real secrets.
4. WHEN the Env_File is absent or a required variable is missing, THE app container SHALL fail its Health_Check and THE Deploy_Job SHALL report a failure rather than silently serving with misconfigured state.
5. THE Env_File SHALL NOT be committed to the repository; the root `.gitignore` SHALL exclude `*.env.production` and `.env.production`.

---

### Requirement 6: Server Bootstrap and Prerequisites

**User Story:** As a DevOps engineer, I want a documented, repeatable process for preparing a fresh server, so that the production environment can be recreated from scratch if needed.

#### Acceptance Criteria

1. THE repository SHALL contain a `deploy/bootstrap.sh` script that installs Docker Engine and Docker Compose plugin on a fresh Ubuntu 22.04 LTS server.
2. THE `deploy/bootstrap.sh` script SHALL create the directory for the Env_File, copy the Stack_File and Caddyfile to the server, and start the stack for the first time.
3. THE repository SHALL contain a `deploy/Caddyfile` that defines the routing rules for both domains and is the single source of truth for Reverse_Proxy configuration.
4. THE `deploy/bootstrap.sh` script SHALL add the SSH_Deploy_Key's public key to the `authorized_keys` of the deploy user on the Production_Server.
5. WHEN the bootstrap script is run on a server where Docker is already installed, THE script SHALL skip the Docker installation step without error.

---

### Requirement 7: GHCR Authentication on the Production Server

**User Story:** As a DevOps engineer, I want the Production_Server to authenticate with GHCR so it can pull private Docker images, so that image pulls succeed during deployments.

#### Acceptance Criteria

1. THE Production_Server SHALL authenticate with GHCR using a GitHub Personal Access Token (PAT) with `read:packages` scope stored in the Env_File or as a Docker credential.
2. WHEN `docker compose pull` is run on the Production_Server, THE Docker_Compose SHALL successfully pull both images from GHCR without interactive prompts.
3. THE `deploy/bootstrap.sh` script SHALL include a step that runs `docker login ghcr.io` using the PAT so subsequent pulls are authenticated.
4. THE PAT used for GHCR authentication SHALL NOT be the same credential as the SSH_Deploy_Key; they are separate secrets with separate scopes.

---

### Requirement 8: Observability and Health Endpoints

**User Story:** As a DevOps engineer, I want each application to expose a health endpoint, so that Docker and the reverse proxy can verify the service is running correctly.

#### Acceptance Criteria

1. THE `vyntrize-crm` app SHALL expose a `GET /api/health` endpoint that returns HTTP 200 and a JSON body `{"status": "ok"}` when the application is running.
2. THE `vyntrize-website` app SHALL expose a `GET /api/health` endpoint that returns HTTP 200 and a JSON body `{"status": "ok"}` when the application is running.
3. WHEN the database connection is unavailable, THE health endpoint SHALL still return HTTP 200 so that a database outage does not cause the container to be marked unhealthy and restarted in a loop.
4. THE Stack_File Health_Check for each service SHALL probe `GET /api/health` with a 10-second interval, a 5-second timeout, 3 retries, and a 30-second start period to allow for container startup time.
