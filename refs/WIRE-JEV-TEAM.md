# WIRE-OSS-ROUTER — Free local router (replaces priced TypeSafe Jev)

**Status:** PIVOT 2026-09-21 · **NO TypeSafe / no paid API key**  
**Was:** Jev System One (priced). **Now:** deterministic gates + open-source semantic routes on Agent Computer.  
**Owner:** Architect (contract) · Coder (lab) · Director (enforce) · Reviewer (gates)  
**NEXUS lock:** GO **1** Taste shelf Pulse-only · `briefEligible:false` · never lead. Router writes **zero** desk/Brief/Voice/`004`/P6 files.

---

## Why this is better than the tweet’s TypeSafe setup

| Priced Jev toy | Our OSS integration |
|----------------|---------------------|
| Billed Choice API | **$0** — local only |
| Needs `TYPESAFE_API_KEY` | **No key** |
| Every fork = API spend | Layer 0 gates skip most calls |
| Generic chief.py | C1–C3 + GO locks + quiet kill |

Stack (MIT / Apache OSS):
1. **Layer 0 — deterministic call gates** (pure Python, no model)  
2. **Layer 1 — [Aurelio semantic-router](https://github.com/aurelio-labs/semantic-router) local** · `HuggingFaceEncoder` (MiniLM) · static routes for C1/C2/C3  
3. Optional later: `semantic-router[local]` + tiny GGUF only if dynamic params needed — **HOLD** until Layer 1 proves gaps

Not using: TypeSafe · RouteLLM cloud · paid embeddings.

---

## Decision surface (unchanged)

- **C1** next worker: `director|architect|coder|reviewer|scout|ux|none`  
- **C2** continue: `continue|stop_quiet|escalate_canberk`  
- **C3** land class: `nexus_product|ops_only|team_tooling|reject` · `nexus_product` always escalates Canberk  

### Call gates (Layer 0 — prefer these; zero spend)
Skip Layer 1 when any true: GO quiet-until · single-bot ack · stamp/age-only · `enabled:false` / `bypass_jev` · FAIL suite already scheduled → code returns `stop_quiet` / `none`.

---

## Lab layout (Coder re-points)

```
/workspace/jev-lab/          # keep path; drop typesafe-sdk
  config.json                # enabled, mode shadow|active, bypass_jev, backend: "oss"
  router.py                  # Layer0 gates + semantic-router C1–C3
  dry_run.py                 # fixtures (no net if encoder cached)
  smoke_oss.py               # replace smoke_system_one.py
  logs/*.jsonl
```

Deps: `pip install "semantic-router[local]"` (or base + sentence-transformers). **Uninstall / ignore typesafe-sdk.**

Config: `backend: "oss"`, `mode: "shadow"`, `enabled: true`, `bypass_jev: false`.

---

## Phases

| Phase | Gate | Done when |
|-------|------|-----------|
| **1 Install OSS** | this pivot + Canberk OK | semantic-router local installed · smoke C1 fixture PASS · no TypeSafe |
| **2 Shadow** | after smoke | jsonl logs · bots ignore |
| **3 Active** | **GO active** + Reviewer | honor `stop_quiet`/`none` · kill switch proven |

---

## Reviewer gates

1. No TypeSafe key in env/repo/chat  
2. Logs: route · scores · mode · caller  
3. Kill switch zero model call  
4. Zero NEXUS product writes  
5. `stop_quiet` ⇒ no room spam  
6. Layer 0 skips quiet/stamp without encoder call when possible  

---

## Explicit cancel

- Secure `TYPESAFE_API_KEY` request: **CANCELLED**  
- `smoke_system_one.py` TypeSafe path: **DEAD** · replace with `smoke_oss.py`

---

**Architect stamp:** OSS-PIVOT 2026-09-21 — free local router · GO 1 Taste stays.
