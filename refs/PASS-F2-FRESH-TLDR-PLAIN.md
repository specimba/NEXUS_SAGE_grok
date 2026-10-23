# PASS-F2 — Freshness, 24h TL;DR, plain headlines

Canberk-approved (relayed by Grok Bot on Oct 24) after a live comparison with huggingnews.com. Grok Bot relayed their score as 7.9 and SAGE's as 6.1, with freshness and readability as SAGE's weak spots. Build order F2.1 → F2.2 → F2.3, as one Coder pass with three commits. Push needs Canberk's go in Coder's chat; merge is Canberk's step; Reviewer verifies.

**Global gates:** free sources only; no Gmail/X in the page TL;DR or feeds beyond today's rules; signal quality first. Every row still passes the existing Wire gate (AI filter, DENY, analyst-only rules, PASS-A2), so there's **no filler**: empty is better than off-topic. First Load is held to **±200 B** of a local base build; the spec grants no waiver in advance, and if a part goes over, stop and ask Architect. overflow-390 must be clean at 390 px, plain and seeded. No `.gitlab-ci.yml`/`ci/` change. Cycle label stays 003. The lead is never invented and comes from real rows only.

## F2.1 Freshness

**a. No dead "0 new".** When a crawl adds 0 new Wire rows, the Wire still shows the newest gated stories from the **last 6 h** (by publisher time), newest first, up to the normal Wire cap. The header reads `no new stories this crawl · newest 2h ago`, never a bare `0 new`.
- If nothing in the last 6 h passes the gate, show the newest gated rows as today, with the header `quiet · newest 11h ago`. Honesty beats a false "fresh".

**b. Age on every row.** Each Wire/Pulse row shows a relative age (`12m`, `3h`, `2d`) from publisher time, falling back to first-seen.
- Ages are computed at render from the row's ISO time, so they're never stale baked text. The server render prints the absolute UTC time, and the client swaps in the relative age after hydration, with no layout shift (fixed-width slot).
- Formatting is shared with the existing stamp helper; there's no date library.

**c. Lead refresh within 12 h** (code change to PASS-L, `lead-pick.ts`).
- At **every** crawl, re-pick when the current lead was picked more than 12 h ago **and** a candidate exists that is under 12 h old, passes the Wire gate, and has ≥2 independent publishers (with the analyst-only and GNews-only exclusions unchanged).
- Otherwise keep the frozen lead.
- New constants: `LEAD_REPICK_AFTER_H = 12` and `LEAD_FRESH_AGE_H = 12`. The 24–36 h tier stays as fallback, and `LEAD_MAX_AGE_H = 36` is unchanged.
- No candidate means the frozen lead stays, or a HELD notice if it's over 36 h. These rules stay in code, not config.
- Log line: `lead: kept|repicked|held age_h=<n> since_pick_h=<n>`.

## F2.2 Past-24h TL;DR

**a. Content.** At the top of the Brief, add a `Past 24 hours` block of **5–7 bullets**, rebuilt every crawl. Each bullet is one gated story from the last 24 h.
- **Order:** most independent publishers first, then newest.
- **Each bullet:** the plain headline (F2.3), a short age, a source count, and one link.
- **Dedupe:** by story cluster (existing dedupe), at most 2 bullets from the same lab/company.
- **Extractive only:** titles and fields come from rows, so there's no generated summary text and no LLM.
- **Fewer than 3 qualifying stories:** the block shows them plus `quiet day`. It never pads with older or off-topic rows.
- The lead story may appear as bullet 1; the lead slot itself is unchanged.

**b. Data.** `desk/src/data/tldr-24h.ts` (or `artifacts/sage/tldr-24h.json` read at build) is written by the crawl, deterministically, from the same rows. The page renders it with existing Brief styles and no new CSS file.

**c. Feed.** The first entry in `feed.xml` is the TL;DR:
- It has a stable id per day: `tag:…:tldr:<YYYY-MM-DD>`.
- Its `updated` moves on each crawl that changes it, and its content is rewritten in place.
- The frozen daily morning-edition entries of PASS-D follow it, unchanged. This is a deliberate PASS-D exception, for the TL;DR entry only.
- 14-entry and 64 KB caps still hold; TL;DR entries count toward them, one per day.

**d. Sources** (additions; each one config-listed with a ceiling and last-good fallback like C2, soft-fail).

- **HF trending models:** `https://huggingface.co/api/models?sort=trendingScore&limit=20` (free, no auth). Keep only models created or updated in the last 72 h, from an org on a fixed code allowlist of known labs (drops random fine-tunes). At most 3 rows per crawl, with an HF chip.
- **Model releases by org:** HF API `models?author=<org>&sort=createdAt&limit=10` for `moonshotai`, `nvidia` and `tencent`, plus the existing labs.
  - Only new repos since `releases-seen.json`.
  - Nvidia needs an AI-model filter: a pipeline_tag is present and the repo isn't a dataset or tool. Nvidia posts lots of non-LLM repos, so cap it at 2 per crawl.
  - These rows get a REL chip, and, as in S1.3, they don't count toward the Wire's 2-source rule.
- **Scout's Oct 23 five:** as listed in `refs/SCOUT-SOURCES-OCT23.md`, each wired with the same ceiling and soft-fail pattern. Any that isn't free and reachable without credentials is skipped and noted in the PR, not swapped for something unvetted.
- **Recall check** (in the PR note): run the new sources against this week's data. Show whether Kimi K3.1, OpenAI's training pause and Cursor Computer Use would have surfaced, and from which source, or say plainly if one still wouldn't. Don't add an ad-hoc source just to make the check pass; list the gap instead.

## F2.3 Plain language

**a. Plain headlines by default.** Brief, Wire and TL;DR show the publisher's headline, cleaned up:
- Strip site suffixes like ` | Site` and ` - Publisher`, collapse whitespace, and decode entities.
- No internal labels in the visible line.

**b. Internal labels behind details.** `CYC/003`, `Sol≠Astra`, gate codes, pack ids and lane codes move into a `<details>` block ("desk details"), collapsed by default.
- Nothing is deleted. The labels stay in the DOM and in tests, for Reviewer and for parity fixtures.
- Chips that carry meaning for readers stay: NEW, ANL, REL, HF, and the source count.

**c. Atom MIME.** GitHub Pages serves `.xml` as non-Atom, so also write a byte-identical `desk/public/feed.atom`, which Pages serves as `application/atom+xml`, in the same atom-feed.ts step.
- The page `<head>` advertises `feed.atom` via `<link rel="alternate" type="application/atom+xml">`.
- `feed.xml` stays at its URL for existing subscribers.
- Plumbing follows PASS-W: `ci-state.sh`, `reader-hash.ts`, the `pages-publish.sh` §2h exclude, and `backup-allowlist.txt`.

## Acceptance tests

**Freshness**
1. Crawl with 0 new rows and gated rows at 2 h and 5 h: those rows show, and the header reads `no new stories this crawl · newest 2h ago`. The string `0 new` is absent.
2. 0 new and nothing gated in 6 h: header `quiet · newest <n>h ago`, rows from today's normal path, no off-topic row.
3. Each row renders a relative age; SSR shows an absolute time; no CLS (fixed slot); 390 clean.
4. Lead picked 13 h ago plus a qualifying candidate at 4 h with 2 publishers: repicked, log `repicked`.
5. Lead picked 13 h ago with only analyst-only or GNews-only candidates: kept.
6. Lead picked 6 h ago with a better candidate: kept (under 12 h since pick).
7. No candidate and lead over 36 h: HELD notice, never invented.

**TL;DR**
8. 10 qualifying stories: 7 bullets, ordered by publisher count then recency, at most 2 per company.
9. 2 qualifying stories: 2 bullets plus `quiet day`; nothing older than 24 h.
10. Rebuilt on the next crawl; feed.xml entry 1 has the same id, a newer `updated` and new content; morning-edition entries are byte-identical.
11. Escaping matches PASS-D tests 11–13 for the TL;DR entry.
12. HF trending: a non-allowlisted org is dropped; at most 3 rows; a source failure soft-fails with last-good used and the crawl continuing.
13. HF org releases: a new moonshotai repo makes a REL row; a seen repo doesn't; an Nvidia dataset or tool repo is dropped; Nvidia stays at 2 or fewer.
14. The recall check table is in the PR note.

**Plain language**
15. `Kimi K3.1 is out | The Decoder` displays as `Kimi K3.1 is out`.
16. No `CYC/`, `Sol≠Astra` or pack-id text is visible before details is opened; those values are present inside details.
17. `feed.atom` is byte-identical to `feed.xml`, and the head link points to it. The live check `curl -sI …/feed.atom` shows `content-type: application/atom+xml` (Reviewer, after merge).

**Gates**
18. First Load within ±200 B of the local base build (record both numbers). Over that, stop and ask Architect.
19. overflow-390 clean, plain and seeded; Chrome check passes.
20. No `.gitlab-ci.yml`/`ci/` diff; full test suite green; config_hash moves only for the new source keys (listed in the PR).
