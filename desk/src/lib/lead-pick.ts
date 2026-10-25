/**
 * Beat 7 scope add — daily Brief lead pick (replaces the static hf-incident Brief pin).
 * Picked once per Istanbul day by the FIRST crawl whose own start time is at/after 06:00
 * Europe/Istanbul on a date that has no pick yet (catch-up: a late-starting cron, e.g. 06:40, or a
 * missed 06 crawl followed by the 10/14 crawl still picks). HELD never locks the date: while the
 * date's entry is HELD, EVERY crawl starting at/after 06:00 retries (no LEAD_PICK_REPICK); a retry that
 * still finds nothing updates the one HELD entry (attempts[] keeps each crawl's candidates + reasons).
 * The date locks only once a real lead is picked. Never a second pick on a picked date (LEAD_PICK_FORCE=1 only lifts
 * the 06:00 gate); an explicit LEAD_PICK_REPICK=1 appends a superseding entry for the date. Sticky until the next day's pick.
 * PASS-L: pick window 36h, two tiers (<24h first, then 24–36h); a picked lead is frozen from PICK time and only
 * renders HELD past 48h of story age (safety net). HELD retries run at slots starting 06:00–20:59 (GitLab: 11:11 and
 * the planned 16:11 recovery); a 21:11 crawl on a HELD date never picks.
 * Strongest = most independent publishers (self-repost counts 0) → higher SIG → newer.
 * Must pass the Wire gate (AI filter, never Taste/X, never briefEligible:false), age < 36h, ≥2 SRC.
 * Age = age of the group's EARLIEST member item (not the newest) — a late repost never refreshes
 * an old story. Extra rules plug in via `exclude` (a small predicate; none added by default).
 * Nothing qualifies ⇒ HELD: yesterday's lead carries over, Brief shows "HELD · no qualifying story".
 * Pure helpers; IO lives in scripts/rank-snapshot.ts (artifacts/sage/lead-history.json).
 */
import { investingNoiseReason, wireCandidates, type WireCluster, type WireOpts } from "@/lib/wire";
import { labBadge, publisherKey, selfRepostIds } from "@/lib/pulse-v5";
import { HEAT_COMPANIES, OTHER_LABS } from "@/lib/topic-heat";


export const LEAD_PICK_HOUR = 6; // first crawl starting at/after 06:00 Europe/Istanbul picks
/** PASS-L L1: candidates qualify under 36h old (earliest item). */
export const LEAD_MAX_AGE_H = 36;
/** PASS-L L1: tier split — under 24h ranks ahead of 24–36h (fallback tier kept). */
export const LEAD_TIER_AGE_H = 24;
/** PASS-F2.1c: a frozen lead picked more than 12 h ago is re-picked at any crawl… */
export const LEAD_REPICK_AFTER_H = 12;
/** …when a qualifying candidate under 12 h old exists (Wire gate, ≥2 independent publishers, usual exclusions). */
export const LEAD_FRESH_AGE_H = 12;
/** PASS-L L2: a picked lead renders HELD only once its story is older than 48h (safety net). */
export const LEAD_STALE_AGE_H = 48;
/** PASS-L L3: HELD retries only for crawls starting before 21:00 Istanbul (16:11 = last planned chance; 21:11 never retries). */
export const LEAD_RETRY_BEFORE_HOUR = 21;
export type LeadAgeBand = "<24h" | "24–36h";
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
  excluded?: LeadExcluded[];
  /** UX-1 clearance plate: label of the story's own (non-Google-News) publisher at pick time, e.g. "HN". */
  pub?: string;
  /** PASS-L L5: story age band at pick time. */
  age_band?: LeadAgeBand;
  /** PASS-L: Istanbul HH:MM of the crawl start that made this entry (pick slot). */
  pick_slot?: string;
  /** HELD entries only: every pick attempt on this date (first HELD + each ≥06:00 retry), with its ruled-out candidates. Beat 11 reads these. */
  attempts?: HeldAttempt[];
};

/**
 * One ruled-out candidate. UX-1 clearance plate crawl fields (optional; older history rows lack them): `sources` = N SRC,
 * `age_h` = whole hours of story age (earliest item) at the pick, `pub` = own-publisher label (absent = none / GNews only).
 */
export type LeadExcluded = { cluster_id: string; headline: string; reason: string; sources?: number; age_h?: number; pub?: string };

export type HeldAttempt = { at: string; crawl_at: string; crawl_started_at?: string; excluded: LeadExcluded[] };

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

/** PASS-L L2 safety net: a picked lead shows HELD only once its story is older than 48h (frozen from pick time otherwise). */
export function leadIsStale(firstAt: string | null | undefined, now: number): boolean {
  const h = leadAgeHours(firstAt, now);
  return h != null && h > LEAD_STALE_AGE_H;
}

/** PASS-L L5: `<24h` / `24–36h` band for an age in hours (null when unknown). */
export function leadAgeBand(ageH: number | null | undefined): LeadAgeBand | null {
  if (ageH == null || !Number.isFinite(ageH)) return null;
  return ageH < LEAD_TIER_AGE_H ? "<24h" : "24–36h";
}

export function istanbulHHMM(iso: string): string {
  const p = istanbulParts(iso);
  return `${p.hour}:${p.minute}`;
}

/** PASS-L L3: a HELD date retries only for crawls starting 06:00–20:59 (21:11 doesn't retry). */
export function inRetryWindow(crawlStartAt: string): boolean {
  const h = istanbulHour(crawlStartAt);
  return h >= LEAD_PICK_HOUR && h < LEAD_RETRY_BEFORE_HOUR;
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

let POLITICS_RE = new RegExp(`\\b(?:${POLITICS_LEAD_TERMS.join("|")})\\b`, "i");
/** PASS-C2: `keywords.politics_deny` override (crawl/rank only; validated). Default = POLITICS_LEAD_TERMS. */
export function configurePoliticsTerms(terms: readonly string[] = POLITICS_LEAD_TERMS): void {
  POLITICS_RE = new RegExp(`\\b(?:${terms.join("|")})\\b`, "i");
}

export function politicsLeadReason(title: string): string | null {
  const m = POLITICS_RE.exec(String(title ?? ""));
  return m ? `politics:${m[0].toLowerCase()}` : null;
}

/**
 * Beat 5 rule: Google News only CONFIRMS, never leads. A lead needs ≥1 independent publisher that did
 * not come through Google News (HN, lab/first-party RSS, security RSS, HF/arXiv paper…). GNews
 * publishers still count toward N SRC. Reason code recorded in lead-history `excluded[]`.
 */
export const GNW_ONLY = "GNW_ONLY";

/** Independent publisher keys in the group that did NOT arrive via Google News (self-reposts count 0). */
export function nonGnewsPublishers(
  c: Pick<WireCluster, "lead_id" | "member_ids" | "members" | "self_repost_ids">,
  publishers: Record<string, string> = {},
  members: Record<string, { publisher?: string }> = {},
): string[] {
  const selfIds = selfRepostIds(c);
  selfIds.delete(c.lead_id);
  const memberPub = new Map((c.members ?? []).map((m) => [m.id, (m as { publisher?: string | null }).publisher ?? null]));
  const out = new Set<string>();
  for (const id of [c.lead_id, ...c.member_ids]) {
    if (selfIds.has(id) || id.startsWith("gnews:")) continue;
    out.add(publisherKey(id, members[id]?.publisher ?? publishers[id] ?? memberPub.get(id)));
  }
  return [...out];
}

/** Short label for one own-publisher item id: HN, SEC, lab badge (rss:<lab>:…), GML, else the id prefix. */
export function pubLabel(id: string): string {
  if (id.startsWith("hn:")) return "HN";
  if (id.startsWith("rss-sec:")) return "SEC";
  if (id.startsWith("rss:")) return labBadge(id.split(":")[1] ?? "");
  if (id.startsWith("gmail:")) return "GML";
  return (id.split(":")[0] || id).toUpperCase();
}

/**
 * UX-1: label of the group's first own (non-Google-News, non-self-repost) publisher, lead item first; null = none.
 * PASS-S1: analyst (anl:) and release (rel:) items are never the own publisher (they can't make a lead either).
 */
export function ownPublisherLabel(c: Pick<WireCluster, "lead_id" | "member_ids" | "members" | "self_repost_ids">): string | null {
  const selfIds = selfRepostIds(c);
  selfIds.delete(c.lead_id);
  for (const id of [c.lead_id, ...c.member_ids]) if (!selfIds.has(id) && !/^(?:gnews|anl|rel):/.test(id)) return pubLabel(id);
  return null;
}

/**
 * PASS-S1.1 rule: analyst feeds (Simon Willison, Latent Space/AINews) CONFIRM a story and count toward N SRC, but a
 * lead needs ≥1 independent publisher that is neither an analyst nor Google News. Two analysts alone (Simon + an
 * AINews recap) can't make a lead. Reason code recorded in lead-history `excluded[]`.
 */
export const ANALYST_ONLY = "analyst-only";

/** PASS-S1.3: a release (rel:) never leads — reason code when a group is headed by a release row. */
export const RELEASE_LEAD = "release";

/**
 * PASS-S1.3: releases never lead and never lift a group to a lead — a release-headed group, or a group whose
 * ≥2-publisher count only holds by counting the release (github.com), is excluded with reason `release`.
 */
export function releaseLeadReason(
  c: Pick<WireCluster, "lead_id" | "member_ids" | "members" | "self_repost_ids">,
  publishers: Record<string, string> = {},
  members: Record<string, { publisher?: string }> = {},
): string | null {
  if (c.lead_id.startsWith("rel:")) return RELEASE_LEAD;
  if (!c.member_ids.some((id) => id.startsWith("rel:"))) return null;
  const pubs = new Set(nonGnewsPublishers(c, publishers, members).filter((k) => !k.startsWith("rel:")));
  for (const id of [c.lead_id, ...c.member_ids])
    if (id.startsWith("gnews:")) pubs.add(publisherKey(id, members[id]?.publisher ?? publishers[id]));
  return pubs.size < LEAD_MIN_SOURCES ? RELEASE_LEAD : null;
}

/** nonGnewsPublishers minus analyst publishers (`anl:<feed>`). */
export function nonAnalystPublishers(...args: Parameters<typeof nonGnewsPublishers>): string[] {
  return nonGnewsPublishers(...args).filter((k) => !k.startsWith("anl:"));
}

/**
 * Customer-deal announcements (LEAD only — they stay on the Wire and in Pulse): a deal verb AND a buying-side
 * subject (text before the verb) that is NOT a tracked lab / AI vendor. "BNP Paribas inks new Google Cloud
 * deal…" → filtered; "Anthropic signs compute deal with Google" → eligible. Never a plain keyword match.
 */
export const CUSTOMER_DEAL = "noise:customer-deal";
const DEAL_VERB_RE =
  /\b(?:inks?|inked|signs?|signed|strikes?|struck|forges?|forged|seals?|sealed|clinch(?:es|ed)?)\b(?=[^.;:]{0,80}?\b(?:deal|partnership|agreement|pact|contract)s?\b)|\bselect(?:s|ed)\b|\btaps?\b|\btapped\b|\bexpand(?:s|ed)?\b(?=[^.;:]{0,40}?\bpartnership\b)/i;
/** Tracked labs / AI vendors (Beat 10 heat set + Other labs + Microsoft). */
export const AI_VENDOR_RES: readonly RegExp[] = [
  ...HEAT_COMPANIES.map((c) => c.re),
  ...Object.values(OTHER_LABS).map((l) => l.re),
  /\bmicrosoft\b/i,
];

export function customerDealReason(title: string): string | null {
  const t = String(title ?? "");
  const m = DEAL_VERB_RE.exec(t);
  if (!m) return null;
  const subject = t.slice(0, m.index).trim();
  if (!subject) return null; // no named buyer ("Signs of…", "Taps…") → not a customer-deal headline
  return AI_VENDOR_RES.some((re) => re.test(subject)) ? null : CUSTOMER_DEAL;
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
  if (now - first >= LEAD_MAX_AGE_H * 3_600_000) return "age>=36h";
  // Title rules first (most specific reason for Beat 11), then the Beat 5 structural rule.
  return (
    politicsLeadReason(c.title) ??
    investingNoiseReason(c.title) ??
    customerDealReason(c.title) ??
    (nonGnewsPublishers(c, opts.publishers, opts.members).length === 0 ? GNW_ONLY : null) ??
    (nonAnalystPublishers(c, opts.publishers, opts.members).length === 0 ? ANALYST_ONLY : null) ??
    releaseLeadReason(c, opts.publishers, opts.members) ??
    opts.exclude?.(c) ??
    null
  );
}

/** Ranked qualifying stories: Wire gate + earliest-item age < 36h + ≥2 independent sources + ≥1 non-GNews publisher; tier (<24h, then 24–36h) → sources → SIG → newer. */
export function leadCandidates(clusters: WireCluster[], now: number, opts: LeadOpts = {}) {
  const byId = new Map(clusters.map((c) => [c.id, c]));
  const tier = (id: string) => (now - groupFirstAt(byId.get(id)!, opts.memberAt) < LEAD_TIER_AGE_H * 3_600_000 ? 0 : 1);
  return wireCandidates(clusters, opts)
    .filter((c) => c.sources >= LEAD_MIN_SOURCES)
    .filter((c) => leadExcludeReason(byId.get(c.id)!, now, opts) === null)
    .sort(
      (a, b) =>
        tier(a.id) - tier(b.id) ||
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

/** UX-1: Istanbul date of the latest real pick (picked or seed; never a HELD entry) — the HELD card's "last pick". */
export function lastPickDate(h: LeadHistory): string | null {
  return [...h.entries].reverse().find((e) => e.reason !== "held")?.date ?? null;
}

/** UX-1 HELD card: the closest candidate of a HELD day (from the latest attempt's ruled-out list). */
export type LeadClosest = { headline: string; reason: string; sources?: number; age_h?: number; pub?: string; at: string };

/** Never a Gmail / X / Taste item (box-only or operator signal), even if a ruled-out list carries one. */
const CLOSEST_DENY = /^(?:cl:)?(?:gmail|x|taste)[:-]/;

/** HELD entries only (null otherwise): first ruled-out candidate of the latest attempt that may be shown, with that attempt's time. */
export function leadClosest(e: LeadEntry | null): LeadClosest | null {
  if (!e || e.reason !== "held") return null;
  const last = e.attempts?.[e.attempts.length - 1];
  const list = last?.excluded ?? e.excluded ?? [];
  const c = list.find((x) => !CLOSEST_DENY.test(x.cluster_id) && x.pub !== "GML" && !x.reason.startsWith("taste"));
  if (!c) return null;
  return {
    headline: c.headline,
    reason: c.reason,
    ...(c.sources != null ? { sources: c.sources } : {}),
    ...(c.age_h != null ? { age_h: c.age_h } : {}),
    ...(c.pub ? { pub: c.pub } : {}),
    at: last?.at ?? e.at,
  };
}

/** PASS-F2.1c refresh verdict for the frozen lead (log: `lead: kept|repicked|held age_h=<n> since_pick_h=<n>`). */
export type LeadRefresh = { kind: "kept" | "repicked" | "held"; age_h: number | null; since_pick_h: number | null };

export function leadRefreshLine(r: LeadRefresh): string {
  const n = (x: number | null) => (x == null ? "?" : String(Math.floor(x)));
  return `lead: ${r.kind} age_h=${n(r.age_h)} since_pick_h=${n(r.since_pick_h)}`;
}

export type PickDecision =
  | { action: "none"; why: "already-picked" | "outside-window" | "retry-closed"; refresh?: LeadRefresh }
  | { action: "picked"; entry: LeadEntry; refresh?: LeadRefresh }
  /** `replace` = update the date's existing HELD entry in place (retry that still found nothing). */
  | { action: "held"; entry: LeadEntry; replace?: true; refresh?: LeadRefresh };

type PickOpts = LeadOpts & { crawlAt: string; at: string; force?: boolean; repick?: boolean; crawlStartedAt?: string };

/**
 * PASS-F2.1c — run at EVERY crawl (scripts/rank-snapshot.ts). The daily pick rules first (unchanged); when they do nothing, the frozen lead is
 * re-picked if it was picked > LEAD_REPICK_AFTER_H ago AND a candidate under LEAD_FRESH_AGE_H exists that passes the
 * Wire gate with ≥2 independent publishers (analyst-only / GNews-only exclusions unchanged). No candidate ⇒ the
 * frozen lead stays, or HELD once its story is over LEAD_MAX_AGE_H. Never invented: only real rows are picked.
 */
export function decideLeadRefresh(h: LeadHistory, clusters: WireCluster[], opts: PickOpts, d: PickDecision = decidePick(h, clusters, opts)): PickDecision {
  if (d.action !== "none" || opts.force || opts.repick) return d;
  const cur = currentLead(h);
  if (!cur || (cur.reason !== "picked" && cur.reason !== "seed")) return d;
  const now = Date.parse(opts.crawlAt);
  const sincePick = leadAgeHours(cur.at, now);
  const byId = new Map(clusters.map((c) => [c.id, c]));
  const curCluster = cur.cluster_id ? byId.get(cur.cluster_id) : undefined;
  const firstMs = cur.first_at ? Date.parse(cur.first_at) : curCluster ? groupFirstAt(curCluster, opts.memberAt) : NaN;
  const ageH = Number.isFinite(firstMs) ? (now - firstMs) / 3_600_000 : null;
  const keep = (): PickDecision => ({ ...d, refresh: { kind: "kept", age_h: ageH, since_pick_h: sincePick } });
  if (sincePick == null || sincePick <= LEAD_REPICK_AFTER_H) return keep();
  const fresh = leadCandidates(clusters, now, opts).find(
    (c) => c.id !== cur.cluster_id && now - groupFirstAt(byId.get(c.id)!, opts.memberAt) < LEAD_FRESH_AGE_H * 3_600_000,
  );
  if (fresh) {
    const freshOnly = clusters.filter((c) => c.id !== cur.cluster_id && now - groupFirstAt(c, opts.memberAt) < LEAD_FRESH_AGE_H * 3_600_000);
    const r = decidePick(h, freshOnly, { ...opts, repick: true });
    if (r.action === "picked") {
      const { forced: _f, ...entry } = r.entry;
      void _f;
      return { action: "picked", entry: { ...entry, supersedes: cur.cluster_id, note: "repick: lead older than 12h since pick" }, refresh: { kind: "repicked", age_h: ageH, since_pick_h: sincePick } };
    }
  }
  if (ageH != null && ageH > LEAD_MAX_AGE_H) {
    const startAt = opts.crawlStartedAt && Number.isFinite(Date.parse(opts.crawlStartedAt)) ? opts.crawlStartedAt : opts.crawlAt;
    return {
      action: "held",
      entry: {
        date: istanbulDate(startAt),
        at: opts.at,
        crawl_at: opts.crawlAt,
        pick_slot: istanbulHHMM(startAt),
        cluster_id: cur.cluster_id,
        headline: cur.headline,
        url: cur.url,
        sources: cur.sources,
        sig: cur.sig,
        ...(cur.first_at ? { first_at: cur.first_at } : {}),
        reason: "held",
        note: "no qualifying story",
        attempts: [{ at: opts.at, crawl_at: opts.crawlAt, excluded: [] }],
      },
      refresh: { kind: "held", age_h: ageH, since_pick_h: sincePick },
    };
  }
  return keep();
}

/** The daily pick rules (Beat 7 / PASS-L), unchanged. The crawl calls decideLeadRefresh, which wraps this. */
export function decidePick(h: LeadHistory, clusters: WireCluster[], opts: PickOpts): PickDecision {
  const startAt = opts.crawlStartedAt && Number.isFinite(Date.parse(opts.crawlStartedAt)) ? opts.crawlStartedAt : opts.crawlAt;
  const date = istanbulDate(startAt);
  const existing = entryFor(h, date);
  // A picked (or seeded) date never picks twice — the date locks only on a real lead. A HELD date is NOT locked:
  // every crawl starting at/after 06:00 that day retries the pick (no LEAD_PICK_REPICK needed).
  if (existing && existing.reason !== "held" && !opts.repick) return { action: "none", why: "already-picked" };
  const force = !!(opts.force || opts.repick);
  if (!force && !inPickWindow(startAt)) return { action: "none", why: "outside-window" };
  // PASS-L L3: a HELD date's last planned retry is 16:11; a crawl starting ≥21:00 leaves it HELD (no late title churn).
  if (!force && existing?.reason === "held" && !inRetryWindow(startAt)) return { action: "none", why: "retry-closed" };
  const now = Date.parse(opts.crawlAt);
  const top = leadCandidates(clusters, now, opts)[0];
  const byId = new Map(clusters.map((c) => [c.id, c]));
  const excluded = wireCandidates(clusters, { ...opts, keepNoise: true })
    .filter((c) => c.sources >= LEAD_MIN_SOURCES)
    .map((c) => {
      const g = byId.get(c.id)!;
      const first = groupFirstAt(g, opts.memberAt);
      const pub = ownPublisherLabel(g);
      return {
        cluster_id: c.id,
        headline: c.title,
        reason: leadExcludeReason(g, now, opts),
        sources: c.sources,
        ...(Number.isFinite(first) ? { age_h: Math.floor((now - first) / 3_600_000) } : {}),
        ...(pub ? { pub } : {}),
      };
    })
    .filter((e): e is typeof e & { reason: string } => e.reason !== null) as LeadExcluded[];
  const base = {
    date,
    at: opts.at,
    crawl_at: opts.crawlAt,
    ...(force ? { forced: true as const } : {}),
    ...(!force && istanbulHour(startAt) > LEAD_PICK_HOUR ? { catch_up: true as const } : {}),
    ...(opts.crawlStartedAt && startAt !== opts.crawlAt ? { crawl_started_at: startAt } : {}),
    pick_slot: istanbulHHMM(startAt),
    ...(existing && opts.repick ? { supersedes: existing.cluster_id } : {}),
    ...(excluded.length ? { excluded } : {}),
  };
  if (top) {
    const first = groupFirstAt(byId.get(top.id)!, opts.memberAt);
    // Re-crowning the incumbent keeps its original pick time, so the 12h refresh clock (decideLeadRefresh) is not reset.
    const cur = currentLead(h);
    const incumbent = cur && cur.reason !== "held" && cur.cluster_id === top.id ? cur : null;
    return {
      action: "picked",
      entry: {
        ...base,
        ...(incumbent ? { at: incumbent.at } : {}),
        cluster_id: top.id,
        headline: top.title,
        url: top.url,
        sources: top.sources,
        sig: top.score,
        reason: "picked",
        ...(ownPublisherLabel(byId.get(top.id)!) ? { pub: ownPublisherLabel(byId.get(top.id)!)! } : {}),
        ...(Number.isFinite(first) ? { first_at: new Date(first).toISOString(), age_band: leadAgeBand((now - first) / 3_600_000)! } : {}),
      },
    };
  }
  const attempt: HeldAttempt = {
    at: opts.at,
    crawl_at: opts.crawlAt,
    ...(opts.crawlStartedAt && startAt !== opts.crawlAt ? { crawl_started_at: startAt } : {}),
    excluded,
  };
  if (existing?.reason === "held") {
    // Still nothing: keep ONE HELD entry for the date, append this attempt (candidate + reason records kept).
    const prior: HeldAttempt[] = existing.attempts ?? [
      { at: existing.at, crawl_at: existing.crawl_at, ...(existing.crawl_started_at ? { crawl_started_at: existing.crawl_started_at } : {}), excluded: existing.excluded ?? [] },
    ];
    return {
      action: "held",
      replace: true,
      entry: { ...existing, ...(excluded.length ? { excluded } : {}), attempts: [...prior, attempt] },
    };
  }
  // HELD carries the last pick from an EARLIER date (never a same-date entry a repick just superseded).
  const prev = [...h.entries].reverse().find((e) => e.date < date) ?? null;
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
      attempts: [attempt],
    },
  };
}

export function applyPick(h: LeadHistory, d: PickDecision): LeadHistory {
  if (d.action === "none") return h;
  if (d.action === "held" && d.replace) {
    const i = h.entries.map((e) => e.date === d.entry.date && e.reason === "held").lastIndexOf(true);
    if (i >= 0) return { schema: 1, entries: h.entries.map((e, j) => (j === i ? d.entry : e)) };
  }
  return { schema: 1, entries: [...h.entries, d.entry] };
}

export function readLeadHistory(raw: unknown): LeadHistory {
  const j = raw as LeadHistory | null;
  return j && j.schema === 1 && Array.isArray(j.entries) ? j : { schema: 1, entries: [] };
}
