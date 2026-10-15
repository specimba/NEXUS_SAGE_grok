# PASS-D — Beat 13: morning Atom feed (data-only publish)

Owner: Coder builds · Reviewer gates · Architect spec. Free only. Cycle label stays `003`.
Supersedes the Beat 13 line in `AUTONOMY-4H-PROGRAM.md` for scope: **feed.xml only**; `morning.html` is deferred (it is a page, so it would need the Chrome/390 gate).

## Goal
Each morning the 06:11 GitLab crawl publishes one new Atom entry, "the morning edition", at a stable public URL:

**`https://specimba.github.io/NEXUS_SAGE_grok/feed.xml`**

No page code changes, no `<link rel="alternate">` in `layout.tsx` (that is a page change and comes later with its own gate), no new service, no new CI minutes.

## D1 — Where it is generated, stored, committed (amended after Reviewer)
- New script `desk/scripts/atom-feed.ts`. **gitlab-ci.yml step** (in `crawl.script`, right after `- bun run pack:export` and before `- export GITHUB_OUTPUT=…`):
  `- bun scripts/atom-feed.ts || echo "atom-feed: crashed (soft)"`
  It runs after ingest has written `lead-history.json`, `src/data/wire.ts` and `src/data/papers.ts`, and **before** `reader-hash.ts`, so the hash sees the new feed.
- Snapshot store `desk/artifacts/sage/morning-editions.json` (`{schema:1, editions:[…]}`), append-only for past dates.
- Output `desk/public/feed.xml`, a **tracked** file. Being under tracked `desk/public` already satisfies pages-publish check 2e.
- **Commit path (blocking fix a)**: `desk/scripts/ci-state.sh stage true` becomes `git add -- src/data artifacts/sage public/feed.xml`. `stage false` also reverts it: `git checkout -- src/data artifacts/sage public/feed.xml`. That's safe because reader-hash covers the feed (D1b), so a feed change always means `changed=true`. Also add `desk/public/feed.xml` and `desk/artifacts/sage/morning-editions.json` to `desk/scripts/backup-allowlist.txt` for the box `cf-build.sh` path.
- **D1b — reader-hash covers the feed**: `reader-hash.ts` adds `public/feed.xml` (when present) to its `files` map under the key `public/feed.xml`. A feed-only change triggers a publish. Since the feed is byte-identical on non-pick crawls, it adds no publishes.
- Add `':(exclude)desk/public/feed.xml'` to the `changed_code` pathspec in `pages-publish.sh` §2h, so a feed change counts as data and `SAGE_OVERFLOW_390=auto` stays skipped.

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
- `published` is **stored** in the snapshot when it is first written, and set to the lead-history entry's `at` (crawl data, never `Date.now()`). A HELD→pick rewrite keeps `published` and moves `updated` to the new entry's `at`.
- On every other crawl, the run is a no-op. `feed.xml` must stay **byte-identical**, with no `now()`, no crawl time and no counters in the XML, so there are no spurious publishes or commits.

## D3 — Atom shape (RFC 4287)
- Feed: `<id>tag:specimba.github.io,2026:nexus-sage/feed</id>`, `<title>NEXUS SAGE · Morning edition</title>`, `<updated>` = newest entry's `updated`, `<link rel="self" href="…/feed.xml"/>`, `<link rel="alternate" href="https://specimba.github.io/NEXUS_SAGE_grok/"/>`, `<author><name>NEXUS SAGE</name></author>`.
- Entry: `<id>tag:specimba.github.io,2026:nexus-sage/morning/YYYY-MM-DD</id>` (permanent), `<title>` = "Oct 15 · <lead headline>" or "Oct 15 · HELD", `<updated>` = the pick or HELD entry `at` (RFC 3339 UTC), `<published>` = the stored snapshot `published` (D2), `<link rel="alternate">` = lead url (or the site on HELD days), and `<content type="html">` (lead, Wire `<ol>`, papers `<ol>`). Use plain tags only, with no scripts, styles or images.
- **Double escaping for `type="html"`**: first HTML-escape each text value and attribute (`&<>"'`) while building the HTML string, then XML-escape the whole HTML string into the element. So the headline `R&D` appears in feed.xml as `R&amp;amp;D`, and `<li>` as `&lt;li&gt;`. Titles are `type="text"` and escaped **once**. No CDATA.
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
7. **Escaping (exact strings)**: with headline `R&D <beta> "x"`:
   - the entry `<title>` contains exactly `R&amp;D &lt;beta&gt; &quot;x&quot;` (single);
   - `<content>` contains exactly `&lt;li&gt;R&amp;amp;D &amp;lt;beta&amp;gt; &amp;quot;x&amp;quot;` (double);
   - an href `https://a.b/?x=1&y=2` appears in content exactly as `href=&quot;https://a.b/?x=1&amp;amp;y=2&quot;`;
   - a `javascript:` url is dropped (row kept, no `href`).
8. **No private lanes**: a fixture with a Gmail item and an X-taste item, both with high scores, shows neither in the output.
9. **Caps**: 20 editions are trimmed to 14, and the size is ≤ 65,536 B.
10. **Soft fail**: a corrupt lead-history yields exit 0, the prior feed.xml intact, and the log line present.
11. **Stored published**: rewriting HELD→pick keeps `<published>` byte-equal to the first write; no test result depends on the wall clock (run with a faked clock 2 days ahead, same output).
12. **ci-state**: with feed.xml modified, `stage true` stages it and `stage false` reverts it (fixture git repo).
13. **reader-hash**: changing only `public/feed.xml` flips `changed=true`; identical feed keeps `changed=false`.

## D6 — Proof written to the repo (blocking fix c; the GitLab job log is private)
- `pages-publish.sh` writes `desk/artifacts/sage/publish-proof.json` on every publish attempt, and `stage true` commits it (force-add like `last-checked.json`):
  `{ "main_sha", "crawl_at", "overflow_390": "skipped"|"ran-pass"|"ran-fail", "overflow_why", "first_load_bytes", "first_load_prev_bytes", "feed_sha256", "feed_entries", "feed_changed": bool, "chrome_install_s": number|null }`.
  `first_load_bytes` comes from the same `first-load.cjs` read used in gate 2f2. `first_load_prev_bytes` is the previous proof's value.
- The `logs/crawl.log` line gets a suffix: `feed=<sha8|same|skipped> ov390=<skipped|pass|fail> fl=<bytes>`.
- **Reviewer live acceptance** (after the first 06:11 run post-merge, all from public sources):
  1. `curl -sI https://specimba.github.io/NEXUS_SAGE_grok/feed.xml` returns 200 with an xml content-type, and the body starts `<?xml` with the `http://www.w3.org/2005/Atom` namespace.
  2. The [W3C Feed Validator](https://validator.w3.org/feed/) is run once by URL and comes back valid (warnings OK, errors not). Paste the result line in the room.
  3. The committed `publish-proof.json` for that run shows `overflow_390:"skipped"`, `feed_changed:true`, and `first_load_bytes == first_load_prev_bytes` (no page code). The crawl.log line matches.
  4. The entry date and lead match the Brief's lead for that date. The next non-pick crawl's proof shows `feed_changed:false` and its commit does not touch feed.xml.

## Out of scope
morning.html, the `<link rel=alternate>` in page head, an RSS 2.0 twin, email/push delivery, any paid service, and cycle `004`.
