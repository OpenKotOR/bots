---
title: Minimal Discord export fixture
owner: ingest-worker
status: active
lastUpdated: 2026-05-16
---

[REPO] Directory `fixtures/discord-export-minimal/` mirrors the layout produced by `scripts/export_discord_server.py`:

- `manifest.json` — must exist; contents are not interpreted beyond JSON parse.
- `containers/*.json` — each file is one container payload with `channel`, optional `container_scope`, and `messages[]`.

[REPO] Message fields used by the importer: `id`, `timestamp`, `content` (empty content lines are skipped), `author` (`username`, `global_name`, `bot`), optional `member.roles`, optional `referenced_message.id`.

[SYNTH] Use this fixture for dry-run smoke checks and automated tests (`apps/ingest-worker/src/discord-export-import.test.ts`).

```bash
pnpm --filter @openkotor/ingest-worker dev import-discord-export fixtures/discord-export-minimal --dry-run
```
