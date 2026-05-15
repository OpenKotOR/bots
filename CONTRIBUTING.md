# Contributing to community-bots

This monorepo uses **pnpm** (Node.js **≥ 24**). Authoritative runtime and product notes live in [`AGENTS.md`](AGENTS.md) at the repo root—read that before changing env-sensitive paths (Nakama, Trask, GitHub Pages base URL, etc.).

## Quick start

```bash
corepack enable
pnpm install
pnpm rebuild esbuild
pnpm build
pnpm check
```

- After a **clean** `pnpm install`, run `pnpm rebuild esbuild` once (see `pnpm-workspace.yaml` `onlyBuiltDependencies`).
- **Tests:** `node --test packages/*/dist/*.test.js apps/*/dist/*.test.js` (packages must be built first). Some packages expose `pnpm --filter <pkg> test` (e.g. `@openkotor/platform`).

## Apps and packages

- **Apps:** `apps/*` — Vite frontends (`pazaak-world`, `cardworld`, `holocron-web`, …), Discord bots, `trask-http-server`, etc.
- **Packages:** `packages/*` — shared TypeScript libraries consumed by apps.
- **Infra:** `infra/*` — Nakama bundle, Cloudflare Workers, etc.

## Lint

Only `pazaak-world` (and packages with their own eslint config) may have ESLint wired today:

```bash
pnpm --filter pazaak-world lint
```

## Pull requests

Use [`.github/pull_request_template.md`](.github/pull_request_template.md). For audio or `localStorage` migration work, complete the **Web Audio / persistence** checklist in the template body.

## Questions

Open a discussion or issue on the GitHub repo; cite `AGENTS.md` when reporting environment-specific bugs.
