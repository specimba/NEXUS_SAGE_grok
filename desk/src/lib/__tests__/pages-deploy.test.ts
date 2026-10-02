import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const desk = resolve(import.meta.dir, "../../..");
const read = (p: string) => readFileSync(resolve(desk, p), "utf8");

describe("GitHub Pages build (PAGES=1 → /NEXUS_SAGE_grok, desk/out-pages)", () => {
  test("next.config: basePath + out-pages only when PAGES=1; site URL env; no metadataBase", () => {
    const cfg = read("next.config.ts");
    expect(cfg).toContain('const PAGES_BASE_PATH = "/NEXUS_SAGE_grok"');
    expect(cfg).toMatch(/process\.env\.PAGES === "1"/);
    expect(cfg).toMatch(/pages \? \{ basePath: PAGES_BASE_PATH, distDir: "out-pages" \} : \{\}/);
    expect(cfg).toContain("https://specimba.github.io${PAGES_BASE_PATH}");
    expect(cfg).not.toMatch(/metadataBase\s*:/);
  });
  test("layout: favicon carries the base path; OG / canonical are absolute from SAGE_SITE_URL; no metadataBase", () => {
    const lay = read("src/app/layout.tsx");
    expect(lay).toContain("url: `${BASE_PATH}/favicon.svg`");
    expect(lay).toContain("url: `${SITE_URL}/og.jpg`");
    expect(lay).toContain("images: [`${SITE_URL}/og.jpg`]");
    expect(lay).toContain("canonical: `${SITE_URL}/`");
    expect(lay).not.toMatch(/metadataBase\s*:/);
    expect(lay).not.toMatch(/url: "\//);
  });
  test("font vars sit on <html> (not <body>) so @theme --font-mono resolves at :root", () => {
    const lay = read("src/app/layout.tsx");
    expect(lay).toMatch(/<html[^>]*\$\{shareTech\.variable\} \$\{jetbrains\.variable\}/);
    expect(lay).not.toMatch(/<body[^>]*variable/);
  });
  test("pages-publish.sh: fail-closed checks, .nojekyll, fast-forward only, never force", () => {
    const sh = read("scripts/pages-publish.sh");
    expect(sh).toContain("set -euo pipefail");
    expect(sh).toContain('.nojekyll');
    expect(sh).toContain("--ff-only");
    expect(sh).toMatch(/git push -q origin "\$BRANCH:\$BRANCH"/);
    expect(sh).not.toMatch(/push[^\n]*(--force|-f\b|\+\$BRANCH|\+gh-pages)/);
    expect(sh).not.toMatch(/reset --hard|commit --amend|rebase/);
    expect(sh).not.toMatch(/add -A|add --all/);
    for (const c of ["/home/box", "token-like", "secret-gate.sh", "unexpected files", "unprefixed HTML refs"]) expect(sh).toContain(c);
    const pkg = JSON.parse(read("package.json"));
    expect(pkg.scripts["pages:publish"]).toBe("bash scripts/pages-publish.sh");
  });
  test("out-pages is gitignored", () => {
    expect(read(".gitignore")).toMatch(/^\/out-pages\/$/m);
  });
});
