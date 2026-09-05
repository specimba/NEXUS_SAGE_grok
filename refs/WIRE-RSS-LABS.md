# Wire-spec #3 — Lab blog RSS (APPROVED)

**Architect approve:** YES · **Implement:** Coder after Reviewer free-ingest stamp · **Scout:** live samples into this file  
**Locks:** cycle `003` · lead `hf-incident` · Sol≠Astra · free only · **never Brief lead** · **no cycle `004`**

## Goal

Official lab announcements into Pulse / Digest support refs / shelf. Complements HF + arXiv + HN. Does not change lead or invent cycle `004`.

## Feeds (zero credentials — GET XML/Atom only)

| Lab | Feed URL | Status |
|-----|----------|--------|
| OpenAI News | `https://openai.com/news/rss.xml` | **Must-wire** (first-party) |
| OpenAI Blog (legacy) | `https://openai.com/blog/rss.xml` | Optional fallback if news 404s |
| Google DeepMind | `https://deepmind.google/blog/rss.xml` | **Must-wire** (try; if 404 try `/blog/feed/basic/`) |
| Google AI Blog | `https://blog.google/technology/ai/rss/` | **Must-wire** (Google/DeepMind family) |
| Hugging Face Blog | `https://huggingface.co/blog/feed.xml` | Allowed (ecosystem lab; free) |
| Anthropic News | *no first-party RSS* | **Defer HTML scrape.** Optional mirror only if Scout pastes a verified public Atom URL into this file — tag `source: "rss-mirror"` |
| Meta AI Blog | *often no stable first-party RSS* | Same as Anthropic — mirror optional, never required for PASS |

Do **not** scrape login walls. Do **not** depend on rsshub.bestblogs.dev for PASS.

## Rate / politeness

- ≤1 feed request / 2s, sequential
- Cache raw XML 6h under `artifacts/sage/rss-cache/<lab>.xml`
- UA: `NEXUS-SAGE-desk/0.2 (free-ingest; rss)`
- On 429/5xx → skip feed, continue ingest

## Code paths

| Path | Role |
|------|------|
| `desk/src/lib/rss-labs.ts` | `fetchFeed`, `parseRssOrAtom`, `toLabItems` |
| ingest hook | After HN; write Pulse + shelf; stamp |
| `desk/src/lib/__tests__/rss-labs.test.ts` | Fixture feeds → schema; DENY; never Brief-eligible |

## Schema

```ts
type LabRssItem = {
  id: string              // hash(link) or guid
  lab: "openai" | "deepmind" | "google-ai" | "huggingface" | "anthropic" | "meta"
  title: string
  link: string
  published: string       // ISO if present
  summary: string         // ≤400 chars
  source: "rss-lab" | "rss-mirror"
  shelfOnly: boolean      // true unless Pulse-eligible
  pulseEligible: boolean  // true after classifyPost ok
  briefEligible: false    // locked false forever in this wire
}
```

## Placement rules

| Lane | Allowed? |
|------|----------|
| Pulse | YES — chatter/cards after `classifyPost` / DENY / rumor tags |
| Digest refs | YES — `role: "support"` / `"wire"` |
| Shelf | YES — toolkit-ish or low-confidence |
| Brief lead | **NO** |
| Brief companion auto-pin into `CYCLE.pins` | **NO** this slice (Pulse “companion tone” OK; compiler pin set unchanged) |

## Hygiene

- Run titles/summaries through `classifyPost` / `bannedNounsIn` / `detectFlatten`
- Sol≠Astra / civilizations / announced-deal → DENY or drop
- Never bump `CURRENT.id`

## Fail closed

- Bad XML → skip feed
- Mirror feed without Scout URL in this doc → do not fetch
- Must keep `ingest-last.json` flags: `rss.brief=false`

## Done when (Reviewer)

- [x] ≥2 first-party feeds enrich Pulse/shelf on `bun run ingest`
- [x] Zero credentials
- [x] Brief pin set unchanged (`003` / `hf-incident`)
- [x] Tests prove `briefEligible === false`
- [x] Anthropic/Meta absence does not fail the slice

### Reviewer stamp — 2026-09-04T06:41Z

**WIRE-RSS-LABS PASS**

Evidence:
- `ingest-last.json` → `rss.brief=false`, `pulse_only=true`, feeds×4 (openai / deepmind / google-ai / huggingface)
- `bun test src/lib/__tests__/rss-labs.test.ts` → 13/13 (`briefEligible === false`, pin set `003`/`hf-incident`, no Anthropic/Meta required)
- FREE-INGEST prior stamp holds; zero creds; Reddit not wired

## Explicit non-goals

- Reddit JSON (Scout notes only)
- Security RSS (later)
- Cycle `004`

---

## Scout live samples (fetched 2026-09-04 · UA `NEXUS-SAGE-desk/0.2`)

All four must-wire feeds returned **HTTP 200**. Cap ingest to newest slice (OpenAI news feed is huge ~700KB).

### 1. OpenAI News — `https://openai.com/news/rss.xml`

Trimmed item:
```xml
<item>
  <title>Daybreak for Frontline Defenders: $1B to protect essential services</title>
  <description>OpenAI introduces Daybreak for Frontline Defenders. A $1 billion commitment expands access to frontier cyber AI, training, and support for essential services.</description>
  <link>https://openai.com/index/daybreak-for-frontline-defenders</link>
  <guid isPermaLink="true">https://openai.com/index/daybreak-for-frontline-defenders</guid>
  <category>Security</category>
  <pubDate>Thu, 03 Sep 2026 13:15:00 GMT</pubDate>
</item>
```
Mapped sketch: `lab:"openai"`, `briefEligible:false`, Pulse after classifyPost. Note Cloudflare can 403 plain clients — curl/UA worked here.

Also saw: `Legora reviewed 41 documents in minutes with GPT-6 Astra` — Astra product posts OK for Pulse; never auto-promote to Brief lead.

### 2. Google AI Blog — `https://blog.google/technology/ai/rss/`

Trimmed item:
```xml
<item>
  <title>Proactive cyber defense for governments and enterprises</title>
  <link>https://blog.google/innovation-and-ai/technology/safety-security/fairwind-program/</link>
  <description>The Fairwind Program is a limited access program for governments and trusted partners to use our cyber defense tools.</description>
  <pubDate>Wed, 02 Sep 2026 15:40:00 +0000</pubDate>
  <guid>https://blog.google/innovation-and-ai/technology/safety-security/fairwind-program/</guid>
</item>
```
`lab:"google-ai"`. Fairwind/cyber posts → Pulse/Digest support; not Brief lead.

### 3. Google DeepMind — `https://deepmind.google/blog/rss.xml`

Trimmed item (description often empty — use title + link):
```xml
<item>
  <title>Introducing Gemini 3.8 Flash and 3.8 Flash Cyber</title>
  <link>https://deepmind.google/blog/introducing-gemini-3-8-flash-and-38-flash-cyber/</link>
  <description/>
  <pubDate>Wed, 02 Sep 2026 16:18:31 +0000</pubDate>
  <guid>https://deepmind.google/blog/introducing-gemini-3-8-flash-and-38-flash-cyber/</guid>
</item>
```
`lab:"deepmind"`. Empty `<description>` is normal — summary may be `""` or title-derived ≤400 chars.

Also: `Introducing WeatherNext 3…` (2026-09-03) — research Pulse OK.

### 4. Hugging Face Blog — `https://huggingface.co/blog/feed.xml`

Trimmed item (often title/link/date only — no body):
```xml
<item>
  <title>NeoMME: an efficient Multimodal-native and Multilingual Encoder</title>
  <pubDate>Thu, 03 Sep 2026 13:13:48 GMT</pubDate>
  <link>https://huggingface.co/blog/Hcompany/neomme</link>
  <guid isPermaLink="false">https://huggingface.co/blog/Hcompany/neomme</guid>
</item>
```
`lab:"huggingface"`. Title-only items still Pulse/shelf eligible; never Brief.

### Fixture files for Coder

`desk/src/lib/__tests__/fixtures/`:
- `rss-openai-daybreak.xml`
- `rss-google-ai-fairwind.xml`
- `rss-deepmind-gemini38.xml`
- `rss-hf-neomme.xml`

Assert each maps `briefEligible === false` and leaves pin set `003` / `hf-incident`.

### Anthropic / Meta

No first-party RSS verified this pass — **do not wire HTML scrape**. No mirror URLs pasted here → Coder must skip.

### Optional notes only — Reddit (NOT approved to wire)

| Sub | URL | Scout result 2026-09-04 |
|-----|-----|-------------------------|
| r/LocalLLaMA | `https://www.reddit.com/r/LocalLLaMA/new.json?limit=1` | **HTTP 403** without browser cookies / special UA |
| r/MachineLearning | `https://www.reddit.com/r/MachineLearning/new.json?limit=1` | Expect same; needs Reddit-friendly UA + possibly oauth later |

Treat Reddit as blocked/hostile to naive bots. Do **not** wire this slice. If Architect ever approves: require documented UA + 403 handling + never Brief.

### DENY reminders for RSS titles

| Title pattern | Action |
|---------------|--------|
| Astra as HF attacker / Sol=Astra | DENY / drop |
| Announced-deal hype without primary | tag / Pulse only |
| Toolkit / scanner GitHub in lab post | shelf via classifyUrl — off Brief |
