# Implementation Plan: Monorepo Deployment

## Overview

Restructure the repository into a proper pnpm monorepo by moving `vyntrize-crm`, `vyntrize-website`, and `vyntrize-db` into `apps/` and `packages/` directories, then creating all root-level configuration files (workspace manifest, TypeScript base config, Dockerfiles, CI workflow, env examples, and gitignore). No application logic changes are required — this is purely structural and configuration work.

Tasks are ordered so the workspace remains in a consistent state at every step: root config files are created before any moves, tsconfig files are updated immediately after each move, and the lockfile is regenerated only after all moves and config updates are complete.

## Tasks

- [x] 1. Create workspace root configuration files
  - Create `pnpm-workspace.yaml` declaring `apps/*` and `packages/**/*` as workspace members
  - Create root `package.json` with `"name": "vyntrize-platform"`, `"private": true`, `"engines"` constraints, and all workspace-level scripts (`build`, `dev`, `dev:website`, `lint`, `typecheck`, `db:generate`, `db:migrate`, `db:migrate:deploy`, `db:studio`)
  - Create `tsconfig.base.json` with shared compiler options (`target`, `lib`, `strict`, `moduleResolution`, `jsx`, etc.) as defined in the design
  - _Requirements: 1.1, 1.2, 1.5, 4.1, 4.2, 4.3, 4.4_

- [x] 2. Create root environment and ignore files
  - Create root `.env.example` listing all variables across all apps and packages with inline comments (`VYNTRIZE_DATABASE_URL`, `CRM_DATABASE_URL`, `POSTGRES_SUPERUSER_URL`, SSL vars, `SESSION_SECRET`, seed vars, `NODE_ENV`)
  - Create root `.gitignore` covering `node_modules/`, `.pnpm-store/`, `.next/`, `dist/`, `out/`, `packages/@platform/vyntrize-db/src/generated/`, all `.env` variants (but not `.env.example`), `.DS_Store`, `*.log`, `.turbo/`
  - _Requirements: 6.1, 6.4, 6.5_

- [x] 3. Move `vyntrize-db` to `packages/@platform/vyntrize-db`
  - Create the `packages/@platform/` directory structure
  - Move the entire `vyntrize-db/` directory to `packages/@platform/vyntrize-db/`
  - Update `packages/@platform/vyntrize-db/tsconfig.json`: add `"extends": "../../../tsconfig.base.json"`, set `"noEmit": false`, `"declaration": true`, `"outDir": "dist"`, keep `"include": ["src/**/*.ts"]` and `"exclude": ["node_modules", "src/generated"]`
  - Verify `prisma.config.ts` still loads `dotenv.config({ path: '../../../.env' })` — the relative path to workspace root is unchanged at three levels up
  - _Requirements: 2.2, 2.5, 3.1, 3.4_

- [x] 4. Move `vyntrize-crm` to `apps/vyntrize-crm`
  - Create the `apps/` directory
  - Move the entire `vyntrize-crm/` directory to `apps/vyntrize-crm/`
  - Update `apps/vyntrize-crm/tsconfig.json`: add `"extends": "../../tsconfig.base.json"` and remove compiler options now inherited from the base; retain `"baseUrl": "."`, `"plugins"`, `"paths"` (`@/*` and `@platform/vyntrize-db` → `../../packages/@platform/vyntrize-db/src/index.ts`), `"include"`, and `"exclude"`
  - _Requirements: 2.1, 2.3, 2.4_

- [x] 5. Move `vyntrize-website` to `apps/vyntrize-website`
  - Move the entire `vyntrize-website/` directory to `apps/vyntrize-website/`
  - Update `apps/vyntrize-website/tsconfig.json`: add `"extends": "../../tsconfig.base.json"` and remove compiler options now inherited from the base; retain `"baseUrl": "."`, `"plugins"`, `"paths"` (`@/*` and `@platform/vyntrize-db` → `../../packages/@platform/vyntrize-db/src/index.ts`), `"include"`, and `"exclude"`
  - Update `apps/vyntrize-website/next.config.ts`: add `transpilePackages: ['motion', '@platform/vyntrize-db']` and `serverExternalPackages: ['@prisma/client']` if not already present (verify against current file)
  - _Requirements: 2.1, 2.3, 2.4, 8.1, 8.2_

- [x] 6. Regenerate the pnpm lockfile
  - Delete all existing `node_modules` directories and any per-package `pnpm-lock.yaml` files across the old layout
  - Run `pnpm install` at the workspace root to produce a single `pnpm-lock.yaml` covering all workspace members
  - Verify that `@platform/vyntrize-db` is resolved via the `workspace:*` protocol in both `apps/vyntrize-crm/package.json` and `apps/vyntrize-website/package.json`
  - _Requirements: 1.3, 1.4, 2.3_

- [x] 7. Checkpoint — verify toolchain scripts
  - Run `pnpm db:generate` at the workspace root and confirm the Prisma client is regenerated into `packages/@platform/vyntrize-db/src/generated/client/`
  - Run `pnpm typecheck` at the workspace root and confirm zero type errors across all workspace members
  - Run `pnpm lint` at the workspace root and confirm zero ESLint errors
  - Run `pnpm build` at the workspace root and confirm packages build before apps (db → crm → website)
  - Ensure all checks pass; ask the user if questions arise.
  - _Requirements: 3.2, 4.1, 4.3, 4.4, 4.5_

- [x] 8. Create `Dockerfile.crm` at the workspace root
  - Write a four-stage Dockerfile (`base`, `deps`, `builder`, `runner`) at the workspace root
  - `base` stage: `node:20-alpine`, enable corepack, activate pnpm
  - `deps` stage: copy only `pnpm-workspace.yaml`, `pnpm-lock.yaml`, root `package.json`, `apps/vyntrize-crm/package.json`, and `packages/@platform/vyntrize-db/package.json`; run `pnpm install --filter vyntrize-crm... --frozen-lockfile`
  - `builder` stage: copy `node_modules` from `deps`, copy all source, run `pnpm --filter @platform/vyntrize-db db:generate`, set `ENV NEXT_OUTPUT=standalone` and dummy `CRM_DATABASE_URL`, run `pnpm --filter vyntrize-crm build`
  - `runner` stage: `node:20-alpine`, create `nodejs`/`nextjs` non-root user, copy standalone bundle and static assets from builder, set `PORT=3014`, `HOSTNAME=0.0.0.0`, `NODE_ENV=production`, expose 3014, `CMD ["node", "apps/vyntrize-crm/server.js"]`
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [x] 9. Create `Dockerfile.website` at the workspace root
  - Write a four-stage Dockerfile (`base`, `deps`, `builder`, `runner`) at the workspace root using the same pattern as `Dockerfile.crm`
  - `deps` stage: filter on `vyntrize-website` (the package name in `apps/vyntrize-website/package.json`); copy `apps/vyntrize-website/package.json` instead of the CRM package manifest
  - `builder` stage: run `pnpm --filter @platform/vyntrize-db db:generate`, set dummy `VYNTRIZE_DATABASE_URL`, run `pnpm --filter vyntrize-website build` (no `NEXT_OUTPUT` env var needed — `output: 'standalone'` is hardcoded in `apps/vyntrize-website/next.config.ts`)
  - `runner` stage: copy standalone bundle and static assets for website, set `PORT=3013`, expose 3013, `CMD ["node", "apps/vyntrize-website/server.js"]`
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [x] 10. Create the GitHub Actions CI workflow
  - Create `.github/workflows/ci.yml`
  - `validate` job: checkout → setup Node 20 → setup pnpm (action-setup@v4) → get pnpm store path → cache pnpm store keyed on `pnpm-lock.yaml` hash → `pnpm install --frozen-lockfile` → `pnpm db:generate` → `pnpm typecheck` → `pnpm lint` → `pnpm build`; trigger on push and PR to all branches
  - `docker` job: depends on `validate`, runs only on push to `main`; login to GHCR with `GITHUB_TOKEN` → setup Buildx → build-and-push `Dockerfile.crm` tagged `latest` and `${{ github.sha }}` → build-and-push `Dockerfile.website` with same tags; use `type=gha` layer cache
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [x] 11. Final checkpoint — end-to-end verification
  - Confirm `pnpm install --frozen-lockfile` succeeds (simulating CI)
  - Confirm `pnpm db:generate`, `pnpm typecheck`, `pnpm lint`, and `pnpm build` all pass
  - Confirm `docker build -f Dockerfile.crm .` completes without errors
  - Confirm `docker build -f Dockerfile.website .` completes without errors
  - Ensure all checks pass; ask the user if questions arise.
  - _Requirements: 1.1–1.5, 2.1–2.6, 3.1–3.5, 4.1–4.6, 5.1–5.7, 6.1–6.5, 7.1–7.6, 8.1–8.4_

## Notes

- No application logic changes are required at any step — this is purely structural and configuration work.
- Tasks 3, 4, and 5 (the directory moves) must be done before task 6 (lockfile regeneration) so pnpm can resolve the new workspace layout.
- The `prisma.config.ts` dotenv path (`../../../.env`) is correct for the target layout and requires no change.
- The `@platform/vyntrize-db` path alias in both app `tsconfig.json` files already points to the correct target path — only the `extends` field needs to be added.
- `vyntrize-website/next.config.ts` already has `output: 'standalone'` hardcoded, so `Dockerfile.website` does not need to set `NEXT_OUTPUT`.
- There are no property-based tests in this feature — the design explicitly states PBT is not applicable for structural configuration work.
