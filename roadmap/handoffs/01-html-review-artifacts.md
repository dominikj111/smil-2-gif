# Hand-off — S-05 HTML review artifacts

- **Story status:** ✅ 2026-08-30 (confirmed done)
- **Next story:** S-06 Client showcase automation

## Delivered

- `html/` — standalone review-artifact mode, three pages: `memory-hierarchy-v2.html`
  (corrected hierarchy: CPU → RAM+SWAP → drive, direct write path, two-line dashed
  buses), `context-linker-sketch.html` (the next projection: inputs → linker pass →
  session image), `motherboard.html` (board layout: CPU ⇄ RAM same row, NB = routing,
  drive → swap + storage).
- Inline CSS only, no build step, openable directly; linked from the review page
  (`src/main.tsx` "HTML artifacts" header line).
- Pipeline rule encoded: `html/` never goes through the gif pipeline.

## Decisions & deviations

- The memory-hierarchy metaphor was relabeled (proposal §2): L1/L2 = firmware, not
  caches; L3 = provider prefix-cache; session = RAM; files = drive; swap = session
  store; direct CPU → drive write path; every bidirectional bus is two dashed lines
  with dots one way each.
- The "just html" mode is a deliberate third authoring mode — it has no export
  contract yet (see Known issues).

## Known issues / follow-ups

- `html/` is a new, untracked directory (first commit is the user's — never commit
  automatically).
- `plan.md` + `gpt-feedback.md` at root predate `roadmap/` + `docs/`; the roadmap
  supersedes `plan.md` — suggest retiring both once their content is confirmed
  absorbed.
- HTML pages are each self-contained (shared review shell could come later).

## Hand-off to S-06

- The showcase should reuse the deterministic capture pattern (demo clock /
  `setCurrentTime`) — `scripts/lib/encoder.mjs` is the seam for a new timeline
  driver, per proposal §3.
- "Real components" showcase depends on the ui-components-library alias contract
  (`vite.config.ts`) — do not change it without a matching library change.
- Start from the review page galleries (`src/main.tsx`) as the showcase's natural
  substrate.
