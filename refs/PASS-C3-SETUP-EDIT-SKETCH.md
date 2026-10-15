# PASS-C3 (sketch) — editable Setup, free paths only

Status: **sketch for Canberk to pick from**, not yet a pass mark. It builds on PASS-C2 (`desk/config/sage-sources.json`, read-only `?view=setup`, ceilings, last-good fallback, `config_hash`).

## Hard constraint
The site is a public static GitHub Pages export. **No write token may ever reach the browser**, so the page itself can never commit. Every edit lands as a git commit made by something that already holds a credential: Canberk's own GitHub login, or the box.

## Option A — chat/box edit to PR (recommended first)
- `desk/scripts/sage-config-edit.ts set <path> <value>` / `toggle <source>` / `add-term <list> <term>` / `remove-term …`, run on the box.
- It loads the config, applies the change, and runs the **same** validator as CI (`sage-config-check.ts`: ceilings, known feed ids). It refuses on any violation and prints a one-line human diff.
- It commits to branch `config/<yyyymmdd-hhmm>` and opens a PR via the authenticated box `gh` or the GitHub connector. The PR body has the diff, the new `config_hash`, and "takes effect at next crawl (hh:11)".
- Canberk says "turn off GNews" / "add 'mixture of experts' to ai_terms" to Grok Bot, which routes it here, and gets the PR link. He merges on his phone. **Nothing auto-merges.**
- Cost: zero CI minutes (GitHub Actions stays off). Validation runs on the box before the PR and again in the next GitLab crawl, where the last-good fallback catches anything odd.

## Option B — in-page draft editor plus GitHub edit link
- Setup view gains an "Edit" toggle, in a lazy chunk so the First Load cap is untouched. Controls are bounded by the C2 ceilings, with a live client-side validation using the same rules (shared module).
- Output: "Copy JSON" plus a button opening `github.com/specimba/NEXUS_SAGE_grok/edit/main/desk/config/sage-sources.json`. Canberk pastes, and GitHub's own UI offers "commit to a new branch / PR".
- Drafts are kept only in `localStorage`, never sent anywhere.
- It's a page change, so it needs the full gate: Chrome visual, overflow-390, and First Load <185 kB.

## Option C — the X taste weight slider
Covered by A (`set taste.weight 0.2`, clamped 0–0.3, shelf-only). No separate flow.

## Shared acceptance (when it becomes a pass mark)
- An invalid edit can't reach main via A. Via B, it is caught by the in-page validator and again by CI last-good with the `config invalid` meter.
- `config_hash` in the ingest stamp changes on the first crawl after merge, and the Setup view shows "edited <date> · PR #n".
- No credentials in page JS, the repo or the yml (the secret-gate passes); no new paid service; no extra scheduled runs.

## Recommendation
Ship **A** now: no page change, no gate, and it fits the "ask Grok Bot" flow. Add **B** later only if Canberk wants to tweak visually.
