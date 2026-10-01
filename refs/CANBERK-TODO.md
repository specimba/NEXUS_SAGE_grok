# CANBERK-TODO — your part of the Cloudflare deploy

Source: §6 of `refs/DEPLOY-FREE-LIVE.md` and the R2 amendment. Repo visibility is settled (public, Sep 25), so that step is gone.
Type every key directly into Cloudflare, encrypted and production only. Don't paste any key into chat. The one we need on the box comes through a secure field.
Blocked until this is done: B5–B13 (going live, votes, curator).

1. **Cloudflare account (free):** sign up, then install the "Cloudflare Workers & Pages" GitHub app with **Only select repositories = `specimba/NEXUS_SAGE_grok`**.
2. **Pages project:** Workers & Pages → Create → Pages → connect `NEXUS_SAGE_grok`. Production branch `main`, root directory `desk`, framework preset **None**, build command `bash scripts/cf-build.sh`, output directory `out`. Add the variable `BUN_VERSION` = `1.2.15`. Then tell us the `<project>.pages.dev` name.
3. **Zero Trust login:** Zero Trust → choose a team name → **Free** plan (it may ask for a card; the plan stays $0). Login methods: **One-time PIN**.
4. **Access app, production:** Access → Applications → Self-hosted, domain `<project>.pages.dev`. Policy **Allow**, Include **Emails** = your address only. Session 24h.
5. **Access app, previews:** the same thing again for `*.<project>.pages.dev`. Pages' built-in toggle covers previews only, so production needs step 4 as its own app. Send us the **Application Audience (AUD) tag** and the team domain (`<team>.cloudflareaccess.com`). Neither is secret.
6. **D1:** Storage → D1 → Create database `sage`. Then Pages project → Settings → Bindings → D1, variable name `DB`, database `sage`.
7. **R2 (build state):** R2 → Create bucket `sage-state` (enabling R2 may ask for a card; free up to 10 GB). Then R2 → Manage API tokens → **Object Read & Write**, limited to bucket `sage-state`. Save it in the Pages variables (encrypted) as `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY`.
8. **Cloudflare API token:** My Profile → API Tokens → Custom. Permission **Account · D1 · Read** only, on your account only, with an expiry date. Save it as `CF_API_TOKEN`, and save the account ID as `CF_ACCOUNT_ID` (both encrypted).
9. **GitHub token (rotate the old one):** fine-grained token, **Only `specimba/NEXUS_SAGE_grok`**, permission **Contents: Read and write** (nothing else), expiry 90 days. Put it in Pages as `GH_PUSH_TOKEN`, give it to Coder through the secure field for my computer's crawl, then **revoke the old token**.
10. **Vyce key:** create a key named `nexus-sage-build`, **Spend limit $1/day** and **Rate limit 10 req/min**. Save it in Pages as `VYCE_API_KEY` (encrypted, production only). We'll confirm the model IDs from the build log.
11. **Deploy hook + cron Worker (after Coder ships `ops/cf-cron/`):** Pages → Settings → Builds → Add deploy hook `sage-cron` on branch `main`. Create the Worker `sage-cron` from that code, add the hook URL as the Worker **secret** `DEPLOY_HOOK_URL` (never in git or chat), and set the Cron Trigger to `11 3,7,11,15,19,23 * * *` (UTC, which is 06:11–02:11 Istanbul).

When 1–10 are done, tell Grok Bot. The team runs B5's private-window check and the first `SHADOW=1` cloud run. My computer's crawl keeps running until two cloud runs in a row are green.
