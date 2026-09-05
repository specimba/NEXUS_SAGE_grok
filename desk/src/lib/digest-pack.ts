import { DIGEST_ITEMS, DROPPED, PACK_AT, PACK_SOURCE, type DigestItem } from "@/data/digest-pack";

export const CADENCE_MS = 6 * 60 * 60 * 1000;
/** Browser mirror key — disk `digest-last.json` is truth. */
export const PACK_KEY = "sage-digest-last";

export type DigestLast = {
  last_at: string;
  next_at: string;
  pack_id: string;
};

export type RenderReportOpts = {
  source?: string;
  dropped?: string[];
};

export function kept(items = DIGEST_ITEMS) {
  return items.filter((i) => i.kind !== "drop");
}

export function renderReport(
  items: DigestItem[] = DIGEST_ITEMS,
  at = PACK_AT,
  opts: RenderReportOpts = {},
) {
  const lead = items.find((i) => i.kind === "lead");
  const source = opts.source ?? PACK_SOURCE;
  const dropped = opts.dropped ?? DROPPED;
  return [
    `# SAGE digest pack`,
    `compiled ${at}`,
    `source ${source}`,
    `lead_policy unlock — no new HF primary 03 Sep`,
    ``,
    `## Lead`,
    lead ? `${lead.title} [${lead.confidence}]` : "none",
    lead?.take ?? "",
    lead ? `MOVE ${lead.move}` : "",
    lead ? `UNLOCK IF ${lead.unlockIf}` : "",
    ``,
    `## Files`,
    ...kept(items).flatMap((i) => [
      `### [${i.kind} / ${i.file} / ${i.confidence}] ${i.title}`,
      i.take,
      ...i.evidence.map((e) => `- ${e}`),
      ...i.steps.map((s, n) => `${n + 1}. ${s}`),
      `Done when: ${i.doneWhen}`,
      ``,
    ]),
    `## Dropped`,
    ...dropped.map((d) => `- ${d}`),
  ].join("\n");
}

export function renderPlan(items: DigestItem[] = DIGEST_ITEMS) {
  return kept(items).map((i) => ({
    id: i.id,
    title: i.title,
    file: i.file,
    kind: i.kind,
    confidence: i.confidence,
    move: i.move,
    evidence: i.evidence,
    steps: i.steps,
    doneWhen: i.doneWhen,
    unlockIf: i.unlockIf,
    refs: i.refs,
  }));
}

export function nextDue(lastIso: string | null, now = Date.now()) {
  if (!lastIso) return { due: true, nextAt: new Date(now).toISOString(), ageH: Infinity };
  const last = Date.parse(lastIso);
  const next = last + CADENCE_MS;
  return { due: now >= next, nextAt: new Date(next).toISOString(), ageH: (now - last) / 3_600_000 };
}

/**
 * Cadence gate from digest-last.json shape.
 * Missing file → due. If now < next_at → HOLD.
 * (Pure — no node:fs; disk I/O lives in digest-pack-disk.ts.)
 */
export function isDigestDue(last: DigestLast | null, now = Date.now()) {
  if (!last) {
    return { due: true as const, reason: "missing" as const, nextAt: new Date(now).toISOString() };
  }
  const nextMs = Date.parse(last.next_at);
  if (Number.isFinite(nextMs) && now < nextMs) {
    return { due: false as const, reason: "hold" as const, nextAt: last.next_at };
  }
  if (!Number.isFinite(nextMs)) {
    const fromLast = nextDue(last.last_at, now);
    return {
      due: fromLast.due,
      reason: fromLast.due ? ("due" as const) : ("hold" as const),
      nextAt: fromLast.nextAt,
    };
  }
  return { due: true as const, reason: "due" as const, nextAt: new Date(now + CADENCE_MS).toISOString() };
}

/** Pack stem: YYYY-MM-DDTHH (UTC hour). */
export function packStamp(now: Date | number = Date.now()): string {
  const d = typeof now === "number" ? new Date(now) : now;
  return d.toISOString().slice(0, 13);
}
