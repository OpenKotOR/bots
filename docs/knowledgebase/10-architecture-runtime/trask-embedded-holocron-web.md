---
title: Trask Embedded Holocron Web (Discord Bot)
owner: trask-bot
status: active
lastUpdated: 2026-05-20
---

# When it runs

- [REPO] `startEmbeddedTraskWebUi` in `apps/trask-bot/src/web-server.ts` returns **`undefined`** unless `TRASK_WEB_PORT` is set (`loadTraskBotConfig`).

# Static app

- [REPO] Holocron build is served from `TRASK_WEBUI_DIST_PATH` when set, otherwise `apps/holocron-web/dist` under the monorepo root (`path.resolve` from `web-server.ts`).
- [REPO] If that directory is missing, the process still starts the API but logs **API only** (no SPA shell).

# API mount

- [REPO] `createTraskHttpRouter` is mounted at **`/api/trask`** with the same runtime as Discord (chunk search + research wizard + `JsonTraskQueryRepository`).

# Auth order (`createWebAuth`)

- [REPO] **1.** Valid **`trask_web_session` cookie** (JWT signed with `TRASK_SESSION_SECRET`): user `{ id: sub, persistQueries: true }`.
- [REPO] **2.** Else if `TRASK_WEB_API_KEY` is set: `Authorization: Bearer <key>` **or** `X-Trask-Api-Key: <key>` must match; user `{ id: TRASK_WEB_DEFAULT_USER_ID, persistQueries: true }`.
- [REPO] **3.** Else if `TRASK_WEB_ALLOW_ANONYMOUS` resolves true: user `{ id: TRASK_WEB_DEFAULT_USER_ID, persistQueries: false }` (no server-side query persistence for `/ask` async path semantics — see [trask-http-ask-contract.md](trask-http-ask-contract.md)).
- [REPO] Otherwise **401** with message guiding Discord sign-in or dev env vars.

# Discord OAuth (optional)

- [REPO] Enabled when `TRASK_SESSION_SECRET`, `TRASK_WEB_OAUTH_REDIRECT_URI`, and `TRASK_DISCORD_CLIENT_SECRET` are all present (plus `sessionSecretKey` derived from the secret).
- [REPO] Routes: **`GET /api/trask/auth/discord/start`** (state cookie + redirect), **`GET /api/trask/auth/discord/callback`** (code exchange, JWT cookie, redirect `/`).
- [REPO] `GET /api/trask/session` uses `getSession`: `loggedIn` + optional `discord` profile when cookie verifies.

# Logout

- [REPO] `onLogout` clears the session cookie and returns **204** (wired into the shared router’s `POST /auth/logout`).

# Related

- [trask-http-session-history-contract.md](trask-http-session-history-contract.md) — REST surfaces after auth.
- [trask-http-server-standalone-contract.md](trask-http-server-standalone-contract.md) — same SPA + `/api/trask` without Discord OAuth cookie path.
- [holocron-web-trask-client.md](../30-product-ux/holocron-web-trask-client.md) — SPA `fetch` layer (`VITE_*`, dev proxy).
- [trask-configuration-env-map.md](../50-execution/trask-configuration-env-map.md) — env names for web + OAuth.
