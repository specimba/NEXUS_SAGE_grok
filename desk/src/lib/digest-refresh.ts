/**
 * Map free-ingest snapshots → DigestItem[] without mutating Brief pin set.
 * Authoritative map: refs/SCOUT-DIGEST-FIELD-MAP.md (+ WIRE-DIGEST-CADENCE).
 * Locks: cycle 003 · lead hf-incident · Sol≠Astra · Digest never invents Brief pins · no 004.
 *
 * Append-only: ingest may add evidence[] / refs[] (and toolkit steps on drop shelf).
 * title/take/why/move stay from DIGEST_ITEMS baseline (banned-noun scrub only).
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { CYCLE } from "@/data/cycle";
import {
  DIGEST_ITEMS,
  DROPPED,
  type DigestItem,
} from "@/data/digest-pack";
import { PAPERS } from "@/data/papers";
import { HN_PULSE, type HnPulseRow } from "@/data/hn-pulse";
import { RSS_LABS, type RssLabRow } from "@/data/rss-labs";
import { RSS_SECURITY, type RssSecurityRow } from "@/data/rss-security";
import { SHELF, type ShelfItem } from "@/data/shelf";
import { classifyPost } from "@/lib/x-hygiene";
import { classifyUrl } from "@/lib/ingest/shelf";

/** Scout: ≤3 new evidence lines + ≤5 refs per kept item (dedupe by href). */
const MAX_NEW_EVIDENCE = 3;
const MAX_NEW_REFS = 5;
const MAX_SHELF_STEPS = 5;

const BANNED_COPY = /\bcivilizations\b|\bmissed[- ]dna\b|\bannounced deal\b/i;
const STIGMERGY_AS_HF =
  /\bstigmergy\b.*\b(hf|hugging\s*face|breach|swarm)\b|\b(hf|hugging\s*face|breach|swarm)\b.*\bstigmergy\b|\bbuehler\b.*\b(hf|breach|proof)\b/i;

export type RefreshResult = {
  items: DigestItem[];
  dropped: string[];
  at: string;
  source: string;
  cycleId: string;
  leadId: string;
};

type Budgets = Map<string, { evidence: number; refs: number }>;

function cloneItems(base: DigestItem[]): DigestItem[] {
  return JSON.parse(JSON.stringify(base)) as DigestItem[];
}

function trunc(s: string, n = 72): string {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length <= n ? t : t.slice(0, n - 1) + "…";
}

function findItem(items: DigestItem[], id: string): DigestItem | undefined {
  return items.find((i) => i.id === id);
}

function budget(budgets: Budgets, id: string) {
  let b = budgets.get(id);
  if (!b) {
    b = { evidence: 0, refs: 0 };
    budgets.set(id, b);
  }
  return b;
}

function pushEvidence(item: DigestItem, line: string, budgets: Budgets) {
  const b = budget(budgets, item.id);
  if (b.evidence >= MAX_NEW_EVIDENCE) return false;
  if (item.evidence.includes(line)) return false;
  if (BANNED_COPY.test(line) || STIGMERGY_AS_HF.test(line)) return false;
  item.evidence.push(line);
  b.evidence++;
  return true;
}

function pushRef(
  item: DigestItem,
  ref: DigestItem["refs"][number],
  budgets: Budgets,
) {
  const b = budget(budgets, item.id);
  if (b.refs >= MAX_NEW_REFS) return false;
  if (item.refs.some((r) => r.href === ref.href)) return false;
  if (BANNED_COPY.test(ref.label) || STIGMERGY_AS_HF.test(ref.label)) return false;
  item.refs.push(ref);
  b.refs++;
  return true;
}

function pushStep(item: DigestItem, step: string, limit = MAX_SHELF_STEPS) {
  if (item.steps.includes(step)) return;
  const added = item.steps.filter((s) => s.startsWith("Shelf toolkit:")).length;
  if (added >= limit) return;
  item.steps.push(step);
}

/** Papers / arXiv / OpenAlex / Crossref → support refs + evidence on harness-papers. Never displace HF lead. */
function mergePapers(
  items: DigestItem[],
  papers: typeof PAPERS,
  budgets: Budgets,
) {
  const harness = findItem(items, "harness-papers");
  if (!harness || harness.kind === "drop") return;

  const ranked = [...papers]
    .filter((p) => p.href && p.title && !BANNED_COPY.test(String(p.title)))
    .sort((a, b) => (b.up ?? 0) - (a.up ?? 0));

  for (const p of ranked) {
    const href = String(p.href);
    const title = String(p.title);
    const id = String(p.id);
    const up = typeof p.up === "number" ? p.up : 0;
    const doi = "doi" in p && p.doi ? String(p.doi) : "";
    const line = doi
      ? `DOI confirm ${id}: ${trunc(title, 56)}.`
      : `HF keep still ranked ${id}: ${trunc(title, 56)} (${up} up).`;
    pushEvidence(harness, line, budgets);
    pushRef(
      harness,
      { label: trunc(title, 48), href: doi || href, role: "support" },
      budgets,
    );
  }
}

function pulseBlob(row: { text?: string; title?: string; summary?: string }): string {
  return [row.text, row.title, row.summary].filter(Boolean).join(" ");
}

/** DENY/rumor/flatten/banned → do not enter evidence or non-Dropped refs. */
function acceptWire(blob: string, handle?: string): boolean {
  const c = classifyPost({ text: blob, handle });
  if (c.class === "drop" || c.class === "flatten") return false;
  if (c.class === "rumor") return false;
  if (c.banned.length) return false;
  if (BANNED_COPY.test(blob) || STIGMERGY_AS_HF.test(blob)) return false;
  return true;
}

/**
 * HN / lab RSS / security RSS → wire refs (+ optional one-liner evidence) after hygiene.
 * Never Brief lead; Astra product posts stay on companion refs only.
 */
function mergePulseWires(
  items: DigestItem[],
  hn: HnPulseRow[],
  labs: RssLabRow[],
  security: RssSecurityRow[],
  budgets: Budgets,
) {
  const aisle = findItem(items, "aisle-curl");
  const harness = findItem(items, "harness-papers");
  const astra = findItem(items, "astra-depth");
  const restTarget =
    aisle && aisle.kind !== "drop" && aisle.kind !== "lead" ? aisle : harness;

  for (const row of labs) {
    const blob = pulseBlob(row);
    if (!acceptWire(blob, row.lab)) continue;
    if (row.tag === "companion" && astra && astra.kind === "companion") {
      pushRef(
        astra,
        { label: trunc(`lab:${row.lab} ${row.title}`, 48), href: row.link, role: "wire" },
        budgets,
      );
      pushEvidence(astra, `Lab wire: ${trunc(row.title, 64)}.`, budgets);
      continue;
    }
    if (!restTarget || restTarget.kind === "lead") continue;
    if (row.tag === "incident") continue;
    pushRef(
      restTarget,
      { label: trunc(`lab:${row.lab} ${row.title}`, 48), href: row.link, role: "wire" },
      budgets,
    );
    pushEvidence(restTarget, `Lab wire: ${trunc(row.title, 64)}.`, budgets);
  }

  for (const row of security) {
    const blob = pulseBlob(row);
    if (!acceptWire(blob, row.lab)) continue;
    if (!restTarget || restTarget.kind === "lead") continue;
    // Prefer cyber-containment relevance; skip pure malware how-to style via hygiene already
    pushRef(
      restTarget,
      {
        label: trunc(`sec:${row.lab} ${row.title}`, 48),
        href: row.link,
        role: "wire",
      },
      budgets,
    );
    pushEvidence(
      restTarget,
      `Security wire: ${trunc(row.title, 64)}.`,
      budgets,
    );
  }

  for (const row of hn) {
    const blob = pulseBlob(row);
    if (!acceptWire(blob, row.author)) continue;
    if (row.tag === "incident" || row.tag === "rumor") continue;
    if (!restTarget || restTarget.kind === "lead") continue;
    const urlLane = classifyUrl(row.url);
    if (urlLane.lane === "drop" || urlLane.lane === "shelf") continue;
    pushRef(
      restTarget,
      { label: trunc(`hn ${row.text}`, 48), href: row.url, role: "wire" },
      budgets,
    );
    pushEvidence(restTarget, `HN wire: ${trunc(row.text, 64)}.`, budgets);
  }
}

/** GitHub / toolkit shelf → owasp-tooling drop refs/steps only. Never Brief pins. */
function mergeShelf(items: DigestItem[], shelf: ShelfItem[], budgets: Budgets) {
  const toolkit = findItem(items, "owasp-tooling");
  if (!toolkit || toolkit.kind !== "drop") return;

  const githubish = shelf.filter(
    (s) =>
      s.reason === "toolkit-github" ||
      s.reason === "github-search-shelf" ||
      s.reason === "toolkit",
  );
  for (const s of githubish) {
    const lane = classifyUrl(s.href);
    if (lane.lane === "drop") continue;
    pushRef(
      toolkit,
      { label: trunc(s.label, 48), href: s.href, role: "support" },
      budgets,
    );
    pushStep(toolkit, `Shelf toolkit: ${trunc(s.label, 56)}`);
    pushEvidence(toolkit, `toolkit on shelf: ${trunc(s.label, 56)}.`, budgets);
  }
}

/** Optional ingest-last stamp ages as evidence on harness rest only. */
function mergeIngestStamp(items: DigestItem[], deskRoot: string | undefined, budgets: Budgets) {
  if (!deskRoot) return;
  const path = resolve(deskRoot, "artifacts/sage/ingest-last.json");
  if (!existsSync(path)) return;
  try {
    const raw = JSON.parse(readFileSync(path, "utf8")) as {
      at?: string;
      soft_fail?: number;
      providers?: Record<string, unknown>;
    };
    const harness = findItem(items, "harness-papers");
    if (!harness || harness.kind === "drop") return;
    if (raw.at) {
      pushEvidence(harness, `ingest-last stamp ${raw.at}.`, budgets);
    }
  } catch {
    /* ignore malformed */
  }
}

/** Banned-noun scan on lead+companion+rest titles/takes (Scout step 5). Drop section untouched. */
function scrubBanned(items: DigestItem[]) {
  for (const item of items) {
    if (item.kind === "drop") continue;
    for (const key of ["title", "take", "why", "move", "doneWhen", "unlockIf"] as const) {
      if (BANNED_COPY.test(item[key])) {
        item[key] = item[key].replace(BANNED_COPY, "[denied-noun]");
      }
    }
    item.evidence = item.evidence.filter(
      (e) => !BANNED_COPY.test(e) && !STIGMERGY_AS_HF.test(e),
    );
    item.refs = item.refs.filter(
      (r) => !BANNED_COPY.test(r.label) && !STIGMERGY_AS_HF.test(r.label),
    );
  }
}

function assertLocks(items: DigestItem[], cycleId: string, leadId: string) {
  if (cycleId !== "003") {
    throw new Error(`digest-refresh lock: cycle must stay 003 (got ${cycleId})`);
  }
  if (leadId !== "hf-incident") {
    throw new Error(`digest-refresh lock: lead must stay hf-incident (got ${leadId})`);
  }
  const leads = items.filter((i) => i.kind === "lead");
  if (leads.length !== 1 || leads[0]!.file !== "hf-incident") {
    throw new Error("digest-refresh lock: exactly one lead with file hf-incident");
  }
  const stig = items.find((i) => i.id === "stigmergy");
  if (!stig || stig.kind !== "drop") {
    throw new Error("digest-refresh lock: stigmergy must remain kind drop");
  }
  const astra = items.find((i) => i.id === "astra-depth");
  if (!astra || astra.kind !== "companion" || astra.file !== "astra") {
    throw new Error("digest-refresh lock: Astra must remain companion file");
  }
  // Brief pin set from cycle.ts must stay hf-incident lead
  const pinLead = CYCLE.pins.find((p) => p.kind === "lead");
  if (!pinLead || pinLead.id !== "hf-incident") {
    throw new Error("digest-refresh lock: CYCLE.pins lead must be hf-incident");
  }
}

/**
 * Rebuild Digest organism from free-ingest data modules (Scout algorithm).
 * Does **not** mutate CYCLE.pins / invent Brief pins / bump cycle / rewrite baseline prose.
 */
export function refreshDigest(opts?: {
  now?: Date | number;
  deskRoot?: string;
  baseItems?: DigestItem[];
  dropped?: string[];
  papers?: typeof PAPERS;
  hn?: HnPulseRow[];
  labs?: RssLabRow[];
  security?: RssSecurityRow[];
  shelf?: ShelfItem[];
  cycleId?: string;
  leadId?: string;
}): RefreshResult {
  const nowMs =
    opts?.now === undefined
      ? Date.now()
      : typeof opts.now === "number"
        ? opts.now
        : opts.now.getTime();
  const at = new Date(nowMs).toISOString();
  const cycleId = opts?.cycleId ?? CYCLE.id;
  const leadPin = CYCLE.pins.find((p) => p.kind === "lead");
  const leadId = opts?.leadId ?? leadPin?.id ?? "hf-incident";

  const baseline = opts?.baseItems ?? DIGEST_ITEMS;
  const items = cloneItems(baseline);
  const dropped = [...(opts?.dropped ?? DROPPED)];
  const budgets: Budgets = new Map();

  // Snapshot baseline prose — refresh must not rewrite take/why/move (append-only)
  const proseSnap = new Map(
    baseline.map((i) => [i.id, { title: i.title, take: i.take, why: i.why, move: i.move }]),
  );

  const lead = items.find((i) => i.kind === "lead");
  if (lead) {
    lead.file = "hf-incident";
    lead.kind = "lead";
  }

  mergePapers(items, opts?.papers ?? PAPERS, budgets);
  mergePulseWires(
    items,
    opts?.hn ?? HN_PULSE,
    opts?.labs ?? RSS_LABS,
    opts?.security ?? RSS_SECURITY,
    budgets,
  );
  mergeShelf(items, opts?.shelf ?? SHELF, budgets);
  mergeIngestStamp(items, opts?.deskRoot, budgets);
  scrubBanned(items);

  // Restore baseline prose if scrub didn't need to touch (or after scrub only denied-noun)
  // Actually scrub may alter — that's intentional for banned nouns. Assert ids/kinds intact.
  for (const item of items) {
    const snap = proseSnap.get(item.id);
    if (!snap) continue;
    // If no banned nouns in original, prose must match exactly
    if (
      !BANNED_COPY.test(snap.title) &&
      !BANNED_COPY.test(snap.take) &&
      !BANNED_COPY.test(snap.why) &&
      !BANNED_COPY.test(snap.move)
    ) {
      item.title = snap.title;
      item.take = snap.take;
      item.why = snap.why;
      item.move = snap.move;
    }
  }

  assertLocks(items, cycleId, leadId);

  const source = `free-ingest digest refresh ${at} · cycle ${cycleId} · lead ${leadId}`;

  return { items, dropped, at, source, cycleId, leadId };
}

/** Non-Dropped section text blob for civilization / banned checks. */
export function nonDroppedCopy(items: DigestItem[]): string {
  return items
    .filter((i) => i.kind !== "drop")
    .map((i) =>
      [
        i.title,
        i.take,
        i.why,
        i.move,
        i.doneWhen,
        i.unlockIf,
        ...i.evidence,
        ...i.steps,
        ...i.refs.map((r) => r.label),
      ].join("\n"),
    )
    .join("\n");
}
