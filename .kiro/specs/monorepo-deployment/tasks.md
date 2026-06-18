# Implementation Plan: Monorepo Deployment

> **Status**: Complete — all tasks done  
> **Last Updated**: 2026-06-18  
> **Stack**: pnpm workspaces · TypeScript · Docker (multi-stage) · GitHub Actions  
> **Scope**: Pure structural + configuration work — zero application logic changes

---

## ✅ Done — All Tasks Complete

> The monorepo restructure is fully complete. The workspace runs as a proper pnpm monorepo with a single lockfile, shared TypeScript base config, multi-stage Dockerfiles, and a CI/CD pipeline.

---

### 1. Workspace Root Configuration
**Why**: pnpm needs a workspace manifest before any packages can be linked. The root `package.json` and `tsconfig.base.json` define the shared foundation everything else extends.

- [x] `pnpm-workspace.yaml` — declares `apps/*` and `packages/**/*` as workspace members
- [x] Root `package.json` — `"name": "vyntrize-platform"`, `"private": true`, `"engines"` constraints, all workspace-level scripts (`build`, `dev`, `dev:website`, `lint`, `typecheck`, `db:generate`, `db:migrate`, `db:migrate:deploy`, `db:studio`)
- [x] `tsconfig.base.json` — shared compiler options (`target`, `lib`, `strict`, `moduleResolution`, `jsx`)
- [x] _Requirements: 1.1, 1.2, 1.5, 4.1–4.4_

---

### 2. Root Environment & Ignore Files
**Why**: A single root `.env.example` documents all variables across all apps in one place. The `.gitignore` prevents secrets and generated files from being committed.

- [x] Root `.env.example` — all variables with inline comments: `VYNTRIZE_DATABASE_URL`, `CRM_DATABASE_URL`, `POSTGRES_SUPERUSER_URL`, SSL vars, `SESSION_SECRET`, seed vars, `NODE_ENV`
- [x] Root `.gitignore` — `node_modules/`, `.pnpm-store/`, `.next/`, `dist/`, `out/`, `packages/@platform/vyntrize-db/src/generated/`, all `.env` variants (not `.env.example`), `.DS_Store`, `*.log`, `.turbo/`
- [x] _Requirements: 6.1, 6.4, 6.5_

---

### 3. Move `vyntrize-db` → `packages/@platform/vyntrize-db`
**Why**: The shared database package must live under `packages/` so both apps can depend on it via the `workspace:*` protocol. The `prisma.config.ts` dotenv path (`../../../.env`) already points to the workspace root — no change needed.

- [x] Created `packages/@platform/` directory structure
- [x] Moved `vyntrize-db/` to `packages/@platform/vyntrize-db/`
- [x] Updated `tsconfig.json` — added `"extends": "../../../tsconfig.base.json"`, set `"noEmit": false`, `"declaration": true`, `"outDir": "dist"`
- [x] Verified `prisma.config.ts` dotenv path is correct at three levels up
- [x] _Requirements: 2.2, 2.5, 3.1, 3.4_

---

### 4. Move `vyntrize-crm` → `apps/vyntrize-crm`
**Why**: Apps live under `apps/` per the workspace layout. The tsconfig must extend the base and retain its `paths` aliases for `@/*` and `@platform/vyntrize-db`.

- [x] Created `apps/` directory
- [x] Moved `vyntrize-crm/` to `apps/vyntrize-crm/`
- [x] Updated `tsconfig.json` — added `"extends": "../../tsconfig.base.json"`, retained `baseUrl`, `plugins`, `paths`, `include`, `exclude`
- [x] _Requirements: 2.1, 2.3, 2.4_

---

### 5. Move `vyntrize-website` → `apps/vyntrize-website`
**Why**: Same reasoning as task 4. The website also needs `transpilePackages` in `next.config.ts` to handle the shared DB package.

- [x] Moved `vyntrize-website/` to `apps/vyntrize-website/`
- [x] Updated `tsconfig.json` — extends base, retained paths aliases
- [x] Updated `next.config.ts` — added `transpilePackages: ['motion', '@platform/vyntrize-db']` and `serverExternalPackages: ['@prisma/client']`
- [x] _Requirements: 2.1, 2.3, 2.4, 8.1, 8.2_

---

### 6. Regenerate pnpm Lockfile
**Why**: After moving directories, the old lockfile is stale. A fresh `pnpm install` at the workspace root produces a single `pnpm-lock.yaml` that covers all members.

- [x] Deleted all existing `node_modules/` directories
- [x] Ran `pnpm install` at workspace root — single `pnpm-lock.yaml` generated
- [x] Verified `@platform/vyntrize-db` is resolved via `workspace:*` in both app `package.json` files
- [x] _Requirements: 1.3, 1.4, 2.3_

---

### 7. Checkpoint — Toolchain Scripts
**Why**: Verifies the workspace is internally consistent before containerizing.

- [x] `pnpm db:generate` — Prisma client regenerated into `packages/@platform/vyntrize-db/src/generated/client/`
- [x] `pnpm typecheck` — zero type errors across all workspace members
- [x] `pnpm lint` — zero ESLint errors
- [x] `pnpm build` — packages build before apps (db → crm → website)
- [x] _Requirements: 3.2, 4.1, 4.3–4.5_

---

### 8. `Dockerfile.crm`
**Why**: A four-stage build (base → deps → builder → runner) produces a minimal production image. The `deps` stage copies only manifests to maximize layer cache reuse — source changes don't invalidate the dependency layer.

- [x] `base` — `node:20-alpine`, corepack enabled, pnpm activated
- [x] `deps` — copies workspace manifest, lockfile, and only the relevant `package.json` files; runs `pnpm install --filter vyntrize-crm... --frozen-lockfile`
- [x] `builder` — copies source, runs `pnpm --filter @platform/vyntrize-db db:generate`, sets `ENV NEXT_OUTPUT=standalone` + dummy `CRM_DATABASE_URL`, runs `pnpm --filter vyntrize-crm build`
- [x] `runner` — `node:20-alpine`, non-root `nodejs`/`nextjs` user, standalone bundle, `PORT=3014`, `HOSTNAME=0.0.0.0`, `NODE_ENV=production`
- [x] _Requirements: 5.1–5.6_

---

### 9. `Dockerfile.website`
**Why**: Same four-stage pattern as the CRM Dockerfile. Website uses `output: 'standalone'` hardcoded in `next.config.ts` so no `NEXT_OUTPUT` env var is needed.

- [x] Same four-stage pattern as `Dockerfile.crm`
- [x] `deps` filters on `vyntrize-website`
- [x] `builder` runs `pnpm --filter vyntrize-website build` with dummy `VYNTRIZE_DATABASE_URL`
- [x] `runner` — `PORT=3013`, standalone bundle at `apps/vyntrize-website/server.js`
- [x] _Requirements: 5.1–5.6_

---

### 10. GitHub Actions CI Workflow
**Why**: Two-job pipeline — `validate` runs on every push/PR, `docker` runs only on pushes to `main`. Layer caching via `type=gha` keeps Docker builds fast.

- [x] `validate` job — checkout → Node 20 → pnpm setup → cache pnpm store → `pnpm install --frozen-lockfile` → `db:generate` → `typecheck` → `lint` → `build`; triggers on push + PR to all branches
- [x] `docker` job — depends on `validate`, main-branch only; GHCR login → Buildx setup → build+push `Dockerfile.crm` tagged `latest` + `${{ github.sha }}` → build+push `Dockerfile.website` same tags; `type=gha` layer cache
- [x] _Requirements: 7.1–7.6_

---

### 11. Final Checkpoint — End-to-End Verification

- [x] `pnpm install --frozen-lockfile` succeeds (CI simulation)
- [x] `pnpm db:generate`, `typecheck`, `lint`, `build` all pass
- [x] `docker build -f Dockerfile.crm .` completes without errors
- [x] `docker build -f Dockerfile.website .` completes without errors
- [x] _Requirements: 1.1–1.5, 2.1–2.6, 3.1–3.5, 4.1–4.6, 5.1–5.7, 6.1–6.5, 7.1–7.6, 8.1–8.4_

---

## Notes

- No application logic was changed — this was purely structural and configuration work
- Tasks 3, 4, 5 (directory moves) were done before task 6 (lockfile regeneration) so pnpm could resolve the new layout
- The `prisma.config.ts` dotenv path (`../../../.env`) was correct for the target layout and required no change
- `vyntrize-website/next.config.ts` already had `output: 'standalone'` hardcoded — `Dockerfile.website` does not set `NEXT_OUTPUT`
- There are no property-based tests — the design explicitly states PBT is not applicable for structural config work
