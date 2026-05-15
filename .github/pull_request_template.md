## Summary

<!-- What changed and why (1–3 sentences). -->

## Test plan

- [ ] `pnpm check`
- [ ] `pnpm build`
- [ ] `pnpm --filter pazaak-world lint` (if TS/TSX under `apps/pazaak-world` changed)
- [ ] `pnpm --filter @openkotor/platform test` (if `packages/platform` changed)

## Web Audio / persistence (check if applicable)

- [ ] N/A — no audio, `localStorage` migration, or sound prefs touched
- [ ] Autoplay: verified first user gesture still enables audio where required
- [ ] `soundManager.setEnabled(false)` does not leave a running `AudioContext`
- [ ] Ambient music: `startAmbientMusic` stop handle still disposed on unmount / toggle
- [ ] Cardworld parity if `apps/pazaak-world` audio or prefs code was edited

## Risk / rollout notes

<!-- Migrations, feature flags, or operator-visible behavior. -->
