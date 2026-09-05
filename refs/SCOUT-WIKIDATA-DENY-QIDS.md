# Scout deepen — Wikidata DENY allowlist Q-ids

**Scout:** Gürok worker · **For:** Coder (`desk/src/data/wikidata-deny-seeds.ts` + `wikidata-deny.ts`)  
**Contract:** `WIRE-WIKIDATA-DENY.md` (APPROVED) · **Candidates close:** `WIRE-CANDIDATES-S2-WIKIDATA.md`  
**Probe timestamp:** `2026-09-04T09:48:37Z`–`2026-09-04T09:52:10Z` UTC  
**Locks:** cycle `003` · lead `hf-incident` · Sol≠Astra · **never Brief** · **never Pulse lead** · **no cycle `004`** · free only · no HF HTML · no S2 key · DENY grounding only

Wikidata is **operator evidence for `classifyPost` / flatten / DENY hygiene** — not news, not Papers, not Brief pins.

---

## Live probe evidence

| Call | HTTP | Notes |
|------|------|-------|
| `wbsearchentities` (many seeds, UA below) | **200** | Usable zero-cred |
| `wbgetentities` (batched ids) | **200** | Labels/aliases/descriptions confirmed |
| MediaWiki `list=search` `Trail of Bits` | **200** | No Trail-of-Bits org item found |
| SPARQL label=`Trail of Bits`@en | **200** empty bindings | Org **not** in Wikidata (or unlabeled) |
| curl **no** `User-Agent` | **200** | Still works (do not rely) |
| curl `-A ''` (empty UA) | **403** | Soft-fail; **always send UA** |
| Semantic Scholar `paper/search?query=HuggingGPT` | **429** | Confirms S2 SKIPPED this pulse |

**UA used:**

```
NEXUS-SAGE-desk/0.2 (free-ingest; wikidata; mailto:local@nexus-sage.invalid)
```

**Sample curl that worked (HTTP 200):**

```bash
curl -sS -A 'NEXUS-SAGE-desk/0.2 (free-ingest; wikidata; mailto:local@nexus-sage.invalid)' \
  --get 'https://www.wikidata.org/w/api.php' \
  --data-urlencode 'action=wbsearchentities' \
  --data-urlencode 'search=Hugging Face' \
  --data-urlencode 'language=en' \
  --data-urlencode 'format=json' \
  --data-urlencode 'limit=5'
# → Q108943604 "Hugging Face" / "American company"
```

**Rate / soft-fail (honor wire):** ≤1 call / 2s · ≤3 seeds / ingest tick · cache 24h · 429/5xx/403 → `soft_fail`, ingest continues · never invent entities · `briefEligible: false`.

**API quirks:**

1. Short tokens (`Sol`, `Astra`, `METR`, `Claude`, `Llama`, `GPT`, `agent`, `swarm`, `transformers`) rank **false friends** first.
2. `METR` alone → metre / museums; use full name **Model Evaluation and Threat Research** → `Q135185153` (label language `mul`; `wbgetentities` may omit `labels.en` — keep search label).
3. `Persistent Sol` / `Persistent-Sol` → climate/solar **papers** (top: `Q34104679`) — **no** Wikidata person/agent for Persistent-Sol.
4. `Astra` / `OpenAI Astra` → pharma/cars/missiles; **OpenAI Astra product has 0 search hits**.
5. `Project Zero` ranks Fatal Frame games above Google team — require allowlisted Q-id `Q18859887`.
6. `Trail of Bits` / `trailofbits` → **0** `wbsearchentities` hits → `unresolved` (RSS still live elsewhere; do not invent Q-id).
7. `Artifactory` alone → Python lib `Q107385338`; JFrog product string empty — ground via **JFrog Ltd** `Q98608948` if needed.
8. Empty UA → **403**; send the wire UA always.

---

## Curated seed list (Coder hardcode)

~**32 accept Q-ids** + reject set. Prefer **exact allowlist match** over free-text heuristics.

Suggested `desk/src/data/wikidata-deny-seeds.ts` shape (from wire):

```ts
{ seed, query?, allowedQids?: string[], rejectQids?: string[], rejectLabelRe?: RegExp }
```

| Seed (ingest rotate) | Search query | Accept Q-ids | Intent |
|----------------------|--------------|--------------|--------|
| `Hugging Face` | `Hugging Face` | `Q108943604`, `Q131939003` | HF org / Hub grounding (incident file) |
| `METR` | `Model Evaluation and Threat Research` | `Q135185153` | Eval lab (not metre) |
| `OpenAI` | `OpenAI` | `Q21708200` | Lab RSS / companion context |
| `DeepMind` | `DeepMind` | `Q15733006` | Lab RSS |
| `Anthropic` | `Anthropic` | `Q116758847` | Lab (no first-party RSS; still DENY-ground) |
| `Meta AI` | `Meta AI` | `Q112114913` | Lab |
| `Fox-IT` | `Fox-IT` | `Q5476521` | Security RSS |
| `Project Zero` | `Project Zero` | `Q18859887` only | Security RSS (reject Fatal Frame) |
| `OWASP` | `OWASP` | `Q379297` | Toolkit shelf |
| `NIST` | `NIST` | `Q176691` | Standards / shelf |
| `MITRE` | `MITRE Corporation` | `Q627039`, `Q104434300` | Corp + ATT&CK |
| `JFrog` | `JFrog` | `Q98608948` | Artifactory parent (HF incident jargon) |
| `ChatGPT` | `ChatGPT` | `Q115564437` | Model family / OpenAI product |
| `GPT-4` | `GPT-4` | `Q116709136` | Model family |
| `Claude` | `Claude` | `Q118876059`, `Q134885164` | Anthropic LLM only (reject given-name) |
| `LLaMA` | `LLaMA` | `Q116894231` | Meta LLM (reject mammal) |
| `Gemini` | `Gemini` | `Q123688361`, `Q116698014` | Google LLM / chatbot (reject zodiac) |
| `Mistral AI` | `Mistral AI` | `Q119718658` | Lab |
| `Google` | `Google` | `Q95` | Parent of DeepMind / PZ |
| `Meta Platforms` | `Meta Platforms` | `Q380` | Parent of Meta AI |
| `stigmergy` | `stigmergy` | `Q2141158` | Flatten hygiene concept (not breach proof) |
| `Sol` / `Persistent Sol` | `Persistent Sol` | **none** | Flatten guard — **reject-only** (see REJECT) |
| `Astra` | `Astra` | **none** | Companion ≠ HF attacker — **reject-only** |
| `Trail of Bits` | `Trail of Bits` | **none** | `unresolved` until WD has item |

Optional (lower priority rotate): `Alphabet Inc.` → `Q20800404`; `NCC Group` → `Q17149263` (RSS skipped HTML/404, org still real); `Grok` → `Q123361035` only; `xAI` → prefer `Q120599684` (SpaceXAI / xAI Corp aliases) — **never** `Q40890078` explainable AI.

---

## Allowlist table (verified)

| Q-id | label | why DENY-relevant | aliases to match | false-friend notes |
|------|-------|-------------------|------------------|--------------------|
| `Q108943604` | Hugging Face | HF incident org grounding | (none en) | Reject emoji `Q87583026` HUGGING FACE |
| `Q131939003` | Hugging Face Hub | Hub / hosting | | |
| `Q107382298` | transformers (HF lib) | HF stack | Hugging Face Transformers, Huggingface Transformers | **Do not** accept bare `transformers` search without this Q-id — franchise `Q1323565` wins |
| `Q135185153` | Model Evaluation and Threat Research | METR eval nonprofit | (label `mul`) | Bare `METR` → metre `Q11573` etc. |
| `Q21708200` | OpenAI | Lab / Astra companion context | openai.com | Prefer over LLC twin `Q124605186` |
| `Q115564437` | ChatGPT | OpenAI product family | Chat Generative Pre-trained Transformer | |
| `Q116709136` | GPT-4 | Model family | GPT 4, GPT4 | Bare `GPT` also hits GUID Partition Table |
| `Q116777014` | generative pre-trained transformer | GPT type | GPT | Use only with seed `GPT` + allowlist |
| `Q15733006` | Google DeepMind | Lab RSS | DeepMind Technologies, deepmind.com | |
| `Q116758847` | Anthropic | Lab | | |
| `Q118876059` | Claude (LLM) | Model family | Claude (language model), Claude 2.1 | Reject given-name `Q17523984` |
| `Q134885164` | Claude 3 | Model family | | |
| `Q112114913` | Meta AI | Lab | AI at Meta | Reject Meta AI mobile-app twins unless listed |
| `Q380` | Meta Platforms | Parent org | meta.com | |
| `Q116894231` | LLaMA | Model family | Llama, Large Language Model Meta AI | Reject mammal `Q42569` |
| `Q119718658` | Mistral AI | Lab | Mistral | |
| `Q123688361` | Gemini (LLM family) | Model family | Gemini Pro/Ultra/Nano, Google Gemini | Reject constellation `Q8923` |
| `Q116698014` | Gemini (chatbot) | Product | Google Bard, Bard | |
| `Q95` | Google | Parent / PZ employer | | |
| `Q20800404` | Alphabet Inc. | Parent | Alphabet | |
| `Q18859887` | Project Zero | Google security team | Project Zero (Google) | Reject Fatal Frame `Q2323933` (alias Project Zero) |
| `Q5476521` | Fox-IT | Security RSS | | |
| `Q379297` | OWASP | Toolkit / security org | Open Web Application Security Project | |
| `Q176691` | National Institute of Standards and Technology | NIST | NBS, National Bureau of Standards | |
| `Q627039` | MITRE Corporation | Security / ATT&CK parent | MITRE, The MITRE Corporation | Bare `MITRE` → family names / liturgical mitre |
| `Q104434300` | Mitre ATT&CK | Threat KB | MITRE ATT&CK, Mitre Attack | |
| `Q98608948` | JFrog Ltd | Artifactory vendor (HF path jargon) | JFrog | Reject Python `artifactory` `Q107385338` |
| `Q2141158` | stigmergy | Flatten: concept ≠ breach proof | | |
| `Q17149263` | NCC Group | Security firm (RSS skipped) | NCC | Optional |
| `Q123361035` | Grok (chatbot) | Optional model/product | Grok chatbot, Grok 3 | Reject Heinlein / Zope framework |
| `Q120599684` | SpaceXAI | xAI corp grounding | xAI Corp., xAI company | Bare `xAI` → explainable AI first |
| `Q30688088` | Google (AI division) | Optional Google AI division | | `Google AI` search is noisy |

**Accept count for Coder seed file:** **32** primary Q-ids in table (optional rows included). Start rotate with wire’s four seeds + labs/security; expand from table without inventing Brief pins.

---

## Explicit REJECT / false-friend list

Hard-reject these Q-ids (and/or label regex) when they appear for the related seed:

| Q-id | label | seed collision | action |
|------|-------|----------------|--------|
| `Q34104679` | Persistent solar influence on North Atlantic climate… | `Persistent Sol` / `Persistent-Sol` | `rejected_false_friend` |
| `Q60276667` / other “Persistent solar…” papers | solar-physics articles | same | reject (desc contains `solar` / `scientific article`) |
| `Q10673071` | Sol (given name) | `Sol` | reject |
| `Q904031` | sol (Martian day) | `Sol` | reject |
| `Q181780` | colloid (aliases: sol, sols) | `Sol` | reject |
| `Q48440` | solar radius | `Sol` / `solar` | reject |
| `Q108695872` | Solana (alias SOL) | `Sol` | reject |
| `Q14646` | Solaris (OS) | `Sol` / `Solaris` | reject |
| `Q731938` | AstraZeneca | `Astra` | reject (wire fixture) |
| `Q1350` | Opel Astra (alias Astra) | `Astra` | reject |
| `Q1109155` | Vauxhall Astra | `Astra` | reject |
| `Q1137096` | Astra (missile) | `Astra` | reject |
| `Q12155952` | Astra (Hinduism weapon) | `Astra` | reject |
| `Q87583026` | 🤗 / HUGGING FACE emoji | `Hugging Face` | reject |
| `Q11573` | metre | `METR` | reject |
| `Q160236` | Metropolitan Museum of Art | `METR` | reject |
| `Q42569` | llama (mammal) | `Llama` / `LLaMA` | reject |
| `Q37126053` | Llama (family name) | same | reject |
| `Q17523984` | Claude (given name) | `Claude` | reject |
| `Q603889` | GUID Partition Table (alias GPT) | `GPT` | reject |
| `Q1323565` | Transformers (franchise) | `transformers` | reject |
| `Q2323933` | Fatal Frame (alias Project Zero) | `Project Zero` | reject |
| `Q135025558` / `Q586400` | Project Zero / Fatal Frame games | same | reject |
| `Q107385338` | artifactory (Python lib) | `Artifactory` | reject (not JFrog product) |
| `Q40890078` | explainable AI | `xAI` | reject |
| `Q5610141` | Grok (Python web framework) | `Grok` | reject |
| `Q2599246` | grok (Heinlein) | `Grok` | reject |
| `Q8923` | Gemini (constellation) | `Gemini` | reject |

**Suggested `rejectLabelRe` (per seed):**

- `Sol` / `Persistent Sol`: `/\b(solar|climate|holocene|urticaria|martian|colloid|solana|solaris)\b/i`
- `Astra`: `/\b(zeneca|pharma|opel|vauxhall|missile|vaccine|azd\d+)\b/i`
- `METR`: `/\b(metre|meter|museum|metro-goldwyn|poetry|tonne)\b/i`
- `Project Zero`: `/\b(fatal frame|video game|wii)\b/i`
- `Claude` / `Llama` / `Gemini` / `Grok`: reject if description is given-name / mammal / constellation / neologism / web framework unless Q-id allowlisted

---

## Suggested match algorithm

1. **Scrub before Brief / Pulse lead:** Wikidata hints never set `briefEligible` / `pulseLeadEligible`; Digest may cite `wire` “entity grounding” only.
2. Pick ≤3 seeds / tick (rotate). Normalize query string; for `METR` force full org name; for `Sol` prefer `Persistent Sol` probe solely to **reject** solar hits.
3. `GET wbsearchentities` (`language=en`, `limit=5`) with wire UA. On network/HTTP 403/429/5xx → `{ status: "soft_fail", qid: null, briefEligible: false }`.
4. Optional ≤1 `wbgetentities` per accept candidate (`props=labels|descriptions|aliases`, `languages=en`).
5. **Match order for each hit:**
   - If `qid ∈ rejectQids` **or** `rejectLabelRe` hits label/description → `rejected_false_friend`.
   - Else if `allowedQids` non-empty and `qid ∈ allowedQids` → `matched` (prefer **exact** case-insensitive equality of search `label` or any `aliases` to seed token; `contains` only for multi-word org names already allowlisted).
   - Else → skip hit (do not heuristic-accept).
6. If any `matched` → return best (exact alias > exact label > other allowlisted). Else if any reject-only outcomes and no accept → `rejected_false_friend`. Else → `unresolved`.
7. **Never invent** Persistent-Sol or OpenAI Astra Q-ids; absence is correct → hygiene keeps using `x-hygiene` regex; Wikidata only blocks wrong-entity pollution.
8. Cache key = normalized seed; TTL 24h under `artifacts/sage/wikidata-cache/<seed>.json`.
9. Emit `WikidataDenyHint` per wire schema; attach to `ingest-last.json` → `wikidata` block for hygiene consumers / optional `bannedNounsIn` alias feed.

**Case:** compare with `toLowerCase()`; do not fuzzy-match single-token seeds (`Sol`, `Astra`) via substring into unrelated labels.

---

## Fixture expectations (for Coder tests)

| Case | Expect |
|------|--------|
| Search `Persistent Sol` → `Q34104679` | `rejected_false_friend` |
| Search `Astra` → `Q731938` AstraZeneca | `rejected_false_friend` |
| Search `Hugging Face` → `Q108943604` | `matched` |
| Search `METR` alone | metre-class reject / unresolved — use full name seed |
| Search `Model Evaluation and Threat Research` → `Q135185153` | `matched` |
| Search `Project Zero` without allowlist | may hit Fatal Frame — allowlist forces `Q18859887` or reject games |
| Any success path | `briefEligible: false`, `denyGroundingOnly: true` |
| Empty UA / 403 / 429 | `soft_fail` |

---

## Locks reminder

- **Never Brief** · **never Pulse lead** · DENY / flatten / hygiene only  
- **No cycle `004`** · pins stay `003` / `hf-incident`  
- **Free only** · zero credentials · **S2 not wired** (429)  
- HF HTML deferred · Reddit blocked · paid X banned  
- Sol≠Astra: Wikidata rejects solar-Sol and AstraZeneca/cars; does **not** prove attacker identity  

