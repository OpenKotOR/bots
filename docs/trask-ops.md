# Trask Operations Quickstart

This is the operator path for setting up, updating, and verifying Trask Q&A plus the Holocron web UI.

## One Command Helper

Run from the repo root:

```bash
node scripts/trask_ops.mjs --help
```

Useful commands:

```bash
node scripts/trask_ops.mjs setup
node scripts/trask_ops.mjs update
node scripts/trask_ops.mjs build-web
node scripts/trask_ops.mjs dev-http
node scripts/trask_ops.mjs verify-web
node scripts/trask_ops.mjs smoke-discord
```

The helper uses `pnpm` when available and falls back to `npx --yes pnpm@10.11.0` when it is not on `PATH`.

## Local Holocron Verification

Start the integrated HTTP server:

```bash
TRASK_WEB_ALLOW_ANONYMOUS=1 node scripts/trask_ops.mjs dev-http
```

In another terminal, run the browser verifier:

```bash
node scripts/trask_ops.mjs verify-web
```

The verifier opens the Holocron UI with Playwright and submits five dynamic KotOR/modding queries. It fails if answers do not resolve with visible source evidence or if the page reports research errors.

## Discord Command Smoke

Set bot credentials, then verify registered commands:

```bash
TRASK_DISCORD_BOT_TOKEN=... TRASK_DISCORD_APP_ID=... node scripts/trask_ops.mjs smoke-discord
HK_DISCORD_BOT_TOKEN=... HK_DISCORD_APP_ID=... node scripts/trask_ops.mjs smoke-discord
PAZAAK_DISCORD_BOT_TOKEN=... PAZAAK_DISCORD_APP_ID=... node scripts/trask_ops.mjs smoke-discord
```

If guild-scoped commands are used, also set the matching `*_DISCORD_GUILD_ID` or `DISCORD_TARGET_GUILD_ID`.

## Browser Discord Verification Boundary

Discord web verification still requires an authenticated human session. Use Discord in the browser to confirm:

- Trask: `/ask` opens the structured `query` option and returns a briefing with sources.
- HK-86: `/designations reactions status` works for guild managers and reaction-role panel reactions add/remove roles.
- Pazaak: `/pazaak rules`, `/pazaak wallet`, and `/pazaak lobby action:create` respond in the target guild.

The REST smoke script validates token/app/command deployment before browser interaction, so browser failures are easier to attribute to Discord UI state, guild permissions, role hierarchy, or channel restrictions.
