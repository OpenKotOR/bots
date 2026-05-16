---
title: Caveat Register
owner: trask-bot
status: active
lastUpdated: 2026-05-15
---

# Active Caveats

- [OPEN] Discord export coverage is limited to channels and threads visible to the bot.
- [OPEN] Private archived threads are excluded by default in this pass.
- [OPEN] Message edits/deletes can drift from imported snapshots unless periodic refresh is run.
- [OPEN] Discord conversational tone can bias answer wording unless balanced by higher-authority sources.
- [OPEN] `discord://` citations are audit-useful but not directly browsable for all users.
- [OPEN] CI or sandboxes without `pnpm`/`corepack` require alternate commands (`npx tsc`, `npx tsx apps/ingest-worker/...`); see validation ladder and runbook.
- [OPEN] Chunk retrieval uses lexical token overlap only (no dense embeddings in the chunk path); sparse or off-vocabulary queries may return few local hits ([trask-synthesis-and-chunk-retrieval.md](../10-architecture-runtime/trask-synthesis-and-chunk-retrieval.md)).

# Mitigations

- [SYNTH] Keep source authority ordering explicit in synthesis.
- [SYNTH] Preserve redaction and dry-run checks in importer.
- [SYNTH] Maintain operator runbook for export/import/rollback.
