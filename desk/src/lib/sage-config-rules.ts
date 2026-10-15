/**
 * PASS-C3.1 — the PASS-C2 config rules as one pure module shared by the browser (Setup editor, lazy chunk) and CI
 * (crawl-start validateSageConfig). NO imports from ingest libs (lead-pick, gmail-news, rss-*, …): every number,
 * id list and baseline term arrives in `limits` — from code at crawl time (sage-config.ts limitsFromCode) and from
 * SAGE_SETUP.limits (written by scripts/desk-view.ts from the same code) in the browser.
 * PASS-S1 note: new source blocks / keyword lists slot in through limits.source_ids / ceilings / feeds / keyword_lists.
 */
import type { SageConfig } from "./sage-config-types";

export type SageLimits = {
  schema: 1;
  /** Source ids in file order. */
  source_ids: string[];
  /** Code defaults (missing optional fields inherit these). */
  defaults: SageConfig;
  /** Numeric field → hard ceiling, per source (min is `fieldMin(field)`: 1, or TIMEOUT_MIN_S for timeout_s). */
  ceilings: Record<string, Record<string, number>>;
  /** Feed-list fields: source → wired feed ids. */
  feeds: Record<string, string[]>;
  keyword_lists: string[];
  /** Lists whose terms are regex fragments (compile with "i" and "iu"; composed list compiles with "i"). */
  regex_lists: Record<string, { head: string; tail: string }>;
  /** Lead-filter lists: additions-only against these code baseline terms. */
  baseline: Record<string, string[]>;
  keyword_list_max: number;
  keyword_len_max: number;
  taste_max: number;
  /** Sources the browser editor never changes (box-only; edit by commit). */
  box_only: string[];
};

/**
 * PASS-C3 ruling (4): the timeout_s floor (seconds), shared by the CI validator (validateSageConfig) and the browser
 * stepper (setup-draft capBounds) — one constant, so they cannot disagree. Every other numeric field's floor is 1.
 */
export const TIMEOUT_MIN_S = 3;
export const fieldMin = (field: string): number => (field === "timeout_s" ? TIMEOUT_MIN_S : 1);

export type ValidateResult = { ok: true; config: SageConfig; warnings: string[] } | { ok: false; errors: string[] };

const SECRET_KEY = /token|secret|cookie|passw|bearer|auth|api[_-]?key|session/i;
const SECRET_VALUE = /\b(ghp_|gho_|github_pat_|glpat-|xox[abp]-|sk-[a-z0-9]{8}|AKIA[0-9A-Z]{8})/i;

export function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function scanSecrets(v: unknown, path: string, errors: string[]) {
  if (typeof v === "string") {
    if (SECRET_VALUE.test(v)) errors.push(path + ": looks like a secret value");
  } else if (Array.isArray(v)) {
    v.forEach((x, i) => scanSecrets(x, path + "[" + i + "]", errors));
  } else if (isObj(v)) {
    for (const [k, x] of Object.entries(v)) {
      if (SECRET_KEY.test(k)) errors.push(path + "." + k + ": secret-like key not allowed in config");
      scanSecrets(x, path + "." + k, errors);
    }
  }
}

const compiles = (src: string, flags: string) => {
  try {
    new RegExp(src, flags);
    return true;
  } catch {
    return false;
  }
};

/** One regex rule everywhere: "(?:t)" with "i" (ingest flags) AND with "iu" (stricter lint). */
export function regexTermError(list: string, t: string): string | null {
  if (!compiles("(?:" + t + ")", "i")) return "keywords." + list + ": invalid regex fragment " + JSON.stringify(t);
  if (!compiles("(?:" + t + ")", "iu")) return "keywords." + list + ": invalid regex fragment " + JSON.stringify(t) + " (fails the \"iu\" lint)";
  return null;
}

/** Validate a parsed config against "limits". Missing optional fields inherit defaults; anything unknown or out of bounds rejects the file. */
export function validateWithRules(raw: unknown, limits: SageLimits): ValidateResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const out = JSON.parse(JSON.stringify(limits.defaults)) as SageConfig;
  if (!isObj(raw)) return { ok: false, errors: ["config is not a JSON object"] };
  scanSecrets(raw, "$", errors);
  for (const k of Object.keys(raw)) {
    if (!["schema", "sources", "keywords", "taste", "$comment"].includes(k)) errors.push("unknown top-level key \"" + k + "\"");
  }
  if (raw.schema !== limits.schema) errors.push("schema must be " + limits.schema);

  const ceil = limits.ceilings;
  if (raw.sources !== undefined) {
    if (!isObj(raw.sources)) errors.push("sources must be an object");
    else {
      for (const [id, v] of Object.entries(raw.sources)) {
        if (!limits.source_ids.includes(id)) {
          errors.push("unknown source \"" + id + "\" (no new providers by JSON)");
          continue;
        }
        if (!isObj(v)) {
          errors.push("sources." + id + " must be an object");
          continue;
        }
        const target = (out.sources as Record<string, Record<string, unknown>>)[id]!;
        for (const [field, val] of Object.entries(v)) {
          const where = "sources." + id + "." + field;
          if (field === "on") {
            if (typeof val !== "boolean") errors.push(where + " must be true/false");
            else target.on = val;
          } else if (field === "feeds" && limits.feeds[id]) {
            if (!Array.isArray(val) || val.length === 0) {
              errors.push(where + " must be a non-empty list (use \"on\": false to drop the source)");
              continue;
            }
            const wired = limits.feeds[id]!;
            const bad = val.filter((f) => typeof f !== "string" || !wired.includes(f));
            if (bad.length) errors.push(where + ": feed id(s) not wired in code: " + bad.map(String).join(", "));
            else if (new Set(val).size !== val.length) errors.push(where + ": duplicate feed id");
            else target.feeds = [...val];
          } else if (field in (ceil[id] || {})) {
            const max = ceil[id]![field]!;
            if (typeof val !== "number" || !Number.isInteger(val)) errors.push(where + " must be an integer");
            else if (val < fieldMin(field))
              errors.push(where + (fieldMin(field) === 1 ? " must be ≥ 1 (use \"on\": false to drop the source)" : " must be ≥ " + fieldMin(field)));
            else if (val > max) errors.push(where + "=" + val + " over the code ceiling " + max);
            else target[field] = val;
          } else {
            errors.push("unknown field " + where);
          }
        }
      }
    }
  }

  if (raw.keywords !== undefined) {
    if (!isObj(raw.keywords)) errors.push("keywords must be an object");
    else {
      for (const [k, v] of Object.entries(raw.keywords)) {
        if (!limits.keyword_lists.includes(k)) {
          errors.push("unknown keyword list \"" + k + "\"");
          continue;
        }
        if (!Array.isArray(v) || v.length === 0) {
          errors.push("keywords." + k + " must be a non-empty list");
          continue;
        }
        if (v.length > limits.keyword_list_max) errors.push("keywords." + k + ": more than " + limits.keyword_list_max + " entries");
        const bad = v.filter((t) => typeof t !== "string" || !t.trim() || t.length > limits.keyword_len_max);
        if (bad.length) {
          errors.push("keywords." + k + ": entries must be non-empty strings ≤ " + limits.keyword_len_max + " chars");
          continue;
        }
        const terms = v as string[];
        const rx = limits.regex_lists[k];
        if (rx) {
          let termsOk = true;
          for (const t of terms) {
            const e = regexTermError(k, t);
            if (e) {
              errors.push(e);
              termsOk = false;
            }
          }
          if (termsOk && !compiles(rx.head + terms.join("|") + rx.tail, "i")) errors.push("keywords." + k + ": the list does not compile as one regex");
        }
        for (const t of limits.baseline[k] || []) {
          if (!terms.includes(t)) errors.push("keywords." + k + ": removing " + JSON.stringify(t) + " is a lead rule change — code PR + Reviewer only");
        }
        (out.keywords as Record<string, string[]>)[k] = [...terms];
      }
    }
  }

  if (raw.taste !== undefined) {
    if (!isObj(raw.taste)) errors.push("taste must be an object");
    else {
      for (const [k, v] of Object.entries(raw.taste)) {
        if (k === "weight") {
          if (typeof v !== "number" || !Number.isFinite(v)) errors.push("taste.weight must be a number");
          else {
            const w = Math.min(limits.taste_max, Math.max(0, v));
            if (w !== v) warnings.push("taste.weight " + v + " clamped to " + w);
            out.taste.weight = w;
          }
        } else if (k === "max") {
          if (v !== limits.taste_max) errors.push("taste.max is fixed in code at " + limits.taste_max);
        } else errors.push("unknown field taste." + k);
      }
    }
  }

  return errors.length ? { ok: false, errors } : { ok: true, config: out, warnings };
}

/** Stable JSON (sorted keys) — the input to config_hash. */
export function canonicalJson(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(canonicalJson).join(",")}]`;
  if (isObj(v)) {
    return `{${Object.keys(v)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canonicalJson(v[k])}`)
      .join(",")}}`;
  }
  return JSON.stringify(v);
}

/** The committed file's own format: 2-space indent, file key order, trailing newline (copy JSON output). */
export function fileJson(v: unknown): string {
  return `${JSON.stringify(v, null, 2)}\n`;
}
