# SCOUT: 5 more free source candidates for `desk/config/sage-sources.json` (Oct 23)

**Scout:** Gürok · **Probed:** 2026-10-23 ~19:55–20:05 TRT (UTC+3) · **Method:** Python `urllib`, UA `Mozilla/5.0 (compatible; NexusSage-Scout/1.0)`, 20 s timeout, no auth/keys; parsed with ElementTree (RSS `item` / Atom `entry`) or JSON; newest `pubDate|published|updated` taken; "48h" = items newer than 2026-10-21 ~20:00 TRT.
**Scope:** doc only. `sage-sources.json` and registries NOT edited. All times TRT (UTC+3).

## 0. Excluded (already covered)

- Everything in `refs/SCOUT-SOURCES-OCT16.md` (top 15 **and** its "also probed" list: Zvi, Cloudflare, BleepingComputer, THN, TechCrunch AI, AWS ML, Lobsters `ai`, etc.).
- Registered in code: `rss-labs.ts` (openai news/blog, deepmind, google-ai, huggingface blog, mistral, nvidia, nvidia-dev, ms-research, google-research), `rss-security.ts` (trailofbits, fox-it, projectzero, embracethered), `hf_papers` (covers `huggingface.co/api/daily_papers`).

## 1. Scored table (5)

| # | Name | Lane | Type | URL | Fresh | Signal | Noise | Total | 48h proof item (TRT) | Loader caveat |
|---|------|------|------|-----|:-:|:-:|:-:|:-:|---|---|
| 1 | Palo Alto Unit 42 | sec | RSS | `https://unit42.paloaltonetworks.com/feed/` | 4 | 5 | 5 | **14** | 2026-10-22 20:15 · [eMudhra Intermediate CA Certificates Compromised](https://unit42.paloaltonetworks.com/emudhra-certificate-compromise/) | 24 KB, 15 items; clean. |
| 2 | The Decoder | labs/news | RSS | `https://the-decoder.com/feed/` | 5 | 4 | 4 | **13** | 2026-10-23 18:42 · [OpenAI CEO Sam Altman says advanced AI will inevitably escape its sandbox…](https://the-decoder.com/openai-ceo-sam-altman-says-advanced-ai-will-inevitably-escape-its-sandbox-and-only-alignment-can-save-us/) | 10 items, all 48h → ~5/day; AI-only outlet, partial gnews overlap. |
| 3 | OpenAI Codex releases | tooling | Atom (GitHub) | `https://github.com/openai/codex/releases.atom` | 5 | 4 | 3 | **12** | 2026-10-23 07:50 · [0.164.0](https://github.com/openai/codex/releases/tag/rust-v0.164.0) | 8/10 entries in 48h incl. alphas; needs `skip_prerelease` (drop `-alpha`). Fits Oct 16 `releases_atom` block. |
| 4 | SecurityWeek | sec | RSS | `https://www.securityweek.com/feed/` | 5 | 4 | 3 | **12** | 2026-10-23 15:45 · [Mirai Botnet Operators Join PHP2Shell Attacks as ASLR Bypass Exploits Emerge](https://www.securityweek.com/mirai-botnet-operators-join-php2shell-attacks-as-aslr-bypass-exploits-emerge/) | Only 10 newest items per fetch, all <48h → poll ≥2×/day or miss items. General security; filter for AI/agent/supply-chain. |
| 5 | Railway blog | sec (platform incidents) | RSS | `https://blog.railway.com/rss.xml` | 4 | 4 | 3 | **11** | 2026-10-22 03:46 · [Security Disclosure Recommendation: Check for Anomalous AWS Access](https://blog.railway.com/p/security-disclosure-recommendation-check-for-anomalous-aws-access) | **4.8 MB** (234 full-body items) → needs `streamCap`. Mostly product posts; keep only titles matching `security|disclosure|incident`. |

### Alternates (alive, fresh, not chosen)

| Name | URL | 48h item (TRT) | Note |
|------|-----|---|---|
| Phoronix | `https://www.phoronix.com/rss.php` | 10-23 19:27 HPFS removal | 25/48h, Linux-heavy; useful only for kernel CVEs (ksmbd). |
| Wiz blog | `https://www.wiz.io/feed/rss.xml` | 10-22 16:05 ARTEX in the Wild: Storm-0940 | 723 KB / 707 items, vendor marketing mixed in. |
| MarkTechPost | `https://www.marktechpost.com/feed/` | 10-23 09:05 Google Cloud Agent Compute Engine | High volume, rewrite-y. |
| Dark Reading | `https://www.darkreading.com/rss.xml` | 10-23 17:00 | Low AI density. |
| NVIDIA OpenShell releases | `https://github.com/NVIDIA/OpenShell/releases.atom` | 10-23 01:20 v0.1.6-pre.4 | Only prereleases in 48h. |

### Probed, didn't qualify

- **No item in 48h:** LiteLLM blog RSS (newest 10-21 13:00, incident post; 1.1 MB, worth adding later), GitLab security releases (10-21 03:00), LiteLLM/SGLang/transformers GitHub releases, Google safety-security blog (10-15).
- **404:** `thephp.foundation/blog/feed.xml`, `thephp.foundation/rss.xml`, `anthropic.com/rss.xml`, `anthropic.com/news/rss.xml` (Anthropic still has no first-party feed), `simonwillison.net/tags/ai-security.atom`.
- **406:** `github.com/advisories.atom` (needs different Accept / not a public feed).
- **Malformed:** `alphaxiv.org/feed` (returns HTML/invalid XML) → alphaXiv stays X/web-only.

## 2. Registry URLs for Coder (key → url)

```
unit42          https://unit42.paloaltonetworks.com/feed/          (sec_rss)
the-decoder     https://the-decoder.com/feed/                      (lab_rss)
codex           https://github.com/openai/codex/releases.atom      (releases_atom, skip_prerelease)
securityweek    https://www.securityweek.com/feed/                 (sec_rss, poll 2x/day)
railway         https://blog.railway.com/rss.xml                   (sec_rss, streamCap, title filter)
```
Same constraint as Oct 16: C2 validator rejects plain config keys, so each needs a registry entry in code first.
