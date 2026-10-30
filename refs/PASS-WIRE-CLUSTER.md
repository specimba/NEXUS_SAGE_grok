# PASS-WIRE-CLUSTER — Same story, one Wire/Pulse row

**Proof:** Reviewer live `03e3ec8-202610301821` + HN side-by-side `/workspace/review-hn-bar-2026-10-30/`; UX `refs/audit-boost-prereset/BOOST-LOOK.md`; Scout `/workspace/sage_home.png` + `huggingnews_home.png` (22:14 TRT). Desk does **not** beat HuggingNews on noise.

**FAIL:** Same story many times:
- Mistral Large 4 / Le Chonk ≈ **5 Pulse/Wire rows** (MIS+HN, TES GNW, THE GNW, HF GNW, GNW×2 trillion-param). Wire alone shows row1 `mistral.ai/news/mistral-large-4-oss/` + row5 GNews blob.
- Blackstone/Anthropic rating = lead + HUG twin title on Wire/Past-24h.

HuggingNews keeps one card per story.

**Goal:** one cluster per story across Wire **and** Pulse. Prefer newsy title over lab marketing. Free only. No CI config. First Load ≤185,000 B and ±200 B of local base. overflow-390 clean. One Coder pass.

## Fix (required)
1. **Canonical URL cluster key** — merge when GNews resolves / shares final URL with another member (strip utm). Opaque encrypted blobs → try link/guid/publisher landing already on the item.
2. **Lab-release entity merge (narrow, code-fixed aliases)** — within 48h, merge clusters that are the same lab+product release. Start aliases: `Le Chonk` → `Mistral Large 4`; also match `Mistral` + `Large 4` / `Large-4` / `Large4` across titles. Do **not** build general NLP.
3. **Twin-title merge** — Blackstone/Anthropic IPO-rating variants (junk/credit/investment-grade) → one cluster when pubs overlap or titles share Blackstone+Anthropic+rating/IPO tokens.
4. **Title pick** — prefer product+verb news form over slogan ("Le Chonk: Built for Coders…"). Keep all SRC chips/members.
5. **Wire/Pulse rank after merge** — do not leave a ≥24h marketing-led cluster above fresher multi-SRC news on the same release; fresher age wins ties when SRC within 1.

## Proof
- Live: **one** Mistral Large 4 row on Wire and on Pulse (not ~5).
- **one** Blackstone/Anthropic rating cluster (lead may still point at it; no twin Wire row).
- Display title news-form, not slogan-alone.
- Fixture for mistral.ai URL + GNews blob + Le Chonk alias → one cluster.
- FL / overflow-390 / no CI config diff.

## Out of scope
PASS-NOISE; PASS-NEW-AGE; lead-pick reweight (see PASS-LEAD-WHY); ops chrome; source widen.

## Order
After PASS-NOISE (Canberk go in Coder chat). Before or with PASS-NEW-AGE.
