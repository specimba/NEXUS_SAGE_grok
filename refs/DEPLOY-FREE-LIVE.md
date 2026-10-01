# DEPLOY-FREE-LIVE — a free, private, live URL for the NEXUS_SAGE desk

Written 2026-09-25 (Istanbul, UTC+3). Research only: nothing was deployed, no accounts were created, nothing was pushed.
All limits below come from official pages fetched on 2026-09-25. Anything I could not verify is marked **UNVERIFIED**.

---

## 0. What the code needs (checked in `desk/`)

| Question | Finding |
|---|---|
| Does it need a long-running server? | **No.** `src/app/page.tsx` is the only route. It renders `<Desk/>`, which is a `"use client"` component. All data comes from `src/data/*.ts` modules (352 KB) that the crawl regenerates and that get **compiled into the bundle**. There are no API routes, no DB, no server actions and no `next/image`. |
| Does anything write to disk at request time? | **No.** Every `writeFileSync` lives in crawl code (`scripts/*`, provider caches, `digest-pack-disk.ts`). Nothing writes during page render. |
| Does anything read the filesystem at runtime? | Only two places: `require-current.ts` (reads `artifacts/sage/CURRENT.json`) and `server-boot.ts` (reads `.next/BUILD_ID` and stamps `SERVER_STARTED_AT`). There are also `prebuild` and `prestart` gates (`scripts/check-current.mjs`). `page.tsx` sets `dynamic = "force-dynamic"`. |
| Can it be statically generated? | **Yes.** Next.js runs Server Components during `next build` when `output: "export"` is set. The limits: no request-dependent route handlers, no cookies, headers, rewrites, redirects, ISR or default image optimizer ([Next static exports](https://nextjs.org/docs/app/guides/static-exports)). The desk uses none of these. The required changes are small: remove `force-dynamic`, and replace the BUILD_ID/`SERVER_STARTED_AT` reads with a stamp taken at build time. *(I started a trial export build in a scratch copy, but it was interrupted, so the export is not yet proven in practice. Beat B1 proves it.)* |
| Artifact size | `du -sh desk/artifacts` = **8.2 MB**. Of that, git tracks only about **556 KB** (69 files). The provider `*-cache/` dirs (rss 2.4 MB, rss-sec 3.0 MB, gnews 1.3 MB, …) are gitignored. `.git` is 49 MB. |
| Crawl + build time (from `logs/a1-stale-ingest.log`, 2026-09-25 VM run) | `bun run ingest` started 14:16:08 and ended 14:18:17 (**2 min 09 s**, including the postingest rank snapshot). `bun run build` started 14:18:19.8 and ended 14:18:43.1 (**23 s**). The earlier run took 28 s to build. **Total ≈ 2.5 min on the VM.** I did not run `ingest` myself because it overwrites committed state. |
| Requests per crawl | More than 50 upstream requests. Estimated from cache file counts: arXiv 70, Wikidata 13, gnews 11, Crossref 11, RSS 9+3, HN 6, GitHub 5, OpenAlex 2. |
| Lead pick | `lead-pick.ts` only picks when the crawl hour is **exactly 06** Istanbul (`LEAD_PICK_HOUR = 6`). A late or dropped 06:11 run therefore means no lead that day. B4 fixes this. |
| Repo visibility | Checked through the GitHub API: **`specimba/NEXUS_SAGE_grok` is PUBLIC.** `desk/src/data/x-taste.ts` (X likes/bookmarks) and the crawl history are world-readable today. |

---

## 1. Recommendation

### Primary: Cloudflare-only pipeline (no GitHub Actions, no GitLab CI, no VM)

- **Scheduler:** a tiny Cloudflare Worker with a **Cron Trigger** runs every 4 h and POSTs a **Cloudflare Pages deploy hook**.
- **Crawl + build:** the **Cloudflare Pages build** does the whole job. It runs `ingest → rank → digest → curator → next build (static export)`, pushes the crawl commit back to GitHub, and deploys `out/` plus a few **Pages Functions**.
- **Storage:** crawl JSON stays in **git**, as it does today, so everything is rebuildable from saved JSON. Feedback lives in **Cloudflare D1** and is exported to git on every crawl.
- **Privacy:** **Cloudflare Access (Zero Trust Free)** puts a login wall on the production `*.pages.dev`, all preview URLs and `/api/*`.
- **Curator:** runs **inside the build** using `VYCE_API_KEY`, which is an encrypted Pages build variable. The key never reaches the browser.
- **Embeddings:** Vyce shows no embeddings endpoint, so embeddings run locally in the build (`all-MiniLM-L6-v2` via transformers.js). That is free and needs no key.

Why this stack:
1. It is the only candidate where cron, build, hosting, login wall and feedback DB are all free **and** none of them depends on GitHub Actions minutes.
2. 6 crawls a day uses about 186 of the 500 free Pages builds per month.
3. A login wall on the production URL is free.
4. D1 does not pause when idle, unlike Supabase.

### Fallback: Vercel Hobby + Supabase Free
- The same Cloudflare cron Worker (1 of 5 free cron triggers) POSTs a **Vercel deploy hook** instead. Vercel Hobby's own cron can only run **once a day**.
- The Vercel build runs the crawl, the same way as in the primary stack.
- Login wall: **Vercel Authentication with scope "All Deployments"**, which is free on Hobby.
- Feedback goes through a Next route handler (`app/api/feedback/route.ts`, so this stack keeps SSR) into **Supabase Free Postgres**.
- Accept the Supabase inactivity-pause risk. The 6 curator reads per day should count as activity, but Supabase does not publish the exact threshold.

### Rejected or secondary
- **GitHub Actions:** the repo is currently **public**, and standard runners are free for public repos ([GitHub Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions)), so "minutes depleted" should not block it today. But the desk holds X bookmarks, which argues for making the repo private. A private repo would draw from the 2,000 min/month Free quota. The primary stack avoids this conflict.
- **GitLab CI:** does not fit 6 runs a day (see §3). It is only usable as a reduced-frequency backup.
- **Netlify Free:** 300 credits a month and 15 credits per production deploy means 6 deploys a day ≈ 2,700 credits a month, about **9× over**. When credits run out, sites pause.
- **GitHub Pages:** no login wall. Private Pages exist only on GitHub Enterprise Cloud, which fails hard requirement 1.
- **Workers cron doing the crawl itself:** the free plan allows 10 ms CPU per cron invocation and 50 subrequests. The crawl makes more than 50 requests and parses several MB of XML/JSON. Not feasible without Workers Paid.

---

## 2. Architecture

```mermaid
flowchart LR
  subgraph CF[Cloudflare free]
    CRON[Worker sage-cron<br/>cron 11 3,7,11,15,19,23 UTC] -->|POST deploy hook| BUILD
    BUILD[Pages build<br/>cf-build.sh:<br/>crawl-if-stale → rank → digest<br/>→ curator → embeddings<br/>→ next build export → secret gate] -->|deploy out/ + functions/| SITE
    SITE[Pages site *.pages.dev<br/>static desk] --- FN[Pages Functions /api/feedback<br/>Access JWT check]
    FN --> D1[(D1 sage<br/>feedback table)]
    ACCESS[Cloudflare Access<br/>email OTP, 1 allowed email] --> SITE
    ACCESS --> FN
  end
  BUILD -->|git push crawl commit<br/>'[skip ci]' prefix| GH[(GitHub repo<br/>artifacts/sage/*.json<br/>src/data/*.ts<br/>feedback-export.json)]
  GH -->|checkout at build start| BUILD
  BUILD -->|D1 REST read, scoped token| D1
  BUILD -->|chat/completions<br/>VYCE_API_KEY build secret| VYCE[Vyce AI proxy<br/>OpenAI-compatible]
  BUILD -->|free sources| SRC[HN · Google News RSS · lab RSS · HF · arXiv<br/>OpenAlex · Crossref · GitHub · Wikidata]
  USER((Canberk)) -->|browser| ACCESS
  VM[VM bot scheduler<br/>fallback until B6 passes] -.->|git push, old path| GH
```

**Crawl.** The Cron Trigger runs at 06:11, 10:11, 14:11, 18:11, 22:11 and 02:11 Istanbul (cron triggers use UTC, and Istanbul is UTC+3 all year) and POSTs the deploy hook. Pages builds the production branch HEAD.
- `cf-build.sh` first restores provider caches (see Risks), then runs the crawl **only if `CRAWL_AT` is at least 3 h old**. A manual code push therefore does not trigger a duplicate crawl.
- After a crawl it commits `artifacts/sage/*` and `src/data/*` with the message `[skip ci] chore(sage): 4h crawl <CRAWL_AT>` and pushes over HTTPS with a fine-grained PAT. Pages treats a `[skip ci]` or `[CF-Pages-Skip]` prefix as "skip this build" ([Pages GitHub integration](https://developers.cloudflare.com/pages/configuration/git-integration/github-integration/)), so the push does not loop.
- The build then deploys the `out/` it just produced.

**Where JSON lives.** In git, as today. Every crawl is a commit, and the VM wipe drill still works: clone, then `bun run pack:import`. Provider caches are rebuildable and are not committed.

**Deploy trigger.** Two paths: the deploy hook (cron) or a push to the production branch (code changes). Pages runs one build at a time and queues the rest.

**Feedback loop.**
1. On every Pulse, Wire and paper row, the user presses **+** or **−** and can add a note.
2. The browser POSTs to `/api/feedback`. The page and the API share an origin, and both sit behind Access.
3. A Pages Function validates the Access JWT and writes a row to D1.
4. At the next crawl, the build reads D1 through the D1 REST API with a read-only token.
5. The curator combines the rule rank with the taste profile and embedding similarity, and writes `src/data/curator.ts` (scores and one-line "why it matters for you").
6. The build commits `artifacts/sage/feedback-export.json`, and the next build ships the reranked desk.
7. The Governance lane lists recent feedback, with an **undo** on each entry.

**Private access.** Zero Trust Free has one Access application covering `<project>.pages.dev` and `*.<project>.pages.dev` (previews). The policy is Allow + Include Emails = Canberk's address, with email one-time PIN login. Pages Functions check `Cf-Access-Jwt-Assertion` with the official plugin, so a request that somehow bypasses Access still gets 403.

---

## 3. Free-tier limits and our headroom (6 crawls/day, 1 user)

| Service / limit | Verified value | Our use | Headroom | Source |
|---|---|---|---|---|
| **CF Pages** builds | 500/month, 1 concurrent, 20-min timeout | ~186 cron builds + ~30–60 manual ≈ 250/month; build ≈ 4–6 min (**UNVERIFIED** on Pages: VM time is 2.5 min, plus clone and `bun install`) | ~50% builds; ~3× on time | [Pages limits](https://developers.cloudflare.com/pages/platform/limits/) |
| CF Pages files | 20,000 files, 25 MiB per file | static export ≈ tens of files (**UNVERIFIED** until B1) | large | same |
| CF Pages build image | Ubuntu 22.04, Bun 1.2.15 preinstalled (override with `BUN_VERSION`), Node 22 | — | — | [Build image](https://developers.cloudflare.com/pages/configuration/build-image/) |
| CF Pages deploy hooks | POST URL triggers a build; the URL is itself the secret | 6/day | — | [Deploy hooks](https://developers.cloudflare.com/pages/configuration/deploy-hooks/) |
| **Workers Free** | 100,000 requests/day (Pages Functions count toward this); 10 ms CPU per request/cron; 50 subrequests; **5 cron triggers per account**; cron wall time 15 min | < 500 req/day; 1 cron | > 99% | [Workers limits](https://developers.cloudflare.com/workers/platform/limits/), [Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/) |
| **D1 Free** | 5M rows read/day, 100k rows written/day, 500 MB per DB, 5 GB per account, 10 DBs, Time Travel 7 days | < 1,000 writes/day, < 50k reads/day | > 95% | [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/), [D1 limits](https://developers.cloudflare.com/d1/platform/limits/) |
| KV Free (not chosen) | 100k reads/day, **1,000 writes/day**, 1 GB | — | — | [KV limits](https://developers.cloudflare.com/kv/platform/limits/) |
| **Cloudflare Access** | Zero Trust Free, $0, **50 users** (a seat is used on first login) | 1 user | 49 seats | [Zero Trust plans](https://www.cloudflare.com/plans/zero-trust-services/), [Access on pages.dev](https://developers.cloudflare.com/pages/platform/known-issues/) |
| **Vyce AI** Free plan | "$10 daily reward credits" (text in the vyceai.com pricing bundle); RPM/TPM are "tier-specific, configured in your dashboard" | ~$0.10/day (§4) | ~99% | vyceai.com (site JS; no public docs page); see §4 |
| GitHub Actions (not used) | Free on **public** repos with standard runners; private: **2,000 min/month** (Free plan); cron ≥ 5 min apart; can be delayed at load peaks and dropped; public-repo schedules auto-disable after 60 days with no repo activity | would be ~5 min × 186 ≈ 930 min/month if private | 53% of quota if private | [Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions), [schedule event](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows) |
| **GitLab.com Free** (not primary) | **400 compute min/month**; small Linux runner cost factor 1; schedules at most `*/5`; 10 schedules; 24 pipelines per schedule per day; **pull mirroring is Premium only** | 6/day × ~4 min (crawl + build + clone + install) ≈ **744 min/month = 186%**. Crawl-only (build on Pages) ≈ 3.2 min ⇒ ~595 min = 149%. **Fits only at ≤ 3 crawl-only runs/day (~298 min) or 2 full runs/day (~248 min)** | ✗ at 6/day | [GitLab compute minutes](https://docs.gitlab.com/ci/pipelines/compute_minutes/), [GitLab.com settings](https://docs.gitlab.com/user/gitlab_com/), [pull mirroring](https://docs.gitlab.com/user/project/repository/mirror/pull/) |
| Vercel Hobby (fallback) | cron **once/day**, ±59 min; 100 deployments/day; 45-min build; 5 deploy hooks per project, 60 triggers/h; Hobby cannot connect to repos owned by Git *organizations*; **Vercel Authentication "All Deployments" does not need a paid add-on**; Password Protection **not available on Hobby** | 6 hook deploys/day | OK | [Vercel cron](https://vercel.com/docs/cron-jobs/usage-and-pricing), [Vercel limits](https://vercel.com/docs/limits), [Deployment protection](https://vercel.com/docs/deployment-protection) |
| Supabase Free (fallback) | 500 MB DB per project, 2 active projects, 5 GB egress, 500k Edge Function invocations; **paused after ~7 days of low database activity** (warning email about a week earlier; restorable for up to 1 year per the current page, 90 days in older text) | 6 reads/day + clicks | pause risk | [Supabase billing](https://supabase.com/docs/guides/platform/billing-on-supabase), [Project pausing](https://supabase.com/docs/guides/platform/free-project-pausing), [pricing](https://supabase.com/pricing) |
| Netlify Free (rejected) | 300 credits/month hard cap; production deploy = 15 credits; sites pause when out | 2,700 credits/month | ✗ | [Netlify credits](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/how-credits-work) |
| GitHub Pages (rejected) | Sites up to 1 GB, 100 GB/month soft bandwidth; private visibility only on Enterprise Cloud | — | ✗ login wall | [Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits), [Pages visibility (GHEC)](https://docs.github.com/enterprise-cloud@latest/pages/getting-started-with-github-pages/changing-the-visibility-of-your-github-pages-site) |
| OpenNext on Workers (not needed) | Supports the latest Next 15 minors and all of Next 16. Their page says a Worker is 3 MiB compressed on Free, while Cloudflare's own limits page (updated Sep 2026) says 64 MiB. **Conflicting**; irrelevant while we export statically | — | — | [OpenNext Cloudflare](https://opennext.js.org/cloudflare) |

Git hosting: Cloudflare Pages can build from GitHub **or GitLab** ([GitLab integration](https://developers.cloudflare.com/pages/configuration/git-integration/gitlab-integration/)) and from public or private repos ([Pages limits → Users](https://developers.cloudflare.com/pages/platform/limits/)).

---

## 4. LLM curation (Vyce AI)

### What I could verify about Vyce
- **No public API docs.** `vyceai.com/docs` returns 404. The site is a single-page app, and its sitemap lists only `/`, `/login`, `/signup`, `/terms` and `/privacy`.
- **Base URL `https://vyceai.com/v1`, OpenAI-compatible.** Third-party sources say so ([LMSpeed listing](https://lmspeed.net/provider/vyce-ai), [pi-vyceai-provider](https://github.com/cheeseonamonkey/pi-vyceai-provider)). I checked it myself: `GET https://vyceai.com/v1/models` without a key returns HTTP 401 with an OpenAI-style error body (`"type":"authentication_error","code":"invalid_api_key"`). Endpoints referenced in the site bundle: `/v1/chat/completions`, `/v1/messages` (Anthropic style), `/v1/models`, `/v1/images/generations`. **No `/v1/embeddings` appears anywhere**, so embeddings are **UNVERIFIED and probably absent**.
- **Models** (from the site bundle and the third-party table; `/v1/models` returns IDs only): `claude-haiku-4-5`, `claude-sonnet-4-6`, `claude-sonnet-5`, `deepseek-v4-flash`, `gemini-3.1-flash-lite`, `gemini-3.6-flash`, `glm-5.2`, `minimax-m3`, `mimo-v2.5-pro`, `nemotron-ultra-550b`, `qwen3.8-*`, `grok-4.6`, `gpt-5.6-*` (some plan-gated or returning 503). Per-token prices only come from a third-party table that is "never invoice-checked": haiku-4-5 $0.8/$4 per M tokens, deepseek-v4-flash $0.09/$0.18, gemini-3.1-flash-lite $0.25/$1.5, sonnet-4-6 $3/$15. **UNVERIFIED.**
- **Rate limits:** the Terms say RPM/TPM are "tier-specific … configured in your dashboard". The key-creation UI has "Rate limit (req/min)" and "Spend limit" fields. No numbers are published.
- **Credits:** the pricing bundle says Free plan "Earn credits through referrals, $10 daily reward credits". Community pages mention a +$10 referral bonus and a $40–50 signup credit. Whether the daily $10 needs a check-in, expires or accumulates is **UNVERIFIED**.
- **Privacy:** the Privacy page (July 2026) claims zero retention: "do not store, view, or log … never used to train or fine-tune public models". But Vyce is a **proxy to undisclosed "upstream model engines"**. Its own frontend code scrubs these names from error messages: `openrouter`, `nvidia`, `groq`, `tokenrouter`, `literouter`, `…:free` model suffixes, and disposable-mail services (`mail.tm`, `cybertemp`). That strongly suggests it resells third-party and free-tier capacity, whose retention and training terms are unknown. **Treat the zero-retention claim as unverifiable.**

### Design (provider-agnostic)
- **Client:** a plain `fetch` to `${LLM_BASE_URL}/chat/completions`. No SDK is needed.
  - `LLM_BASE_URL` (default `https://vyceai.com/v1`)
  - `VYCE_API_KEY`
  - `LLM_MODEL` (default `claude-haiku-4-5`)
  - `LLM_FALLBACK_MODEL` (default `gemini-3.1-flash-lite`)
  - `LLM_DAILY_USD_CAP` (default `1.00`)
  - `LLM_PRICE_IN` / `LLM_PRICE_OUT` (USD per M tokens, for the local ledger)
  - Swapping provider later means changing only the base URL, model and key.
- **Where it runs:** only in `scripts/curate.ts` inside `cf-build.sh`, after `rank-snapshot`. It is never imported from `src/`. Next inlines only `NEXT_PUBLIC_*` variables into client code, and none are used here.
- **Roles, 3 calls per crawl at most:**
  1. **Rerank Wire and Pulse.** Input: up to 60 rule-ranked candidates (id, title, publisher, source count, age, lane), plus the taste profile (~600 tokens) and the last 30 feedback items (title + ±, notes truncated to 140 chars). Output: strict JSON `[{id, score 0–100, why ≤ 90 chars}]` for the top 20.
  2. **Papers rerank.** Same shape, top 12 papers.
  3. **Taste-profile update,** once a day on the lead-pick crawl. Input: yesterday's feedback plus the current profile. Output: a revised profile (≤ 600 tokens: liked topics and labs, disliked patterns, notes). Written to `artifacts/sage/taste-profile.json`.
- **Blend:** `final = 0.55·rule_norm + 0.30·llm_score + 0.15·embed_sim`.
  - The **daily lead pick stays rule-based** (cycle lock). The LLM never moves the lead and never adds IDs that were not in the candidate list (IDs are validated as a subset).
  - Dismissed items are hard-filtered out before the blend.
- **Budget:** per rerank call ≈ 5k input + 1.2k output tokens.
  - At the haiku price above: ≈ $0.009 per call. That is ≈ $0.016 per crawl for calls 1 and 2, ≈ $0.10/day with call 3, about **1% of $10/day**.
  - Worst case with sonnet-4-6 at the same volume: 3 calls × 6 crawls ≈ $0.60/day.
  - Hard caps: `max_tokens` 1500, 45 s timeout, 1 retry (on 429 honour `Retry-After` up to 20 s, then switch to `LLM_FALLBACK_MODEL` once).
  - Spend ledger in `artifacts/sage/llm-ledger.json` (uses the returned `usage` tokens × env prices). The curator refuses to call once the day's spend exceeds `LLM_DAILY_USD_CAP`.
  - Also set a **spend limit and RPM on the key in the Vyce dashboard**.
- **Fallback:** on any failure (no key, 401/403/429/5xx, timeout, invalid JSON, over cap), the curator writes `curator-last.json {status:"skipped", reason}` and the build carries on with the **existing rule rank**. The UI shows a small `RULE RANK` chip instead of the "why" lines. A failed curator must never fail the build.
- **Embeddings:** Vyce shows none, so keep one free option: **`Xenova/all-MiniLM-L6-v2` through `@huggingface/transformers`**, run locally in the build (384-dim, mean-pooled, normalized) ([model card](https://huggingface.co/Xenova/all-MiniLM-L6-v2)). No key, no data leaves the build.
  - Taste vector = mean(liked) − 0.5·mean(disliked), stored in `artifacts/sage/taste-vector.json`.
  - If the model download or inference fails in the Pages build (**UNVERIFIED** there), `embed_sim` is 0 and the weights re-normalize.
- **Privacy rule for prompts:** send only public headlines, URLs, publishers, and the user's own short notes and profile. **Never send the raw X-bookmark list.** The profile carries only derived topics. Assume anything sent to Vyce may be logged upstream.

---

## 5. Code changes in `desk/`, as Beats with pass marks

Hard gates (from the team) are marked **[HARD]**.

| Beat | Change | Pass mark |
|---|---|---|
| **B0 Privacy of source [HARD-adjacent]** | Decide repo visibility. Recommended: make `NEXUS_SAGE_grok` private. Pages builds private repos, and the primary stack uses no Actions minutes. The alternative is to move `x-taste.ts` and `feedback-export.json` out of the public repo. | GitHub API reports `"private": true`, or `rg x-taste` finds no bookmark data in public HEAD. |
| **B1 Static export** | `next.config.ts`: `output: "export"`, `images: { unoptimized: true }`. `page.tsx`: drop `force-dynamic`. `server-boot.ts`: replace the `.next/BUILD_ID` read and `SERVER_STARTED_AT` with build-time constants from `src/data/build-stamp.ts` (generated before `next build`). Keep `check-current.mjs` as a prebuild gate and drop `prestart`. | `bun run build` produces `out/index.html` containing `data-sage-cycle="003"`. `bun test` is green. `bunx serve out` renders the desk with no Node server, and `visual:check` passes. File count in `out/` < 20,000. |
| **B2 Build stamp footer [HARD #4]** | Footer shows the source commit (`CF_PAGES_COMMIT_SHA`, falling back to `git rev-parse`), the crawl commit, build/deploy time and `CRAWL_AT`, all in Istanbul time. | Footer values match the Pages build log and the crawl commit. |
| **B3 `scripts/cf-build.sh`** | Restore caches, then crawl if stale (≥ 3 h): `ingest && rank:snapshot && digest:tick && a2:tick`, then `curate.ts`, embeddings, `next build`. Then run the **secret gate**, print a **per-source row-count table** (HF, arXiv, OpenAlex, Crossref, HN, lab RSS, sec RSS, Google News, GitHub, Wikidata: rows, HTTP status, soft-fail) and flag any source at 0 rows as `THROTTLED?`. Finally commit and push `[skip ci] chore(sage): 4h crawl <CRAWL_AT>` with `git pull --rebase`. A `SHADOW=1` mode skips the push. | Running locally with CF-like env produces `out/` and the table. Setting `SHADOW=1` means no git changes are pushed. |
| **B3a Secret gate [HARD #2]** | `scripts/secret-gate.sh`: `grep -rIl "VYCE_API_KEY" out/` and `grep -rIlF -- "$VYCE_API_KEY" out/` must both be empty (never echo the key). The build fails otherwise. | Planting a fake key string in a test file makes the build fail. A clean build passes. `curate.ts` is not reachable from `src/` (checked with `rg "curate" src/` = 0). |
| **B4 Lead pick off crawl start [HARD #3]** | `decidePick`: pick on the **first crawl whose `CRAWL_AT` (crawl start time) is ≥ 06:00 Istanbul on day D and has no pick for D yet**, replacing the exact-hour check. `LEAD_PICK_FORCE` stays. | New tests: 06:47 crawl picks; 06:11 run dropped then 10:15 crawl picks; a second crawl the same day does nothing; 05:59 does not pick. |
| **B5 Pages project + Access [HARD #1]** | The user creates the project (root `desk`, preset None, build `bash scripts/cf-build.sh`, output `out`), then follows [Known issues → Enable Access on `*.pages.dev`](https://developers.cloudflare.com/pages/platform/known-issues/) so both production and previews are protected. | In a **private browser window**, the production URL and a preview URL both redirect to `<team>.cloudflareaccess.com`. Only the allowed email gets a PIN. `curl -I` gives 302 to Access. `/api/feedback` without a JWT gives 403. |
| **B6 Cron Worker + first cloud run [HARD #3]** | `ops/cf-cron/` Worker: `crons = ["11 3,7,11,15,19,23 * * *"]`, `scheduled()` POSTs `env.DEPLOY_HOOK_URL`. First run with `SHADOW=1`. The **VM routine stays on**. | Worker Cron Events shows the run. The Pages deployment shows Source = deploy hook. The log contains the row-count table. Then flip to `SHADOW=0` and **disable the VM cron** (do not delete it). The next run pushes a crawl commit. The first run starting ≥ 06:00 Istanbul appends today's entry to `lead-history.json`. |
| **B7 D1 + feedback API [HARD #4]** | `desk/functions/api/_middleware.ts`: `@cloudflare/pages-plugin-cloudflare-access` with `ACCESS_TEAM_DOMAIN` and `ACCESS_AUD`, plus a same-origin check, 4 KB body cap and note ≤ 280 chars. `functions/api/feedback.ts`: `POST` creates, `GET ?since=` lists. `functions/api/feedback/[id]/undo.ts`: `POST` sets `undone_at`. D1 binding `DB`. Schema: `feedback(id TEXT PK, item_id TEXT, lane TEXT, kind TEXT CHECK(kind IN('up','down','save','dismiss')), note TEXT, title TEXT, url TEXT, crawl_at TEXT, created_at TEXT, undone_at TEXT, email TEXT)` + index on `created_at`. | Without a JWT: 403. Logged in: 201 and the row is visible in D1. Undo sets `undone_at`. The Workers dashboard shows < 1% of the daily requests. |
| **B8 Feedback UX [HARD #4]** | **+ / −** buttons and an optional note on every story and paper row (optimistic update; keyboard `+` and `-`). The Governance lane gets a "Your feedback" list with **undo**. Must match `refs/UX-LIVE-SITE.md` (not re-read for this doc). | Click + on a row: the entry appears in Governance. Undo removes it from the curator input. Survives a reload (read from `/api/feedback`). |
| **B9 Curator [HARD #2]** | `scripts/curate.ts` per §4. Reads feedback through the D1 REST API (`CF_API_TOKEN` with D1 read, `CF_ACCOUNT_ID`, `D1_DATABASE_ID`; endpoint **UNVERIFIED this session**). Alternative: an Access **service token** calling `/api/feedback`. Writes `curator-last.json`, `src/data/curator.ts` and `llm-ledger.json`. | With the key: ≤ 3 calls logged and ledger spend < cap. With a bogus key: the build is still green and the UI shows `RULE RANK`. The secret gate stays clean. |
| **B10 Local embeddings** | `scripts/embed.ts` (transformers.js MiniLM) writes `taste-vector.json`. | Similarity boosts appear in the log. With the model blocked, the build still passes. |
| **B11 Stale strip [HARD #4]** | Client-side check: if `now − CRAWL_AT > 6 h`, show a full-width amber strip "Last cloud crawl Xh ago — check the failed build". It links to `NEXT_PUBLIC_DEPLOYS_URL` (the Pages deployments page), with an optional `/api/status` Function listing the latest failed deployment. A static page cannot know about a failed build, so the crawl age is the signal. | Fixture with `CRAWL_AT` 7 h old shows the strip and the link. 5 h old: no strip. |
| **B12 Feedback durability** | Each crawl exports non-undone and undone feedback to `artifacts/sage/feedback-export.json` (git). `scripts/feedback-restore.ts` loads it into a fresh D1. | Drill: new D1 + restore gives row counts equal to the export. D1 Time Travel (7 days) is a second net. |
| **B13 Retire VM** | After 2 consecutive green cloud runs, disable the VM's A1/A2 cron and document the fallback in `OPERATOR.md`. | Two green runs shown in Pages deployments and the VM cron commented out. |

Env and secrets (Pages → Settings → Variables, production, **encrypted**): `VYCE_API_KEY`, `GH_PUSH_TOKEN`, `CF_API_TOKEN`, `CF_ACCOUNT_ID`, `D1_DATABASE_ID`, `LLM_BASE_URL`, `LLM_MODEL`, `LLM_FALLBACK_MODEL`, `LLM_DAILY_USD_CAP`, `LLM_PRICE_IN`, `LLM_PRICE_OUT`, `BUN_VERSION`, `ACCESS_TEAM_DOMAIN`, `ACCESS_AUD`, `NEXT_PUBLIC_DEPLOYS_URL` (the only public one). The Worker `sage-cron` holds the secret `DEPLOY_HOOK_URL`.

---

## 6. What Canberk must do himself (checklist)

1. **Decide repo visibility.** Recommended: make `specimba/NEXUS_SAGE_grok` private, because the desk contains X bookmarks.
2. **Cloudflare account** (free). Install the Cloudflare Workers & Pages GitHub app **scoped to this repo only**. Create a Pages project with root `desk`, build `bash scripts/cf-build.sh`, output `out`.
3. **Zero Trust**: choose a team name and the Free plan. Whether signup asks for a card is **UNVERIFIED**. Create the Access app for `<project>.pages.dev` and previews, Allow = his email, login = one-time PIN.
4. **D1**: create database `sage` and bind it to the Pages project as `DB`.
5. **Deploy hook**: Pages → Settings → Builds → Add deploy hook (branch `main`). Put the URL in the Worker secret `DEPLOY_HOOK_URL`, and never commit it.
6. **Cloudflare API token** with only D1 read on this account, stored as `CF_API_TOKEN`. Add Pages read if he wants `/api/status`.
7. **GitHub fine-grained PAT**: only this repo, Contents read/write, with an expiry. Stored as `GH_PUSH_TOKEN`.
8. **Vyce**: create an API key and set its **spend limit and RPM** in the dashboard. Run `GET https://vyceai.com/v1/models` to confirm the model IDs. Store the key as `VYCE_API_KEY` (encrypted, production only).
9. Keep the **VM cron running** until B6 passes, then disable it.

---

## 7. Risks

- **Repo is public (today).** X bookmarks, the crawl history and, later, feedback exports are world-readable. Fix: B0.
- **Vyce is an opaque reseller.** No public docs, undisclosed upstreams (code hints at OpenRouter, Groq, NVIDIA, free-tier routes), an unverifiable zero-retention claim, and it could vanish or change credits at any time. Mitigations: provider-agnostic env, a rule-rank fallback, a spend cap, and minimal prompt content.
- **Cloud-IP throttling.** Pages build IPs are shared. OpenAlex already returned 429 from the VM (14:18 log), and Google News RSS may throttle cloud ranges. The per-source row-count table and soft-fail meters detect it. Use the OpenAlex/Crossref `mailto` polite pools.
- **Build-time crawl coupling.** A crawl failure means a failed build, and the old site keeps serving, which is the intended fail-closed behaviour. The stale strip at > 6 h tells him.
- **Provider caches.** Pages build caching is not verified here. Without it, each crawl refetches, which is slower and hits more rate limits. Option: commit a slim cache, or store caches in R2 (R2 free limits not verified this session).
- **Dual writers during migration.** The VM and cloud builds both pushing can conflict. Mitigated by `SHADOW=1` until the VM is off, and `git pull --rebase` on generated files.
- **Deploy hook URL = credential.** Anyone holding it can trigger builds and burn the 500/month. Keep it only in the Worker secret, and rotate it if leaked.
- **Pages quirks.** A custom domain cannot be added while an Access policy already covers it. The `CF_PAGES_*` variables were briefly missing in one reported incident, so fall back to `git rev-parse`.
- **Schedulers are imprecise.** GitHub cron can be delayed or dropped at peak times. Cloudflare cron precision is not documented. B4 makes the lead pick robust to late runs.
- **Fallback stack risks.** Supabase pauses after ~7 days of low activity. Vercel Hobby cron is daily only, Hobby is for personal non-commercial use, and it cannot connect to repos owned by Git organizations.
- **GitLab.** 400 min/month cannot cover 6 runs a day, and pull-mirroring from GitHub is Premium only.

## 8. Not verified (explicit)

- Static export build and file count (my trial build was interrupted).
- Pages build duration for this repo, and whether transformers.js runs in the Pages gVisor build.
- Pages build caching.
- Whether Pages direct uploads count toward the 500-build limit (irrelevant here: we use Git-integration builds).
- D1 REST query endpoint details.
- Whether Zero Trust Free signup needs a card.
- All Vyce specifics: model prices, RPM, embeddings, how the daily credit works, real retention.
- Exact Supabase activity threshold.
- Cloudflare cron timing precision.
- Vercel Hobby build-minute quota and Vercel GitLab support (not fetched).

## Amendment (Sep 25 15:40) — build state lives in R2
- Primary state store: Cloudflare R2 (free tier), bucket `sage-state`. Each Pages build pulls state at start and pushes it at end: `seen-index.json`, `lead-history.json`, `wire-last/prev.json`, `rank-last/prev.json`, `source-health.json` (incl. OpenAlex pause-until), `topic-heat.json`, `digest-last.json`.
- Git `[skip ci]` commit (scoped fine-grained token) stays as the rebuildable backup; a failed push must not lose state.
- Gate (Reviewer): two consecutive builds on clean checkouts; the second must not mark everything NEW and must send no OpenAlex request while paused.
- Minutes math: GitLab 6/day × 30 × ~5 min ≈ 900 min vs 400 free (no fit). Cloudflare Pages ≈ 186 builds/month vs 500 cap, 20-min build limit vs ~5-min crawl (fits). Crawl runs as existing bun/node scripts inside the Pages build; the cron Worker only calls the deploy hook. Verify bun availability on the Pages build image in shadow mode; fall back to node.
- Correction (15:55, Coder timing after OpenAlex pause 1152667): full routine ~2.6 min incl. build; dry ingest 13.4 s cold / 1.8 s warm. GitLab ≈ 6 × 30 × 2.6 ≈ 470 min vs 400 (still over); a crawl-only GitLab job fits only if job setup + ingest stays under ~2.2 min/run. Pick stays Cloudflare Pages (counts builds not minutes; login, state and hosting on one free account). GitLab crawl-only = fallback, to be measured if Pages build image fails.
