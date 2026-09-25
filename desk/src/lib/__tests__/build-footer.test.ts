import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { footerStamp } from "@/lib/build-footer";

const DESK = join(import.meta.dir, "../../..");
function stampWith(env: Record<string, string>) {
  const clean = { ...process.env };
  for (const k of ["CF_PAGES_COMMIT_SHA", "GITHUB_SHA", "SAGE_CRAWL_COMMIT", "SAGE_REPO_URL", "SAGE_BUILD_ID"]) delete clean[k];
  const p = Bun.spawnSync(["bun", "scripts/build-stamp.mjs", "--print"], { cwd: DESK, env: { ...clean, ...env } });
  if (p.exitCode !== 0) throw new Error(p.stderr.toString());
  return JSON.parse(p.stdout.toString().trim().split("\n").pop()!);
}
function git(args: string[]) {
  return Bun.spawnSync(["git", ...args], { cwd: DESK }).stdout.toString().trim();
}

describe("B2 build stamp footer", () => {
  test("source commit: CF_PAGES_COMMIT_SHA wins, else git rev-parse HEAD", () => {
    expect(stampWith({ CF_PAGES_COMMIT_SHA: "1234567890abcdef1234567890abcdef12345678" }).commit).toBe("1234567890abcdef1234567890abcdef12345678");
    expect(stampWith({}).commit).toBe(git(["rev-parse", "HEAD"]));
  });

  test("crawl commit: SAGE_CRAWL_COMMIT wins, else the last commit touching artifacts/sage/CURRENT.json", () => {
    expect(stampWith({ SAGE_CRAWL_COMMIT: "feedfacefeedfacefeedfacefeedfacefeedface" }).crawlCommit).toBe("feedfacefeedfacefeedfacefeedfacefeedface");
    expect(stampWith({}).crawlCommit).toBe(git(["log", "-1", "--format=%H", "--", "artifacts/sage/CURRENT.json"]));
  });

  test("repo URL is a constant (never git remote — an HTTPS remote can carry a token)", () => {
    const s = stampWith({});
    expect(s.repoUrl).toBe("https://github.com/specimba/NEXUS_SAGE_grok");
    expect(s.repoUrl).not.toContain("@");
    expect(readFileSync(join(DESK, "scripts/build-stamp.mjs"), "utf8")).not.toMatch(/"remote"/);
  });

  test("format + Istanbul clock + links", () => {
    const f = footerStamp({
      commit: "9754d34aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      crawlCommit: "0dffa0cbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      builtAt: "2026-09-25T11:22:00Z",
      crawlAt: "2026-09-25T11:16:08Z",
      repoUrl: "https://github.com/specimba/NEXUS_SAGE_grok/",
    });
    expect(f.text).toBe("build 9754d34 · deployed 14:22 · crawl 14:16 UTC+3");
    expect(f.commitHref).toBe("https://github.com/specimba/NEXUS_SAGE_grok/commit/9754d34aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    expect(f.crawlHref).toBe("https://github.com/specimba/NEXUS_SAGE_grok/commit/0dffa0cbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb");
    const none = footerStamp({ commit: "", crawlCommit: "", builtAt: "", crawlAt: "", repoUrl: "" });
    expect(none.text).toBe("build nogit · deployed — · crawl — UTC+3");
    expect(none.commitHref).toBeNull();
  });

  test("CSS: --muted-foreground, no hex", () => {
    const css = readFileSync(join(DESK, "src/app/globals.css"), "utf8");
    const block = css.slice(css.indexOf("/* B2 build stamp footer"));
    expect(block).toMatch(/color: var\(--muted-foreground\)/);
    expect(block).not.toMatch(/#[0-9a-f]{3,8}\b/i);
  });
});
