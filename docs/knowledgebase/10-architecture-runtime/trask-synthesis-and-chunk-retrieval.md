---
title: Trask Synthesis And Chunk Retrieval
owner: trask-bot
status: active
lastUpdated: 2026-05-15
---

# Package roles

- [REPO] **`@openkotor/trask`** — `ResearchWizardClient`, headless `ai-researchwizard` subprocess bridge, optional OpenAI-compatible rewrite passes (`research-wizard.ts`).
- [REPO] **`@openkotor/retrieval`** — `defaultSourceCatalog`, `FileChunkStore`, `ChunkSearchProvider`, `createChunkSearchProvider`, URL allowlist helpers (`traskApprovedResearchSources`, `isTraskApprovedBaseUrl`, …).

# `createResearchWizardClient`

- [REPO] Factory in `packages/trask/src/research-wizard.ts`: `(config, aiConfig?, localSearchProvider?)` → client wired to **`traskApprovedResearchSources`** for live web research plus optional **`localSearchProvider`** (typically `createChunkSearchProvider(INGEST_STATE_DIR)` from hosts).

# Local knowledge (`SearchProvider`)

- [REPO] When `localSearchProvider` is set, **`searchLocalKnowledge`** runs `search(query, 4)`, drops hits whose URL passes **`isTraskApprovedBaseUrl`** (avoids double-counting catalog home URLs), and builds a **“Local Knowledge Context (lower authority…)”** digest string plus `SourceDescriptor[]` from `searchHitToSource`.
- [REPO] On search throw, digest/sources are empty (silent degrade).

# `ChunkSearchProvider` (`packages/retrieval`)

- [REPO] **`createChunkSearchProvider(stateDir)`** wraps `FileChunkStore(stateDir)` + `StaticCatalogSearchProvider(defaultSourceCatalog, FileReindexQueueStore(stateDir))`.
- [REPO] **`search`**: token overlap scoring over **all** loaded chunks plus catalog search; **merges** chunk hits before catalog hits, dedupes by URL, sorts by score descending, returns up to **`limit`** (default **5** in `listSources` callers; local path uses **4**).

# `answerQuestion` (full Holocron / Discord `/ask`)

- [REPO] Applies **`applySourcePreferences`** to `traskApprovedResearchSources` when `options.sourcePreferences` is present.
- [REPO] Loads local digest; emits **`onProgress`** `gather` when local hits exist.
- [REPO] **`fetchResearchReport`** → `runHeadlessGptResearcher` with `report_type: "research_report"`, `report_source: "web"`, `allowed_url_prefixes` from approved sources, optional `model`, and custom prompt **`buildCustomPrompt()`** (Discord-native KOTOR assistant instructions + **Sources** heading contract).
- [REPO] Appends local digest to the normalized report for citation extraction; **`mergeSourcesPreserveOrder`** merges **`collectRelevantSources(...)`** with local sources.
- [REPO] Final answer text uses **`fallbackDiscordRewrite(reportWithLocalContext, relevantSources)`** (deterministic excerpt + **Sources** block from the merged report). A private **`rewriteForDiscord`** helper exists for OpenAI-style rewrites but is **not** invoked by **`answerQuestion`** in the current tree—brief/proactive uses **`rewriteForDiscordBrief`** instead.
- [REPO] **Catch path**: if local sources exist → **`localKnowledgeFallbackAnswer`**; else **`degradedAnswerFallback`** with empty sources.

# `answerQuestionBrief` (proactive)

- [REPO] Uses **`buildCustomPromptBrief()`** (~900 word digest contract); **does not** take `ResearchWizardQueryOptions` / source weight overrides.
- [REPO] Always uses full **`this.approvedSources`** for `fetchResearchReport`.
- [REPO] Returns **`researchReport`** (report + optional local digest) for **`scoreResearchAlignment`** in proactive mode.

# Model listing

- [REPO] **`listModels()`** merges `DEFAULT_RESEARCH_WIZARD_MODELS` (`auto`) with `listHeadlessGptResearcherModels`; on failure returns defaults only.

# Operator troubleshooting

- [trask-research-troubleshooting.md](../50-execution/trask-research-troubleshooting.md) — timeouts, GPTR / empty report, `INGEST_STATE_DIR` layout and mismatches, proactive gates, lexical chunk search limits.

# Related

- [answer-pipeline.md](answer-pipeline.md) — surfaces using this client.
- [discord-history-ingestion.md](discord-history-ingestion.md) — where Discord chunks enter `FileChunkStore`.
- [trask-reindex-queue-contract.md](trask-reindex-queue-contract.md) — catalog `reindex-queue.json` + ingest-worker drain.
- [trask-research-troubleshooting.md](../50-execution/trask-research-troubleshooting.md) — operator symptom index.
- `packages/trask/src/local-knowledge.test.ts` — [REPO] merge/fallback behavior.
