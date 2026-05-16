## Learned User Preferences

- Prefer taking full initiative: run commands, start services, and verify behavior in this environment instead of telling the user to perform manual setup or testing steps themselves.
- For repo-wide TypeScript tightening (replacing `any` or unjustified `unknown`), leave `./vendor/ai-researchwizard` out of scope unless the user explicitly includes it.

## Learned Workspace Facts

- **PazaakWorld gameplay** (authoritative matches, RPCs, realtime): local/dev uses **Nakama** (`infra/nakama`, `@openkotor/pazaak-nakama` runtime). Point the client with `VITE_PAZAAK_BACKEND=nakama` (or set `VITE_NAKAMA_HOST`) and keep `VITE_LEGACY_HTTP_ORIGIN=http://localhost:4001` when you still need the bot for OAuth token exchange and `/api/trask/*`. Older Cloudflare Worker + Durable Object paths remain in-repo for reference but are not the primary gameplay backend for the Nakama cutover.
- **PazaakWorld HTTP API failover** (non-Nakama paths): `@openkotor/platform` `createBrowserApiClient` walks comma-separated `VITE_API_BASES` in order and retries the next origin on **network errors or 5xx** (4xx does not hop). **`VITE_LEGACY_HTTP_ORIGIN`** origins are **prepended** (deduped) before `VITE_API_BASES`, so Pages can set `VITE_LEGACY_HTTP_ORIGIN` to a public bot and `PAZAAK_API_BASES` to a Cloudflare Worker URL for bot-first → Worker fallback. Worker lives in `infra/pazaak-matchmaking-worker`; CI runs `wrangler deploy --dry-run` in `.github/workflows/pazaak-matchmaking-worker.yml` without secrets; live deploy needs `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` repository secrets.
- **PazaakWorld on GitHub Pages** (static client only): `OpenKotOR/community-bots` is published at `https://openkotor.github.io/community-bots/`; CI and Vite should use `BASE=/community-bots/` (and `import.meta.env.BASE_URL` in app code). Treat legacy `/bots/` org URLs as mismatched with the renamed repo unless a separate redirect or `bots` Pages repo exists.
- For KotOR-authentic color theming in PazaakWorld (including fixing mismatched labels like “KotOR classic”), reference OpenKotOR ModSync’s K1 and TSL theme definitions rather than inventing standalone palettes.
- **Trask Q&A:** Node side uses `@openkotor/trask` and `@openkotor/trask-http`; `apps/trask-http-server` can serve `apps/holocron-web` and expose `/api/trask/*`, including a minimal in-memory `/__spark-kv` shim for static Holocron builds. Research calls go to `vendor/ai-researchwizard` (GPTR). When `TRASK_GPT_RESEARCHER_PYTHON` is unset, `loadResearchWizardRuntimeConfig` prefers the monorepo bootstrap interpreter at `.venv-trask-gptr` (`Scripts/python.exe` on Windows, `bin/python` on Unix), matching `scripts/smoke_trask_headless_gptr.py`. The vendored `vendor/ai-researchwizard/requirements.txt` omits `langchain-netmind` by default (LangChain version pin conflict); install it with `pip install langchain-netmind --no-deps` only if you need it. Python LLM fallback ordering comes from `vendor/llm_fallbacks` (`FREE_CHAT_MODELS` / `get_fallback_list("chat")`, not a `FREE_LLM_MODELS` env var). `loadSharedAiConfig` may fall back to `OPENROUTER_API_KEY` when `OPENAI_API_KEY` is unset for OpenAI-compatible clients (optional `OPENAI_BASE_URL` and OpenRouter headers). Holocron browser sessions allow anonymous `/api/trask/*` when `TRASK_WEB_API_KEY` is unset unless `TRASK_WEB_ALLOW_ANONYMOUS=0`; set `TRASK_WEB_API_KEY` for locked-down deployments. `TRASK_RESEARCHWIZARD_TIMEOUT_MS` defaults to **900000** ms when unset (`loadResearchWizardRuntimeConfig` in `packages/config`).

## Cursor Cloud specific instructions

### Environment overview

- **Runtime**: Node.js ≥24, pnpm 10.11.0 (via corepack)
- **Monorepo**: pnpm workspaces — `apps/*`, `packages/*`, `infra/*`
- **Build**: `pnpm build` (runs `tsc -b tsconfig.workspace.json`)
- **Type check**: `pnpm check`
- **Lint**: `pnpm --filter pazaak-world lint` (only pazaak-world has eslint config currently)
- **Tests**: `pnpm test` (shorthand for `node --test packages/*/dist/*.test.js apps/*/dist/*.test.js`, Node.js built-in runner; build first). `pnpm test:watch` for interactive watch mode.

### Build scripts (esbuild)

After `pnpm install`, you must run `pnpm rebuild esbuild` once per clean install because esbuild's postinstall is blocked by the `onlyBuiltDependencies` allow-list in `pnpm-workspace.yaml`. Without the rebuild, the pazaak-nakama bundle step will fail (esbuild binary missing). This does not affect the main TypeScript workspace build or the Vite-based dev servers.

### Running dev servers

Standard scripts from `package.json`:
- `pnpm dev:pazaak-world` — Vite dev server for the card game SPA (port 5173)
- `pnpm dev:holocron-web` — Vite dev server for the KOTOR knowledge base (port 5174 if 5173 is taken)
- `pnpm dev:hk86-web` — static Discord bots hub page
- `pnpm dev:trask-http` — REST + static serve for holocron-web
- `pnpm dev:pazaak` — Discord Pazaak Bot (needs `PAZAAK_DISCORD_BOT_TOKEN`)
- `pnpm dev:trask` — Discord Trask Bot (needs `TRASK_DISCORD_BOT_TOKEN`)
- `pnpm dev:hk` — Discord HK Bot (needs `HK_DISCORD_BOT_TOKEN`)

### Gotchas

- The pazaak-world app renders a dark/space-themed animated background on load; without a backend (bot or Nakama), the main menu card content may not render — this is expected when no API is reachable.
- `trask-http` tests have 2 pre-existing flaky failures around temp-file rename race conditions under `/tmp`; these are not environment issues.
- holocron-web uses TypeScript ~5.7 while the rest of the workspace uses ~6.0; Vite handles each independently.
- The `package-lock.json` at root is legacy/stale; pnpm is the authoritative package manager.
