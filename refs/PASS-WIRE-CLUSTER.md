# PASS-WIRE-CLUSTER — Same story, one row across Brief / Wire / Pulse

**Proof:** Reviewer live `03e3ec8-202610301821` + HN bar pack; post-NOISE recheck `395529d` crawl 22:51 TRT `/workspace/review-pass-noise-2026-10-30/`; UX `refs/audit-boost-prereset/BOOST-LOOK.md` + `refs/audit-hn-gap/`. Desk still does **not** beat HuggingNews on noise density.

**FAIL (still after PASS-NOISE):** Same story across lanes:
- Mistral / Le Chonk: Brief `"5h · Mistral Releases… · 2 SRC"` **and** Wire `"31h · Le Chonk… · 4 SRC"` (ages disagree). Pre-NOISE also ~5 Pulse/Wire rows.
- Blackstone/Anthropic rating on **lead + Brief + Wire**.
- Claude Code also Brief + Wire. 9 visible rows → ~6 distinct stories.

HuggingNews keeps one card per story.

**Goal:** one cluster per story across **Brief, Wire, and Pulse**. Prefer newsy title over lab marketing. Free only. No CI config. First Load ≤185,000 B and ±200 B of local base. overflow-390 clean. One Coder pass.

## Fix (required)
1. **Canonical URL cluster key** — merge when GNews resolves / shares final URL with another member (strip utm). Opaque encrypted blobs → try link/guid/publisher landing already on the item.
2. **Lab-release entity merge (narrow, code-fixed aliases)** — within 48h, merge clusters that are the same lab+product release. Start aliases: `Le Chonk` → `Mistral Large 4`; also match `Mistral` + `Large 4` / `Large-4` / `Large4` across titles; `Claude Code` (Anthropic coding product) title variants → one. Do **not** build general NLP.
3. **Twin-title merge** — Blackstone/Anthropic IPO-rating variants (junk/credit/investment-grade) → one cluster when pubs overlap or titles share Blackstone+Anthropic+rating/IPO tokens.
4. **Cross-lane apply** — same cluster key feeds Brief story list, Wire, and Pulse. Lead plate may still point at the Blackstone cluster; Brief and Wire must not each show a twin row for it.
5. **Title pick** — prefer product+verb news form over slogan ("Le Chonk: Built for Coders…"). Keep all SRC chips/members.
6. **Rank after merge** — do not leave a ≥24h marketing-led cluster above fresher multi-SRC news on the same release; fresher age wins ties when SRC within 1. When Brief and Wire both held the story, keep the fresher age on the surviving row.

## Proof
- Live: **one** Mistral Large 4 / Le Chonk row total across Brief + Wire + Pulse (not Brief 5h + Wire 31h).
- **one** Blackstone/Anthropic rating cluster (lead may still point at it; no Brief twin and no Wire twin).
- **one** Claude Code row across Brief + Wire.
- Display title news-form, not slogan-alone.
- Fixture: mistral.ai URL + GNews blob + Le Chonk alias → one cluster; Blackstone title variants → one; Claude Code Brief+Wire titles → one.
- FL / overflow-390 / no CI config diff.

## Out of scope
PASS-NOISE (visible lifestyle cleared on `395529d`; day-tape JSON history horoscopes stay HOLD); PASS-NEW-AGE; lead-pick reweight (see PASS-LEAD-WHY); ops/CYC chrome; abstracts; source widen.

## Order
After PASS-NOISE (landed `395529d`). Before or with PASS-NEW-AGE. Go-before-push in Coder chat.
