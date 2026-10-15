# PASS-D — Beat 13: morning Atom feed (data-only publish)

Owner: Coder builds · Reviewer gates · Architect spec. Free only. Cycle label stays `003`.
Supersedes the Beat 13 line in `AUTONOMY-4H-PROGRAM.md` for scope: **feed.xml only**; `morning.html` is deferred (it is a page, so it would need the Chrome/390 gate).

## Goal
Each morning the 06:11 GitLab crawl publishes one new Atom entry, "the morning edition", at a stable public URL:

**`https://specimba.github.io/NEXUS_SAGE_grok/feed.xml`**

No page code changes, no `<link rel="alternate">` in `layout.tsx` (that is a page change and comes later with its own gate), no new service, no new CI minutes.

## D1 — Where it is generated and stored
- New script `desk/scripts/atom-feed.ts`, run in the crawl job **after** `desk-view.ts` and **before** `reader-hash.ts`.
- Snapshot store `desk/artifacts/sage/morning-editions.json` (`{schema:1, editions:[…]}`), append-only for past dates.
- Output `desk/public/feed.xml`, a **tracked** file. Being under tracked `desk/public` already satisfies pages-publish check 2e (no allowlist change in the publish script).
- Add both paths to `desk/scripts/backup-allowlist.txt` so the `[skip ci]` crawl commit may stage them.
- Add `':(exclude)desk/public/feed.xml'` to the `changed_code` pathspec in `pages-publish.sh` §2h, so a feed change counts as data and `SAGE_OVERFLOW_390=auto` stays skipped. That pathspec edit is the only script change outside the generator.

## D2 — What an edition is
One edition per Istanbul date, keyed by `lead-history.json`'s entry for that date. It is frozen at pick time, matching PASS-L L2:
- **Picked lead** (`reason:"picked"`): headline, url, sources, sig, age band, and pick slot.
- **Wire**: up to 5 rows from `WIRE_ROWS` **of the crawl that made the pick**, with headline, url, and SRC count.
- **Papers**: the top 5 from `PAPERS` of the same crawl, with title, arXiv href, and up count.
- **HELD day**: the entry is a plain HELD notice ("No lead today: nothing cleared the 2-publisher bar", reason-aware text reused from Phase 2). Wire and papers are still listed. **Never invent a lead, never promote a Gmail, X-taste or single-source item.**
- Gmail-news (`briefEligible:false`) and X session taste **never** appear in the feed.

When it writes:
- When the crawl creates today's lead-history entry (06:11 normally, or the catch-up/HELD crawl that first lands the date), it snapshots it.
- When a HELD date later picks (11:11 or 16:11 recovery, PASS-L L3), it rewrites **that same date's** snapshot once: same `id`, newer `updated`. That is the only allowed rewrite.
- On every other crawl, the run is a no-op. `feed.xml` must stay **byte-identical**, with no `now()`, no crawl time and no counters in the XML, so there are no spurious publishes or commits.

## D3 — Atom shape (RFC 4287)
- Feed: `<id>tag:specimba.github.io,2026:nexus-sage/feed</id>`, `<title>NEXUS SAGE · Morning edition</title>`, `<updated>` = newest entry's `updated`, `<link rel="self" href="…/feed.xml"/>`, `<link rel="alternate" href="https://specimba.github.io/NEXUS_SAGE_grok/"/>`, `<author><name>NEXUS SAGE</name></author>`.
- Entry: `<id>tag:specimba.github.io,2026:nexus-sage/morning/YYYY-MM-DD</id>` (permanent), `<title>` = "Oct 15 · <lead headline>" or "Oct 15 · HELD", `<updated>` = the pick or HELD entry `at` (RFC 3339 UTC), `<published>` = the first snapshot time, `<link rel="alternate">` = lead url (or the site on HELD days), and `<content type="html">` holding escaped HTML (lead, Wire `<ol>`, papers `<ol>`). Use plain tags only, with no scripts, styles or images.
- Keep the last **14** editions, newest first. File ≤ **64 KB**; if it's over, drop the oldest entries until it fits.
- All text is XML-escaped (`& < > " '`), and all links are absolute `https://`. Invalid URLs are dropped (row kept, no link), never emitted raw.

## D4 — Failure behaviour
- Missing/unparseable `lead-history.json` or data files: log `atom-feed: skipped (<reason>)`, leave the existing `feed.xml` untouched, and exit 0. A broken feed must never fail the crawl or block the Pages publish.
- A generator exception is caught the same way. The watchdog does **not** gain a feed check in this pass.

## D5 — Acceptance tests (`desk/src/lib/__tests__/atom-feed.test.ts`, bun test, fixtures only)
1. **Well-formed + required elements**: parse with a dependency-free checker (balanced tags, one root `feed` in the Atom namespace). Feed has id/title/updated/self link; every entry has id/title/updated/content.
2. **Picked day**: fixture picked entry plus 7 wire rows and 9 papers gives 1 entry with the lead headline in its title, exactly 5 wire `<li>` and 5 paper `<li>`.
3. **HELD day**: the entry title ends "· HELD", and the content contains no headline from `excluded[]`.
4. **HELD then 16:11 pick**: same `<id>`, `updated` advances, and the entry count is unchanged.
5. **Idempotent**: running twice on the same inputs gives byte-identical output; a non-pick crawl (12:11 fixture) leaves `feed.xml` unchanged.
6. **Frozen past**: changing today's wire fixture doesn't alter yesterday's entry content.
7. **Escaping**: a headline `R&D <beta> "x"` round-trips escaped; a `javascript:` url is dropped.
8. **No private lanes**: a fixture with a Gmail item and an X-taste item, both with high scores, shows neither in the output.
9. **Caps**: 20 editions are trimmed to 14, and the size is ≤ 65,536 B.
10. **Soft fail**: a corrupt lead-history yields exit 0, the prior feed.xml intact, and the log line present.

## D6 — Live acceptance (Reviewer, after the first 06:11 run post-merge)
- `curl -sI …/feed.xml` returns 200 with an xml content-type, and the body starts `<?xml` with the `http://www.w3.org/2005/Atom` namespace.
- [W3C Feed Validator](https://validator.w3.org/feed/) run once by URL: valid (warnings OK, errors not). Paste the result line in the room.
- The job log shows `overflow-390: skipped (data-only…)` on that run; First Load is unchanged (no page code touched).
- The entry date and lead match the Brief's lead for that date. The next non-pick crawl's commit doesn't touch feed.xml.

## Out of scope
morning.html, the `<link rel=alternate>` in page head, an RSS 2.0 twin, email/push delivery, any paid service, and cycle `004`.
