---
title: Ingest Worker CLI Runbook
owner: ingest-worker
status: active
lastUpdated: 2026-05-15
---

[SYNTH] Operator commands for `apps/ingest-worker` (`pnpm --filter @openkotor/ingest-worker dev <command>` or `npx tsx apps/ingest-worker/src/main.ts <command>` / `node dist/main.js <command>`). Paths assume repo root unless noted.

- [REPO] With no command argument, the process defaults to **`list-sources`** (`command ?? "list-sources"` in `apps/ingest-worker/src/main.ts`).

# Commands

| Command | Role |
|---------|------|
| `list-sources` | [REPO] Prints the default source catalog (table + log). |
| `queue-reindex [sourceIds...]` | [REPO] Enqueues refresh jobs; empty `rest` queues all known sources via `searchProvider.queueReindex`. |
| `reindex-now [sourceIds...]` | [REPO] Immediate `fetchAndIndexSource` for requested ids (or all if none passed). |
| `drain-queue` | [REPO] Single dequeue + reindex pass; re-enqueues failures. |
| `run-queue-worker [pollMs]` | [REPO] Infinite loop: `drain-queue` then sleep; `pollMs` clamped **1000–300000** ms (default **15000**). |
| `show-indexed` | [REPO] Table of `FileChunkStore` source indexes (`chunkCount`, `lastFetched`). |
| `show-config` | [REPO] Logs `stateDir`, AI key presence, models, `databaseUrl` presence. |
| `import-discord-export <dir> [--dry-run]` | [REPO] Discord export tree → chunks (see [discord-text-ingestion-runbook.md](discord-text-ingestion-runbook.md)). |

# State directory

- [REPO] `INGEST_STATE_DIR` (default `data/ingest-worker`) from `loadIngestWorkerConfig` (`packages/config/src/index.ts`).

# Firecrawl and fetch

- [REPO] When `FIRECRAWL_API_KEY` is set, `reindex-now` / queue-driven paths prefer Firecrawl markdown scrape; otherwise raw HTTP fetch with HTML stripping (`main.ts`).

# Related

- [discord-text-ingestion-runbook.md](discord-text-ingestion-runbook.md) — export/import workflow.
- [trask-reindex-queue-contract.md](../10-architecture-runtime/trask-reindex-queue-contract.md) — persisted queue + lock semantics.
