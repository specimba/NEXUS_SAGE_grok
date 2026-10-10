import { DIGEST_ITEMS, DROPPED, PACK_AT, PACK_SOURCE, type DigestItem } from "@/data/digest-pack";
export * from "@/lib/digest-cadence-gate";

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

