# Pass E — Session taste only

**Architect cut:** 2026-10-07 · Canberk order D→F→C→B→E→A  
**Status:** PASS MARK · land after B  
**Owners:** Coder builds · UX signs off · Reviewer gates  
**Prefer free.** DENY: paid X API / bearer / `api.x.com` · Bluesky · cookie-to-token · inventing taste cards · Brief pins / lead from taste · putting taste likes into Pulse `UP` (D).

## Goal

X on the desk stays **operator session taste only**: bookmarks · likes · feed from Canberk’s signed-in box session, on the Pulse Taste shelf. It never becomes paid hydrate, never fills Pulse `UP`, never touches Brief. Soft-fail when the session is dead or stale — honest empty, not invented cards.

## What changes

| Surface | Today | After E |
|---------|-------|---------|
| **Pulse Taste shelf** | Cards from `x-taste.ts` / dry-run keep; badge `taste · bookmark\|like\|feed` | Same chrome. Enforce: shelf only under Pulse; cap **5–8** visible + “more taste” fold; **never** cluster-table `UP`. |
| **`desk/src/data/x-taste.ts`** | May lag `artifacts/sage/x-taste-last.json` (Sep-era snap still possible) | Mirror disk on every successful taste capture (same spirit as Pass B). `briefEligible: false`, `pulseLeadEligible: false`, `paidApi: false` locked in the type. |
| **Soft-fail meters** | X-session chip exists | `login_wall` / skipped / empty → soft chip; **stale** if `captured_at` older than **14d** → soft `taste stale` without inventing items. Crawl still succeeds. |
| **Pulse `UP` (D)** | HN points only | **Unchanged** — taste likes never enter `UP`. |
| **Brief / Digest / Voice** | — | **No content changes.** (A unlocks Digest/Voice titles later.) |

## Rules

1. Source = box signed-in X session only (read bookmarks / likes / feed slice). No `api.x.com`, no bearer, no Nitter, no scrape farms.
2. Read-only on X — never post, like, retweet, DM, or change settings.
3. Filter via existing Scout allowlist (`SCOUT-X-TASTE-ALLOWLIST.md`); drop non-AI noise.
4. Soft-fail: session dead / challenge / empty → `skipped: true`, empty shelf, desk boots.
5. Do not write wall-clock fake items over a skip. Do not promote taste URLs into Brief pins or HELD.
6. Weekday Istanbul capture window preferred (existing WIRE cadence); E does **not** require a new overnight firehose.

## Pass marks (Reviewer on live Pages + `:3000`)

1. Taste shelf still under Pulse; cards show `taste · …` badges; **no** taste row in the cluster `UP` column.
2. `X_TASTE.briefEligible === false` and Brief lead / HELD / cycle `003` unchanged for the same crawl.
3. Soft path: forced skip / login_wall → soft meter, empty or prior honest shelf, ingest exit 0.
4. If disk `x-taste-last.json` is >14d old and no fresh capture, UI shows soft stale (not silent Sep-forever without a meter).
5. Sync: after a successful capture WROTE, committed `x-taste.ts` matches disk ids/counts (coherence check or sibling to pages-coherence).
6. Paid X DENY strip still present; no bearer in repo.
7. Tests: fixture skip → empty; likes present on taste item ignored for Pulse `UP`; mirror-on-WROTE; never Brief.
8. First Load under 185 kB; Skin V2; 0 sideways scroll at 390. Proof scrolls Taste shelf into frame at 390.

## Proof

`refs/VISUAL-PROOF-pass-e-session-taste-{shelf,meter}-{before,after}-{1280,390}.png` → Grok Bot.

## Out of scope

| Letter | Note |
|--------|------|
| A | Cycle unlock — Digest/Voice titles vs `CYCLE.003` (Architect unlock policy before land) |
| D/F/C/B | Already gated |
| Full X re-scrape expansion | Only if Canberk session is live on the box; E may PASS on soft-fail + sync honesty alone |

## Land order

Coder lands **E alone** after B stamp. Do not bundle A. If box X session is logged out, land soft-fail + sync/coherence path first; do not block the letter on a live scrape.
