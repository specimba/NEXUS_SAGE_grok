/**
 * Beat 10 — topic heat (refs/UX-BEAT10-SINCE-HEAT.md). Pure helpers, no IO.
 * Per crawl: Pulse clusters per company (a cluster counts once per company it mentions).
 * Reviewer window rule: bars are 4h routine windows (02/06/10/14/18/22 Istanbul); one value per
 * window = the LAST crawl inside it; hand runs in one window collapse; empty windows are gaps
 * (null) — never zeros, never padding.
 */
export type CompanyId = "anthropic" | "openai" | "google" | "nvidia" | "hf" | "other";

/**
 * Cell 6 · OTHER LABS — ONE exported map. Entity word-boundary match on the headline, plus the lab's
 * own RSS feed where we crawl one. A cluster counts once for the cell even if it names several labs;
 * per-lab counts drive the dim "which labs" line.
 */
export const OTHER_LABS = {
  xai: { label: "xAI", re: /\b(xai|grok)\b/i, labs: [] as string[] },
  meta: { label: "Meta", re: /\bmeta\b(?!-)|\bllama\b(?!\.cpp)/i, labs: [] as string[] },
  mistral: { label: "Mistral", re: /\bmistral\b/i, labs: ["mistral"] },
  deepseek: { label: "DeepSeek", re: /\bdeepseek\b/i, labs: [] as string[] },
  qwen: { label: "Qwen", re: /\b(qwen|alibaba)\b/i, labs: [] as string[] },
  xiaomi: { label: "Xiaomi", re: /\b(xiaomi|mimo)\b/i, labs: [] as string[] },
} as const;
export type OtherLabId = keyof typeof OTHER_LABS;
const OTHER_IDS = Object.keys(OTHER_LABS) as OtherLabId[];

export const HEAT_COMPANIES: ReadonlyArray<{ id: CompanyId; label: string; filter: string; re: RegExp; labs: readonly string[] }> = [
  { id: "anthropic", label: "ANTHROPIC", filter: "anthropic", re: /\b(anthropic|claude)\b/i, labs: ["anthropic"] },
  { id: "openai", label: "OPENAI", filter: "openai", re: /\b(openai|chatgpt|sora|codex)\b|\bgpt-/i, labs: ["openai"] },
  { id: "google", label: "GOOGLE", filter: "google", re: /\b(google|deepmind|gemini|gemma|alphabet)\b/i, labs: ["deepmind", "google-ai", "google-research"] },
  { id: "nvidia", label: "NVIDIA", filter: "nvidia", re: /\b(nvidia|cuda|geforce)\b/i, labs: ["nvidia", "nvidia-dev"] },
  { id: "hf", label: "HF", filter: "hugging face", re: /\bhugging ?face\b/i, labs: ["huggingface"] },
  {
    id: "other",
    label: "OTHER LABS",
    filter: "other labs",
    re: new RegExp(OTHER_IDS.map((k) => OTHER_LABS[k].re.source).join("|"), "i"),
    labs: OTHER_IDS.flatMap((k) => OTHER_LABS[k].labs),
  },
];

export type HeatCounts = Record<CompanyId, number>;
export type LabCounts = Partial<Record<OtherLabId, number>>;
export type HeatCrawl = { crawl_at: string; counts: HeatCounts; labs?: LabCounts; source?: string };
export type HeatFile = { schema: 1; crawls: HeatCrawl[] };

type ClusterLike = { title: string; member_ids: readonly string[] };

/** Companies a cluster is about: headline match, or any member from that company's lab feed. */
export function clusterCompanies(c: ClusterLike): Set<CompanyId> {
  const out = new Set<CompanyId>();
  const labs = c.member_ids.filter((id) => id.startsWith("rss:")).map((id) => id.split(":")[1] ?? "");
  for (const co of HEAT_COMPANIES) if (co.re.test(c.title) || labs.some((l) => co.labs.includes(l))) out.add(co.id);
  return out;
}

const feedLabs = (c: ClusterLike) => c.member_ids.filter((id) => id.startsWith("rss:")).map((id) => id.split(":")[1] ?? "");

/** Which other labs a cluster is about (for the dim driver line). */
export function clusterOtherLabs(c: ClusterLike): OtherLabId[] {
  const feeds = feedLabs(c);
  return OTHER_IDS.filter((k) => OTHER_LABS[k].re.test(c.title) || feeds.some((f) => (OTHER_LABS[k].labs as readonly string[]).includes(f)));
}

export function countCompanies(clusters: readonly ClusterLike[]): HeatCounts {
  const counts: HeatCounts = { anthropic: 0, openai: 0, google: 0, nvidia: 0, hf: 0, other: 0 };
  for (const c of clusters) for (const id of clusterCompanies(c)) counts[id]++;
  return counts;
}

export function countOtherLabs(clusters: readonly ClusterLike[]): LabCounts {
  const out: LabCounts = {};
  for (const c of clusters) for (const k of clusterOtherLabs(c)) out[k] = (out[k] ?? 0) + 1;
  return out;
}

/** Dim line under OTHER LABS: top 2 contributing labs + "+N", e.g. "xAI · Xiaomi +1". */
export function driversLine(labs: LabCounts | null | undefined): string {
  if (!labs) return "";
  const ranked = (Object.entries(labs) as [OtherLabId, number][])
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1] || OTHER_IDS.indexOf(a[0]) - OTHER_IDS.indexOf(b[0]));
  const top = ranked.slice(0, 2).map(([k]) => OTHER_LABS[k].label).join(" · ");
  return ranked.length > 2 ? `${top} +${ranked.length - 2}` : top;
}

/** Upsert one crawl (same crawl_at replaces), oldest → newest, capped. */
export function upsertCrawl(file: HeatFile | null, crawl: HeatCrawl, cap = 120): HeatFile {
  const crawls = (file?.crawls ?? []).filter((c) => c.crawl_at !== crawl.crawl_at);
  crawls.push(crawl);
  crawls.sort((a, b) => Date.parse(a.crawl_at) - Date.parse(b.crawl_at));
  return { schema: 1, crawls: crawls.slice(-cap) };
}

const H = 3_600_000;
/** Window start (epoch ms). Istanbul is fixed UTC+3, so 02/06/…/22 Istanbul = 23/03/…/19 UTC. */
export function windowStart(ms: number): number {
  return Math.floor((ms + H) / (4 * H)) * 4 * H - H;
}
/** Istanbul hour label of a window start, "02" … "22". */
export function windowLabel(start: number): string {
  return String(new Date(start + 3 * H).getUTCHours()).padStart(2, "0");
}

export type HeatWindow = { start: number; label: string; crawl_at: string | null; counts: HeatCounts | null; labs?: LabCounts | null };

/** Last `n` windows ending at the window of `latestAt`, oldest first; missing windows are gaps. */
export function bucketWindows(crawls: readonly HeatCrawl[], latestAt: string, n = 6): HeatWindow[] {
  const last = windowStart(Date.parse(latestAt));
  const byWin = new Map<number, HeatCrawl>();
  for (const c of crawls) {
    const t = Date.parse(c.crawl_at);
    if (!Number.isFinite(t) || t > Date.parse(latestAt)) continue;
    const w = windowStart(t);
    const prev = byWin.get(w);
    if (!prev || Date.parse(prev.crawl_at) < t) byWin.set(w, c); // last crawl in the window wins
  }
  const out: HeatWindow[] = [];
  for (let k = n - 1; k >= 0; k--) {
    const start = last - k * 4 * H;
    const c = byWin.get(start);
    out.push({ start, label: windowLabel(start), crawl_at: c?.crawl_at ?? null, counts: c?.counts ?? null, labs: c ? (c.labs ?? null) : null });
  }
  return out;
}

export type HeatCell = {
  id: CompanyId;
  label: string;
  filter: string;
  /** One per window, oldest first; null = gap (no crawl in that window). */
  bars: (number | null)[];
  current: number | null;
  /** vs the immediately previous window; null when either side is a gap. */
  delta: number | null;
  hot: boolean;
  /** OTHER LABS only: labs that drove the latest window's count. */
  drivers?: string;
};

export function heatCells(windows: readonly HeatWindow[]): HeatCell[] {
  const cells = HEAT_COMPANIES.map((co): HeatCell => {
    // A record without this company's field (older schema) is a gap, never a padded zero.
    const bars = windows.map((w) => (w.counts ? (w.counts[co.id] ?? null) : null));
    const current = bars[bars.length - 1] ?? null;
    const prev = bars.length > 1 ? bars[bars.length - 2]! : null;
    return { id: co.id, label: co.label, filter: co.filter, bars, current, delta: current != null && prev != null ? current - prev : null, hot: false,
      ...(co.id === "other" ? { drivers: driversLine(windows[windows.length - 1]?.labs) } : {}) };
  });
  const ranked = cells
    .filter((c) => c.current != null && c.current > 0)
    .sort((a, b) => b.current! - a.current! || (b.delta ?? 0) - (a.delta ?? 0));
  if (ranked[0]) ranked[0].hot = true;
  return cells;
}

export function realWindows(windows: readonly HeatWindow[]): number {
  return windows.filter((w) => w.counts).length;
}

export function heatLabel(windows: readonly HeatWindow[]): string {
  const n = realWindows(windows);
  return n >= windows.length ? `HEAT · ${windows.length} windows` : `HEAT · ${n}/${windows.length} windows`;
}

export function deltaText(d: number | null): string {
  if (d == null) return "";
  if (d > 0) return `▲${d}`;
  if (d < 0) return `▼${-d}`;
  return "=";
}

/** Heat-cell filter: when the / filter is exactly a company's filter word, match by company (same rule as the counts). */
export function companyFilterMatch(q: string, c: ClusterLike | undefined): boolean {
  if (!c) return false;
  const needle = q.trim().toLowerCase();
  const co = HEAT_COMPANIES.find((x) => x.filter === needle);
  return !!co && clusterCompanies(c).has(co.id);
}
