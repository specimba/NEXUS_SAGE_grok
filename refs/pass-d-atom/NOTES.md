# PASS-D Beat 13 — morning Atom feed · build notes (spec refs/PASS-D-ATOM-FEED.md as amended in de37cec)
Branch beat13-atom on origin/main e04acd2 · local only, not pushed · cycle 003 · free only · no page code.

## Before (origin/main e04acd2)
- No feed. https://specimba.github.io/NEXUS_SAGE_grok/feed.xml does not exist; out-pages has 41 files.
- Tests 702 pass / 0 fail (test-before-origin-main.txt). First Load / = 178,674 B (first-load.txt, build-before.txt).

## After (beat13-atom)
- desk/scripts/lib/atom-feed.ts: pure snapshot and render. desk/scripts/atom-feed.ts: IO, soft-fails with exit 0 (D4).
  The lib sits under desk/scripts/lib, not src/lib, so §2h treats the merge itself as data-only.
- desk/artifacts/sage/morning-editions.json + desk/public/feed.xml (tracked). The 2026-10-15 edition comes from that
  date's own pick crawl (ca29164 data), so nothing is invented. Rerunning on today's data is a byte-identical no-op.
- D1: gitlab-ci.yml named step `bun scripts/atom-feed.ts || echo "atom-feed: crashed (soft)"` after pack:export, before
  GITHUB_OUTPUT/reader-hash. ci-state.sh: stage true adds public/feed.xml (+ force-adds publish-proof.json); stage false reverts it.
  backup-allowlist.txt lists both files. §2h pathspec excludes desk/public/feed.xml (pathspec-check.txt).
- D1b: reader-hash.ts hashes public/feed.xml under the key "public/feed.xml" (and takes --desk for tests).
- D6: pages-publish.sh writes artifacts/sage/publish-proof.json through scripts/publish-proof.ts on every attempt that reaches
  verify. crawl.log gets `feed=… ov390=… fl=…` (publish-proof-dryrun.txt).
- Tests 715 pass / 0 fail (+13, test-after.txt). First Load / = 178,674 B (Δ 0). out-pages now has 42 files (+feed.xml,
  identical to desk/public/feed.xml). Atom check PASS, feedparser atom10 with bozo False (atom-validity.txt, feedparser.txt).
- No visible UI change (no <link rel=alternate>, no page edit), so no screenshots.

## Stacked on ci-chrome (branch beat13-on-chrome, base 8db377a)
- There is now ONE publish-proof writer, scripts/publish-proof.ts. ci-chrome's inline `bun -e` block is gone.
  The writer records the same fields as before: main_sha, crawl_at, at, result, overflow_390, overflow_why, font_check,
  first_load_bytes, first_load_prev_bytes, chrome_install_s, and chrome {version, pinned, zip_sha256, bin_sha256}.
  It adds feed_sha256, feed_entries and feed_changed.
- ci-chrome's slot watchdog steps in gitlab-ci.yml are unchanged. The ci-chrome test now asserts against the
  writer script rather than the inline block. New test 14 covers the writer's behaviour, including a faked Chrome binary.
- Tests: 738 pass, 0 fail (test-after-stacked.txt). No app code changed against ci-chrome. First Load in the box
  smoke run is 178,674 B (publish-proof-stacked-box.json.txt).
