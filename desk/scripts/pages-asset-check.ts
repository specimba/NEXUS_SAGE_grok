#!/usr/bin/env bun
/**
 * Pages pre-push asset gate (fail closed). Born from gh-pages f286e1c (2026-10-06 02:41): index.html used
 * next/font class __variable_0466e9 but the CSS it linked (byte-identical to the previous publish, served from the
 * shared .next webpack cache) only defined __variable_210582 ⇒ body fell back to Times New Roman, every file 200.
 *   bun scripts/pages-asset-check.ts <dir> [basePath=/NEXUS_SAGE_grok]
 * For EACH *.html in <dir>:
 *  1. every hashed _next/static/... URL it references (attrs, inline RSC payload) exists in <dir> after stripping
 *     basePath; so does every _next/static URL referenced by the CSS/JS files it links (url(), "static/..." literals);
 *  2. every __variable_* class used by the HTML, and by the JS chunks it links, is DEFINED (as a selector) in the
 *     CSS files THAT SAME HTML links — not merely somewhere in the tree.
 * index.txt (RSC payload) refs are checked for existence too. Exit 1 with the problems listed; exit 0 when clean.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

export type AssetCheck = { ok: boolean; errors: string[]; checked: { html: number; css: number; classes: number; refs: number } };

const walk = (d: string): string[] =>
  readdirSync(d).flatMap((n) => {
    const p = join(d, n);
    return statSync(p).isDirectory() ? (n === ".git" ? [] : walk(p)) : [p];
  });

/** `/NEXUS_SAGE_grok/_next/static/x` | `/_next/static/x` | `static/x` (RSC, relative to /_next/) → `_next/static/x` */
export function toTreePath(ref: string, basePath: string): string | null {
  let r = ref.replace(/\\+$/, "").split(/[?#]/)[0];
  try { r = decodeURIComponent(r); } catch {}
  if (basePath && r.startsWith(basePath + "/")) r = r.slice(basePath.length);
  if (r.startsWith("/_next/static/")) return r.slice(1);
  if (r.startsWith("_next/static/")) return r;
  if (/^static\/(chunks|css|media)\//.test(r)) return "_next/" + r;
  return null;
}

const REF_RE = /(?:\/[A-Za-z0-9_.-]+)?\/_next\/static\/[^"'\s\\)<>,]+|(?<=["'(])static\/(?:chunks|css|media)\/[^"'\s\\)<>,]+/g;
export const refsIn = (text: string, basePath: string) =>
  [...new Set([...text.matchAll(REF_RE)].map((m) => toTreePath(m[0], basePath)).filter((x): x is string => !!x))];
export const classesUsed = (text: string) => [...new Set(text.match(/__variable_[0-9a-f]{6}\b/g) ?? [])];
export const classesDefined = (css: string) =>
  new Set([...css.matchAll(/\.(__variable_[0-9a-f]{6})(?=[\s{,:.>+~\[)])/g)].map((m) => m[1]));
const linked = (html: string, basePath: string, rel: "css" | "js") => {
  const re = rel === "css" ? /<link\b[^>]*rel="stylesheet"[^>]*>/g : /<script\b[^>]*\bsrc="[^"]+"[^>]*>/g;
  return [...new Set((html.match(re) ?? []).map((t) => /(?:href|src)="([^"]+)"/.exec(t)?.[1] ?? "")
    .map((h) => toTreePath(h, basePath)).filter((x): x is string => !!x))];
};

export function checkAssets(dir: string, basePath = "/NEXUS_SAGE_grok"): AssetCheck {
  const errors: string[] = [];
  const files = walk(dir);
  const htmls = files.filter((f) => f.endsWith(".html"));
  const has = (p: string) => existsSync(join(dir, p));
  const rd = (p: string) => readFileSync(join(dir, p), "utf8");
  let nCss = 0, nCls = 0, nRefs = 0;
  if (!htmls.length) errors.push(`no *.html in ${dir}`);
  for (const f of files.filter((x) => x.endsWith(".txt"))) {
    const name = relative(dir, f);
    for (const r of refsIn(readFileSync(f, "utf8"), basePath)) { nRefs++; if (!has(r)) errors.push(`${name}: missing ${r}`); }
  }
  for (const f of htmls) {
    const name = relative(dir, f);
    const html = readFileSync(f, "utf8");
    for (const r of refsIn(html, basePath)) { nRefs++; if (!has(r)) errors.push(`${name}: missing ${r}`); }
    const css = linked(html, basePath, "css").filter(has);
    const js = linked(html, basePath, "js").filter(has);
    const defined = new Set<string>();
    for (const c of css) {
      nCss++;
      const t = rd(c);
      classesDefined(t).forEach((k) => defined.add(k));
      for (const r of refsIn(t, basePath)) { nRefs++; if (!has(r)) errors.push(`${name} → ${c}: missing ${r}`); }
    }
    for (const j of js) for (const r of refsIn(rd(j), basePath)) { nRefs++; if (!has(r)) errors.push(`${name} → ${j}: missing ${r}`); }
    const used = new Map<string, string>();
    classesUsed(html).forEach((k) => used.set(k, name));
    for (const j of js) classesUsed(rd(j)).forEach((k) => used.has(k) || used.set(k, j));
    for (const [k, where] of used) {
      nCls++;
      if (!defined.has(k)) errors.push(`${name}: class ${k} (used in ${where}) not defined in its linked CSS [${css.join(", ") || "none"}] (defines: ${[...defined].join(" ") || "none"})`);
    }
  }
  return { ok: errors.length === 0, errors, checked: { html: htmls.length, css: nCss, classes: nCls, refs: nRefs } };
}

if (import.meta.main) {
  const dir = process.argv[2];
  if (!dir || !existsSync(dir)) { console.error("usage: bun scripts/pages-asset-check.ts <dir> [basePath]"); process.exit(2); }
  const r = checkAssets(dir, process.argv[3] ?? "/NEXUS_SAGE_grok");
  const c = r.checked;
  if (!r.ok) { console.error(`pages-asset-check FAIL (${r.errors.length})`); for (const e of r.errors.slice(0, 20)) console.error(" - " + e); process.exit(1); }
  console.log(`pages-asset-check OK — ${c.html} html · ${c.css} linked css · ${c.classes} font classes defined · ${c.refs} _next/static refs present`);
}
