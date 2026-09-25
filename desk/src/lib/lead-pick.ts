/**
 * Beat 7 scope add — daily Brief lead pick (replaces the static hf-incident Brief pin).
 * Picked once per Istanbul day by the FIRST crawl whose own start time is at/after 06:00
 * Europe/Istanbul on a date that has no pick yet (catch-up: a late-starting cron, e.g. 06:40, or a
 * missed 06 crawl followed by the 10/14 crawl still picks). A HELD date (nothing qualified) retries
 * on the next crawl that day. Never a second pick on a picked date (LEAD_PICK_FORCE=1 only lifts
 * the 06:00 gate); an explicit LEAD_PICK_REPICK=1 appends a superseding entry for the date. Sticky until the next day's pick. A lead whose story is
 * older than 24h renders as HELD on the Brief (leadIsStale), never as a stale lead.
 * Strongest = most independent publishers (self-repost counts 0) → higher SIG → newer.
 * Must pass the Wire gate (AI filter, never Taste/X, never briefEligible:false), age < 24h, ≥2 SRC.
 * Age = age of the group's EARLIEST member item (not the newest) — a late repost never refreshes
 * an old story. Extra rules plug in via `exclude` (a small predicate; none added by default).
 * Nothing qualifies ⇒ HELD: yesterday's lead carries over, Brief shows "HELD · no qualifying story".
 * Pure helpers; IO lives in scripts/rank-snapshot.ts (artifacts/sage/lead-history.json).
 */
import { investingNoiseReason, wireCandidates, type WireCluster, type WireOpts } from "@/lib/wire";


export const LEAD_PICK_HOUR = 6; // first crawl starting at/after 06:00 Europe/Istanbul picks
export const LEAD_MAX_AGE_H = 24;
export const LEAD_MIN_SOURCES = 2;

export type LeadEntry = {
  /** Istanbul calendar date of the pick, YYYY-MM-DD. */
  date: string;
  cluster_id: string | null;
  headline: string;
  url: string | null;
  sources: number;
  sig: number | null;
  reason: "picked" | "held" | "seed";
  note?: string;
  at: string;
  crawl_at: string;
  forced?: true;
  /** Picked by a crawl that started after the 06 slot (06:00–06:59) — the 06 crawl missed. */
  catch_up?: true;
  /** Crawl start time used for the pick decision (falls back to the crawl stamp). */
  crawl_started_at?: string;
  /** Earliest member item of the picked story — drives the Brief's 24h stale → HELD rule. */
  first_at?: string;
  /** Forced re-pick on a date that already had one: the cluster it replaced. */
  supersedes?: string | null;
  /** Wire-eligible (≥2 SRC) groups ruled out as lead at this pick, with the reason (age>=24h, politics:…). */
  excluded?: { cluster_id: string; headline: string; reason: string }[];
};

export type LeadHistory = { schema: 1; entries: LeadEntry[] };

/** Built once — the first tz-aware Intl formatter is slow to construct (ICU tz data). */
let IST_FMT: Intl.DateTimeFormat | undefined;

function istanbulParts(iso: string): Record<string, string> {
  const t = Date.parse(iso);
  IST_FMT ??= new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const parts = IST_FMT.formatToParts(Number.isFinite(t) ? t : 0);
  return Object.fromEntries(parts.map((p) => [p.type, p.value]));
}

export function istanbulDate(iso: string): string {
  const p = istanbulParts(iso);
  return `${p.year}-${p.month}-${p.day}`;
}

export function istanbulHour(iso: string): number {
  return Number(istanbulParts(iso).hour);
}

/** Crawl START time is at/after 06:00 on its Istanbul date (no upper bound — catch-up). */
export function inPickWindow(crawlStartAt: string): boolean {
  return istanbulHour(crawlStartAt) >= LEAD_PICK_HOUR;
}

/** Lead story age in hours at `now` (earliest member item); null when unknown. */
export function leadAgeHours(firstAt: string | null | undefined, now: number): number | null {
  const t = Date.parse(firstAt ?? "");
  return Number.isFinite(t) ? (now - t) / 3_600_000 : null;
}

/** Brief rule: a lead older than 24h shows HELD instead of the stale story. */
export function leadIsStale(firstAt: string | null | undefined, now: number): boolean {
  const h = leadAgeHours(firstAt, now);
  return h != null && h >= LEAD_MAX_AGE_H;
}

/**
 * Partisan-politics lead exclusion (Architect): a mainly partisan-politics headline can NOT be
 * the lead but CAN stay on the Wire. Plain partisan-keyword test on the headline — word-boundary,
 * case-insensitive, no model. Edit this one list to widen/narrow it.
 */
export const POLITICS_LEAD_TERMS = [
  // Partisan words ONLY. Safety/policy stays lead-eligible: never add regulation, executive order,
  // bill, act, senate, law, governor, newsom, senator, congress, white house, election, campaign.
  "trump",
  "maga",
  "biden",
  "harris",
  "vance",
  "democrat(?:s|ic)?",
  "republicans?",
  "gop",
  "dnc",
  "rnc",
  "partisan",
] as const;

const POLITICS_RE = new RegExp(`\\b(?:${POLITICS_LEAD_TERMS.join("|")})\\b`, "i");

export function politicsLeadReason(title: string): string | null {
  const m = POLITICS_RE.exec(String(title ?? ""));
  return m ? `politics:${m[0].toLowerCase()}` : null;
}

export type LeadOpts = WireOpts & {
  /** member id → ISO time of that item (HN created_at, GNews/RSS published). */
  memberAt?: Record<string, string>;
  /** Extension point: return a reason string to rule a group out (e.g. a future topic rule). */
  exclude?: (c: WireCluster) => string | null;
};

/** Earliest known item time in the group (cluster `at` and every member's own time). */
export function groupFirstAt(c: Pick<WireCluster, "at" | "member_ids">, memberAt: Record<string, string> = {}): number {
  let first = Date.parse(c.at);
  for (const id of c.member_ids) {
    const t = Date.parse(memberAt[id] ?? "");
    if (Number.isFinite(t) && (!Number.isFinite(first) || t < first)) first = t;
  }
  return first;
}

/** Why a group can't be the lead (null = eligible on age/exclusion; Wire gate + SRC checked in leadCandidates). */
export function leadExcludeReason(c: WireCluster, now: number, opts: LeadOpts = {}): string | null {
  const first = groupFirstAt(c, opts.memberAt);
  if (!Number.isFinite(first)) return "no-time";
  if (now - first >= LEAD_MAX_AGE_H * 3_600_000) return "age>=24h";
  return politicsLeadReason(c.title) ?? investingNoiseReason(c.title) ?? opts.exclude?.(c) ?? null;
}

/** Ranked qualifying stories: Wire gate + earliest-item age < 24h + ≥2 independent sources; sources → SIG → newer. */
export function leadCandidates(clusters: WireCluster[], now: number, opts: LeadOpts = {}) {
  const byId = new Map(clusters.map((c) => [c.id, c]));
  return wireCandidates(clusters, opts)
    .filter((c) => c.sources >= LEAD_MIN_SOURCES)
    .filter((c) => leadExcludeReason(byId.get(c.id)!, now, opts) === null)
    .sort(
      (a, b) =>
        b.sources - a.sources ||
        (b.score ?? -1) - (a.score ?? -1) ||
        (Date.parse(b.at) || 0) - (Date.parse(a.at) || 0) ||
        a.id.localeCompare(b.id),
    );
}

export function entryFor(h: LeadHistory, date: string): LeadEntry | undefined {
  return [...h.entries].reverse().find((e) => e.date === date);
}

/** The lead on screen: the latest entry that names a story (held entries carry yesterday's). */
export function currentLead(h: LeadHistory): LeadEntry | null {
  return h.entries.length ? h.entries[h.entries.length - 1]! : null;
}

/** Yesterday line: latest entry dated before the current lead's date. */
export function yesterdayLead(h: LeadHistory): LeadEntry | null {
  const cur = currentLead(h);
  if (!cur) return null;
  return [...h.entries].reverse().find((e) => e.date < cur.date) ?? null;
}

export type PickDecision =
  | { action: "none"; why: "already-picked" | "outside-window" }
  | { action: "picked" | "held"; entry: LeadEntry };

export function decidePick(
  h: LeadHistory,
  clusters: WireCluster[],
  opts: LeadOpts & { crawlAt: string; at: string; force?: boolean; repick?: boolean; crawlStartedAt?: string },
): PickDecision {
  const startAt = opts.crawlStartedAt && Number.isFinite(Date.parse(opts.crawlStartedAt)) ? opts.crawlStartedAt : opts.crawlAt;
  const date = istanbulDate(startAt);
  const existing = entryFor(h, date);
  // A picked (or seeded) date never picks twice; a HELD date retries on the next crawl that day.
  if (existing && existing.reason !== "held" && !opts.repick) return { action: "none", why: "already-picked" };
  const force = !!(opts.force || opts.repick);
  if (!force && !inPickWindow(startAt)) return { action: "none", why: "outside-window" };
  const now = Date.parse(opts.crawlAt);
  const top = leadCandidates(clusters, now, opts)[0];
  const byId = new Map(clusters.map((c) => [c.id, c]));
  const excluded = wireCandidates(clusters, { ...opts, keepNoise: true })
    .filter((c) => c.sources >= LEAD_MIN_SOURCES)
    .map((c) => ({ cluster_id: c.id, headline: c.title, reason: leadExcludeReason(byId.get(c.id)!, now, opts) }))
    .filter((e): e is { cluster_id: string; headline: string; reason: string } => e.reason !== null);
  const base = {
    date,
    at: opts.at,
    crawl_at: opts.crawlAt,
    ...(force ? { forced: true as const } : {}),
    ...(!force && istanbulHour(startAt) > LEAD_PICK_HOUR ? { catch_up: true as const } : {}),
    ...(opts.crawlStartedAt && startAt !== opts.crawlAt ? { crawl_started_at: startAt } : {}),
    ...(existing && opts.repick ? { supersedes: existing.cluster_id } : {}),
    ...(excluded.length ? { excluded } : {}),
  };
  if (top) {
    const first = groupFirstAt(byId.get(top.id)!, opts.memberAt);
    return {
      action: "picked",
      entry: {
        ...base,
        cluster_id: top.id,
        headline: top.title,
        url: top.url,
        sources: top.sources,
        sig: top.score,
        reason: "picked",
        ...(Number.isFinite(first) ? { first_at: new Date(first).toISOString() } : {}),
      },
    };
  }
  if (existing?.reason === "held" && !force) return { action: "none", why: "already-picked" }; // still nothing: keep the one HELD entry
  const prev = currentLead(h);
  return {
    action: "held",
    entry: {
      ...base,
      cluster_id: prev?.cluster_id ?? null,
      headline: prev?.headline ?? "",
      url: prev?.url ?? null,
      sources: prev?.sources ?? 0,
      sig: prev?.sig ?? null,
      ...(prev?.first_at ? { first_at: prev.first_at } : {}),
      reason: "held",
      note: "no qualifying story",
    },
  };
}

export function applyPick(h: LeadHistory, d: PickDecision): LeadHistory {
  return d.action === "none" ? h : { schema: 1, entries: [...h.entries, d.entry] };
}

export function readLeadHistory(raw: unknown): LeadHistory {
  const j = raw as LeadHistory | null;
  return j && j.schema === 1 && Array.isArray(j.entries) ? j : { schema: 1, entries: [] };
}
