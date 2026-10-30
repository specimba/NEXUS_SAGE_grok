# PASS-NOISE — Lifestyle / astrology junk off the desk

Canberk saw a live Wire cluster: "Cancer Horoscope Tomorrow…" via Google News / Times of India, tagged NEW, 2 members (gnews `Gemini` query). The desk looked dumb. One Coder pass. **No push until Canberk's go in Coder's chat.** Merge is Canberk's step; Reviewer verifies.

**Goal:** drop astrology / horoscope / zodiac and similar lifestyle noise while keeping AI, tech, security, and AI-politics. Free only. No CI config change. First Load **≤ 185,000 B** (absolute gate; also stay within ±200 B of the local base build unless Architect waives). overflow-390 clean.

## Root cause
`GNEWS_WATCHLIST_QUERIES` includes the bare model name `Gemini`. Google News returns Times of India zodiac/horoscope pages that mention the sign Gemini. Those rows pass `classifyPost` (class `rest`) and land on Pulse/Wire with NEW.

## Where to filter (three layers; all required)

### L1 — Ingest queries (stop fetching junk)
In `desk/src/lib/gnews-rss.ts` (and any config copy of the standing watchlist):
- Rewrite bare zodiac-collision model names so GNews prefers the AI sense:
  - `Gemini` → `Gemini AI` OR `Gemini (Google OR DeepMind OR "Google AI")` — pick the shortest form that still returns AI hits and kills horoscope pages. Prove with a one-off fetch in the PR note.
  - Same pattern for any other watchlist term that is also a zodiac sign (none today besides Gemini; lock a test so adding `Cancer`/`Leo` as a bare query fails).
- Do **not** add `-horoscope` operators as the only defence (Google News RSS operator support is uneven). Query rewrite + L2 is the pair.
- HN title queries, lab RSS, analyst RSS, HF, releases: no change unless a term is itself a zodiac word (none today).

### L2 — Title / body heuristics (drop what still arrives)
Shared pure helper `isLifestyleNoise(title, summary?): boolean` in a small lib module (e.g. `desk/src/lib/lifestyle-noise.ts`), called from every ingest path that maps entries → items:
- **GNews** `toGnewsItems` (required; this is the bug).
- HN Pulse, lab RSS, analyst RSS, security RSS, Gmail news (same helper; cheap; keeps one rule).
- Wire / Pulse assembly: belt-and-suspenders drop if a row somehow still has the mark.

**Hard drop** (case-insensitive, word-ish; title **or** summary) when any of these match:
- `horoscope`, `astrology`, `zodiac`, `birth chart`, `horoscopes?`
- Zodiac **sign + lifestyle frame**: `(aries|taurus|gemini|cancer|leo|virgo|libra|scorpio|sagittarius|capricorn|aquarius|pisces)` **and** one of `(horoscope|astrology|zodiac|moon sextile|mercury retrograde|in your sign|spiritual quote of the day|daily astrology)`
- Lifestyle frames without needing a sign: `spiritual quote of the day`, `daily astrology`, `tarot`, `numerology`, `vastu tips`, `feng shui` (title only for the last two)

**Must NOT drop** (keep AI / tech / security / AI-politics):
- Gemini/Gemma/Claude/GPT/etc model news, even with a planet name in a metaphor.
- "Cancer" as the disease (e.g. "AI detects cancer in scans") — the zodiac frame above requires a lifestyle co-term; bare "cancer" alone never drops.
- "Mercury" as the planet **or** the company only drops with lifestyle co-terms (`mercury retrograde` is the co-term; "Mercury contamination in chips" lives).
- Security/politics AI: election deepfakes, model bans, export controls — unchanged; still subject to existing `politics_deny` / lead rules.

Drop reason string: `noise:lifestyle` (log + any dropped[] lists). Soft-fail never applies: a match is a hard skip of that row only.

### L3 — Source allow / deny (narrow, not a publisher banlist)
- **Do not** ban "The Times of India" wholesale (it can carry real tech wire copy).
- Optional soft weight only if needed after L1+L2: when publisher ∈ `{The Times of India, Hindustan Times, …}` **and** the only AI hit is a bare zodiac-collision token with no other `ai_terms` / lab name, treat as noise. Prefer proving L1+L2 enough first; add this only if the recall check still shows leaks. Document the publisher list in code, not config (fixed list, like PASS-A2 AI names).

Setup / `politics_deny` / `ai_terms`: **no new config key** this pass (keeps config_hash quiet and avoids C3 additions-only fights). The lifestyle list is fixed code. A later pass may expose it as additions-only if Canberk wants.

## Proof — fixtures (must die / must live)

**Must die** (`isLifestyleNoise` true; never a Pulse/Wire/TL;DR/feed row):
1. `Cancer Horoscope Tomorrow, October 29, 2026: Gemini Moon Sextile Mars Helps You Rest and Recover - The Times of India`
2. `Gemini Horoscope Tomorrow, October 29, 2026: Moon in Your Sign Sextile Jupiter Lifts Your Mood - The Times of India`
3. `Daily Astrology News Alert, 28 October 2026: Gemini Moon Speeds Up Communication, Mercury Retrograde Coul - The Times of India`
4. `Aries Horoscope Tomorrow, October 29, 2026: Gemini Moon Sextile Mars Helps You Finish Pending Errands - The Times of India`
5. `Spiritual Quote of the Day, October 28: Gemini Moon Brings a Reminder That Not Every Thought Deserves You - The Times of India`
6. `Your Weekly Horoscope: What the Stars Mean for Virgo`
7. `Zodiac signs that will have a lucky week, per astrology`

**Must live** (`isLifestyleNoise` false; still subject to the normal AI / DENY gate):
8. `Gemini 3.8 text-to-speech says hello` (DeepMind)
9. `Google ships Gemini agents for Workspace`
10. `Gemma 3 open weights on Hugging Face`
11. `AI model detects cancer in CT scans earlier than radiologists`
12. `Mercury contamination found in chip fab wastewater` (no lifestyle co-term)
13. `Election deepfakes: how Gemini-class models change campaign security` (AI-politics; politics_deny may still block a lead, but noise filter must not drop it)
14. `Claude and Gemini both refuse this prompt injection` (security)
15. `CUDA 13 release notes` / `Nvidia inference chip for LLMs`

**Query lock**
16. Standing GNews watchlist must not contain a bare zodiac sign token (`gemini` alone as the whole query fails; `Gemini AI` / disambiguated form passes).
17. After one crawl (or a recorded GNews fetch for the rewritten query), zero of titles 1–5 appear in `desk/src/data/gnews-rss.ts` / desk-view. Paste counts in the PR note: `noise: dropped_gnews=N kept_gemini_ai=M`.

**Gates**
18. Full test suite green; First Load ≤ 185,000 B and within ±200 B of local base (page-code change should be ~0 B — this is ingest/data). If desk-view shrinks because junk rows leave, that is fine and expected.
19. overflow-390 clean; no `.gitlab-ci.yml` / `ci/` diff.
20. Existing committed junk rows (the five Times of India Gemini hits in current `gnews-rss.ts` / desk-view) are cleared on the next crawl regen, or stripped in the same PR by re-running desk-view after the filter — do not leave them as live NEW clusters.

## Out of scope
- Rewriting PASS-F2 / TL;DR / lead-pick rules.
- Banning entire publishers.
- Paid X / Bluesky / Reddit (still DENY).
- Config-editable lifestyle list (code-only this pass).
