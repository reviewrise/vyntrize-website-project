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
cp "${SCRIPT_DIR}/Caddyfile"          "${DEPLOY_DIR}/Caddyfile"
cp "${SCRIPT_DIR}/docker-compose.yml" "${DEPLOY_DIR}/docker-compose.yml"

# ─── 5. Start the stack ──────────────────────────────────────────────────────
info "Starting the stack ..."
cd "${DEPLOY_DIR}"
docker compose pull
docker compose up -d

info "Stack is up. Check status with: docker compose ps"
