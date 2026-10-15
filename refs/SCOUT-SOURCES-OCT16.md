# SCOUT: free source candidates for `desk/config/sage-sources.json` (Oct 16)

**Scout:** Gürok · **Probed:** 2026-10-16 ~00:05–00:25 TRT (UTC+3) · **Method:** `curl -sS -L -m 20`, UA `Mozilla/5.0 (compatible; NexusSage-Scout/1.0)`, parsed with Python ElementTree (RSS `item` / Atom `entry`), newest `pubDate|published|updated` taken.
**Scope:** read-only. `sage-sources.json` NOT edited. All times below are TRT (UTC+3).

## 0. Already covered (not re-proposed)

- `lab_rss`: openai, deepmind, google-ai, huggingface, mistral, nvidia, nvidia-dev, ms-research, google-research
- `sec_rss`: trailofbits, fox-it, projectzero
- `hn` (Algolia full-text watchlist + 48h sweep), `hf_papers`, `gnews`, `github`, `openalex`, `crossref`, `arxiv`, `wikidata`, `x_taste`
- Gmail senders already landing in `gmail-news-cache`: supercharged@mail.beehiiv.com, simplifyingai@newsletter.alvarocintas.com, opinionai@substack.com, newsletters@techstronggroup.com, newsletter@divenewsletter.com, metr@substack.com, info@comms.infosecurity-magazine.com, hello@theinformation.com, growth@crewai.com, ai.plus@axios.com

**Two locks to flag before wiring:** `WIRE-LAB-HF-RSS-P2.md` put **Reddit** on its DENY list, and `rss-security.ts` notes "NCC intentionally absent". Rows 7 and 8 below (Reddit) need Architect to lift that lock first. Score scale is 1–5; for noise, higher = cleaner.

## 1. Scored table (15)

| # | Name | Type | URL / query | Fresh | Signal | Noise | Total | Newest item (TRT) | Why |
|---|------|------|-------------|:-:|:-:|:-:|:-:|---|-----|
| 1 | Simon Willison (everything) | Atom | `https://simonwillison.net/atom/everything/` | 5 | 5 | 4 | **14** | 2026-10-15 22:47 | 21 items/7d; fastest hands-on read of every model/tool drop. (`/tags/llms.atom` also 200 if we want it narrower.) |
| 2 | Latent Space + AINews | RSS (Substack) | `https://www.latent.space/feed` | 5 | 5 | 4 | **14** | 2026-10-15 13:08 | 12 items/7d; AINews is a daily recap of the whole AI-eng day, ideal cross-check for Pulse. |
| 3 | METR | RSS | `https://metr.org/feed.xml` | 4 | 5 | 5 | **14** | 2026-10-14 10:00 | First-party evals/safety. Feed is **6.8 MB** (full bodies, 110 items), so it needs the Project Zero `streamCap` path. Partly overlaps metr@substack in Gmail. |
| 4 | Engine releases (GitHub Atom) | Atom ×4 | `https://github.com/ggml-org/llama.cpp/releases.atom` · `https://github.com/ollama/ollama/releases.atom` · `https://github.com/vllm-project/vllm/releases.atom` · `https://github.com/anthropics/claude-code/releases.atom` | 5 | 4 | 4 | **13** | 22:22 (claude-code v2.1.301), 22:18 (ollama v0.40.5), 20:15 (llama.cpp v0.7.0), 12:50 (vllm v0.32.0rc2), all 10-15 | Ship signal for the local/agent stack with no auth and no rate-limit issue. Filter to non-rc and minor+ bumps, or it gets chatty. |
| 5 | Embrace The Red | RSS | `https://embracethered.com/blog/index.xml` | 3 | 5 | 5 | **13** | 2026-10-14 01:00 | Best single source on prompt-injection and agent exploits (latest: VS Copilot/SSMS RCE CVE-2026-103572). Low volume, all signal. |
| 6 | HN Algolia, **title-scoped** queries | API query | `https://hn.algolia.com/api/v1/search?tags=story&restrictSearchableAttributes=title&numericFilters=created_at_i>{now-48h},points>=10&query=` + one of `agent`, `open weights`, `prompt injection`, `Qwen`, `local model` | 5 | 4 | 4 | **13** | 2026-10-15 17:36 ("Prompt injection in HTTP headers…", 76 pts) | Our watchlist matches full text, so `MCP` pulled "C++26 Contracts" and "Recreational Programming". Scoping to title cleaned it up: `agent` gave 15 on-topic hits (LFM2.5-24B-A2B at 278 pts on top). |
| 7 | r/LocalLLaMA top/day | Atom | `https://www.reddit.com/r/LocalLLaMA/top/.rss?t=day` | 5 | 4 | 3 | **12** | 2026-10-15 23:09 | Local/open-weights ground truth (Ternary Bonsai 2, Qwen tok/s runs). **Reddit is DENY in the P2 wire**, so it needs Architect sign-off. |
| 8 | r/MachineLearning top/day | Atom | `https://www.reddit.com/r/MachineLearning/top/.rss?t=day` | 4 | 4 | 4 | **12** | 2026-10-15 18:42 | Research angle; only 4 items/day, so it stays tidy. Same Reddit lock applies. |
| 9 | Import AI (Jack Clark) | RSS | `https://importai.substack.com/feed` | 3 | 5 | 5 | **13** | 2026-10-12 15:30 | Weekly; dense paper and policy curation (#476: RSI, open-weight gap). |
| 10 | Interconnects (Nathan Lambert) | RSS | `https://www.interconnects.ai/feed` | 3 | 5 | 5 | **13** | 2026-10-10 00:33 | Open-model and post-training analysis that fits the NEXUS SAGE source mix. Low cadence. |
| 11 | Schneier on Security | Atom | `https://www.schneier.com/feed/atom/` | 4 | 4 | 4 | **12** | 2026-10-15 19:24 | 6/7d; security + AI policy in one place. |
| 12 | Krebs on Security | RSS | `https://krebsonsecurity.com/feed/` | 4 | 4 | 4 | **12** | 2026-10-14 17:22 | Original cybercrime reporting; 3/7d. |
| 13 | CISA advisories (all) | RSS | `https://www.cisa.gov/cybersecurity-advisories/all.xml` | 5 | 4 | 3 | **12** | 2026-10-15 15:00 | Authoritative; ICS-heavy, so filter titles. Body is **1.2 MB**. |
| 14 | Gmail: VentureBeat AI | Gmail keyword | sender `hello@newsletters.venturebeat.com` · query `from:newsletters.venturebeat.com newer_than:3d -subject:(webinar OR "learn how")` | 5 | 4 | 3 | **12** | 2026-10-15 22:06 | Already in the inbox (3 sends/day) but not in the cache. Agent-security and enterprise-agent angles ("AI agents breached seven South Korean financial firms"). Drop the sponsored "Learn how…" sends. |
| 15 | Gmail: Takara TLDR | Gmail keyword | sender `takaramono@tldr.takara.ai` · query `from:tldr.takara.ai subject:"Takara TLDR" newer_than:3d` | 5 | 3 | 4 | **12** | 2026-10-15 11:43 | Daily, one mail per day, already arriving. Signal score is provisional: I only checked subjects, not bodies. |

### Also probed: alive but not in the top 15

| Name | URL / sender | Newest (TRT) | Note |
|------|--------------|--------------|------|
| Zvi Mowshowitz | `https://thezvi.substack.com/feed` | 10-15 15:03 | F5 S4 N3 = 12. Huge posts (2.3 MB feed) |
| Cloudflare blog | `https://blog.cloudflare.com/rss/` | 10-15 20:11 | F5 S3 N4 = 12. Agent infra (browserTool etc.) |
| BleepingComputer | `https://www.bleepingcomputer.com/feed/` | 10-15 23:25 | F5 S3 N3 = 11 |
| The Hacker News | `https://feeds.feedburner.com/TheHackersNews` | 10-15 23:24 | F5 S3 N2 = 10. 50 items/7d, PR-heavy |
| TechCrunch AI | `https://techcrunch.com/category/artificial-intelligence/feed/` | 10-15 23:04 | F5 S3 N3 = 11. Overlaps gnews |
| AWS ML blog | `https://aws.amazon.com/blogs/machine-learning/feed/` | 10-15 20:43 | F5 S3 N3 = 11 |
| Lobsters `ai` tag | `https://lobste.rs/t/ai.rss` | 10-14 14:24 | F4 S3 N4 = 11 |
| Gmail: The Neuron | `theneuron@newsletter.theneurondaily.com` | 10-15 13:32 | F5 S3 N3 = 11. Consumer-tone |
| Gmail: Chrome Built-in AI EPP | `chrome-ai-dev-preview@chromium.org` | 10-15 17:40 | F3 S4 N5 = 12. WebMCP tooling; low volume |
| r/ClaudeAI, r/singularity top/day | `…/r/ClaudeAI/top/.rss?t=day`, `…/r/singularity/top/.rss?t=day` | 10-15 23:49 / 23:08 | Alive; noisy (N2) |
| r/netsec top/day | `…/r/netsec/top/.rss?t=day` | 10-15 22:26 | Only 1 item/day |
| hnrss.org | `https://hnrss.org/best`, `/frontpage`, `/newest?q=prompt+injection` | 10-15 | 200, **but** query variants returned 502/TLS EOF 3 of 5 times, so it's flaky. Prefer Algolia (row 6). |
| MIT Tech Review AI · 404 Media · Ars · GitHub blog · Ollama blog · SemiAnalysis · Last Week in AI | (all 200) | 10-09…10-15 | Fine, but each is covered by gnews or low AI density |

### Dropped (dead, not a feed, or stale)

- 404: `epoch.ai/blog/rss.xml`, `aisi.gov.uk/blog/rss.xml`, `pytorch.org/feed.xml`, `blog.vllm.ai/feed.xml`, NVD `nvd-rss-analyzed.xml`
- Not a feed: `msrc.microsoft.com/blog/feed` (HTML)
- Timeout: `security.googleblog.com/feeds/posts/default` (302 to feedburner, which timed out at 20 s)
- Stale (newest > 2 weeks): Karpathy bearblog (Apr 30), Lil'Log (Jul 4), BAIR (Jul 29), Raschka (Sep 29), One Useful Thing (Oct 1)

## 2. Ready-to-paste JSON (matches current shape)

`lab_rss.feeds` and `sec_rss.feeds` are **keys** that resolve through the registries in `desk/src/lib/rss-labs.ts` and `desk/src/lib/rss-security.ts`. So each new key also needs a `{ id/lab, urls: [...] }` registry entry, which is Coder's job, not a config-only change. The blocks marked `// NEW` don't exist in the loader yet.

```json
{
  "lab_rss": {
    "feeds": ["openai","deepmind","google-ai","huggingface","mistral","nvidia","nvidia-dev","ms-research","google-research",
              "simonw","latent-space","metr","import-ai","interconnects"]
  },
  "sec_rss": {
    "feeds": ["trailofbits","fox-it","projectzero",
              "embracethered","schneier","krebs","cisa-advisories"]
  },
  "releases_atom": { "on": true, "cap_per_feed": 3, "skip_prerelease": true,
    "feeds": ["llama.cpp","ollama","vllm","claude-code"] },
  "community_rss": { "on": false, "cap_per_feed": 10, "_note": "Reddit DENY in WIRE-LAB-HF-RSS-P2; needs Architect lift",
    "feeds": ["r-localllama","r-machinelearning"] },
  "keywords": {
    "hn_title_queries": ["agent","open weights","prompt injection","Qwen","local model"],
    "gmail_senders": ["hello@newsletters.venturebeat.com","takaramono@tldr.takara.ai"]
  }
}
```

Registry URLs for Coder (key → url):

```
simonw          https://simonwillison.net/atom/everything/
latent-space    https://www.latent.space/feed
metr            https://metr.org/feed.xml                     (streamCap: true, 6.8 MB)
import-ai       https://importai.substack.com/feed
interconnects   https://www.interconnects.ai/feed
embracethered   https://embracethered.com/blog/index.xml
schneier        https://www.schneier.com/feed/atom/
krebs           https://krebsonsecurity.com/feed/
cisa-advisories https://www.cisa.gov/cybersecurity-advisories/all.xml   (streamCap: true, 1.2 MB)
llama.cpp       https://github.com/ggml-org/llama.cpp/releases.atom
ollama          https://github.com/ollama/ollama/releases.atom
vllm            https://github.com/vllm-project/vllm/releases.atom
claude-code     https://github.com/anthropics/claude-code/releases.atom
r-localllama    https://www.reddit.com/r/LocalLLaMA/top/.rss?t=day
r-machinelearning https://www.reddit.com/r/MachineLearning/top/.rss?t=day
```

Gmail note: the canonical `GMAIL_QUERY` already matches subjects like "AI"/"newsletter". To surface the two new senders, the fix is to add them to `senderTrust()` (trust 2) in `gmail-news.ts`. That's a code change, so `gmail_senders` above is a proposal.

## 3. X taste snapshot: last ~24h (pulled 2026-10-16 ~00:20 TRT, 7 free `x` reads)

**Narratives**
1. **Meta's Muse Spark Open dominates.** It's an 816B MoE with 42B active, 1M context and open weights, tuned with Apple to run on two M5 Ultra Mac Studios. It's a US trend. Lead post: @alexandr_wang, "muse spark open -- weights out today! best US open-source model, and runs on the new mac studio" (3.7k likes): https://x.com/alexandr_wang/status/2110778579764285512. Day-0 partners piled in: @AIatAMD https://x.com/AIatAMD/status/2110797631089754565, @togethercompute https://x.com/togethercompute/status/2110791253843427330.
2. **"Best US open model" is doing a lot of work.** Pushback with Meta's own table: AA index 39 vs GLM-5.3 45 and Kimi K3 44, and Terminal-Bench 2.1 at 76.4 vs 85.0. See https://x.com/hars_7086/status/2110811808491831478 and https://x.com/Quotracker/status/2110785757287707120. There's also a license gripe vs Qwen3.8-27B Apache 2.0: https://x.com/Ldataengineer/status/2110794302674891055.
3. **Mac Studio as the home lab.** "512GB M5 ultra gonna sell like crazy now" (MLX build is 359 GB): https://x.com/ns123abc/status/2110797026870821069.
4. **Why are Chinese labs quiet?** A distillation-blocking theory got 140 likes: https://x.com/elshayib_/status/2110799095015084422.
5. **Claude Code vs Codex, round N.** Opus plans as a script and a swarm of cheaper agents runs it (copy-pasted "ABSOLUTE GOLDMINE" thread, several clones): https://x.com/skunzu/status/2110808873322123547. Usage burn on session resume: https://x.com/Im_IrushiK/status/2110733197462151650. Codex used 45% more RAM per fix: https://x.com/stas_sorokin_/status/2110782505896857880. "40 agents a day" setup flex: https://x.com/adxtyahq/status/2110772144317833641.
6. **Safety.** Gray Swan's $300k prompt-injection challenge with Anthropic, Meta, GDM and Reflection: https://x.com/GraySwanAI/status/2110746350983737460. Apollo Research says GLM-5.3 shows unprompted "update-aware reasoning" (X story https://x.com/i/trending/2110756370127720854).
7. **Meme or curiosity of the day:** LLMs pick 7 as a "random" number over 93% of the time (X stories https://x.com/i/trending/2110506665359643098, https://x.com/i/trending/2110806659128049867). The "do LLMs understand?" debate is running again: https://x.com/i/trending/2110810704483856794.

**Other stories X is carrying:** Gemini 4 Argon gets mixed coding reviews vs Opus 5.5 (https://x.com/i/trending/2110279138858946570). Ling-3.1-flash runs at 210 tok/s (https://x.com/i/trending/2110411771840548958). Inworld opened its inference service, claiming up to 95% lower cost (https://x.com/i/trending/2110646671109419180).

**Accounts worth a taste-allowlist look:** @alexandr_wang, @AIatAMD, @togethercompute, @victormustar (HF), @GraySwanAI, @DesignArena. Cross-check with `SCOUT-X-TASTE-ALLOWLIST.md`.

**Noise to filter:** "THIS IS AN ABSOLUTE F*CKING GOLDMINE" clone threads (@skunzu, @danikkk_wqs, @ArchimedesLore, @carm1nee) and @grok-ask replies.
