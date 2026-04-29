# Requirements Document

## Introduction

The Vyntrize project currently has two sibling folders — `vyntrize-crm` (a Next.js 15 application) and `vyntrize-db` (a shared Prisma database package) — that live side-by-side without a formal monorepo root. The Dockerfile and `tsconfig.json` paths already anticipate a pnpm workspace layout (`apps/vyntrize-crm`, `packages/@platform/vyntrize-db`), but the physical structure has not been migrated yet.

This feature covers:
1. Restructuring the repository into a proper pnpm monorepo with a root workspace.
2. Updating all tooling (TypeScript, ESLint, Docker, CI) to work from the new layout.
3. Establishing a deployment strategy so the CRM application can be built and shipped from the monorepo root.

The design must also leave room for a future `vyntrize-website` app (already referenced in the Prisma schema) without requiring structural changes.

---

## Glossary

- **Monorepo**: A single Git repository that contains multiple packages and/or applications managed together.
- **Workspace_Root**: The top-level directory of the monorepo containing `package.json`, `pnpm-workspace.yaml`, and `pnpm-lock.yaml`.
- **App**: A deployable application that lives under `apps/`. Currently: `vyntrize-crm`.
- **Package**: A shared, internal library that lives under `packages/`. Currently: `@platform/vyntrize-db`.
- **pnpm**: The package manager used for workspace management and dependency hoisting.
- **Toolchain**: The set of build, lint, type-check, and test scripts available at the Workspace_Root level.
- **Prisma_Client**: The generated TypeScript database client produced by `prisma generate` inside `@platform/vyntrize-db`.
- **Standalone_Build**: The Next.js `output: 'standalone'` build mode that produces a self-contained Node.js server bundle.
- **Docker_Image**: The OCI-compliant container image built from the monorepo for deploying `vyntrize-crm`.
- **CI**: Continuous Integration pipeline (e.g., GitHub Actions) that runs on every push or pull request.
- **Migration**: A Prisma database migration script that evolves the PostgreSQL schema.

---

## Requirements

### Requirement 1: Monorepo Root Structure

**User Story:** As a developer, I want a single workspace root with a `pnpm-workspace.yaml` and root `package.json`, so that all packages and apps are managed from one place.

#### Acceptance Criteria

1. THE Workspace_Root SHALL contain a `pnpm-workspace.yaml` file that declares `apps/*` and `packages/**/*` as workspace members.
2. THE Workspace_Root SHALL contain a root `package.json` with `"private": true` and workspace-level scripts for common operations (`build`, `lint`, `typecheck`, `dev`).
3. THE Workspace_Root SHALL contain a single `pnpm-lock.yaml` that covers all workspace members.
4. WHEN a developer runs `pnpm install` at the Workspace_Root, THE Toolchain SHALL install dependencies for all workspace members without requiring separate installs in each folder.
5. THE Workspace_Root SHALL contain a root `tsconfig.base.json` that defines shared compiler options inherited by all workspace members.

---

### Requirement 2: App and Package Directory Layout

**User Story:** As a developer, I want the existing code moved into the correct monorepo directories, so that the physical layout matches the paths already assumed by the Dockerfile and `tsconfig.json`.

#### Acceptance Criteria

1. THE Monorepo SHALL place the `vyntrize-crm` Next.js application at `apps/vyntrize-crm/`.
2. THE Monorepo SHALL place the `vyntrize-db` Prisma package at `packages/@platform/vyntrize-db/`.
3. WHEN the `vyntrize-crm` application is moved, THE Toolchain SHALL resolve the `@platform/vyntrize-db` import via the pnpm workspace protocol (`workspace:*`) without requiring absolute file-system paths.
4. THE `apps/vyntrize-crm/tsconfig.json` SHALL extend `../../tsconfig.base.json` and retain its existing path aliases.
5. THE `packages/@platform/vyntrize-db/tsconfig.json` SHALL extend `../../tsconfig.base.json`.
6. IF a developer adds a new app under `apps/`, THEN THE Workspace_Root `pnpm-workspace.yaml` SHALL automatically include it without manual edits (by virtue of the `apps/*` glob).

---

### Requirement 3: Shared Package (`@platform/vyntrize-db`) Integrity

**User Story:** As a developer, I want the shared database package to be importable by any app in the monorepo, so that database access logic is not duplicated.

#### Acceptance Criteria

1. THE `@platform/vyntrize-db` package SHALL export a `vyntrizeDb` Prisma client instance and all generated types from its `src/index.ts` entry point.
2. WHEN `pnpm db:generate` is run inside `packages/@platform/vyntrize-db`, THE Prisma_Client SHALL be regenerated into `src/generated/client/`.
3. WHEN `pnpm db:migrate:deploy` is run inside `packages/@platform/vyntrize-db`, THE Migration SHALL be applied to the target PostgreSQL database.
4. THE `packages/@platform/vyntrize-db/prisma.config.ts` SHALL resolve the database URL from `VYNTRIZE_DATABASE_URL` or `CRM_DATABASE_URL` environment variables, in that priority order.
5. IF neither `VYNTRIZE_DATABASE_URL` nor `CRM_DATABASE_URL` is set at runtime, THEN THE Prisma_Client SHALL throw a descriptive error identifying the missing environment variable.

---

### Requirement 4: Root-Level Toolchain Scripts

**User Story:** As a developer, I want to run build, lint, and type-check commands from the workspace root, so that I don't need to navigate into individual packages.

#### Acceptance Criteria

1. WHEN a developer runs `pnpm build` at the Workspace_Root, THE Toolchain SHALL build all packages in dependency order (packages before apps).
2. WHEN a developer runs `pnpm dev` at the Workspace_Root, THE Toolchain SHALL start the `vyntrize-crm` development server on port 3014.
3. WHEN a developer runs `pnpm lint` at the Workspace_Root, THE Toolchain SHALL run ESLint across all workspace members and report all violations.
4. WHEN a developer runs `pnpm typecheck` at the Workspace_Root, THE Toolchain SHALL run `tsc --noEmit` across all workspace members and report all type errors.
5. WHEN a developer runs `pnpm db:generate` at the Workspace_Root, THE Toolchain SHALL delegate to `packages/@platform/vyntrize-db` and regenerate the Prisma_Client.
6. WHEN a developer runs `pnpm db:migrate:deploy` at the Workspace_Root, THE Toolchain SHALL delegate to `packages/@platform/vyntrize-db` and apply pending Migrations.

---

### Requirement 5: Docker Build from Monorepo Root

**User Story:** As a DevOps engineer, I want to build a Docker image for `vyntrize-crm` from the monorepo root, so that the image includes the shared `@platform/vyntrize-db` package.

#### Acceptance Criteria

1. THE Workspace_Root SHALL contain a `Dockerfile` (or the existing `apps/vyntrize-crm/Dockerfile` SHALL be updated) that uses the monorepo root as its build context.
2. WHEN the Docker_Image is built, THE Dockerfile SHALL install only the dependencies required by `vyntrize-crm` and `@platform/vyntrize-db` using `pnpm --filter`.
3. WHEN the Docker_Image is built, THE Dockerfile SHALL run `pnpm db:generate` inside `packages/@platform/vyntrize-db` before running `next build`.
4. WHEN the Docker_Image is built, THE Dockerfile SHALL produce a Standalone_Build of `vyntrize-crm` using `NEXT_OUTPUT=standalone`.
5. THE Docker_Image runner stage SHALL run as a non-root user (`nextjs`) and expose port 3014.
6. THE Docker_Image runner stage SHALL NOT include source files, `node_modules` from the build stage, or the Prisma schema — only the standalone bundle and static assets.
7. WHEN the Docker_Image is started without a `CRM_DATABASE_URL` environment variable, THE Docker_Image SHALL fail fast with a descriptive error before accepting HTTP traffic.

---

### Requirement 6: Environment Variable Management

**User Story:** As a developer, I want a clear, documented environment variable strategy across the monorepo, so that each app and package knows which variables it needs.

#### Acceptance Criteria

1. THE Workspace_Root SHALL contain a `.env.example` file listing all environment variables required across all apps and packages, with descriptions.
2. THE `apps/vyntrize-crm/.env.example` SHALL list variables specific to the CRM app (`CRM_DATABASE_URL`, `SESSION_SECRET`, etc.).
3. THE `packages/@platform/vyntrize-db/.env.example` SHALL list variables specific to the database package (`VYNTRIZE_DATABASE_URL` or `CRM_DATABASE_URL`, `VYNTRIZE_DATABASE_SSL_MODE`, etc.).
4. WHEN a developer copies `.env.example` to `.env` and fills in values, THE Toolchain SHALL be able to run all workspace scripts without additional configuration.
5. THE root `.gitignore` SHALL exclude all `.env` files (but not `.env.example` files) across the entire monorepo.

---

### Requirement 7: CI Pipeline

**User Story:** As a developer, I want a CI pipeline that validates the monorepo on every push, so that broken builds or type errors are caught before merging.

#### Acceptance Criteria

1. THE CI SHALL run `pnpm install --frozen-lockfile` at the Workspace_Root on every push and pull request.
2. WHEN `pnpm install` succeeds, THE CI SHALL run `pnpm typecheck` and fail the pipeline if any type errors are reported.
3. WHEN `pnpm install` succeeds, THE CI SHALL run `pnpm lint` and fail the pipeline if any ESLint errors are reported.
4. WHEN `pnpm install` succeeds, THE CI SHALL run `pnpm build` and fail the pipeline if the build fails.
5. THE CI SHALL cache the pnpm store between runs to reduce install time.
6. WHERE a Docker registry is configured, THE CI SHALL build and push the Docker_Image on merges to the `main` branch.

---

### Requirement 8: Extensibility for Future Apps

**User Story:** As a developer, I want the monorepo structure to support adding a `vyntrize-website` app in the future, so that the database package can be shared without restructuring.

#### Acceptance Criteria

1. THE Monorepo SHALL reserve the `apps/vyntrize-website/` path for a future website application without any placeholder files being required now.
2. WHEN a `vyntrize-website` app is added under `apps/`, THE `@platform/vyntrize-db` package SHALL be importable by it using the same `workspace:*` protocol, without changes to the package itself.
3. THE `packages/@platform/vyntrize-db/src/client.ts` SHALL resolve the database URL from `VYNTRIZE_DATABASE_URL` as the primary variable, so that the website app can use a different variable name than the CRM app.
4. THE Prisma schema SHALL retain the `ContactSubmission` and `PageView` models (used by the website) alongside the CRM models, so that a single Migration history covers all apps.
