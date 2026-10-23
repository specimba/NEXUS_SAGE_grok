# PASS-A2 — Analyst AI-title check: split AI names from company words

Not related to the "A2 digest" pipeline; the name is the analyst-gate pass, round 2. One small Coder pass, built after PASS-N. Data-quality only: no page change, no CI config change, First Load ±0 B. Code push needs Canberk's go in Coder's chat; merge is Canberk's step; Reviewer verifies.

## Problem
`desk/src/lib/rss-analyst.ts` `ANALYST_KNOWN_NAMES` is built from LAB_FEEDS ids + `HEAT_COMPANIES` + `OTHER_LABS` regexes. The heat lists include plain company words (google, alphabet, nvidia, geforce, meta, alibaba, xiaomi, …), so an analyst title like "Google Docs gets a new outline view" or "GeForce driver 590 notes" passes `analystAiTitle` with no AI term and lands as an ANL row.

## A2.1 Split (fixed code lists, never config)
- `ANALYST_AI_NAMES`: names that are AI by themselves: lab RSS ids, AI-lab names (openai, anthropic, deepmind, mistral, deepseek, qwen, moonshot, minimax, xai, …) and model families (gpt, claude, gemini, llama, grok, gemma, phi, …). Pass on their own, as today.
- `ANALYST_COMPANY_WORDS`: general companies/products from the heat lists that are not AI-only (google, alphabet, nvidia, geforce, meta, microsoft, apple, amazon, alibaba, xiaomi, samsung, …). Pass **only if** the same title also matches `AI_TERMS` (config `keywords.ai_terms`).
- Every `HEAT_COMPANIES`/`OTHER_LABS` entry lands in exactly one list. A unit test fails if a heat entry is in neither or both. `google-ai` stays an AI name; bare `google` is a company word.
- `analystAiTitle(t) = AI_TERMS.test(t) || ANALYST_AI_NAMES.test(t)`. Company words then add nothing on their own and are kept only for the classification and the test. The drop reason for a company-only title is `not-ai:company-only` (new, distinct from `not-ai`).
- Lead rules are unchanged: an analyst-only story still can't be the lead (S1.1).
- AINews recap bypass is unchanged.

## A2.2 Fixtures (`desk/src/lib/__tests__/rss-analyst.test.ts`)
Kept (pass):
1. "Gemini 3 Flash pricing, tested" → AI name.
2. "Running Llama 4 on a laptop" → AI name.
3. "Nvidia's new inference chip for LLMs" → company + ai_terms (LLM).
4. "Google ships an AI agent for Sheets" → company + ai_terms.
5. "Anthropic's new usage limits" → AI lab name.
6. "Notes on DeepSeek V4.1-Flash" → AI lab name.
Dropped (`not-ai:company-only`):
7. "Google Docs gets a new outline view".
8. "GeForce driver 590 release notes".
9. "Meta's Q3 earnings call".
10. "Xiaomi 17 camera review".
11. "Alibaba Singles' Day numbers".
Edge:
12. "Metaprogramming in Rust": no match (word boundary, not `meta`), so `not-ai`.
13. Mixed case "NVIDIA GTC keynote: agents everywhere" → kept (ai_terms "agent").
14. Coverage test: every heat entry is in exactly one list.

## A2.3 Check on today's crawl (required in the PR note)
Script `bun desk/scripts/analyst-gate-diff.ts` (one-off check, not a CI step):
- Input: the cached analyst feeds in `artifacts/sage/rss-analyst-cache/` from the latest committed crawl on the branch base (note the crawl commit sha).
- Runs the old and new gates over the same entries and prints: `analyst-gate: base=<sha> kept_old=N kept_new=M dropped_company_only=K newly_kept=0`.
- Lists every title that changes from kept to dropped (title, feed, matched company word).
- **Pass:** `newly_kept = 0` (the new gate is never looser). Every dropped title is not about AI by plain reading; Reviewer spot-reads the list. If any dropped title is clearly AI news, add the missing term to the AI-name list (code) and rerun. Don't widen company words.
- If K = 0 on today's cache, also run it on the last 3 committed crawls and report all four counts.

## Acceptance
- Fixtures 1–14 green; full test suite green.
- Diff check output pasted in the PR note with the base sha.
- desk-view parity fixtures (ANL items) updated only where a fixture title is company-only, with the change listed.
- First Load unchanged, overflow-390 clean, no `.gitlab-ci.yml`/`ci/` or page-component diff.
- config_hash unchanged (no config key added).
