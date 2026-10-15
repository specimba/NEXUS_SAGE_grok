import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

// pages-checked-push.sh (the changed=false path) against a local bare "origin": never touches main, fast-forward only,
// exit 0, the desk's state file is left byte-identical, and an unchanged last-checked.json pushes nothing.
const real = resolve(import.meta.dir, "../../../scripts/pages-checked-push.sh");
const ENV = {
  PATH: process.env.PATH ?? "/usr/bin:/bin", HOME: process.env.HOME ?? "/tmp", GIT_CONFIG_NOSYSTEM: "1", GIT_CONFIG_GLOBAL: "/dev/null",
  GIT_AUTHOR_NAME: "t", GIT_AUTHOR_EMAIL: "t@t", GIT_COMMITTER_NAME: "t", GIT_COMMITTER_EMAIL: "t@t", GIT_TERMINAL_PROMPT: "0",
};
const git = (cwd: string, ...a: string[]) => {
  const r = spawnSync("git", a, { cwd, env: ENV, encoding: "utf8" });
  if (r.status !== 0) throw new Error(`git ${a.join(" ")}: ${r.stderr}`);
  return r.stdout.trim();
};
const lc = (at: string) => JSON.stringify({ checked_at: at, last_run: "skipped", soft_history: [], gate_error: null }, null, 2) + "\n";

function fixture(pagesAt: string, deskAt: string) {
  const root = mkdtempSync(join(tmpdir(), "checked-push-"));
  const bare = join(root, "origin.git");
  git(root, "init", "-q", "--bare", "-b", "main", bare);
  // seed origin: main (repo with desk/) and gh-pages (site with index.html + last-checked.json)
  const seed = join(root, "seed");
  git(root, "init", "-q", "-b", "main", seed);
  mkdirSync(join(seed, "desk/scripts"), { recursive: true });
  writeFileSync(join(seed, "desk/README"), "main\n");
  git(seed, "add", "-A"); git(seed, "commit", "-q", "-m", "main");
  git(seed, "checkout", "-q", "--orphan", "gh-pages"); git(seed, "rm", "-rq", "--cached", ".");
  rmSync(join(seed, "desk"), { recursive: true, force: true });
  writeFileSync(join(seed, "index.html"), "<html>site</html>\n");
  writeFileSync(join(seed, "last-checked.json"), lc(pagesAt));
  git(seed, "add", "index.html", "last-checked.json"); git(seed, "commit", "-q", "-m", "pages: publish");
  git(seed, "push", "-q", `file://${bare}`, "main", "gh-pages");
  // CI-like clone: depth-1, main only, the script copied in, a fresh last-checked.json in desk/artifacts/sage
  const repo = join(root, "repo");
  git(root, "clone", "-q", "--depth", "1", "--branch", "main", `file://${bare}`, repo);
  mkdirSync(join(repo, "desk/scripts"), { recursive: true });
  copyFileSync(real, join(repo, "desk/scripts/pages-checked-push.sh"));
  mkdirSync(join(repo, "desk/artifacts/sage"), { recursive: true });
  writeFileSync(join(repo, "desk/artifacts/sage/last-checked.json"), lc(deskAt));
  return { root, bare, repo, wt: join(root, "pages") };
}
const ref = (bare: string, r: string) => git(bare, "rev-parse", r);
const run = (f: ReturnType<typeof fixture>) =>
  spawnSync("bash", [join(f.repo, "desk/scripts/pages-checked-push.sh")], { cwd: join(f.repo, "desk"), env: { ...ENV, PAGES_WORKTREE: f.wt, PAGES_FETCH_DEPTH: "1" }, encoding: "utf8" });

describe("pages-checked-push.sh against a local bare repo (changed=false path)", () => {
  test("unchanged last-checked.json → 'no change', exit 0, nothing pushed, state intact", () => {
    const f = fixture("2026-10-15T18:22:00Z", "2026-10-15T18:22:00Z");
    const [main0, pages0] = [ref(f.bare, "main"), ref(f.bare, "gh-pages")];
    const before = readFileSync(join(f.repo, "desk/artifacts/sage/last-checked.json"), "utf8");
    const r = run(f);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("pages-checked-push: no change");
    expect(ref(f.bare, "gh-pages")).toBe(pages0);
    expect(ref(f.bare, "main")).toBe(main0);
    expect(readFileSync(join(f.repo, "desk/artifacts/sage/last-checked.json"), "utf8")).toBe(before);
    expect(git(f.repo, "status", "--porcelain", "--", "desk/artifacts")).toBe("?? desk/artifacts/");
    rmSync(f.root, { recursive: true, force: true });
  });
  test("newer checked_at → one fast-forward commit on gh-pages touching only last-checked.json; main untouched", () => {
    const f = fixture("2026-10-15T18:22:00Z", "2026-10-16T03:22:00Z");
    const [main0, pages0] = [ref(f.bare, "main"), ref(f.bare, "gh-pages")];
    const before = readFileSync(join(f.repo, "desk/artifacts/sage/last-checked.json"), "utf8");
    const r = run(f);
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/pages-checked-push: pushed [0-9a-f]{7}/);
    const pages1 = ref(f.bare, "gh-pages");
    expect(pages1).not.toBe(pages0);
    expect(ref(f.bare, "gh-pages^")).toBe(pages0); // fast-forward, parent = previous head
    expect(git(f.bare, "diff", "--name-only", pages0, pages1)).toBe("last-checked.json");
    expect(git(f.bare, "show", `${pages1}:last-checked.json`)).toBe(before.trim());
    expect(git(f.bare, "show", `${pages1}:index.html`)).toBe("<html>site</html>");
    expect(git(f.bare, "log", "-1", "--format=%s", pages1)).toBe("pages: last-checked 2026-10-16T03:22:00Z [skip ci]");
    expect(ref(f.bare, "main")).toBe(main0);
    expect(readFileSync(join(f.repo, "desk/artifacts/sage/last-checked.json"), "utf8")).toBe(before);
    // a second run with the same file is a no-op
    const r2 = run(f);
    expect(r2.status).toBe(0);
    expect(r2.stdout).toContain("no change");
    expect(ref(f.bare, "gh-pages")).toBe(pages1);
    rmSync(f.root, { recursive: true, force: true });
  });
  test("local gh-pages diverged from origin → FAIL, exit ≠ 0, nothing pushed", () => {
    const f = fixture("2026-10-15T18:22:00Z", "2026-10-16T03:22:00Z");
    expect(run(f).status).toBe(0);
    const pushed = ref(f.bare, "gh-pages");
    git(f.wt, "reset", "-q", "--hard", "HEAD^");
    writeFileSync(join(f.wt, "x.txt"), "local\n"); git(f.wt, "add", "x.txt"); git(f.wt, "commit", "-q", "-m", "local only");
    writeFileSync(join(f.repo, "desk/artifacts/sage/last-checked.json"), lc("2026-10-16T08:22:00Z"));
    const r = run(f);
    expect(r.status).not.toBe(0);
    expect(r.stderr).toContain("pages-checked-push FAIL: local gh-pages diverged");
    expect(ref(f.bare, "gh-pages")).toBe(pushed);
    rmSync(f.root, { recursive: true, force: true });
  });
  test("missing last-checked.json → FAIL, exit 1, origin untouched", () => {
    const f = fixture("2026-10-15T18:22:00Z", "2026-10-16T03:22:00Z");
    rmSync(join(f.repo, "desk/artifacts/sage/last-checked.json"));
    const pages0 = ref(f.bare, "gh-pages");
    const r = run(f);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("pages-checked-push FAIL:");
    expect(ref(f.bare, "gh-pages")).toBe(pages0);
    rmSync(f.root, { recursive: true, force: true });
  });
});
