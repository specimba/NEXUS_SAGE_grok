# Pass Q1G — Quota-smart pipeline on GitLab CI (free)

**Architect cut:** 2026-10-09 · Canberk (via Grok Bot): GitHub Actions out (billing lock), GitLab OK. Gmail rows stay public (no change).  
**Replaces:** the runner part of `PASS-Q1-ACTIONS-CRON.md`. Hash skip, honest `last-checked`, watchdog rules and pack artifact carry over from Q1 unless changed here.  
**Status:** PASS MARK · Coder builds · Reviewer PASS after **2 green scheduled pipelines**  
**Free only.** DENY: paid GitLab tier · bought minutes · LLM calls in the pipeline · Gmail/X creds in CI · cycle `004`.

## 0. Two facts that shape the design

1. **Pull mirroring is Premium-only on GitLab.com** ([GitLab docs](https://docs.gitlab.com/18.6/user/project/repository/mirror/pull/)). So **no mirror**. The GitLab project is a thin runner. Each job shallow-clones the public GitHub repo, runs, and pushes back to GitHub. GitHub stays the only source of truth.
2. **Free = 400 compute minutes/month** on shared runners, cost factor 1 for a standard project ([GitLab compute minutes](https://docs.gitlab.com/ci/pipelines/compute_minutes/)). Billed per job second, so setup time counts.

## 1. Where the CI file lives

- `ci/gitlab-ci.yml` in the **GitHub** repo (Coder owns it, normal review).
- GitLab project → CI/CD settings → *CI/CD configuration file* = raw GitHub URL of that file (GitLab supports external config URLs). Nobody has to push to GitLab after setup.
- GitLab repo only needs a README so `main` exists for the schedule.

## 2. Schedule and budget (fit under 400)

| Item | Rule |
|------|------|
| Slots | **4/day**: `11 6,11,16,21 * * *`, schedule timezone **Europe/Istanbul**. 06:11 stays the lead-pick run. |
| Overnight | 21:11 → 06:11 gap is 9h. Watchdog stale threshold moves to **10h**. |
| Job | One job `crawl`. No separate watchdog job (each job pays setup). |
| Image | Pinned bun image that already has `git`. No apt installs per run. |
| Cache | GitLab `cache:` for bun install cache, keyed on `bun.lockb`, plus Next build cache (`desk/.next/cache`). |
| Clone | `git clone --depth 1` main. gh-pages fetched depth 1 **only** when publishing. |
| Speed cuts | Lab RSS per-feed timeout **≤10s** (was 48.5s of an 88s ingest); drop the dead feed if it keeps timing out. No `:3000` rebuild. No per-crawl ref-doc stamps (one `logs/crawl.log` line). |
| Fast exit | Reader-hash unchanged → skip PAGES build and gh-pages push. Commit only `last-checked.json` + log line, then exit. |
| Hard cap | `timeout: 6m` per job. |

**Budget (estimate, measured inputs from the quota audit):** changed run ≈ 30s setup + 45s ingest + 10s rank/tick + 40s build + 15s push ≈ **2.3 min**. Unchanged run ≈ **1.4 min**. 4 × 30 = 120 runs. Worst case (all changed) ≈ **280 min**. That leaves about 120 min for manual reruns and code-pass publishes. Five slots (≈350 min worst case) is too tight. Stay at 4.

**Budget guard:** if a run takes over 4 min, the log line marks `slow`. Two `slow` runs in a row fail the watchdog so we see the trend before the cap does.

## 3. Publish target: keep GitHub Pages

- Push gh-pages to GitHub with a **fine-grained token** in masked + protected GitLab variable `GH_PUSH_TOKEN`. Same `basePath /NEXUS_SAGE_grok`. The live URL doesn't change.
- **Why not GitLab Pages:** it would add a deploy job every publish (more minutes), change the URL and `basePath`, and redo the font/asset gates. No gain.
- **Risk to check once:** GitHub serves branch-based Pages through its own Pages build. If the billing lock ever stops gh-pages pushes from going live, the fallback is Cloudflare Pages on the same repo (free, already planned in Sep). Not GitLab Pages.

## 4. Watchdog (failure-only, inside the same job)

- `desk/scripts/watchdog.ts` runs **first** (checks the previous run's `checked_at` against the 10h threshold, which catches a missed slot) and **last** (checks this run: gh-pages crawl = main crawl after a publish, soft-fail ratio, hash gate error).
- Healthy → silent. Failure → job fails, and GitLab emails the owner on failed pipelines (free, default). No room posts, no agent wakes, no GitHub issue (would need another token scope).
- Known gap: if GitLab stops running schedules completely, nothing alerts until the next run. Accept for now.

## 5. Unchanged from Q1

Reader-hash fields and skip rule · live `last-checked.json` fetched by the page (`checked HH:MM · data HH:MM`; STALE uses `checked_at`) · pack artifact (`artifacts:` with `expire_in: 30 days`, named by `pack_id`) · Gmail/X read from committed snapshots only, soft meter `gmail · box-only` / `taste stale` · 185 kB gate (free headroom before adding the `last-checked` fetch; 60 B today).

## Canberk's setup (once, ~10 min)

1. **GitLab:** sign up at gitlab.com (Free) and create a new **private** blank project `nexus-sage-ci` with a README.
2. **GitHub token:** create a fine-grained token with access to **only** `specimba/NEXUS_SAGE_grok`, permission **Contents: Read and write**, and a 90-day expiry.
3. **GitLab variable:** in the project's CI/CD settings, add variable `GH_PUSH_TOKEN` with the token as its value. Tick **Masked** and **Protected**.
4. **CI file:** in the same CI/CD settings, set the configuration file to the raw URL Coder posts for `ci/gitlab-ci.yml`.
5. **Schedule:** create a pipeline schedule with cron `11 6,11,16,21 * * *`, timezone Istanbul, target branch `main`.
6. Run the schedule once by hand and tell Grok Bot it ran.

## Pass marks (Reviewer)

1. Two consecutive **scheduled** pipelines green on the TRT slots, with no agent turn.
2. One changed run publishes and live Pages matches the main crawl. One unchanged run skips publish, and live `checked` updates anyway.
3. Fixture: a stamp-only diff hashes equal and makes no gh-pages commit. A lead/item diff publishes.
4. Watchdog: a forced stale `checked_at` fails the job (email arrives). A healthy run is silent.
5. Minutes: the GitLab usage page shows per-run cost ≤2.5 min. Projected month ≤300 min.
6. No secret in the repo or logs (masked). The token can only reach this repo. secret-gate passes.
7. Brief lead / cycle `003` / unlock unchanged. 185 kB gate holds.
8. Retire the box crawl + publish agent routine only after 1–7. Box scripts stay as the manual fallback.

## Out of scope

Director pulse cadence · stale one-shot cleanup · Scout digest cadence (owner-side routines).
