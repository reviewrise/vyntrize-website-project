# Design Document: Monorepo Deployment

## Overview

This document describes the technical design for restructuring the Vyntrize project into a proper pnpm monorepo. The current layout has `vyntrize-crm`, `vyntrize-db`, and `vyntrize-website` as sibling folders at the repository root with no formal workspace configuration. The target layout places apps under `apps/` and shared packages under `packages/`, with a workspace root that owns toolchain scripts, Docker build files, and CI configuration.

The migration is a structural reorganisation — no application logic changes. The design covers:

- Workspace root configuration files
- Directory layout and file moves
- TypeScript project references
- Dockerfile design for both apps (fresh, from scratch)
- GitHub Actions CI workflow
- Environment variable strategy
- Migration steps

---

## Architecture

```mermaid
graph TD
    subgraph Workspace Root
        WS[pnpm-workspace.yaml]
        PKG[package.json]
        TSB[tsconfig.base.json]
        ENV[.env.example]
        GIT[.gitignore]
        DCR[Dockerfile.crm]
        DWS[Dockerfile.website]
        CI[.github/workflows/ci.yml]
        LOCK[pnpm-lock.yaml]
    end

    subgraph apps/
        CRM[apps/vyntrize-crm]
        WEB[apps/vyntrize-website]
    end

    subgraph packages/
        DB[packages/@platform/vyntrize-db]
    end

    CRM -->|workspace:*| DB
    WEB -->|workspace:*| DB
    CRM -.->|extends| TSB
    WEB -.->|extends| TSB
    DB -.->|extends| TSB
    DCR -->|builds| CRM
    DWS -->|builds| WEB
    DCR -->|generates| DB
    DWS -->|generates| DB
```

### Key Design Decisions

**pnpm workspaces over npm/yarn**: pnpm's strict hoisting and `--filter` flag make it the best fit for monorepos with shared internal packages. The `workspace:*` protocol ensures apps always use the local package version.

**Two separate Dockerfiles at root**: `Dockerfile.crm` and `Dockerfile.website` live at the workspace root so they can use the full monorepo as build context. Each uses `pnpm --filter <app>...` to install only the transitive dependencies needed for that app.

**`tsconfig.base.json` inheritance**: Shared compiler options (target, strict, moduleResolution) live in one place. Each workspace member extends it and adds only app-specific overrides (paths, plugins, includes).

**No root `node_modules` hoisting of Prisma**: `@prisma/client` is declared as `serverExternalPackages` in both Next.js configs, so Next.js does not bundle it. The generated client lives inside `packages/@platform/vyntrize-db/src/generated/client/` and is copied into the standalone bundle by the Dockerfile.

---

## Components and Interfaces

### Workspace Root Files

| File | Purpose |
|------|---------|
| `pnpm-workspace.yaml` | Declares `apps/*` and `packages/**/*` as workspace members |
| `package.json` | Root scripts, `"private": true`, no runtime dependencies |
| `tsconfig.base.json` | Shared TypeScript compiler options |
| `.env.example` | Aggregated env var documentation for all apps and packages |
| `.gitignore` | Root-level ignore rules covering all workspace members |
| `Dockerfile.crm` | Multi-stage Docker build for `vyntrize-crm` |
| `Dockerfile.website` | Multi-stage Docker build for `vyntrize-website` |
| `.github/workflows/ci.yml` | GitHub Actions CI pipeline |

### App: `apps/vyntrize-crm`

Moved from `vyntrize-crm/`. No code changes required. The `tsconfig.json` path alias for `@platform/vyntrize-db` already points to `../../packages/@platform/vyntrize-db/src/index.ts`, which is correct for the new layout.

**Interface with shared package**: via `@platform/vyntrize-db` workspace dependency. The CRM imports `vyntrizeDb` from `@platform/vyntrize-db` in `lib/prisma.ts`.

### App: `apps/vyntrize-website`

Moved from `vyntrize-website/`. No code changes required. The `tsconfig.json` path alias already points to the correct relative path for the new layout.

### Package: `packages/@platform/vyntrize-db`

Moved from `vyntrize-db/`. The `prisma.config.ts` currently loads `../../../.env` as a root env fallback — after the move to `packages/@platform/vyntrize-db/`, the relative path to the workspace root becomes `../../../.env` (three levels up: `vyntrize-db/` → `@platform/` → `packages/` → root), which is unchanged.

**Exports** (via `src/index.ts`):
- `vyntrizeDb` — the extended Prisma client with soft-delete filter
- `VyntrizeDb` — the TypeScript type of the client
- All Prisma-generated types re-exported for consumers

---

## Data Models

### Directory Layout (Target)

```
/ (workspace root)
├── apps/
│   ├── vyntrize-crm/
│   │   ├── app/
│   │   ├── components/
│   │   ├── lib/
│   │   ├── scripts/
│   │   ├── public/
│   │   ├── .env.example
│   │   ├── .gitignore
│   │   ├── eslint.config.mjs
│   │   ├── middleware.ts
│   │   ├── next.config.ts
│   │   ├── package.json
│   │   ├── postcss.config.js
│   │   ├── tailwind.config.ts
│   │   └── tsconfig.json
│   └── vyntrize-website/
│       ├── app/
│       ├── components/
│       ├── public/
│       ├── .env.example
│       ├── .gitignore
│       ├── eslint.config.mjs
│       ├── next.config.ts
│       ├── package.json
│       ├── postcss.config.js
│       ├── tailwind.config.ts
│       └── tsconfig.json
├── packages/
│   └── @platform/
│       └── vyntrize-db/
│           ├── prisma/
│           │   ├── migrations/
│           │   └── schema.prisma
│           ├── scripts/
│           ├── src/
│           │   ├── client.ts
│           │   ├── index.ts
│           │   └── generated/client/
│           ├── .env.example
│           ├── .gitignore
│           ├── package.json
│           ├── prisma.config.ts
│           └── tsconfig.json
├── .env.example
├── .gitignore
├── Dockerfile.crm
├── Dockerfile.website
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── .github/
    └── workflows/
        └── ci.yml
```

### Root Configuration File Designs

#### `pnpm-workspace.yaml`

```yaml
packages:
  - 'apps/*'
  - 'packages/**/*'
```

The `packages/**/*` glob covers nested scoped packages like `packages/@platform/vyntrize-db`.

#### Root `package.json`

```json
{
  "name": "vyntrize-platform",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "build": "pnpm --filter @platform/vyntrize-db build && pnpm --filter vyntrize-crm build && pnpm --filter vyntrize-website build",
    "dev": "pnpm --filter vyntrize-crm dev",
    "dev:website": "pnpm --filter vyntrize-website dev",
    "lint": "pnpm -r lint",
    "typecheck": "pnpm -r exec tsc --noEmit",
    "db:generate": "pnpm --filter @platform/vyntrize-db db:generate",
    "db:migrate": "pnpm --filter @platform/vyntrize-db db:migrate",
    "db:migrate:deploy": "pnpm --filter @platform/vyntrize-db db:migrate:deploy",
    "db:studio": "pnpm --filter @platform/vyntrize-db db:studio"
  },
  "engines": {
    "node": ">=20",
    "pnpm": ">=9"
  }
}
```

**Rationale for explicit build order**: `pnpm -r build` would run in parallel by default. Since `vyntrize-crm` and `vyntrize-website` depend on `@platform/vyntrize-db`, the package must be built first. Explicit `--filter` chaining guarantees order without needing `--workspace-concurrency=1`.

#### `tsconfig.base.json`

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "lib": ["DOM", "DOM.Iterable", "ESNext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "downlevelIteration": true
  }
}
```

Each app's `tsconfig.json` extends this with `"extends": "../../tsconfig.base.json"` and adds its own `plugins`, `paths`, `baseUrl`, and `include`/`exclude`.

#### `apps/vyntrize-crm/tsconfig.json` (updated)

```jsonc
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "baseUrl": ".",
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"],
      "@platform/vyntrize-db": [
        "../../packages/@platform/vyntrize-db/src/index.ts"
      ]
    }
  },
  "include": [
    "next.config.ts",
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    ".next/dev/types/**/*.ts"
  ],
  "exclude": ["node_modules", "scripts"]
}
```

The path alias `../../packages/@platform/vyntrize-db/src/index.ts` is already correct for the target layout — no change needed from the current file.

#### `apps/vyntrize-website/tsconfig.json` (updated)

```jsonc
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "baseUrl": ".",
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"],
      "@platform/vyntrize-db": [
        "../../packages/@platform/vyntrize-db/src/index.ts"
      ]
    }
  },
  "include": [
    "next.config.ts",
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    ".next/dev/types/**/*.ts"
  ],
  "exclude": ["node_modules", "scripts"]
}
```

Same pattern as CRM — path alias already correct for target layout.

#### `packages/@platform/vyntrize-db/tsconfig.json` (updated)

```jsonc
{
  "extends": "../../../tsconfig.base.json",
  "compilerOptions": {
    "baseUrl": ".",
    "noEmit": false,
    "declaration": true,
    "outDir": "dist"
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "src/generated"]
}
```

Note: three levels up (`../../../`) because the package is nested under `packages/@platform/vyntrize-db/`.

#### Root `.gitignore`

```gitignore
# Dependencies
node_modules/
.pnpm-store/

# Build outputs
.next/
dist/
out/

# Prisma generated client
packages/@platform/vyntrize-db/src/generated/

# Environment files
.env
.env.local
.env.*.local
# Keep .env.example files
!.env.example

# Misc
.DS_Store
*.log
.turbo/
```

#### Root `.env.example`

```dotenv
# ─── Database ────────────────────────────────────────────────────────────────
# Primary database URL (used by vyntrize-website and @platform/vyntrize-db)
VYNTRIZE_DATABASE_URL="postgresql://vyntrize_user:vyntrize_password@localhost:5432/vyntrize_db?sslmode=disable"

# CRM database URL (used by vyntrize-crm; falls back to VYNTRIZE_DATABASE_URL in the shared package)
CRM_DATABASE_URL="postgresql://vyntrize_user:vyntrize_password@localhost:5432/vyntrize_db?sslmode=disable"

# Postgres superuser URL — used by setup scripts only, not at runtime
POSTGRES_SUPERUSER_URL="postgresql://postgres:password@localhost:5432/postgres"

# Optional SSL configuration for the database connection
# VYNTRIZE_DATABASE_SSL_MODE="disable"   # disable | prefer | require | verify-ca | verify-full
# VYNTRIZE_DATABASE_SSL_CA=""
# VYNTRIZE_DATABASE_SSL_CERT=""
# VYNTRIZE_DATABASE_SSL_KEY=""

# ─── vyntrize-crm ────────────────────────────────────────────────────────────
# Session secret for iron-session (must be at least 32 characters)
SESSION_SECRET="your-super-secret-session-key-min-32-chars-here"

# Seed credentials (used by scripts only)
SEED_ADMIN_EMAIL="admin@vyntrise.com"
SEED_ADMIN_PASSWORD="ChangeMe123!"
SEED_ADMIN_NAME="Admin User"
SEED_DEFAULT_PASSWORD="Vyntrise2026!"

# ─── Runtime ─────────────────────────────────────────────────────────────────
NODE_ENV="development"
```

---

## Dockerfile Design

### `Dockerfile.crm`

Builds `vyntrize-crm` with `NEXT_OUTPUT=standalone`. Four stages: `base`, `deps`, `builder`, `runner`.

```dockerfile
# ─── Stage 1: base ───────────────────────────────────────────────────────────
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# ─── Stage 2: deps ───────────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /app

# Copy workspace manifests only — no source code yet.
# This layer is cached as long as package.json / lock files don't change.
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/vyntrize-crm/package.json ./apps/vyntrize-crm/
COPY packages/@platform/vyntrize-db/package.json ./packages/@platform/vyntrize-db/

# Install only the transitive closure of vyntrize-crm's dependencies.
# --frozen-lockfile ensures reproducible installs.
RUN pnpm install --filter vyntrize-crm... --frozen-lockfile

# ─── Stage 3: builder ────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app

# Bring in installed node_modules from deps stage.
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/vyntrize-crm/node_modules ./apps/vyntrize-crm/node_modules
COPY --from=deps /app/packages/@platform/vyntrize-db/node_modules ./packages/@platform/vyntrize-db/node_modules

# Copy all source files.
COPY . .

# Generate the Prisma client before building the Next.js app.
# This must run before `next build` so the generated types are available.
RUN pnpm --filter @platform/vyntrize-db db:generate

# Build vyntrize-crm in standalone mode.
# NEXT_OUTPUT=standalone tells next.config.ts to set output: 'standalone'.
# CRM_DATABASE_URL is a dummy value — the real URL is injected at runtime.
ENV NEXT_OUTPUT=standalone
ENV CRM_DATABASE_URL=postgresql://build:build@localhost:5432/build
RUN pnpm --filter vyntrize-crm build

# ─── Stage 4: runner ─────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3014
ENV HOSTNAME="0.0.0.0"

# Create a non-root user for security.
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# Copy the standalone bundle produced by Next.js.
# The standalone output is self-contained: it includes a minimal node_modules
# with only the server-side runtime dependencies.
COPY --from=builder --chown=nextjs:nodejs /app/apps/vyntrize-crm/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/vyntrize-crm/.next/static ./apps/vyntrize-crm/.next/static

# Copy public assets (if any exist in the CRM app).
# Using a conditional COPY pattern: the trailing slash on the source means
# Docker will not fail if the directory is empty.
COPY --from=builder --chown=nextjs:nodejs /app/apps/vyntrize-crm/public ./apps/vyntrize-crm/public

USER nextjs
EXPOSE 3014

# The standalone server entry point is server.js at the root of the standalone output.
CMD ["node", "apps/vyntrize-crm/server.js"]
```

**Stage rationale**:
- `deps` stage is cached independently of source changes — only re-runs when `package.json` or `pnpm-lock.yaml` changes.
- `builder` stage copies source and runs the build. The dummy `CRM_DATABASE_URL` satisfies `next.config.ts`'s build-time env fallback so Prisma can be instantiated during static analysis.
- `runner` stage contains no source files, no build tools, no Prisma schema — only the standalone bundle and static assets.

### `Dockerfile.website`

Builds `vyntrize-website` (package name: `vyntrize-website`). Same four-stage pattern.

```dockerfile
# ─── Stage 1: base ───────────────────────────────────────────────────────────
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# ─── Stage 2: deps ───────────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /app

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/vyntrize-website/package.json ./apps/vyntrize-website/
COPY packages/@platform/vyntrize-db/package.json ./packages/@platform/vyntrize-db/

# Filter on the package name declared in apps/vyntrize-website/package.json.
RUN pnpm install --filter vyntrize-website... --frozen-lockfile

# ─── Stage 3: builder ────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/vyntrize-website/node_modules ./apps/vyntrize-website/node_modules
COPY --from=deps /app/packages/@platform/vyntrize-db/node_modules ./packages/@platform/vyntrize-db/node_modules

COPY . .

RUN pnpm --filter @platform/vyntrize-db db:generate

# vyntrize-website has output: 'standalone' hardcoded in next.config.ts,
# so no NEXT_OUTPUT env var is needed.
ENV VYNTRIZE_DATABASE_URL=postgresql://build:build@localhost:5432/build
RUN pnpm --filter vyntrize-website build

# ─── Stage 4: runner ─────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3013
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/apps/vyntrize-website/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/vyntrize-website/.next/static ./apps/vyntrize-website/.next/static

# The website has a public/ directory with assets (images, fonts, etc.).
COPY --from=builder --chown=nextjs:nodejs /app/apps/vyntrize-website/public ./apps/vyntrize-website/public

USER nextjs
EXPOSE 3013

CMD ["node", "apps/vyntrize-website/server.js"]
```

---

## GitHub Actions CI Workflow

### `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: ['**']
  pull_request:
    branches: ['**']

env:
  REGISTRY: ghcr.io
  IMAGE_NAME_CRM: ${{ github.repository }}/vyntrize-crm
  IMAGE_NAME_WEBSITE: ${{ github.repository }}/vyntrize-website

jobs:
  validate:
    name: Install, Typecheck, Lint, Build
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: latest
          run_install: false

      - name: Get pnpm store directory
        id: pnpm-cache
        shell: bash
        run: echo "STORE_PATH=$(pnpm store path --silent)" >> $GITHUB_OUTPUT

      - name: Cache pnpm store
        uses: actions/cache@v4
        with:
          path: ${{ steps.pnpm-cache.outputs.STORE_PATH }}
          key: ${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}
          restore-keys: |
            ${{ runner.os }}-pnpm-store-

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Generate Prisma client
        run: pnpm db:generate

      - name: Typecheck
        run: pnpm typecheck

      - name: Lint
        run: pnpm lint

      - name: Build
        run: pnpm build

  docker:
    name: Build and Push Docker Images
    runs-on: ubuntu-latest
    needs: validate
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Log in to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Build and push CRM image
        uses: docker/build-push-action@v6
        with:
          context: .
          file: Dockerfile.crm
          push: true
          tags: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME_CRM }}:latest,${{ env.REGISTRY }}/${{ env.IMAGE_NAME_CRM }}:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Build and push Website image
        uses: docker/build-push-action@v6
        with:
          context: .
          file: Dockerfile.website
          push: true
          tags: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME_WEBSITE }}:latest,${{ env.REGISTRY }}/${{ env.IMAGE_NAME_WEBSITE }}:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

**Design notes**:
- The `validate` job runs on every push and PR to every branch.
- The `docker` job only runs on pushes to `main` and requires `validate` to pass first.
- Docker layer caching uses GitHub Actions cache (`type=gha`) to speed up repeated builds.
- Images are pushed to GitHub Container Registry (GHCR) using the built-in `GITHUB_TOKEN` — no additional secrets needed for the registry itself.
- Both images are tagged with `latest` and the commit SHA for traceability.

---

## Migration Strategy

The migration is a sequence of shell operations followed by configuration updates. No application code changes are required.

### Step 1: Create the target directory structure

```bash
mkdir -p apps packages/@platform
```

### Step 2: Move the packages

```bash
# Move apps
mv vyntrize-crm apps/vyntrize-crm
mv vyntrize-website apps/vyntrize-website

# Move shared package (preserving the scoped name in the path)
mv vyntrize-db packages/@platform/vyntrize-db
```

### Step 3: Create root configuration files

Create the following files at the workspace root (content defined in the Data Models section above):
- `pnpm-workspace.yaml`
- `package.json`
- `tsconfig.base.json`
- `.env.example`
- `.gitignore`
- `Dockerfile.crm`
- `Dockerfile.website`
- `.github/workflows/ci.yml`

### Step 4: Update `tsconfig.json` in each workspace member

Add `"extends": "../../tsconfig.base.json"` (or `"../../../tsconfig.base.json"` for the db package) to each member's `tsconfig.json` and remove the compiler options that are now inherited from the base. The path aliases are already correct and do not need to change.

### Step 5: Update `prisma.config.ts` path

The current `prisma.config.ts` loads `dotenv.config({ path: '../../../.env' })`. After the move to `packages/@platform/vyntrize-db/`, the path from the package root to the workspace root is still three levels up (`../../../`), so this line is unchanged.

### Step 6: Reinstall dependencies

```bash
# Delete all existing node_modules and lockfiles
find . -name 'node_modules' -type d -prune -exec rm -rf {} +
find . -name 'pnpm-lock.yaml' -delete

# Install from the workspace root
pnpm install
```

### Step 7: Verify

```bash
pnpm db:generate
pnpm typecheck
pnpm lint
pnpm build
```

### Step 8: Update `.gitignore` files

Remove per-app `.gitignore` files or consolidate them into the root `.gitignore`. At minimum, ensure the root `.gitignore` covers `node_modules/`, `.next/`, `.env`, and `packages/@platform/vyntrize-db/src/generated/`.

---

## Error Handling

### Missing Environment Variables

The `@platform/vyntrize-db` client throws a descriptive error at startup if neither `VYNTRIZE_DATABASE_URL` nor `CRM_DATABASE_URL` is set:

```
[vyntrize-db] No database URL found. Set VYNTRIZE_DATABASE_URL or CRM_DATABASE_URL in your environment.
```

This error surfaces before any HTTP traffic is accepted, satisfying Requirement 5.7.

### Docker Build Failures

- If `pnpm install --frozen-lockfile` fails, the build fails at the `deps` stage with a clear pnpm error. The fix is to run `pnpm install` locally and commit the updated `pnpm-lock.yaml`.
- If `db:generate` fails (e.g., Prisma schema syntax error), the build fails at the `builder` stage before `next build` runs.
- If `next build` fails, the error is surfaced in the builder stage output.

### CI Failures

Each CI step is independent and fails fast. The `docker` job has `needs: validate`, so Docker images are never pushed from a broken build.

---

## Testing Strategy

This feature is a structural reorganisation — it moves files and creates configuration. There is no new application logic to unit test. The appropriate testing strategy is:

**Smoke tests** (manual or scripted, run once after migration):
1. `pnpm install` completes without errors at the workspace root
2. `pnpm db:generate` regenerates the Prisma client
3. `pnpm typecheck` reports zero errors across all workspace members
4. `pnpm lint` reports zero errors across all workspace members
5. `pnpm build` produces `.next/standalone` output for both apps
6. `docker build -f Dockerfile.crm .` produces a valid image
7. `docker build -f Dockerfile.website .` produces a valid image
8. Running the CRM container with a valid `CRM_DATABASE_URL` serves HTTP on port 3014
9. Running the website container with a valid `VYNTRIZE_DATABASE_URL` serves HTTP on port 3013
10. Running either container without a database URL fails with the descriptive error from `@platform/vyntrize-db`

**CI as ongoing verification**: The GitHub Actions workflow defined above acts as the automated regression suite. Every push runs install → typecheck → lint → build, catching any regressions introduced by future changes.

**Property-based testing assessment**: This feature does not introduce pure functions, parsers, serializers, or data transformation logic. It is entirely structural configuration (workspace files, Dockerfiles, CI YAML). Property-based testing is not applicable here. The correctness guarantees are verified by the smoke tests and CI pipeline above.
