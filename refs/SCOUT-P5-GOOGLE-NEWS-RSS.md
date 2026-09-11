# SCOUT — FREE-PULSE P5 Google News RSS (spice · research-only)

**Scout:** Gürok worker · **Stamp:** 2026-09-11T12:33:42Z (live curl probes ~12:32–12:33Z)  
**Companion:** `FREE-PULSE-DEEPEN.md` §P5 · `UX-P5-GOOGLE-NEWS-SHELF.md`  
**Architect cut target:** `WIRE-GOOGLE-NEWS-P5` · **LANDED**  
**Locks:** cycle `003` · `hf-incident` · Sol≠Astra · free only · no `004` · soft-fail only · **never Brief** · **never sole Pulse lead** · never Brief pins  
**DENY:** paid X · Bluesky · Reddit · scrape farms · inventing mirrors

**Probe method:** `curl -sS -L` · UA `Mozilla/5.0 (compatible; NexusSageScout/1.0)` · `--max-time 15–20`

---

## 1. Verdict / spice role (never sole lead)

| Field | Value |
|-------|-------|
| Verdict | **GO as optional spice** — classic Google News RSS search still returns live RSS 2.0 in 2026 |
| Role | Pulse shelf **sibling** only · enrich / chatter spice · **never** sole Pulse lead · **never** Brief |
| `briefEligible` | **`false`** forever |
| `pulseLeadEligible` | **`false`** forever |
| Soft-fail | Format break / empty / 403/429 → stamp + A4 soft chip · ingest continues · silent empty OK |
| Hold | Needs explicit Canberk/Director GO before Architect APPROVE (P5–P6 HOLD in deepen contract) |

**Why spice, not spine:** Google article links are opaque `news.google.com/rss/articles/…` redirects; copyright restricts personal feed-reader use; topic quality is newsy/firehose vs first-party lab RSS. Keep Lab RSS / HN / HF as primary Pulse signal; Google News = optional quiet shelf.

---

## 2. Stable feed URL templates (verified 2026-09-11)

### 2a. Search (preferred for P5 allowlist)

```
https://news.google.com/rss/search?q={QUERY}&hl=en-US&gl=US&ceid=US:en
```

| Probe query | HTTP | Content-Type | Format | ~items | Redirects | Notes |
|-------------|------|--------------|--------|--------|-----------|-------|
| `Hugging+Face` | **200** | `application/xml; charset=utf-8` | RSS 2.0 (`NFE/5.0`) | **99** | 0 | Stable |
| `OpenAI` | **200** | same | RSS 2.0 | **101** | 0 | Stable |
| `large+language+model` | **200** | same | RSS 2.0 | **100** | 0 | Stable |
| `AI+agent` | **200** | same | RSS 2.0 | **100** | 0 | Stable |
| `Anthropic` | **200** | same | RSS 2.0 | **97** | 0 | Stable |
| `open+weights` | **200** | same | RSS 2.0 | **100** | 0 | Stable |
| `ML+security` | **200** | same | RSS 2.0 | **100** | 0 | Stable |
| `inference` | **200** | same | RSS 2.0 | **100** | 0 | Broader; optional rotate only |
| `when:7d+Hugging+Face` | **200** | same | RSS 2.0 | **100** | 0 | Time operator works; optional |

**Item shape (sample):** `<title>` · `<link>` (Google article redirect) · `<pubDate>` · `<source>` (publisher) · `<guid isPermaLink="…">` · `<description>` (HTML snippet, often long) · `xmlns:media` MRSS.

### 2b. Topic / top feeds (alive · secondary)

| Template | HTTP | Redirects | ~items | Notes |
|----------|------|-----------|--------|-------|
| `…/rss/headlines/section/topic/TECHNOLOGY?hl=en-US&gl=US&ceid=US:en` | **200** | **1** → `/rss/topics/CAAq…` | **40** | Topic slug still works; prefer stable topic ID if wiring |
| `…/rss/topics/{TOPIC_ID}?hl=en-US&gl=US&ceid=US:en` | **200** | 0 | ~40–100 | IDs opaque; do not invent |
| `…/rss?hl=en-US&gl=US&ceid=US:en` | **200** | 0 | ~100 | Top stories — too broad for AI Pulse spice |
| Legacy `…/news/rss/search?q=…&hl=&gl=&ceid=` | **200** | **1** → `/rss/search?…` | same | OK as alias; prefer canonical `/rss/search` |

**Fragility:** Topic slug URLs redirect to opaque `CAAq…` IDs that Google can rotate. **P5 should prefer search templates + allowlist**, not hardcoded topic IDs.

### 2c. Locale / params

| Probe | Result |
|-------|--------|
| Missing `hl`/`gl`/`ceid` | **200** · **1 redirect** that **injects** `hl=en-US&gl=US&ceid=US:en` |
| `hl`+`gl` without `ceid` | **200** · redirect adds `ceid=US:en` |
| Explicit `hl=tr&gl=TR&ceid=TR:tr` | **200** · `<language>tr</language>` · ~100 items |
| No User-Agent | **200** RSS (this egress) — still send polite UA |
| `Accept: text/html` | Still returns `application/xml` RSS (not HTML) |

**Required in wire URL anyway:** always emit `hl` · `gl` · `ceid` explicitly — do not rely on redirect injection (redirect may geo-vary or vanish).

---

## 3. Recommended query allowlist (≤6 standing · rotate ≤2/tick)

Align with Scout AI taste / `SCOUT-HN-P3-QUERIES.md` · **no Sol/Astra** · no incident standing firehose.

| # | Query (URL-encoded form) | Lane | HN P3 cousin |
|---|--------------------------|------|--------------|
| 1 | `Hugging+Face` | labs / OSS | `Hugging Face` |
| 2 | `OpenAI` | baseline | `OpenAI` |
| 3 | `Anthropic` | baseline | `Anthropic` |
| 4 | `large+language+model` | models | `LLM` |
| 5 | `AI+agent` | agents | `agents` / `agent tooling` |
| 6 | `open+weights` | OSS weights | `open weights` |

**Rotate ≤2 / ingest tick** (suggested rounds):

1. `Hugging+Face` · `OpenAI`  
2. `Anthropic` · `large+language+model`  
3. `AI+agent` · `open+weights`  

**Optional rotate pool (not standing):** `ML+security` · `inference` · `when:7d+…` on a standing query — only if Architect opens; keep ≤2 live fetches/tick.

**EXCLUDE from standing:** `Sol` · `Astra` · `Persistent Sol` · `HF breach` / incident nouns · jailbreak firehose · crypto spam · Bluesky.

**Cap display:** ~6–8 cards on shelf (UX-P5) even if feed returns ~100 items — take newest by `pubDate`, de-dupe by `guid` / title+source.

---

## 4. Soft-fail matrix + stamp fields for `ingest-last`

### 4a. Format-break modes (observed + expected)

| Mode | Observed / expected | Soft-fail action |
|------|---------------------|------------------|
| HTML instead of XML | Empty `q=` → **404** `text/html` “Error 404”; geo/CAPTCHA pages possible | Soft · do not parse HTML · never scrape |
| Empty channel | Nonsense `q` → **200** RSS · **0 `<item>`** · tiny body (~1.1KB) | Soft · empty OK · no fake headlines |
| Geo block | Not hit on this egress; possible elsewhere | Soft · stamp reason |
| CAPTCHA / consent interstitial | Not hit; treat HTML body with forms as break | Soft · no browser farm |
| **429 / 403** | Not hit this probe; treat like other free pipes | Soft · backoff/skip tick · A4 chip |
| Query encoding pitfalls | Raw spaces → **curl URL reject** (client); server expects `+` or `%20` | Encode always · fail closed if build URL invalid |
| Missing `ceid`/`hl`/`gl` | Currently auto-filled via redirect | Still **require** all three in wire |
| CT alone | Search returns honest `application/xml` | Still sniff `<rss` / `<item` (P2 lesson) |
| Opaque article links | `link` = `https://news.google.com/rss/articles/CBMi…` | Store as-is · never invent publisher mirror URLs |

### 4b. Suggested `ingest-last.google_news` (or `gn_rss`) fields

| Field | Type | Success | Soft-fail |
|-------|------|---------|-----------|
| `ok` | bool | `true` | `false` |
| `soft_fail` | bool | `false` | **`true`** |
| `soft_fail_reason` | string\|null | `null` | e.g. `HTTP 404` · `empty_channel` · `html_body` · `HTTP 429` · `parse_error` |
| `queries_attempted` | number | ≤2 | count tried |
| `queries_ok` | number | ≥1 | 0 |
| `items` | number | shelf-capped count kept | **0** |
| `http_status` | number\|null | 200 | last status |
| `content_type` | string\|null | as returned | as returned |
| `format` | string\|null | `rss2` | `html` / `empty` / `unknown` |
| `brief` | bool | **`false`** | **`false`** |
| `pulse_lead` | bool | **`false`** | **`false`** |
| `briefEligible` | bool | **`false`** | **`false`** |
| `pulseLeadEligible` | bool | **`false`** | **`false`** |
| `url_template` | string | search template used | same |
| `queried` | string[] | which ≤2 ran | which tried |

**A4:** soft chip ON iff `soft_fail===true`. Aggregate may show `Google News empty` / `Google News 429`. Never wash to OK without clearing reason. Never displace HF / Lab RSS / HN meters.

**Freeze-note line:** `GoogleNews · soft_fail={bool} · queries_ok={n}/{attempted} · items={n}`

---

## 5. Placement

Per `UX-P5-GOOGLE-NEWS-SHELF.md`:

```
Pulse
├─ Health · soft-fail meters   ← A4
├─ HN chatter
├─ Lab RSS
├─ ★ News RSS · Google (P5)    ← quiet shelf sibling · pulse only
├─ Taste · operator X-session
└─ Security RSS
```

| Flag | Value |
|------|-------|
| `briefEligible` | **`false`** |
| `pulseLeadEligible` | **`false`** |
| Chrome | `pin-card-quiet` · kicker `news · google rss · pulse only` · sticky `never Brief · never sole lead` |
| Empty/soft | A4 soft chip · **not** fake headlines |

---

## 6. DENY / non-goals

| DENY / non-goal | Why |
|-----------------|-----|
| Paid X · Bluesky · Reddit | Contract DENY |
| Scrape farms · Nitter/mirrors · inventing publisher mirrors from Google redirects | Not free-first honesty |
| Sole Pulse lead / Brief pins / Brief eligibility | Spice only |
| Cycle `004` · Sol/Astra standing queries | Locks |
| Wiring TECHNOLOGY top feed as default AI spice | Too broad · prefer allowlist search |
| Resolving Google article URLs via headless farm | Soft-fail / leave opaque · no scrape |
| CAPTCHA solving · residential proxies | Out of scope |
| P6 Lobsters/dev.to in this cut | Separate optional spice |
| Land without Canberk/Director GO | P5 HOLD until explicit GO |

---

## 7. Done-when hints for Reviewer

1. Live probe evidence in this file (stamp **2026-09-11T12:33:42Z**) — search template **200** + RSS 2.0 for allowlisted queries.  
2. Wire (when APPROVED) uses **soft-fail only** · empty/HTML/4xx/429 ≠ crash · A4 stamp honesty.  
3. **`briefEligible:false`** · **`pulseLeadEligible:false`** · never Brief pins · never sole Pulse lead.  
4. Standing allowlist **≤6** · rotate **≤2/tick** · no Sol/Astra/incident standing.  
5. Placement = Pulse shelf sibling per UX-P5 · quiet cards · cap ~6–8.  
6. No paid X / Bluesky / Reddit / scrape farms / invented mirrors.  
7. Locks `003` · `hf-incident` · free only · no `004` untouched.  
8. Dual-home / stamp-truth if land touches ingest artifacts.

---

## Probe log (summary)

| Window | Result |
|--------|--------|
| 2026-09-11T12:32:46Z | Search×4 (`Hugging+Face` · `OpenAI` · `large+language+model` · `AI+agent`) → **HTTP 200** · `application/xml` · RSS 2.0 · ~99–101 items · 0 redirects |
| 2026-09-11T12:33:24Z | Break probes: empty `q`→404 HTML; nonsense→200 empty channel; missing locale→200+redirect inject; unencoded spaces→client URL reject; Accept HTML still XML |
| 2026-09-11T12:33:42Z | Extra allowlist (`Anthropic` · `open+weights` · `ML+security` · `inference`) → **200** · ~97–100 items; TECHNOLOGY topic → **200** · 1 redirect · **40** items |

**Query templates verified HTTP 200 (RSS):** **8** search queries (+ topic/top/legacy also 200; not counted as allowlist templates).



---

## Coder land — 2026-09-11T12:45:00Z

**LANDED** with `WIRE-GOOGLE-NEWS-P5` · desk `src/lib/gnews-rss.ts` · ingest `google_news` stamp · Pulse quiet shelf · A4 `GNews` chip · rotate ≤2/tick · soft_fail format-break/empty/403/429 · never Brief · never sole lead · locks `003`/`hf-incident` · **P6 HOLD**.
