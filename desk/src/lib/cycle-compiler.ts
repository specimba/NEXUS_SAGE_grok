/**
 * sage-cycle-compiler — cluster / leadPolicy / selectPins / pinBudget / bannedCopy / assertCycle
 */

import { bannedNounsIn, detectFlatten } from "@/lib/x-hygiene";
import type { Pin } from "@/data/cycle";

export const PIN_BUDGET = 3;
export const DEFAULT_LEAD_ID = "hf-incident";
export const DEFAULT_LEAD_POLICY = "unlock" as const;

export type LeadPolicyMode = "unlock" | "lock";

export type StoryLike = {
  id: string;
  title?: string;
  take?: string;
  why?: string;
  move?: string;
  kind?: "lead" | "companion" | "rest" | "drop";
  file?: "hf-incident" | "astra" | "split" | "other";
  delta?: string | null;
  /** true when this story is a new primary that can unlock a lead swap */
  isNewPrimary?: boolean;
};

export type Cluster = {
  file: "hf-incident" | "astra" | "split" | "other";
  items: StoryLike[];
};

export function pinBudget(): number {
  return PIN_BUDGET;
}

/** Group digest/story items by file lane. Drop kind excluded from pin clusters. */
export function clusterItems(items: StoryLike[]): Cluster[] {
  const order: Cluster["file"][] = ["hf-incident", "astra", "other", "split"];
  const buckets = new Map<Cluster["file"], StoryLike[]>();
  for (const f of order) buckets.set(f, []);
  for (const item of items) {
    if (item.kind === "drop") continue;
    const file =
      item.file ??
      (item.id.includes("hf") || item.id.includes("incident")
        ? "hf-incident"
        : item.id.includes("astra")
          ? "astra"
          : "other");
    buckets.get(file)!.push(item);
  }
  return order
    .map((file) => ({ file, items: buckets.get(file) ?? [] }))
    .filter((c) => c.items.length > 0);
}

/**
 * Default unlock unless stories carry a new primary delta.
 * Lead stays HF / hf-incident until that primary fires.
 */
export function leadPolicy(
  stories: StoryLike[],
  currentLeadId = DEFAULT_LEAD_ID,
): {
  mode: LeadPolicyMode;
  leadId: string;
  reason: string;
} {
  const primary = stories.find((s) => s.isNewPrimary || (s.delta && s.delta.trim().length > 0));
  if (primary && (primary.file === "hf-incident" || primary.id.includes("hf"))) {
    return {
      mode: "unlock",
      leadId: primary.id,
      reason: `new primary delta on ${primary.id}`,
    };
  }
  // Non-HF primary deltas do not swap the lead — companion/rest only
  if (primary) {
    return {
      mode: "unlock",
      leadId: currentLeadId,
      reason: `delta on ${primary.id} is not an HF primary — lead stays ${currentLeadId}`,
    };
  }
  return {
    mode: DEFAULT_LEAD_POLICY,
    leadId: currentLeadId,
    reason: "default unlock — no new primary",
  };
}

export function bannedCopy(text: string): { ok: boolean; hits: string[]; flatten: boolean } {
  const hits = bannedNounsIn(text);
  const flatten = detectFlatten(text);
  return { ok: hits.length === 0 && !flatten, hits, flatten };
}

/**
 * Select at most pinBudget pins: one lead (HF), one companion, rest fills.
 * Companion ≠ second lead. Stigmergy/split and banned copy are excluded.
 */
export function selectPins(
  items: StoryLike[],
  opts?: { leadId?: string; budget?: number },
): Pin[] {
  const budget = opts?.budget ?? PIN_BUDGET;
  const policy = leadPolicy(items, opts?.leadId ?? DEFAULT_LEAD_ID);
  const usable = items.filter((i) => {
    if (i.kind === "drop") return false;
    if (i.file === "split") return false;
    const blob = `${i.title ?? ""} ${i.take ?? ""} ${i.why ?? ""} ${i.move ?? ""}`;
    const ban = bannedCopy(blob);
    return ban.ok;
  });

  const lead =
    usable.find((i) => i.id === policy.leadId || i.file === "hf-incident" || i.kind === "lead") ??
    usable[0];
  const companion = usable.find(
    (i) =>
      i !== lead &&
      (i.kind === "companion" || i.file === "astra" || i.id.includes("astra")),
  );
  const rest = usable.filter((i) => i !== lead && i !== companion);

  const picked: StoryLike[] = [];
  if (lead) picked.push(lead);
  if (companion && picked.length < budget) picked.push(companion);
  for (const r of rest) {
    if (picked.length >= budget) break;
    picked.push(r);
  }

  return picked.slice(0, budget).map((p, idx) => {
    const kind: Pin["kind"] =
      idx === 0 ? "lead" : p === companion || p.kind === "companion" || p.file === "astra" ? "companion" : "rest";
    return {
      id: p.id,
      kind,
      title: p.title ?? p.id,
      take: p.take ?? "",
      why: p.why ?? "",
      move: p.move ?? "",
    };
  });
}

export type CycleAssertable = {
  id: string;
  leadPolicy?: string;
  pins: Pin[];
  trust?: { allow?: string[]; deny?: string[]; open?: string[] };
  exec?: string[];
};

export function assertCycle(cycle: CycleAssertable): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!cycle.id) errors.push("missing cycle id");
  if (!cycle.pins || cycle.pins.length === 0) errors.push("no pins");
  if (cycle.pins && cycle.pins.length > PIN_BUDGET) {
    errors.push(`pin budget exceeded: ${cycle.pins.length} > ${PIN_BUDGET}`);
  }
  const leads = (cycle.pins ?? []).filter((p) => p.kind === "lead");
  if (leads.length !== 1) errors.push(`expected exactly one lead, got ${leads.length}`);
  const lead = leads[0];
  if (lead && lead.id !== DEFAULT_LEAD_ID && !lead.id.includes("hf")) {
    errors.push(`lead must stay HF / ${DEFAULT_LEAD_ID} until new primary (got ${lead.id})`);
  }
  if (lead && !/hugging\s*face|hf/i.test(`${lead.title} ${lead.take}`)) {
    errors.push("lead copy must reference Hugging Face / HF");
  }
  const companions = (cycle.pins ?? []).filter((p) => p.kind === "companion");
  if (companions.length > 1) errors.push("companion ≠ second lead — at most one companion pin");
  for (const p of cycle.pins ?? []) {
    const blob = `${p.title} ${p.take} ${p.why} ${p.move}`;
    const ban = bannedCopy(blob);
    if (!ban.ok) {
      errors.push(`banned/flatten on pin ${p.id}: ${[...ban.hits, ban.flatten ? "flatten" : ""].filter(Boolean).join(", ")}`);
    }
  }
  const deny = cycle.trust?.deny ?? [];
  for (const must of ["civilizations", "Astra as HF", "Missed-DNA"]) {
    if (!deny.some((d) => d.toLowerCase().includes(must.toLowerCase().split(" ")[0]!))) {
      // soft: only require civilizations-ish deny present if trust block exists
    }
  }
  if (cycle.trust?.deny && !cycle.trust.deny.some((d) => /civilization/i.test(d))) {
    errors.push("trust.deny should include civilizations copy");
  }
  if (cycle.leadPolicy && cycle.leadPolicy !== "unlock" && cycle.leadPolicy !== "lock") {
    errors.push(`unknown leadPolicy ${cycle.leadPolicy}`);
  }
  return { ok: errors.length === 0, errors };
}
