# PASS-A2 — analyst AI names vs company words (PR note)

Spec: refs/PASS-A2-ANALYST-NAMES.md (A2.1–A2.3 + A2.4 rulings, 7aa6cba). Branch `pass-a2`, base origin/main `2ab7d01`;
latest crawl commit on the base = `230e0e3` (crawl 2026-10-23T13:21:39Z).

## Split (fixed code lists)
- AI names (pass alone): lab RSS ids + anthropic, claude, openai, chatgpt, sora, codex, gpt-, deepmind, gemini, gemma,
  hugging face, xai, grok, llama, mistral, deepseek, qwen.
- Company words (need an ai_terms match; else `not-ai:company-only`): google, alphabet, nvidia, cuda, geforce, meta,
  alibaba, xiaomi, mimo (A2.4: MIMO is also a wireless term); microsoft, apple, amazon, samsung listed for
  classification only (never passed the old gate either).
- No new AI names (A2.4 ruling 3).

## A2.3 diff check (`bun desk/scripts/analyst-gate-diff.ts --cache <dir>`)
Cache source per A2.4 ruling 1 (`rss-analyst-cache/` is gitignored): fresh fetch + box caches.

| Input | Date | Output |
|---|---|---|
| Fresh fetch (simonw atom + latent.space feed, both HTTP 200) | 2026-10-23 20:13:18 TRT | `analyst-gate: base=230e0e3 kept_old=25 kept_new=25 dropped_company_only=0 newly_kept=0` |
| Box cache `/workspace/nexus-sage/desk/artifacts/sage/rss-analyst-cache` | files dated 2026-10-20 18:16 TRT | `analyst-gate: base=230e0e3 kept_old=23 kept_new=23 dropped_company_only=0 newly_kept=0` |
| Box cache `/workspace/nexus-sage-s1/desk/artifacts/sage/rss-analyst-cache` | files dated 2026-10-19 17:15 TRT | `analyst-gate: base=230e0e3 kept_old=25 kept_new=25 dropped_company_only=0 newly_kept=0` |

Dropped titles (kept → dropped): **none** in any input. `newly_kept = 0` everywhere.
Committed ANL rows (`desk/src/data/rss-analyst.ts`, 6 titles): all still kept ⇒ no desk-view parity fixture change.

## Gates
- Tests: 975 pass, 0 fail (fixtures 1–14 + A2.4 checks for mimo/cuda/hugging face).
- First Load: 180,246 B on base and branch (±0 B). config_hash unchanged `6dd1c3db6716`. desk-view --check in sync.
- overflow-390: OK (6 lanes + setup bay + setup editor). No page component, `ci/` or config diff.
- Also on this branch: overflow-390-check.ts accepts `?view=setup[&edit=1]` URLs (strips view/edit to the base page).
- Atom MIME: FYI only (A2.4) — Pages serves feed.xml as application/xml; no change.
