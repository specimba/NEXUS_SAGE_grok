# intel-export dry-run proof

Run 2026-10-24 22:15 TRT on the box, before any push. Inputs are committed data only: `src/lib/__tests__/fixtures/gmail-search-sample.json` (Gmail search payload fixture) and the committed `artifacts/sage/x-taste-last.json` re-fed as the X capture. Cloned the unpushed `intel-plan` branch (dry-run only); a real run clones origin main.

```
$ bun scripts/intel-export.ts --gmail src/lib/__tests__/fixtures/gmail-search-sample.json --x /tmp/x-capture.json --dry-run --clone-from /workspace/nexus-sage-intel --branch intel-plan
intel-export: clone /workspace/nexus-sage-intel → /tmp/intel-export-XXXXXX (dry-run)
gmail: 4 rows
x-taste-refresh: WROTE captured_at=2026-10-24T19:15:14Z kept=8/8
desk/artifacts/sage/x-taste-last.json | 18 +++++++-----------
 desk/src/data/gmail-news.ts           | 16 +++++-----------
 desk/src/data/x-taste.ts              |  6 +++---
 3 files changed, 15 insertions(+), 25 deletions(-)
intel-export: DRY-RUN OK · base a6a4d86 · would commit 4 file(s): desk/artifacts/sage/x-taste-last.json, desk/src/data/gmail-news.ts, desk/src/data/x-taste.ts, desk/artifacts/sage/x-taste-refresh-last.json · no commit, no push

$ CI=1 bun scripts/intel-export.ts --gmail x --dry-run
intel-export: box-only (CI never exports Gmail/X) — nothing done

$ bun scripts/intel-export.ts --gmail … --clone-from /workspace/nexus-sage-intel   # no --dry-run
intel-export: FAIL --clone-from/--branch are dry-run only
```

No commit, no push, temp clone removed. The routine that runs this for real is created later, only with Canberk's go.
