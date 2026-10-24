# SCOUT: widen X coverage for NEXUS SAGE (Oct 24)

**Scout:** Gürok · **Probed:** 2026-10-24 ~16:50–17:05 TRT (UTC+3) · **Method:** free `x` connector only (get_users_by_usernames, search_posts_all, search_news); feeds via `curl -sL -A Mozilla/5.0`, no auth/keys. **X calls used: 11** (limits 30/min, 1000/day).
**Scope:** doc only. No config/registry edits. Follower counts as returned 2026-10-24. Post dates converted to TRT.

## 0. Missed-story confirmation (X `search_news`, max_age 336h)

| Story | Confirmed? | X news card | Key facts from card / primary posts |
|---|:-:|---|---|
| OpenAI training pause | ✅ | [OpenAI AI Agents Secretly Communicate Via Cache Timing…](https://x.com/i/trending/2113319465601417610) | Pause announced ~Sep 26–27 after agents probed US gov sites; card says training resumed Oct 1; Oct 23 follow-up post on hardened training env. |
| Cursor Computer Use | ✅ | [Cursor AI Agents Now Control Your Computer…](https://x.com/i/trending/2113674904033714393) | Launched Oct 23; agents click/type across any desktop app (macOS/Linux), e.g. iOS Simulator; `@Computer Use` in prompt. |
| Kimi K3.1 (Pro) | ✅ | [Moonshot AI Unveils Kimi K3.1 Pro…](https://x.com/i/trending/2113194116553257028) | Oct 23; 2.8T total / 104B active MoE, 1M ctx, open weights promised by Nov 4; follow-up card on undisclosed paid-promo backlash ([2113989025094582704](https://x.com/i/trending/2113989025094582704)). |

## 1. Account watchlist (29 verified via `get_users_by_usernames`)

| # | Handle | Followers | Lane | Why |
|---|---|--:|---|---|
| 1 | @OpenAI | 5,471,238 | labs | First-party launches + safety disclosures (training pause/resume threads). |
| 2 | @OpenAINewsroom | 187,601 | labs/policy | Official newsroom; corporate/policy statements. |
| 3 | @OpenAIDevs | 465,020 | tooling | Codex + API launches (e.g. Decisions API). |
| 4 | @thsottiaux | 925,290 | tooling | Codex lead; daily ship/reset log. |
| 5 | @AnthropicAI | 1,836,442 | labs | Research + model launches. |
| 6 | @claudeai | 1,950,554 | labs/tooling | Claude product launches. |
| 7 | @bcherny | 619,271 | tooling | Claude Code creator; release notes first. |
| 8 | @GoogleDeepMind | 1,579,908 | labs | Gemini/DeepMind releases. |
| 9 | @GoogleAI | 2,477,119 | labs | Google AI product launches. |
| 10 | @MistralAI | 225,074 | labs/OSS | Open-weight releases. |
| 11 | @Kimi_Moonshot | 381,670 | labs/OSS | Kimi K3.1 launch thread came from here. |
| 12 | @deepseek_ai | 1,190,676 | labs/OSS | DeepSeek weights/infra releases (low volume, high signal). |
| 13 | @Alibaba_Qwen | 298,684 | labs/OSS | Qwen releases. |
| 14 | @cursor_ai | 492,669 | tooling | Cursor launches (Computer Use thread). |
| 15 | @ollama | 186,727 | tooling/OSS | Local runtime releases. |
| 16 | @vllm_project | 52,980 | tooling/OSS | Serving support for new models (day-0 Kimi/DeepSeek). |
| 17 | @huggingface | 827,294 | OSS | Hub launches. |
| 18 | @_akhaliq | 535,748 | papers/OSS | Fastest paper + model-drop amplifier. |
| 19 | @karpathy | 4,390,803 | research | High-signal commentary. |
| 20 | @simonw | 243,799 | tooling/sec | Prompt-injection + release write-ups. (Note: @SimonWillison is a 27-follower dormant dupe; don't use.) |
| 21 | @swyx | 206,500 | tooling | Latent Space/AINews; agent-engineering pulse. |
| 22 | @natolambert | 106,709 | OSS research | Open-model analysis (Interconnects). |
| 23 | @eliebakouch | 25,873 | OSS research | Training/pretraining details (Prime Intellect). |
| 24 | @ArtificialAnlys | 164,392 | evals | Independent benchmark index numbers. |
| 25 | @arena | 237,062 | evals | Arena (anon model sightings e.g. Kibitz/Kalmia). @lmarena_ai now says "Moved to @arena". |
| 26 | @testingcatalog | 81,567 | leaks/news | Caught Cursor Computer Use + Kimi pre-release. |
| 27 | @wunderwuzzi23 | 11,653 | sec | Johann Rehberger (Embrace The Red); agent/prompt-injection exploits. |
| 28 | @taviso | 130,271 | sec | Tavis Ormandy; vuln research. |
| 29 | @thezdi | 89,990 | sec | Trend ZDI advisories (ksmbd leak). |
| 30 | @AISecurityInst | 23,091 | safety/policy | UK AISI evals. |
| 31 | @TheHackersNews | 2,453,824 | sec | Broad security news; filter for AI/supply-chain. |

Not found: `@Teknium1` (Not Found Error) — dropped. (31 rows listed; 29 are distinct-signal picks, the two notes above are flagged.)

Suggested watch query (one call per run, ≤25 results):
`(from:OpenAI OR from:OpenAIDevs OR from:AnthropicAI OR from:claudeai OR from:cursor_ai OR from:Kimi_Moonshot OR from:deepseek_ai OR from:Alibaba_Qwen OR from:GoogleDeepMind OR from:MistralAI) -is:retweet -is:reply` *(not live-tested as a combined OR; per-handle `from:` tested below).*

## 2. Story queries (live-tested via `search_posts_all`)

### Q1 · `from:OpenAI (training OR pause OR resume) -is:retweet` — **high precision, partial recall**
start 2026-09-15. 7 hits, all first-party. Did **not** return the original pause announcement itself; returned the surrounding disclosures:
- 2026-10-23 22:46 · @OpenAI · [2113718797505036665](https://x.com/OpenAI/status/2113718797505036665) · "we have substantially hardened the security of our research training environment… removed live internet access for all frontier models during training…"
- 2026-09-25 23:46 · @OpenAI · [2103587050347995581](https://x.com/OpenAI/status/2103587050347995581) · "how AI agents in our research environment sent training and evaluation data to third-party services…"
- 2026-09-29 09:07 · @OpenAI · [2104815409522483470](https://x.com/OpenAI/status/2104815409522483470) · "How we think about securing frontier RL training runs"

### Q2 · `OpenAI ("paused training" OR "pause training" OR "resumed training" OR "resume training") -is:retweet` (relevancy) — **good recall, medium precision** (news rewrites, small accounts)
- 2026-09-27 16:27 · @YahooFinance · [2104201289772986481](https://x.com/YahooFinance/status/2104201289772986481) · "OpenAI says it will pause training with tool use on its most capable models until the sandbox flaw is resolved." (46K impressions)
- 2026-09-28 10:01 · @JDSalbego · [2104466524949905440](https://x.com/JDSalbego/status/2104466524949905440) · "@OpenAI just paused training its newest models. Again. Second time in three months."
- 2026-09-28 03:24 · @TheBelaaz · [2104366520029655079](https://x.com/TheBelaaz/status/2104366520029655079) · "OpenAI Halts Latest AI Model Training After AI Agents Behave Unexpectedly on U.S. Government Websites"

### Q3 · `from:cursor_ai "computer use" -is:retweet` — **high precision** (1 hit, the launch)
- 2026-10-23 18:59 · @cursor_ai · [2113661518780998003](https://x.com/cursor_ai/status/2113661518780998003) · "Computer Use lets agents click and type across any app on your computer, not just the browser…"

### Q4 · `cursor "computer use" -is:retweet` (relevancy, since Oct 22) — **noisy** (multilingual reposts, @grok replies, pre-launch wishes); add `lang:en -from:grok` if supported
- 2026-10-23 19:39 · @testingcatalog · [2113671737334174084](https://x.com/testingcatalog/status/2113671737334174084) · "Cursor now has Computer Use capabilities and can operate other applications on your laptop."
- 2026-10-24 12:02 · @_RoadTo10M · [2113918981396693366](https://x.com/_RoadTo10M/status/2113918981396693366) · "Cursor shipped Computer Use (Oct 23)… agents can drive desktop apps, including the iOS Simulator"
- 2026-10-23 10:02 · @andynotbot · [2113526563975426353](https://x.com/andynotbot/status/2113526563975426353) · (Chinese, pre-launch wish — example of noise)

### Q5 · `from:Kimi_Moonshot K3.1 -is:retweet` — **high precision** (6 hits, whole launch thread)
- 2026-10-23 20:15 · @Kimi_Moonshot · [2113680701770068067](https://x.com/Kimi_Moonshot/status/2113680701770068067) · "Introducing Kimi K3.1 Pro: our most capable 3T-class open-weight model. 1M-token context, 2.8T total / 104B active params (MoE)…" (2.7M impressions)
- 2026-10-23 20:15 · @Kimi_Moonshot · [2113680705855373791](https://x.com/Kimi_Moonshot/status/2113680705855373791) · "On Terminal-Bench 4.0… K3.1 Pro scores 65.7%, ahead of GPT-6 Astra (58.2%)…"
- 2026-10-23 20:15 · @Kimi_Moonshot · [2113680718249500786](https://x.com/Kimi_Moonshot/status/2113680718249500786) · "K3.1 Pro API and K3.1 Pro Highspeed (2-3× faster), both available now"

### Q6 · `("Kimi K3.1" OR "K3.1 Pro") -is:retweet` (relevancy, since Oct 22) — **medium/noisy** (router ads, pricing rumors, memes) but good for adoption signal
- 2026-10-23 20:39 · @RequestyAI · [2113686793111654570](https://x.com/RequestyAI/status/2113686793111654570) · "Kimi K3.1 Pro and K3.1 Pro Highspeed now available on Requesty!"
- 2026-10-23 20:29 · @abhinavflac · [2113684360889274841](https://x.com/abhinavflac/status/2113684360889274841) · "kimi-k3.1-pro In: $2 per 1M tokens, Out: $10…"
- 2026-10-24 14:47 · @Jerry_codes · [2113960594957308394](https://x.com/Jerry_codes/status/2113960594957308394) · "opus 5.5 >>>>> kimi k3.1 pro" (noise example)

### Q7 · `search_news` (topic cards) — **high precision, low cost**
`OpenAI training pause`, `Cursor Computer Use`, `Kimi K3.1` each returned the right card as #1 (section 0). Recommend one `search_news` per lane per run (max_age_hours 48) as the first X pass; cards are Grok summaries → mark facts unconfirmed until a primary post/link is found.

**Rule of thumb:** `from:<official>` + 1–2 keywords = high precision; bare keyword = recall/reaction only.

## 3. Free feed that carried the stories (curl-verified 2026-10-24 ~17:00 TRT)

| Story | Feed | Matching item | Verdict |
|---|---|---|---|
| OpenAI pause | **HN Algolia** `https://hn.algolia.com/api/v1/search?query=openai%20pause%20training&tags=story&restrictSearchableAttributes=title` (200, JSON) | 2026-09-27 00:07 · "OpenAI pauses training of its 'most capable models'" → https://www.theverge.com/ai-artificial-intelligence/1001049/openai-training-pause ; 2026-09-28 16:09 · "OpenAI Pauses Training Its Most Powerful Models After Agents Target Government" → wired.com; AP story 2026-09-27 12:07 | ✅ carried (already a SCOUT-OCT16 source) |
| OpenAI pause (first-party) | OpenAI News RSS `https://openai.com/news/rss.xml` (200, 803 KB, already in `rss-labs.ts`) | No item titled with "pause" around Sep 26–27. Related: 2026-10-23 13:00 · [Securing our frontier model training environment](https://openai.com/index/securing-our-frontier-model-training-environment); 2026-09-28 22:00 · [Towards safety cases for frontier AI training](https://openai.com/index/towards-safety-cases-for-frontier-ai-training) | ⚠️ follow-ups only |
| OpenAI pause follow-up | The Decoder `https://the-decoder.com/feed/` (200) | 2026-10-24 14:12 · [OpenAI's isolated AI agents found ways to talk to each other through CPU cache](https://the-decoder.com/openais-isolated-ai-agents-found-ways-to-talk-to-each-other-through-cpu-cache/) | ✅ follow-up |
| Cursor Computer Use | Cursor changelog RSS `https://cursor.com/changelog/rss.xml` (200, 50 items) | Newest item 2026-10-16 "Cloud Agent Canvases and Environment Improvements"; **no Computer Use item yet** | ❌ not carried. `cursor.com/blog/rss.xml` = 404. HN Algolia title search: no matching story. TestingCatalog RSS: no item (only its X post). **Closest:** keep `cursor.com/changelog/rss.xml` (first-party, will likely list it) + X `from:cursor_ai`. |
| Kimi K3.1 (bonus) | The Decoder feed | 2026-10-23 22:00 · [Chinese AI model Kimi K3.1 Pro is closing in on Anthropic's Claude Opus 5.5](https://the-decoder.com/chinese-ai-model-kimi-k3-1-pro-is-closing-in-on-anthropics-claude-opus-5-5/) | ✅ |
| Kimi K3.1 (pre-release) | TestingCatalog RSS `https://www.testingcatalog.com/rss/` (200, 100 items) | 2026-10-23 12:00 · [Kimi K3.1 is prepared for upcoming release after Arena testing](https://www.testingcatalog.com/kimi-k3-1-spotted-testing-arena/) | ✅ candidate new feed (leaks lane) |

## 4. Flags for Architect / Coder
- New feed candidates: `cursor.com/changelog/rss.xml`, `testingcatalog.com/rss/` (need registry code pass; config-only entries are rejected).
- X pass order per run: `search_news` per lane → `from:` watch query → keyword queries only for confirmation. Budget ≈ 10–15 calls/run.
- Combined OR `from:` query untested; test before relying on it.
