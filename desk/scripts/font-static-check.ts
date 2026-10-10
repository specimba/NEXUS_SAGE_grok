#!/usr/bin/env bun
/**
 * Static font gate for CI (no browser): bun scripts/font-static-check.ts <out-dir> <basePath>
 * Used by pages-publish.sh when SAGE_FONT_CHECK=static (GitLab CI; node:22 image has no Chrome).
 * The box keeps the headless font-check.ts. Fails unless:
 *  - out-dir has ≥1 font file (woff2/woff/ttf/otf);
 *  - the built CSS has @font-face rules for Share Tech Mono and JetBrains Mono (spaced or hashed next/font names);
 *  - every url() in every built CSS file (except data:) starts with <basePath>/ and resolves to an existing file.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const [out, base = "/NEXUS_SAGE_grok"] = process.argv.slice(2);
if (!out || !existsSync(out)) { console.error(`font-static FAIL\n - out dir missing: ${out}`); process.exit(1); }
const walk = (d: string): string[] => readdirSync(d).flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? walk(p) : [p]; });
const files = walk(out);
const fails: string[] = [];
const fonts = files.filter((f) => /\.(woff2?|ttf|otf)$/i.test(f));
if (!fonts.length) fails.push("no font files in out dir");
const css = files.filter((f) => f.endsWith(".css"));
if (!css.length) fails.push("no CSS in out dir");
let faces = "";
let urls = 0;
for (const f of css) {
  const t = readFileSync(f, "utf8");
  for (const m of t.matchAll(/@font-face\s*\{[^}]*\}/g)) faces += m[0] + "\n";
  for (const m of t.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) {
    const u = m[1].trim();
    if (/^(data:|#|%23)/i.test(u)) continue; // inline data / SVG fragment refs
    urls++;
    if (!u.startsWith(base + "/")) { fails.push(`${f.slice(out.length)}: url(${u}) not under ${base}/`); continue; }
    const p = join(out, decodeURIComponent(u.slice(base.length).split(/[?#]/)[0]));
    if (!existsSync(p)) fails.push(`${f.slice(out.length)}: url(${u}) → missing ${p.slice(out.length)}`);
  }
}
for (const fam of [/Share[ _]Tech[ _]Mono/, /JetBrains[ _]Mono/]) {
  const real = [...faces.matchAll(/font-family:\s*["']?([^;"'}]+)/g)].map((m) => m[1]).filter((n) => fam.test(n) && !/Fallback/i.test(n));
  if (!real.length) fails.push(`no non-Fallback @font-face for ${fam.source}`);
}
if (fails.length) { console.error(`font-static FAIL (${fails.length})`); for (const f of [...new Set(fails)].slice(0, 20)) console.error(" -", f); process.exit(1); }
console.log(`font-static OK · ${fonts.length} font files · ${urls} CSS url() resolved under ${base}/ · ${css.length} CSS`);
