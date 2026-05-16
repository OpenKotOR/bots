---
title: Trask HTTP Server Standalone Runtime
owner: trask-http-server
status: active
lastUpdated: 2026-05-20
---

[SYNTH] Documents `apps/trask-http-server` only. For the Trask **bot**-hosted Holocron (JWT cookie + Discord OAuth), see [trask-embedded-holocron-web.md](trask-embedded-holocron-web.md).

# Process

- [REPO] Entry: `apps/trask-http-server/src/main.ts`; config from `loadTraskHttpServerConfig` (`packages/config/src/index.ts`).

# Listen port

- [REPO] **`TRASK_HTTP_PORT`** (default **4010**).

# Auth (`createWebAuth`)

- [REPO] **No** cookie/JWT path (unlike [trask-embedded-holocron-web.md](trask-embedded-holocron-web.md)).
- [REPO] If `TRASK_WEB_API_KEY` is set: require **`Authorization: Bearer <key>`** or **`X-Trask-Api-Key: <key>`**; on success the principal is `{ id: TRASK_WEB_DEFAULT_USER_ID }` (no `persistQueries` field → treated as persisting per `shouldPersistForUser` in `packages/trask-http`).
- [REPO] If no API key and `TRASK_WEB_ALLOW_ANONYMOUS` is true: same default user id without key check.
- [REPO] Otherwise **401** with dev-oriented error text.

# CORS

- [REPO] `buildBrowserCorsAllowedOrigins` uses `TRASK_PUBLIC_WEB_ORIGIN` plus local dev ports **5174, 5173, 4174, 4173, 3000** (`main.ts`).
- [REPO] Preflight allows headers **`Content-Type`**, **`Authorization`**, **`X-Trask-Api-Key`**.

# `__spark-kv` shim

- [REPO] In-memory **`/__spark-kv/*`** GET/POST/DELETE so static Holocron builds that expect Spark KV do not 404 during local QA (not durable storage).

# Static Holocron

- [REPO] Same `TRASK_WEBUI_DIST_PATH` vs `apps/holocron-web/dist` resolution as the embedded bot server; SPA fallback skips `/api` and `/__spark-kv`.

# Related

- [trask-http-ask-contract.md](trask-http-ask-contract.md), [trask-http-session-history-contract.md](trask-http-session-history-contract.md) — API behavior.
- [holocron-web-trask-client.md](../30-product-ux/holocron-web-trask-client.md) — SPA `fetch` + Vite proxy to this host.
- [trask-configuration-env-map.md](../50-execution/trask-configuration-env-map.md) — env table.
