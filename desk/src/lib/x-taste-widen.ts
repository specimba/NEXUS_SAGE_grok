/**
 * Intel plan 4 — X taste widening (box-only). Config: desk/config/x-taste-widen.json, taken verbatim from
 * refs/SCOUT-X-WIDEN-OCT24.md. The weekly box routine runs these through the free built-in X connector reads
 * (get_users_by_usernames / search_posts_all / search_news) and saves rows into the capture file that
 * scripts/x-taste-refresh.ts already ingests (surface "feed"). No API keys or credentials; CI never reads X.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export const X_WIDEN_PATH = "config/x-taste-widen.json";
export const X_WIDEN_TOOLS = ["get_users_by_usernames", "search_posts_all", "search_news"] as const;
export const X_WIDEN_BUDGET_MAX = 15;
const HANDLE_RE = /^[A-Za-z0-9_]{1,15}$/;
const SECRETISH = /token|secret|bearer|cookie|password|api[_-]?key|auth/i;

export type XWidenQuery = { id: string; tool: (typeof X_WIDEN_TOOLS)[number]; q: string; tested: boolean; precision?: string; max_age_hours?: number };
export type XWidenConfig = {
  schema: 1;
  box_only: true;
  budget_calls_per_run: number;
  accounts: { handle: string; lane: string }[];
  watch_query: { q: string; max_results: number; tested: boolean };
  story_queries: XWidenQuery[];
  news_queries: XWidenQuery[];
};
export type XWidenCall = { tool: (typeof X_WIDEN_TOOLS)[number]; q: string; id: string };

export function validateXWiden(j: unknown): { ok: true; config: XWidenConfig } | { ok: false; errors: string[] } {
  const e: string[] = [];
  const c = j as XWidenConfig;
  if (!c || c.schema !== 1) e.push("schema must be 1");
  if (c?.box_only !== true) e.push("box_only must be true");
  if (SECRETISH.test(Object.keys(c ?? {}).join(" "))) e.push("credential-like key");
  if (!(c?.budget_calls_per_run >= 1 && c.budget_calls_per_run <= X_WIDEN_BUDGET_MAX)) e.push(`budget 1..${X_WIDEN_BUDGET_MAX}`);
  const hs = new Set<string>();
  for (const a of c?.accounts ?? []) {
    if (!HANDLE_RE.test(a.handle)) e.push(`bad handle ${a.handle}`);
    if (hs.has(a.handle.toLowerCase())) e.push(`dupe handle ${a.handle}`);
    hs.add(a.handle.toLowerCase());
  }
  for (const q of [...(c?.story_queries ?? []), ...(c?.news_queries ?? [])]) {
    if (!(X_WIDEN_TOOLS as readonly string[]).includes(q.tool)) e.push(`${q.id}: tool ${q.tool} not a free read`);
    if (!q.q?.trim() || q.q.length > 512) e.push(`${q.id}: bad query`);
  }
  for (const m of String(c?.watch_query?.q ?? "").matchAll(/from:(\w+)/g)) if (!hs.has(m[1]!.toLowerCase())) e.push(`watch handle ${m[1]} not in accounts`);
  return e.length ? { ok: false, errors: e } : { ok: true, config: c };
}

export function loadXWiden(root: string): XWidenConfig {
  const v = validateXWiden(JSON.parse(readFileSync(resolve(root, X_WIDEN_PATH), "utf8")));
  if (!v.ok) throw new Error(`x-taste-widen: ${v.errors.join("; ")}`);
  return v.config;
}

/** Ordered calls for one run: search_news cards → watch query (only once tested) → story queries; tested only, within budget. */
export function widenPlan(c: XWidenConfig): XWidenCall[] {
  const out: XWidenCall[] = [];
  for (const q of c.news_queries) if (q.tested) out.push({ tool: q.tool, q: q.q, id: q.id });
  if (c.watch_query.tested) out.push({ tool: "search_posts_all", q: c.watch_query.q, id: "watch" });
  for (const q of c.story_queries) if (q.tested) out.push({ tool: q.tool, q: q.q, id: q.id });
  return out.slice(0, c.budget_calls_per_run);
}
