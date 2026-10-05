import { describe, expect, test } from "bun:test";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { checkAssets, toTreePath } from "../../../scripts/pages-asset-check";
import { tmpCache } from "./tmp-cache";

const B = "/NEXUS_SAGE_grok";
function tree(files: Record<string, string>): string {
  const d = tmpCache("pages-tree");
  for (const [p, c] of Object.entries(files)) {
    mkdirSync(dirname(join(d, p)), { recursive: true });
    writeFileSync(join(d, p), c);
  }
  return d;
}
const html = (cls: string, css = "a.css", extra = "") =>
  `<html class="dark ${cls}"><head><link rel="stylesheet" href="${B}/_next/static/css/${css}" data-precedence="next"/>` +
  `<script src="${B}/_next/static/chunks/main.js" async=""></script>${extra}</head></html>`;
const css = (cls: string) => `.${cls}{--font-jetbrains:'__JetBrains_Mono_abc'}@font-face{src:url(${B}/_next/static/media/f.woff2)}`;
const base = { "_next/static/chunks/main.js": "x", "_next/static/media/f.woff2": "w" };

describe("pages-asset-check (pre-push gate: HTML font classes ⊆ its linked CSS; no missing _next/static)", () => {
  test("clean tree passes", () => {
    const r = checkAssets(tree({ ...base, "index.html": html("__variable_0466e9"), "_next/static/css/a.css": css("__variable_0466e9") }), B);
    expect(r.errors).toEqual([]);
    expect(r.ok).toBe(true);
  });
  test("f286e1c shape fails: HTML class absent from the (present, 200) linked CSS", () => {
    const r = checkAssets(tree({ ...base, "index.html": html("__variable_0466e9"), "_next/static/css/a.css": css("__variable_210582") }), B);
    expect(r.ok).toBe(false);
    expect(r.errors.join("\n")).toContain("__variable_0466e9");
  });
  test("class defined only in an UNLINKED css still fails", () => {
    const r = checkAssets(tree({
      ...base, "index.html": html("__variable_0466e9"),
      "_next/static/css/a.css": css("__variable_210582"), "_next/static/css/other.css": css("__variable_0466e9"),
    }), B);
    expect(r.ok).toBe(false);
  });
  test("class used by a linked JS chunk must be defined too", () => {
    const r = checkAssets(tree({
      ...base, "_next/static/chunks/main.js": 'className:"__variable_210582"',
      "index.html": html("__variable_0466e9"), "_next/static/css/a.css": css("__variable_0466e9"),
    }), B);
    expect(r.ok).toBe(false);
    expect(r.errors.join("\n")).toContain("main.js");
  });
  test("missing linked CSS, missing font media and missing RSC chunk all fail", () => {
    const miss = checkAssets(tree({ ...base, "index.html": html("__variable_0466e9", "gone.css") }), B);
    expect(miss.errors.join("\n")).toContain("missing _next/static/css/gone.css");
    const media = checkAssets(tree({ "_next/static/chunks/main.js": "x", "index.html": html("__variable_0466e9"), "_next/static/css/a.css": css("__variable_0466e9") }), B);
    expect(media.errors.join("\n")).toContain("missing _next/static/media/f.woff2");
    const rsc = checkAssets(tree({ ...base, "index.html": html("__variable_0466e9"), "_next/static/css/a.css": css("__variable_0466e9"), "index.txt": '1:I["static/chunks/909-abc.js"]' }), B);
    expect(rsc.errors.join("\n")).toContain("missing _next/static/chunks/909-abc.js");
  });
  test("basePath is stripped; :3000 tree (no basePath) works", () => {
    expect(toTreePath(`${B}/_next/static/css/a.css`, B)).toBe("_next/static/css/a.css");
    expect(toTreePath("static/media/x.woff2", B)).toBe("_next/static/media/x.woff2");
    expect(toTreePath("/favicon.svg", B)).toBeNull();
    const r = checkAssets(tree({ ...base, "index.html": html("__variable_aa11bb").replaceAll(B, ""), "_next/static/css/a.css": css("__variable_aa11bb").replaceAll(B, "") }), "");
    expect(r.ok).toBe(true);
  });
  test("pages-publish.sh wipes .next + out-pages (never out/) and runs the asset gate + local font-check before push", () => {
    const sh = readFileSync(resolve(import.meta.dir, "../../../scripts/pages-publish.sh"), "utf8");
    expect(sh).toMatch(/rm -rf "\$OUT" "\$DESK\/\.next"/);
    expect(sh).not.toMatch(/rm -rf[^\n]*"\$DESK\/out"/);
    const gate = sh.indexOf("pages-asset-check.ts"), font = sh.indexOf("font-check.ts"), push = sh.indexOf("git push -q origin");
    expect(gate).toBeGreaterThan(0);
    expect(font).toBeGreaterThan(0);
    expect(gate).toBeLessThan(push);
    expect(font).toBeLessThan(push);
  });
});
