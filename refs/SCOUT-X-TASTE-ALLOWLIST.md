# Scout — X session taste keyword allowlist

**Audience:** Coder · Reviewer · Architect  
**Date:** 2026-09-07 · Scout Gürok worker · NEXUS SAGE  
**Status:** **ALLOWLIST ONLY** — not a GO to scrape. Session path waits **A2 WROTE stamp** + **Architect APPROVE** wire (`WIRE-X-SESSION-TASTE.md`).  
**Locks:** cycle `003` · lead `hf-incident` · Sol≠Astra · no `004` · free only for HTTP wires · `briefEligible:false` · `pulseLeadEligible:false` on **all** taste hits

---

## 1. Purpose + locks

Operator-taste filter for Canberk’s **already-logged-in VM X** surfaces (bookmarks · likes · home/Following). Match Gürok scouting priorities: frontier models, agent tooling, HF/open-source, safety/policy/cyber, narrative shifts.

| Path | Status |
|------|--------|
| Paid X API / bearer / Ads / `api.x.com` | **DENY** (unchanged) |
| Bluesky | **DENY** (unchanged) |
| Cookie → token / Nitter / scrape farms | **DENY** |
| Session X read-only taste (this allowlist) | **CANDIDATE** after A2 + Architect APPROVE |
| Taste → Brief pin / Pulse lead | **NEVER** |

**Hard:** never Brief lead · never pulse lead · never write on X · never invent Brief pins · cap ~5–8 cards · Istanbul weekday window later.

---

## 2. INCLUDE allowlist

Case-insensitive. OR across all include terms. Prefer word-boundary (`\b`) for short/ambiguous tokens marked ★.

### A. Frontier labs / models (~22)

| Term | Notes |
|------|-------|
| OpenAI | lab |
| Anthropic | lab |
| DeepMind | lab |
| Google DeepMind | lab phrase |
| Google AI | lab |
| Meta AI | lab |
| xAI | lab ★ |
| Mistral | lab |
| Cohere | lab |
| Hugging Face | lab / hub |
| HuggingFace | alt spelling |
| GPT-5 | model family |
| GPT-6 | model family |
| GPT-6 Astra | companion lock — still taste-ok; never Brief from taste |
| Claude | model ★ (word-bound) |
| Gemini | model ★ |
| Llama | model / Meta ★ |
| Grok | model ★ (taste context; not firehose) |
| o1 | model ★ |
| o3 | model ★ |
| frontier model | phrase |
| foundation model | phrase |

### B. Agent / dev tooling (~18)

| Term | Notes |
|------|-------|
| coding agent | phrase |
| AI agent | phrase |
| agentic | |
| tool use | phrase |
| computer use | phrase |
| MCP | Model Context Protocol ★ |
| Claude Code | product |
| Codex | OpenAI coding ★ |
| Cursor | IDE agent ★ |
| Devin | agent product |
| OpenHands | OSS agent |
| Aider | OSS agent |
| SWE-bench | eval |
| SWE-agent | agent |
| function calling | phrase |
| multi-agent | phrase |
| browser agent | phrase |
| autonomous agent | phrase |

### C. HF / open-source (~16)

| Term | Notes |
|------|-------|
| open weights | phrase |
| open-weight | phrase |
| open source LLM | phrase |
| open-source model | phrase |
| daily papers | HF |
| LoRA | ★ |
| QLoRA | ★ |
| fine-tune | / finetune |
| Transformers | HF lib (case-insensitive) |
| Gradio | |
| HF Spaces | / Spaces demo |
| vLLM | ★ |
| llama.cpp | |
| GGUF | ★ |
| MLX | Apple ML ★ |
| TRL | HF train ★ |

### D. Safety / policy / cyber (~14)

| Term | Notes |
|------|-------|
| alignment | AI safety |
| preparedness | OpenAI framework |
| red team | / red-team |
| model eval | phrase |
| evals | LLM evals ★ |
| jailbreak | **news/policy only** — see EXCLUDE exploit how-to |
| AI safety | phrase |
| responsible AI | phrase |
| Project Zero | Google ★ |
| Trail of Bits | ToB |
| cybersecurity | / cyber security |
| RCE | research/incident context ★ |
| supply chain | security phrase |
| model card | |

### E. Narrative / news verbs + signals (~12)

| Term | Notes |
|------|-------|
| launches | narrative |
| releases | narrative |
| announces | narrative |
| ships | product ship ★ (word-bound) |
| preprint | papers |
| arXiv | papers |
| breakthrough | hype filter still applies via EXCLUDE spam |
| leaderboard | benchmarks |
| benchmark | |
| weights drop | open release slang |
| system card | safety docs |
| preparedness framework | phrase |

**INCLUDE count:** **82** terms (groups A–E). Practical target met (~40–80+). Coder may trim low-signal verbs if feed noise high.

---

## 3. EXCLUDE / DENY filters

If **any** exclude hits (after include OR), **drop** the card. Case-insensitive.

### Politics-only / culture war (~5)

| Term |
|------|
| election 202 |
| congress hearing AI ban-only |
| culture war |
| partisan rant |
| vote blue / vote red (standalone politics) |

*(Coder: drop posts whose **only** signal is electoral politics with no lab/model/agent/safety keyword from INCLUDE.)*

### Crypto / spam (~6)

| Term |
|------|
| pump.fun |
| memecoin |
| $AI token |
| airdrop |
| NFT mint |
| get rich with AI |

### NSFW / blocked tags (align `TAG_BLOCK`) (~7)

| Term |
|------|
| hotwoman |
| furry |
| furryart |
| kemono |
| aiart |
| #ai art only |
| NSFW |

### Bluesky / paid-API / wrong-path promo (~5)

| Term |
|------|
| follow me on Bluesky |
| bsky.app |
| X API bearer |
| api.x.com |
| Twitter Ads API |

### Exploit how-to / unscoped malice (~6)

| Term |
|------|
| step-by-step exploit |
| PoC exploit download |
| how to jailbreak ChatGPT for malware |
| zero-day drop paste |
| credential dump |
| cookie stealer |

**EXCLUDE count:** **29** terms/phrases.

Also inherit desk hygiene: `bannedNounsIn` · `detectFlatten` (Sol≠Astra) · rumor tags do **not** become Brief pins.

---

## 4. Match rules

1. Normalize text: NFC · lowercase · strip URLs for keyword scan (keep `href` separately).  
2. **INCLUDE:** case-insensitive match; use `\b` word-boundary for ★ short tokens (`MCP`, `o1`, `o3`, `Claude`, `Gemini`, `Llama`, `Grok`, `xAI`, `LoRA`, `vLLM`, `GGUF`, `MLX`, `TRL`, `RCE`, `evals`, `Codex`, `Cursor`, `ships`). Multi-word phrases = substring / phrase match.  
3. Combine: `(any INCLUDE hit) AND NOT (any EXCLUDE hit)`.  
4. Optional secondary: run `classifyPost` — `flatten` / hard DENY → drop; `rumor` may still appear as taste with flags, never Brief.  
5. Sort hint (UX): bookmark > like > feed when same keyword strength.  
6. Cap visible **5–8**; rest behind “more taste” fold.

---

## 5. Output schema hint (Coder)

```ts
type XTasteHit = {
  source: "bookmark" | "like" | "feed";
  text: string;
  href?: string;
  handle?: string;
  at?: string; // ISO if available
  matchedKeywords: string[];
  briefEligible: false;      // ALWAYS false
  pulseLeadEligible: false;  // ALWAYS false
};
```

Write path (when APPROVED): `artifacts/sage/x-taste-last.json` (+ soft-fail stamp in ingest-last). Dual-home pack optional — do not invent.

---

## 6. Cap + soft empty behavior

| Case | Behavior |
|------|----------|
| ≥1 include hits after exclude | Emit ≤8 cards · stamp ok |
| Zero hits / quiet session | Soft empty — **no fake AI news** · UX: “session quiet / login wall” |
| Login wall / challenge | Stamp **skipped** · desk still boots |
| Over-match firehose | Cap 5–8 · prefer bookmark > like > feed |

Istanbul **weekday** window only (same spirit as A1–A3) — not overnight ticker.

---

## 7. Explicit non-GO

> This file is the **keyword allowlist** for session taste **after** A2 unattended **WROTE** stamp and **Architect APPROVE** of `WIRE-X-SESSION-TASTE.md`.  
> It is **not** authorization to scrape now.  
> Paid X API remains **DENY**. Bluesky remains **DENY**.  
> Session taste ≠ hydrate ≠ Brief lead ≠ pulse lead.

**Reviewer FAIL reminders:** cookie→token · Brief pollution · write actions on X · unscoped scrape · inventing `004` · flipping lead off `hf-incident` · Bluesky affordance · paid-API chrome as “enabled.”

---

**Scout:** Gürok worker · include **82** · exclude **29** · 2026-09-07
