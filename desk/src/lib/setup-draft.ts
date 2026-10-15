/**
 * PASS-C3.2/C3.3 — the Setup editor's draft model. Pure (no DOM, no storage, no network): setup-editor.tsx wires it to
 * localStorage["sage-setup-draft-v1"] and the clipboard. The draft is a clone of the COMMITTED file
 * (SAGE_SETUP.config), edited path by path, so copy JSON keeps the file's key order and the GitHub diff shows only edits.
 * Box-only sources (limits.box_only) always come from the committed file — a tampered localStorage cannot change them.
 * PASS-S1 note: new source blocks / lists render from limits (source_ids, ceilings, feeds, keyword_lists) — no edits here.
 */
import { fileJson, isObj, validateWithRules, type SageLimits, type ValidateResult } from "./sage-config-rules";

export const DRAFT_KEY = "sage-setup-draft-v1";
export const GITHUB_EDIT_URL = "https://github.com/specimba/NEXUS_SAGE_grok/edit/main/desk/config/sage-sources.json";
export const TIMEOUT_MIN = 3;

type Obj = Record<string, unknown>;
export type Draft = Obj;
export type StoredDraft = { base_hash: string; config: Draft };

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
const srcOf = (d: Obj, id: string): Obj | undefined => {
  const s = d.sources;
  return isObj(s) && isObj(s[id]) ? (s[id] as Obj) : undefined;
};

/** The base the editor starts from: the committed file, or the code defaults if the file did not parse. */
export function committedBase(config: unknown, limits: SageLimits): Draft {
  return clone(isObj(config) ? config : (limits.defaults as unknown as Obj));
}

/** Box-only blocks back to the committed value; taste.weight clamped to 0…max (step 0.05). */
export function sanitizeDraft(d: Draft, base: Draft, limits: SageLimits): Draft {
  const out = clone(d);
  if (isObj(out.sources)) {
    const s = out.sources as Obj;
    for (const id of limits.box_only) {
      const b = srcOf(base, id);
      if (b) s[id] = clone(b);
      else delete s[id];
    }
  }
  if (isObj(out.taste) && typeof (out.taste as Obj).weight === "number") (out.taste as Obj).weight = clampTaste((out.taste as Obj).weight as number, limits);
  return out;
}

export function clampTaste(v: number, limits: SageLimits): number {
  const w = Math.min(limits.taste_max, Math.max(0, Number.isFinite(v) ? v : 0));
  return Math.round(w * 100) / 100;
}

/** Parse localStorage text → stored draft (null when absent/garbled); `stale` = base_hash ≠ the page's file_hash. */
export function loadStored(text: string | null, fileHash: string, base: Draft, limits: SageLimits): { draft: Draft; stale: boolean; base_hash: string } | null {
  if (!text) return null;
  let v: unknown;
  try {
    v = JSON.parse(text);
  } catch {
    return null;
  }
  if (!isObj(v) || typeof v.base_hash !== "string" || !isObj(v.config)) return null;
  return { draft: sanitizeDraft(v.config as Draft, base, limits), stale: v.base_hash !== fileHash, base_hash: v.base_hash };
}

export function storeText(d: Draft, fileHash: string): string {
  return JSON.stringify({ base_hash: fileHash, config: d } satisfies StoredDraft);
}

/** Effective value at sources.<id>.<field>: the draft's own value, else the code default. */
export function srcVal(d: Draft, id: string, field: string, limits: SageLimits): unknown {
  const s = srcOf(d, id);
  if (s && field in s) return s[field];
  return ((limits.defaults.sources as unknown as Record<string, Obj>)[id] || {})[field];
}

export function listVal(d: Draft, list: string, limits: SageLimits): string[] {
  const k = d.keywords;
  const v = isObj(k) ? (k as Obj)[list] : undefined;
  if (Array.isArray(v)) return v.map(String);
  return [...((limits.defaults.keywords as unknown as Record<string, string[]>)[list] || [])];
}

export function tasteVal(d: Draft, limits: SageLimits): number {
  const t = d.taste;
  const w = isObj(t) ? (t as Obj).weight : undefined;
  return typeof w === "number" ? w : limits.defaults.taste.weight;
}

function setSrc(d: Draft, id: string, field: string, v: unknown): Draft {
  const out = clone(d);
  if (!isObj(out.sources)) out.sources = {};
  const s = out.sources as Obj;
  if (!isObj(s[id])) s[id] = {};
  (s[id] as Obj)[field] = v;
  return out;
}

export const isBoxOnly = (id: string, limits: SageLimits) => limits.box_only.includes(id);

export function toggleOn(d: Draft, id: string, limits: SageLimits): Draft {
  if (isBoxOnly(id, limits)) return d;
  return setSrc(d, id, "on", !srcVal(d, id, "on", limits));
}

export function capBounds(id: string, field: string, limits: SageLimits): [number, number] {
  return [field === "timeout_s" ? TIMEOUT_MIN : 1, (limits.ceilings[id] || {})[field] || 1];
}

/** Stepper: value ± delta, clamped to [min, ceiling] — never writes an out-of-bounds number. */
export function stepCap(d: Draft, id: string, field: string, delta: number, limits: SageLimits): Draft {
  if (isBoxOnly(id, limits) || !(limits.ceilings[id] || {})[field]) return d;
  const [lo, hi] = capBounds(id, field, limits);
  const cur = Number(srcVal(d, id, field, limits));
  const next = Math.min(hi, Math.max(lo, Math.round((Number.isFinite(cur) ? cur : lo) + delta)));
  return next === cur ? d : setSrc(d, id, field, next);
}

/** Wired feeds only; re-adding keeps the committed/wired order. */
export function toggleFeed(d: Draft, id: string, feed: string, base: Draft, limits: SageLimits): Draft {
  const wired = limits.feeds[id];
  if (!wired || !wired.includes(feed) || isBoxOnly(id, limits)) return d;
  const cur = (srcVal(d, id, "feeds", limits) as string[] | undefined) || [];
  const order = [...new Set([...((srcVal(base, id, "feeds", limits) as string[] | undefined) || []), ...wired])];
  const next = cur.includes(feed) ? cur.filter((f) => f !== feed) : order.filter((f) => f === feed || cur.includes(f));
  return setSrc(d, id, "feeds", next);
}

function setList(d: Draft, list: string, terms: string[]): Draft {
  const out = clone(d);
  if (!isObj(out.keywords)) out.keywords = {};
  (out.keywords as Obj)[list] = terms;
  return out;
}

/** Baseline lead-list terms carry no ×. */
export const removable = (list: string, term: string, limits: SageLimits) => !(limits.baseline[list] || []).includes(term);

/** Add a term (trimmed). Duplicates/empty are ignored; anything else goes in and the rules flag it (amber, blocks copy). */
export function addTerm(d: Draft, list: string, raw: string, limits: SageLimits): Draft {
  const t = raw.trim();
  const cur = listVal(d, list, limits);
  if (!t || cur.includes(t)) return d;
  return setList(d, list, [...cur, t]);
}

export function removeTerm(d: Draft, list: string, term: string, limits: SageLimits): Draft {
  if (!removable(list, term, limits)) return d;
  return setList(d, list, listVal(d, list, limits).filter((t) => t !== term));
}

export function setTaste(d: Draft, v: number, limits: SageLimits): Draft {
  const out = clone(d);
  if (!isObj(out.taste)) out.taste = {};
  (out.taste as Obj).weight = clampTaste(v, limits);
  return out;
}

export const validateDraft = (d: Draft, limits: SageLimits): ValidateResult => validateWithRules(d, limits);

/** copy JSON: the committed file's format (null while invalid — copy/open stay disabled). */
export function copyText(d: Draft, limits: SageLimits): string | null {
  return validateDraft(d, limits).ok ? fileJson(d) : null;
}

const fmt = (v: unknown) => (v === undefined ? "∅" : Array.isArray(v) ? "[" + v.length + "]" : String(v));
const listDiff = (out: string[], p: string, a: unknown, b: unknown) => {
  const A = Array.isArray(a) ? a.map(String) : [];
  const B = Array.isArray(b) ? b.map(String) : [];
  for (const x of B) if (!A.includes(x)) out.push(p + " +" + JSON.stringify(x));
  for (const x of A) if (!B.includes(x)) out.push(p + " -" + JSON.stringify(x));
};

/** Human diff for the commit message: `gnews.on true→false`, `ai_terms +"mixture of experts"`. */
export function humanDiff(base: Draft, d: Draft, limits: SageLimits): string[] {
  const out: string[] = [];
  for (const id of limits.source_ids) {
    for (const f of new Set([...Object.keys(srcOf(base, id) || {}), ...Object.keys(srcOf(d, id) || {})])) {
      const a = srcVal(base, id, f, limits);
      const b = srcVal(d, id, f, limits);
      const p = id + "." + f;
      if (Array.isArray(a) || Array.isArray(b)) listDiff(out, p, a, b);
      else if (JSON.stringify(a) !== JSON.stringify(b)) out.push(p + " " + fmt(a) + "→" + fmt(b));
    }
  }
  for (const k of limits.keyword_lists) listDiff(out, k, listVal(base, k, limits), listVal(d, k, limits));
  const ta = tasteVal(base, limits);
  const tb = tasteVal(d, limits);
  if (ta !== tb) out.push("taste.weight " + ta + "→" + tb);
  // Anything the views above do not model (tampered keys) still counts — compare the whole file text.
  if (!out.length && fileJson(base) !== fileJson(d)) out.push("other fields changed");
  return out;
}

export { setupRoute } from "./setup-route";

