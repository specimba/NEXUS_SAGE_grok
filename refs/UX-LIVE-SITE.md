# UX — live site requirements (UX Gürok, 2026-09-25 15:33)

For Architect's deploy plan. Goal: Canberk reviews on the real URL, and his reactions teach the curator.

## 1. Build stamp (so reviews name the exact deploy)
Footer kicker on every lane, right-aligned: `build <short sha> · deployed 14:22 · crawl 14:16`. Short sha links to the GitHub commit. Canberk can quote it in chat; we stop guessing which build he saw.

## 2. Taste feedback on rows (the learning loop)
- Every Pulse row, Wire row, Papers row and drawer header gets two quiet controls at the far right, visible on hover/selection (always visible on phone): `+` keep and `−` less like this. Keys `+` / `-` on the selected row (Beat 9 map).
- Pressed state: `+` phosphor fill, `−` muted strike on the row headline (row stays, dims to 60%). One tap toggles back.
- Optional one-line note: long-press / `n` key opens the Pip-Boy prompt `> note:`; Enter saves.
- Store: `{cluster_id, vote, note?, headline, sources, ts}` in the small sync store (Supabase / D1), never in the static page. Curator reads the last 30 days of votes at crawl time as taste context.
- Panel in Governance lane: `TASTE LEDGER · 42 keeps · 17 less` with the last 20 votes, each removable. Canberk must be able to see and undo what the system learned.

## 3. Crawl health on the live page
If the last successful Actions crawl is > 6h old, the existing STALE chip turns into a full-width amber strip under the header: `CRAWL STALE 8.4h · last ok 06:11 · Actions run failed` linking to the failed run. No silent staleness on the real site.

## 4. Login wall
Cloudflare Access / Vercel password page is off-brand but acceptable; don't spend a beat skinning it.

### Public-repo rule (Scout, 17:44)
Repo is public. Votes, notes and anything the curator learns about taste live ONLY in R2/KV, never in committed files or `[skip ci]` backups. The Governance TASTE LEDGER reads from the store at page load (client fetch behind Access), not from build-time data, so it never lands in `out/`. Add a vote/note string to Reviewer's secret gate as a canary.
