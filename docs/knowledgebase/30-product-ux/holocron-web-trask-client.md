---
title: Holocron Web Trask Client
owner: holocron-web
status: active
lastUpdated: 2026-05-20
---

# Module

- [REPO] Browser API helpers live in `apps/holocron-web/src/lib/trask-api.ts`; DTOs mirror `packages/trask-http` router payloads.

# Base URL

- [REPO] **`VITE_TRASK_API_BASE`**: when set (trimmed, no trailing slash), all `fetch` calls use that origin; when **empty**, requests use **same-origin** relative URLs (`apiBase()` returns `''`).
- [SYNTH] Same-origin mode is required for **cookie** sessions (Discord OAuth on embedded bot): `traskRequestInit` sets **`credentials: 'include'`** when `!apiBase()` (`traskUsesSameOriginApi()`).

# API key header

- [REPO] Optional **`VITE_TRASK_API_KEY`**: sent as **`Authorization: Bearer …`** on every Trask call unless overridden per-call (`authHeaders` in `trask-api.ts`).
- [SYNTH] Use for static builds or cross-origin hosts where cookies are not available; must match server `TRASK_WEB_API_KEY` when that mode is enabled.

# Timeouts

- [REPO] Default **20_000** ms per Trask HTTP request (`DEFAULT_TRASK_FETCH_TIMEOUT_MS`); override with **`VITE_TRASK_FETCH_TIMEOUT_MS`** (minimum **3000** ms if parsed as finite number).
- [REPO] Poll helper **`traskPollIterationSignal`** uses **12_000** ms per `/thread` poll iteration (`POLL_ITERATION_MS`).

# Endpoints used

- [REPO] `GET /api/trask/session`, `POST /api/trask/auth/logout`, `GET /api/trask/thread/:id`, `GET /api/trask/sources`, `GET /api/trask/models`, `GET /api/trask/history`, `POST /api/trask/ask`, `POST /api/trask/query/:queryId/cancel` — paths align with [trask-http-session-history-contract.md](../10-architecture-runtime/trask-http-session-history-contract.md) and [trask-http-ask-contract.md](../10-architecture-runtime/trask-http-ask-contract.md).

# `traskAsk` behavior

- [REPO] JSDoc in `trask-api.ts`: **202** + `pending` when server persists queries; client should poll **`traskGetThread(threadId, …)`** until `complete` or `failed`; **201** path returns a finished record when persistence is off.

# Vite dev proxy

- [REPO] `apps/holocron-web/vite.config.ts` proxies **`/api/trask`** to **`TRASK_HTTP_PROXY_TARGET`** (default **`http://127.0.0.1:4010`**) so `VITE_TRASK_API_BASE` can stay empty while developing against `trask-http-server`.

# Discord sign-in link

- [REPO] `TopNav` links to **`/api/trask/auth/discord/start`** (same-origin on embedded bot with OAuth configured).

# Related

- [trask-embedded-holocron-web.md](../10-architecture-runtime/trask-embedded-holocron-web.md) — bot-hosted Holocron + OAuth.
- [trask-http-server-standalone-contract.md](../10-architecture-runtime/trask-http-server-standalone-contract.md) — standalone API + CORS.
- [trask-configuration-env-map.md](../50-execution/trask-configuration-env-map.md) — `VITE_*` and `TRASK_HTTP_PROXY_TARGET` table rows.
