---
title: Discord Privacy And Source Authority
owner: trask-bot
status: active
lastUpdated: 2026-05-19
---

# Privacy Constraints

- [OFFICIAL] Discord message content access is permission and intent constrained.
- [SYNTH] Export/import scope must remain opt-in for channels and threads.
- [SYNTH] Avoid storing sensitive identifiers when not needed for retrieval.

# Content Risks

- [SYNTH] Discord chatter can be stale, speculative, or anecdotal.
- [SYNTH] Replies can conflict across time; ingestion requires recency and provenance fields.
- [SYNTH] Casual greetings should not be ranked as technical evidence.

# Source Authority Controls

- [SYNTH] Rank sources in this order: repo + official docs > approved public references > Discord archive.
- [SYNTH] If only Discord evidence exists, Trask should state uncertainty and avoid overclaiming.
- [SYNTH] Preserve citation URLs for all answer claims, including `discord://` entries.

# Operational Safeguards

- [SYNTH] Keep text-only ingestion as default.
- [SYNTH] Add dry-run checks before writing new chunks.
- [SYNTH] Keep rollback path: disable discord source weighting without removing data.
- [REPO] Proactive mode reads message content in allowlisted channels with privileged intents; gate with env and review [trask-proactive-mode-contract.md](../10-architecture-runtime/trask-proactive-mode-contract.md).
