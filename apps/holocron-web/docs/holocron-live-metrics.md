# Holocron live metrics vs animation

The sanctum animates **query words** (inbound) and **answer fragments** (outbound) using client state. **Source-derived zones** (`deadlystream`, `lucasforums`, etc.) come from `TraskQueryRecord.sources` after `/api/trask/ask` completes — see `zoneFromSourceLabel` in `HolocronSanctum.tsx`.

**Gap:** Per-retrieval / per-scrape progress (e.g. “currently fetching deadlystream”) is **not** exposed on the public Trask DTO consumed by the SPA. Until the API streams research steps or intermediate tool events, facet pulses during retrieval remain **best-effort** (`isProcessing` halo only). Mapping each flying spec to an individual scrape event would require backend events or SSE.

**Single artifact policy:** `HolocronSanctum` always renders `/holocron/holocron-artifact.png` with no video fallback and no frame cycling. This keeps the holocron visual stable across all sessions.

**Hero still:** `holocron-artifact.png` — sourced from Imgur album https://imgur.com/a/RwZA9vk (`i.imgur.com/iTGKv8P.png`), **symmetric horizontal crop (~36% margin each side)** to drop Trask UI columns/text without inpainting the pyramid (inpainting caused wing artifacts).

**Orb mood tint:** CSS classes `holocron-sanctum--mood-{idle|retrieve|success|warn|hot}` drive halo/flare/drop-shadow variables—idle light blue, retrieving cyan, brief neon green after answers, orange/red when cumulative source hits or interaction counts climb (see `HolocronSanctum.tsx`).