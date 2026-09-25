/**
 * B3 · per-source crawl table for scripts/cf-build.sh (Pages build log). Reads ingest-last.json →
 * crawl_sources[] (rows, status, ms) written by scripts/ingest.ts; flags any 0-row source as
 * THROTTLED? (cloud IPs get rate-limited). Older ingest-last.json without crawl_sources[] falls back to
 * the legacy per-source blocks (counts + ok/soft_fail, no timings). Pure; no IO.
 */
export type TableRow = { id: string; label: string; status: string; rows: number | null; ms: number | null; note: string; flag: "" | "THROTTLED?" | "PAUSED" };

type Src = { id?: string; label?: string; status?: string; rows?: number; duration_ms?: number; reason?: string | null; paused_until?: string | null };
type Legacy = Record<string, { ok?: boolean; soft_fail?: boolean; soft_fail_reason?: string | null; count?: number; items?: number; enriched?: number; shelf?: number; searches?: number } | undefined>;

/** Legacy block → rows metric (what each source actually yielded). */
const LEGACY: ReadonlyArray<[id: string, label: string, key: string, metric: "count" | "items" | "enriched" | "shelf" | "searches"]> = [
  ["hf", "HF", "hf", "count"],
  ["arxiv", "arXiv", "arxiv", "enriched"],
  ["openalex", "OpenAlex", "openalex", "enriched"],
  ["crossref", "Crossref", "crossref", "enriched"],
  ["hn", "HN", "hn", "count"],
  ["rss_labs", "lab RSS", "rss", "count"],
  ["rss_security", "sec RSS", "rss_security", "count"],
  ["gnews", "Google News", "google_news", "items"],
  ["github", "GitHub", "github", "shelf"],
  ["wikidata", "Wikidata", "wikidata", "searches"],
];

function flagOf(status: string, rows: number | null): TableRow["flag"] {
  if (status === "paused") return "PAUSED";
  return rows === 0 ? "THROTTLED?" : "";
}

export function crawlTableRows(ingestLast: unknown): { rows: TableRow[]; legacy: boolean } {
  const d = (ingestLast ?? {}) as { crawl_sources?: Src[] } & Legacy;
  if (Array.isArray(d.crawl_sources) && d.crawl_sources.length) {
    return {
      legacy: false,
      rows: d.crawl_sources.map((s) => {
        const status = s.status ?? "?";
        const rows = Number.isFinite(s.rows) ? Number(s.rows) : null;
        const note = status === "paused" ? `until ${s.paused_until ?? "?"}` : (s.reason ?? "");
        return { id: s.id ?? "?", label: s.label ?? s.id ?? "?", status, rows, ms: Number.isFinite(s.duration_ms) ? Number(s.duration_ms) : null, note, flag: flagOf(status, rows) };
      }),
    };
  }
  const rows: TableRow[] = [];
  for (const [id, label, key, metric] of LEGACY) {
    const b = d[key];
    if (!b) continue;
    const status = b.ok ? "ok" : "fail";
    const n = b[metric];
    const r = Number.isFinite(n) ? Number(n) : null;
    rows.push({ id, label, status, rows: r, ms: null, note: b.soft_fail_reason ?? "", flag: flagOf(status, r) });
  }
  return { legacy: true, rows };
}

export function renderCrawlTable(ingestLast: unknown): string {
  const { rows, legacy } = crawlTableRows(ingestLast);
  const out = [`  ${"source".padEnd(13)} ${"status".padEnd(7)} ${"rows".padStart(5)} ${"ms".padStart(7)}  flag / note`];
  for (const r of rows)
    out.push(
      `  ${r.label.padEnd(13)} ${r.status.padEnd(7)} ${(r.rows ?? "—").toString().padStart(5)} ${(r.ms ?? "—").toString().padStart(7)}  ${[r.flag, r.note].filter(Boolean).join(" · ")}`.trimEnd(),
    );
  const t = rows.filter((r) => r.flag === "THROTTLED?").map((r) => r.label);
  out.push(`  ${rows.length} sources · ${t.length ? `THROTTLED? ${t.join(", ")}` : "no 0-row sources"}${legacy ? " · legacy ingest-last (no crawl_sources[], no timings)" : ""}`);
  return out.join("\n");
}
