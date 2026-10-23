/**
 * PASS-F2.2d — Hugging Face model sources (refs/PASS-F2-FRESH-TLDR-PLAIN.md). Free HF API, no auth.
 *   hf-trending   models?sort=trendingScore&limit=20 → created in the last 72 h AND org on HF_TREND_ORGS (fixed code
 *                 allowlist of known labs; random fine-tunes drop) → ≤ HF_TRENDING_CAP rows per crawl, HF chip.
 *   hf-<org>      models?author=<org>&sort=createdAt&limit=10 for HF_RELEASE_ORGS → only repos not yet in
 *                 releases-seen.json (`hf_repos`; first run seeds, no emit) → REL chip. Nvidia: pipeline_tag required,
 *                 dataset/tool-looking repos dropped, ≤ HF_NVIDIA_CAP per crawl.
 * Rows ride the PASS-S1.3 release lane (id `rel:…`): Pulse only, never the lead, never count toward the Wire's 2-source rule.
 * Soft-fail per request; a failed request reuses the last-good rows from releases-seen.json (`hf_last`), crawl continues.
 * The API list has no lastModified field without `full=true`, so the 72 h window reads `createdAt` (PR note).
 * Pure decisions + one fetch helper; IO (seen file) lives in scripts/ingest.ts.
 */
export const HF_API = "https://huggingface.co/api/models";
export const HF_TRENDING_URL = `${HF_API}?sort=trendingScore&limit=20`;
export const hfOrgUrl = (org: string) => `${HF_API}?author=${encodeURIComponent(org)}&sort=createdAt&limit=10`;
export const HF_TRENDING_CAP = 3;
export const HF_NVIDIA_CAP = 2;
export const HF_TREND_WINDOW_H = 72;
/** Org releases tracked (refs: moonshotai, nvidia ≤2, tencent). */
export const HF_RELEASE_ORGS = ["moonshotai", "nvidia", "tencent"] as const;
export type HfOrg = (typeof HF_RELEASE_ORGS)[number];
/** Known labs whose trending models may surface (fixed code list; edit here only). */
export const HF_TREND_ORGS: readonly string[] = [
  "moonshotai", "nvidia", "tencent", "Qwen", "deepseek-ai", "meta-llama", "google", "openai", "mistralai", "microsoft",
  "ibm-granite", "allenai", "HuggingFaceTB", "zai-org", "MiniMaxAI", "black-forest-labs", "stabilityai", "apple",
  "baidu", "xai-org", "nousresearch", "LiquidAI", "ByteDance-Seed", "XiaomiMiMo", "openbmb", "THUDM", "internlm",
];
const TREND_ORGS = new Set(HF_TREND_ORGS.map((o) => o.toLowerCase()));

export type HfModel = { id: string; createdAt?: string; lastModified?: string; pipeline_tag?: string | null; tags?: string[] };
export type HfRow = {
  id: string;
  feed: "hf-trending" | `hf-${HfOrg}`;
  title: string;
  link: string;
  published: string;
  tag: string;
  source: "releases-atom";
  emitted_at: string;
  pulseEligible: true;
  briefEligible: false;
};
export type HfSeen = { repos: string[]; last: HfRow[] };

const iso = (ms: number) => new Date(ms).toISOString().replace(/\.\d{3}Z$/, "Z");
const orgOf = (id: string) => id.split("/")[0] ?? "";
const nameOf = (id: string) => id.split("/").slice(1).join("/") || id;
const timeOf = (m: HfModel) => Math.max(Date.parse(m.createdAt ?? "") || 0, Date.parse(m.lastModified ?? "") || 0);

function row(m: HfModel, feed: HfRow["feed"], now: number): HfRow {
  const t = timeOf(m) || now;
  return {
    id: `rel:${feed}:${m.id}`,
    feed,
    title: m.id, // the repo id as published — no generated text
    link: `https://huggingface.co/${m.id}`,
    published: iso(t),
    tag: nameOf(m.id),
    source: "releases-atom",
    emitted_at: iso(now),
    pulseEligible: true,
    briefEligible: false,
  };
}

/** Trending: allowlisted org, created/updated ≤ 72 h, ≤ 3, list order (trending score). */
export function pickTrending(models: readonly HfModel[], now: number): HfRow[] {
  return models
    .filter((m) => typeof m.id === "string" && TREND_ORGS.has(orgOf(m.id).toLowerCase()))
    .filter((m) => {
      const t = timeOf(m);
      return t > 0 && now - t <= HF_TREND_WINDOW_H * 3_600_000;
    })
    .slice(0, HF_TRENDING_CAP)
    .map((m) => row(m, "hf-trending", now));
}

/** Nvidia AI-model filter: a pipeline_tag is present, and the repo isn't a dataset / tool / export artefact. */
const NV_NOT_MODEL = /(dataset|datasets|toolkit|tool|sdk|export|benchmark|eval|demo|space)/i;
export function nvidiaIsModel(m: HfModel): boolean {
  if (!m.pipeline_tag) return false;
  if ((m.tags ?? []).some((t) => t === "dataset" || t.startsWith("dataset:"))) return false;
  return !NV_NOT_MODEL.test(nameOf(m.id));
}

/** Org releases: repos not yet seen (first run for an org seeds silently). Returns new rows + the updated seen list. */
export function pickOrgReleases(org: HfOrg, models: readonly HfModel[], seen: readonly string[], now: number): { rows: HfRow[]; seen: string[] } {
  const ids = models.map((m) => m.id).filter((x) => typeof x === "string");
  const known = new Set(seen);
  const seeded = seen.some((s) => orgOf(s) === org);
  const next = [...new Set([...seen, ...ids])];
  if (!seeded) return { rows: [], seen: next };
  let fresh = models.filter((m) => !known.has(m.id));
  if (org === "nvidia") fresh = fresh.filter(nvidiaIsModel).slice(0, HF_NVIDIA_CAP);
  return { rows: fresh.map((m) => row(m, `hf-${org}`, now)), seen: next };
}

export type HfFetch = (url: string) => Promise<HfModel[]>;

export async function fetchHfJson(url: string, fetchImpl: typeof fetch = fetch, timeoutMs = 10_000): Promise<HfModel[]> {
  const res = await fetchImpl(url, { headers: { accept: "application/json", "user-agent": "NEXUS-SAGE-desk/0.2 (free-ingest; hf-models)" }, signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const j = (await res.json()) as unknown;
  if (!Array.isArray(j)) throw new Error("not a list");
  return j as HfModel[];
}

export type HfResult = { rows: HfRow[]; seen: HfSeen; softFail: { lab: string; reason: string }[]; ok: boolean };

/**
 * One crawl. Each request soft-fails on its own; a failed feed reuses its last-good rows (`seen.last`) so the
 * crawl continues. `feeds` = enabled ids from config releases_atom.feeds (hf-trending, hf-moonshotai, …).
 */
export async function runHfModels(feeds: readonly string[], prev: HfSeen, get: HfFetch, now: number): Promise<HfResult> {
  const softFail: HfResult["softFail"] = [];
  const rows: HfRow[] = [];
  let repos = [...prev.repos];
  const lastOf = (feed: string) => prev.last.filter((r) => r.feed === feed);
  let okN = 0;
  if (feeds.includes("hf-trending")) {
    try {
      rows.push(...pickTrending(await get(HF_TRENDING_URL), now));
      okN++;
    } catch (e) {
      softFail.push({ lab: "hf-trending", reason: String((e as Error)?.message ?? e) });
      rows.push(...lastOf("hf-trending"));
    }
  }
  for (const org of HF_RELEASE_ORGS) {
    if (!feeds.includes(`hf-${org}`)) continue;
    try {
      const r = pickOrgReleases(org, await get(hfOrgUrl(org)), repos, now);
      repos = r.seen;
      rows.push(...(r.rows.length ? r.rows : lastOf(`hf-${org}`)));
      okN++;
    } catch (e) {
      softFail.push({ lab: `hf-${org}`, reason: String((e as Error)?.message ?? e) });
      rows.push(...lastOf(`hf-${org}`));
    }
  }
  // Same Pulse window as release rows: last-good rows older than 7 days fall off.
  const live = rows.filter((r) => now - (Date.parse(r.emitted_at) || 0) < 7 * 24 * 3_600_000);
  const uniq = [...new Map(live.map((r) => [r.id, r])).values()];
  return { rows: uniq, seen: { repos: repos.slice(-400), last: uniq }, softFail, ok: okN > 0 || feeds.every((f) => !f.startsWith("hf-")) };
}
