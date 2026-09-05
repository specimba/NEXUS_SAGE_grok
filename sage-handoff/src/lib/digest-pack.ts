import { DIGEST_ITEMS, DROPPED, PACK_AT, PACK_SOURCE, type DigestItem } from "../data/digest-pack.ts";

export const CADENCE_MS = 6 * 60 * 60 * 1000;
export const PACK_KEY = "sage-digest-last";

export function kept(items = DIGEST_ITEMS) {
  return items.filter((i) => i.kind !== "drop");
}

export function renderReport(items: DigestItem[] = DIGEST_ITEMS, at = PACK_AT) {
  const lead = items.find((i) => i.kind === "lead");
  return [
    `# SAGE digest pack`,
    `compiled ${at}`,
    `source ${PACK_SOURCE}`,
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
    ...DROPPED.map((d) => `- ${d}`),
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
