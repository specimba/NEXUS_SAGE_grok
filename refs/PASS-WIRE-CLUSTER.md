# PASS-WIRE-CLUSTER — Same story, one Wire row

**Proof (live):** build `03e3ec8-202610301821` · crawl FRESH 0.9h · Reviewer pack `/workspace/review-hn-bar-2026-10-30/` (desk/top 1280+390, `text.txt`, `leadlog.html`).

**FAIL:** Wire shows the same Mistral Large 4 release twice:
1. Row 1 — "Le Chonk: Built for Coders, Trusted by Defenders." → `https://mistral.ai/news/mistral-large-4-oss/` (5 SRC, MIS+HN+GNW×3), tagged NEW · 10-29 · **31h**
2. Row 5 — "Mistral Releases Trillion-Parameter Open-Weight Large 4…" → Google News RSS blob URL (2 SRC, GNW×2), tagged NEW · 10-30 · 6h

HuggingNews keeps one story. Marketing title as Wire #1 is weak vs HN.

**Goal:** one cluster, one row. Prefer a newsy title over lab marketing slogans when both exist. Free only. No CI config change. First Load ≤ 185,000 B and ±200 B of local base (ingest/data — page bytes ~0). overflow-390 clean. One Coder pass.

## Root cause
DEDUPE-V2 already strips utm/query noise and title-matches when GNews URLs are opaque. Here the **display URLs differ** (canonical mistral.ai vs encrypted `news.google.com/rss/articles/…`) and the **titles share almost no tokens** (Le Chonk / Coders / Defenders vs Trillion-Parameter / Sovereign / Cybersecurity), so Jaccard + URL keys both miss.

## Fix (required)
1. **Canonical URL for cluster key.** When a GNews item’s resolved / linked final URL (or decoded legacy blob) equals another member’s URL after strip, merge. If the encrypted blob cannot be resolved offline this tick, still try `link` / `guid` / publisher landing fields already on the item.
2. **Lab-release entity merge (narrow).** If two clusters both name the same lab+product release in-window (here: Mistral + Large 4 / Large-4 / "Le Chonk" alias for that release) within 48h, merge into one. Alias table is code-fixed and tiny: start with `Le Chonk` → `Mistral Large 4`. Do **not** build a general NLP merger.
3. **Title pick after merge.** Cluster display title = prefer non-marketing: if one member’s title is mostly slogan (short, no product version, ends with period, or matches known marketing patterns) and another carries product+verb news form, use the news form. Keep all SRC chips / member URLs.
4. **Wire rank:** after merge, do not leave a 31h marketing-led cluster above fresher multi-SRC news on the same release.

## Proof
- Live Wire (or fixture from this crawl) shows **one** Mistral Large 4 row, not two.
- That row’s SRC count ≥ 5 (MIS+HN+GNW members retained) or documents why a member dropped.
- Display title is the news form (or equal quality), not alone "Le Chonk: Built for Coders…".
- Unit/fixture: two items with URLs as above (or title pair + GNews blob) → one cluster.
- First Load / overflow-390 / no `.gitlab-ci.yml` diff.

## Out of scope
- PASS-NOISE (horoscope) — separate, already specced.
- Cross-panel age rounding (LOW).
- Ops chrome / rail theatre (LOW; skip tonight).
- Rewriting lead-pick rules.

## Order
After PASS-NOISE (needs Canberk go in Coder chat). Can ship same night as PASS-NEW-AGE if FL allows; else this first (bigger HF beat).
