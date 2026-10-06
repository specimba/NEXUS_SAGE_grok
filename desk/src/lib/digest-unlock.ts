/**
 * Pass A — Digest/Voice unlock vs frozen CYCLE.003.
 * Titles follow LEAD_TODAY (06:11 Istanbul pick); cycle label stays 003.
 * Pure helpers — IO / module writes live in rank-snapshot + digest-tick.
 */
import { CYCLE, type Pin } from "@/data/cycle";
import { DIGEST_ITEMS, type DigestItem } from "@/data/digest-pack";
import type { LeadEntry } from "@/lib/lead-pick";
import type { WireRow } from "@/lib/wire";

export const UNLOCK_CYCLE_ID = "003" as const;
export const ARCHIVE_KICKER = "archive · 003";
export const HELD_KICKER = "HELD";

export type UnlockStamp = "live" | "held" | "archive";

export type UnlockRow = {
  id: string;
  kind: "lead" | "companion" | "rest";
  title: string;
  take: string;
  why: string;
  move: string;
  url: string | null;
  sources: number;
  sig: number | null;
  /** Set when this row is archive fallback, never a live headline. */
  archive?: true;
};

export type DigestUnlockSnapshot = {
  schema: 1;
  cycleId: typeof UNLOCK_CYCLE_ID;
  /** Istanbul pick date of the frozen unlock (YYYY-MM-DD), null for archive-only. */
  pickDate: string | null;
  /** ISO when titles were frozen (pick / first WROTE after pick). */
  frozenAt: string | null;
  /** Lead cluster id when live/held-from-last-good. */
  leadId: string | null;
  lead: UnlockRow;
  rows: UnlockRow[];
};

export type UnlockView = DigestUnlockSnapshot & {
  stamp: UnlockStamp;
  /** Small kicker above the lead — never a second headline. */
  kicker: string | null;
};

/** Pulse-only / briefEligible:false families that may be Digest refs, never titles. */
const TITLE_DENY_ID =
  /^(gmail:|cl:gmail:|taste:|cl:taste:|x:|cl:x:)/i;
const TITLE_DENY_SOURCE =
  /^(gmail-news|x-taste|x-watchlist|rss-lab|rss-security|gnews-rss)$/i;

/**
 * True when a story may be a Digest/Voice title (Brief-lead / Wire path).
 * GML, taste, lone RSS, GNews-only → false.
 */
export function titleEligible(input: {
  id?: string | null;
  briefEligible?: boolean;
  pulse_only?: boolean;
  lead_source?: string | null;
  sources?: number | null;
  member_ids?: string[] | null;
}): boolean {
  if (input.briefEligible === false) return false;
  if (input.pulse_only === true) return false;
  const id = String(input.id ?? "");
  if (TITLE_DENY_ID.test(id)) return false;
  const members = input.member_ids ?? [];
  // Pass A: GML / taste / RSS / GNews-only never become Digest/Voice titles.
  // A title needs ≥1 HN/paper/arxiv member, or a non-deny lead id (e.g. already-picked LEAD_TODAY).
  const denyMember = (m: string) => /^(gmail:|taste:|x:|rss:|gnews:)/i.test(m);
  if (members.length) {
    const hasStrong = members.some((m) => /^(hn:|paper:|arxiv:)/i.test(m));
    if (!hasStrong && members.every(denyMember)) return false;
  } else {
    // No members: allow LEAD_TODAY-style ids (cl:hn:…); deny bare gmail/rss/gnews/taste.
    if (/^(gmail:|cl:gmail:|taste:|cl:taste:|x:|cl:x:|rss:|cl:rss:|gnews:|cl:gnews:)/i.test(id)) {
      return false;
    }
  }
  const src = String(input.lead_source ?? "");
  if (TITLE_DENY_SOURCE.test(src) && !members.some((m) => /^(hn:|paper:|arxiv:)/i.test(m))) {
    return false;
  }
  if ((input.sources ?? 1) < 1) return false;
  return true;
}

function factualTake(sources: number, sig: number | null | undefined, date: string | null): string {
  const sigPart = sig != null ? ` · sig ${sig}` : "";
  const datePart = date ? ` · pick ${date}` : "";
  return `${sources} SRC${sigPart}${datePart}`.trim();
}

export function archiveRowsFromCycle(pins: readonly Pin[] = CYCLE.pins): UnlockRow[] {
  return pins.map((p, i) => ({
    id: p.id,
    kind: p.kind,
    title: p.title,
    take: p.take,
    why: p.why,
    move: p.move,
    url: null,
    sources: 0,
    sig: null,
    archive: true as const,
    ...(i === 0 ? {} : {}),
  }));
}

/** Archive fallback lead from CYCLE.003 / DIGEST_ITEMS — never invent. */
export function archiveLeadFromCycle(
  pins: readonly Pin[] = CYCLE.pins,
  digestItems: readonly DigestItem[] = DIGEST_ITEMS,
): UnlockRow {
  const pin = pins.find((p) => p.kind === "lead") ?? pins[0];
  const dig = digestItems.find((i) => i.kind === "lead") ?? digestItems[0];
  return {
    id: pin?.id ?? dig?.id ?? "hf-incident",
    kind: "lead",
    title: dig?.title ?? pin?.title ?? "HF production swarm",
    take: dig?.take ?? pin?.take ?? "",
    why: dig?.why ?? pin?.why ?? "",
    move: dig?.move ?? pin?.move ?? "",
    url: dig?.refs?.[0]?.href ?? null,
    sources: 0,
    sig: null,
    archive: true,
  };
}

export function leadToUnlockRow(lead: LeadEntry): UnlockRow {
  return {
    id: lead.cluster_id ?? `lead:${lead.date}`,
    kind: "lead",
    title: lead.headline,
    take: factualTake(lead.sources, lead.sig, lead.date),
    why: lead.note
      ? lead.note
      : `LEAD_TODAY · ${lead.reason} · frozen at daily pick`,
    move: "Digest/Voice follow Brief lead · cycle label 003",
    url: lead.url,
    sources: lead.sources,
    sig: lead.sig,
  };
}

/** Top Wire rows → Digest/Voice companions (titles already Brief-eligible path). */
export function wireToUnlockRows(
  wire: readonly WireRow[],
  opts: { excludeId?: string | null; max?: number } = {},
): UnlockRow[] {
  const max = opts.max ?? 4;
  const out: UnlockRow[] = [];
  for (const w of wire) {
    if (opts.excludeId && w.id === opts.excludeId) continue;
    if (!titleEligible({ id: w.id, sources: w.sources, member_ids: w.member_ids })) continue;
    // Wire rows are Brief-eligible; still hard-deny GML/taste ids.
    if (TITLE_DENY_ID.test(w.id)) continue;
    out.push({
      id: w.id,
      kind: out.length === 0 ? "companion" : "rest",
      title: w.title,
      take: factualTake(w.sources, w.score, null),
      why: "Top corroborated Wire cluster · same pack as lead pick",
      move: "Digest row · never displaces Brief lead",
      url: w.url,
      sources: w.sources,
      sig: w.score,
    });
    if (out.length >= max) break;
  }
  return out;
}

export function buildLiveSnapshot(opts: {
  lead: LeadEntry;
  wire: readonly WireRow[];
  frozenAt: string;
}): DigestUnlockSnapshot {
  const leadRow = leadToUnlockRow(opts.lead);
  return {
    schema: 1,
    cycleId: UNLOCK_CYCLE_ID,
    pickDate: opts.lead.date,
    frozenAt: opts.frozenAt,
    leadId: opts.lead.cluster_id,
    lead: leadRow,
    rows: wireToUnlockRows(opts.wire, { excludeId: opts.lead.cluster_id }),
  };
}

/**
 * Resolve what Digest/Voice show.
 * - live: LEAD_TODAY good → prefer liveSnap (frozen at pick) when pickDate matches
 * - held: LEAD_HELD / null today → last good + HELD kicker
 * - archive: no last good → CYCLE.003 copy + archive · 003 kicker
 */
export function resolveUnlock(opts: {
  held: boolean;
  today: LeadEntry | null;
  /** Frozen snapshot from last successful unlock (module / disk). */
  lastGood: DigestUnlockSnapshot | null;
  /** Optional live rebuild (tests); production UI reads lastGood only for freeze. */
  liveSnap?: DigestUnlockSnapshot | null;
}): UnlockView {
  const todayOk =
    !opts.held &&
    !!opts.today?.headline &&
    opts.today.reason !== "held" &&
    titleEligible({
      id: opts.today.cluster_id,
      sources: opts.today.sources,
    });

  if (todayOk && opts.today) {
    // Prefer lastGood (frozen at pick) over a rebuilt liveSnap — mid-window crawls must not swap titles.
    const snap =
      opts.lastGood && opts.lastGood.pickDate === opts.today.date
        ? opts.lastGood
        : opts.liveSnap && opts.liveSnap.pickDate === opts.today.date
          ? opts.liveSnap
          : opts.lastGood ?? opts.liveSnap ?? buildLiveSnapshot({
              lead: opts.today,
              wire: [],
              frozenAt: opts.today.at,
            });
    // Guard: never show a deny-family title as live lead.
    if (!titleEligible({ id: snap.lead.id, sources: snap.lead.sources })) {
      return archiveView();
    }
    return { ...snap, stamp: "live", kicker: null };
  }

  if (opts.lastGood && opts.lastGood.lead.title && !opts.lastGood.lead.archive) {
    return {
      ...opts.lastGood,
      stamp: "held",
      kicker: HELD_KICKER,
    };
  }

  return archiveView();
}

function archiveView(): UnlockView {
  const lead = archiveLeadFromCycle();
  const rows = archiveRowsFromCycle()
    .filter((r) => r.id !== lead.id)
    .map((r, i) => ({ ...r, kind: (i === 0 ? "companion" : "rest") as UnlockRow["kind"] }));
  return {
    schema: 1,
    cycleId: UNLOCK_CYCLE_ID,
    pickDate: null,
    frozenAt: null,
    leadId: lead.id,
    lead,
    rows,
    stamp: "archive",
    kicker: ARCHIVE_KICKER,
  };
}

/** Overlay unlocked lead + rows onto DigestItem[] for pack export (cycle stays 003). */
export function unlockToDigestItems(
  view: UnlockView,
  baseline: readonly DigestItem[] = DIGEST_ITEMS,
): DigestItem[] {
  const archiveBaseline = baseline.map((i) =>
    i.kind === "drop"
      ? i
      : { ...i, kind: "drop" as const, title: `[archive · 003] ${i.title}` },
  );

  const leadItem: DigestItem = {
    id: view.lead.id,
    kind: "lead",
    title: view.lead.title,
    take: view.lead.take,
    why: view.lead.why,
    move: view.lead.move,
    file: "other",
    confidence: view.stamp === "archive" ? "medium" : "high",
    evidence: [
      view.kicker ? `stamp ${view.kicker}` : "stamp live",
      view.frozenAt ? `frozen ${view.frozenAt}` : "archive fallback",
      view.pickDate ? `pick ${view.pickDate}` : "no pick",
    ],
    steps: ["Follow LEAD_TODAY · never invent", "Cycle label stays 003"],
    doneWhen: "Digest lead equals Brief LEAD_TODAY title",
    unlockIf: "Next 06:11 Istanbul pick",
    refs: view.lead.url
      ? [{ label: "lead", href: view.lead.url, role: "primary" }]
      : [],
  };

  const rowItems: DigestItem[] = view.rows.map((r) => ({
    id: r.id,
    kind: r.kind === "lead" ? "companion" : r.kind,
    title: r.title,
    take: r.take,
    why: r.why,
    move: r.move,
    file: "other" as const,
    confidence: "medium" as const,
    evidence: [`${r.sources} SRC`],
    steps: [],
    doneWhen: "Listed under Digest lead",
    unlockIf: "Never as Brief lead from pulse-only",
    refs: r.url ? [{ label: r.title.slice(0, 40), href: r.url, role: "wire" as const }] : [],
  }));

  // Pack carries unlocked titles first; archive baseline kept as drops (not deleted).
  const drops = archiveBaseline.filter((i) => i.kind === "drop");
  return [leadItem, ...rowItems, ...drops];
}

export function renderUnlockModule(snap: DigestUnlockSnapshot): string {
  return (
    `/** Pass A Digest/Voice unlock — frozen at daily lead pick (or first WROTE after it).\n` +
    ` * Generated by scripts/rank-snapshot.ts / digest tick. Do not edit by hand.\n` +
    ` * Cycle label stays 003. Mid-window crawls must not rewrite this file.\n` +
    ` */\n` +
    `import type { DigestUnlockSnapshot } from "@/lib/digest-unlock";\n\n` +
    `export const DIGEST_UNLOCK: DigestUnlockSnapshot = ${JSON.stringify(snap, null, 2)} as const;\n`
  );
}
