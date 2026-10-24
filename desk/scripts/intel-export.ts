/**
 * Intel plan 5 — box-only Gmail + X snapshot export. Never runs in CI; never touches /workspace/nexus-sage.
 *
 *   bun scripts/intel-export.ts --gmail <gmail-search.json> --x <x-capture.json> [--dry-run]
 *
 * gmail-search.json: a Gmail connector search_threads payload ({ threads: [...] }) saved by the box routine.
 * x-capture.json:    the X taste capture (scripts/x-taste-refresh.ts format) built from the free X reads
 *                    planned by config/x-taste-widen.json (`bun scripts/x-taste-refresh.ts --plan`).
 * Either input may be omitted (that snapshot is left as committed).
 *
 * Steps: fresh `git clone` of origin into a mktemp dir → apply the committed config → re-render ONLY
 * src/data/gmail-news.ts (publisher + link + "via <publisher>", no From / snippet) and the X taste files →
 * `git add` exactly those paths → one commit → fetch, require origin/main to be an ancestor (ff-only) →
 * `git push origin HEAD:main` (never --force). --dry-run stops before commit/push and prints the diffstat.
 * The remote URL is printed with any userinfo masked; tokens come only from the existing git credential setup.
 * Dry-run proof of unpushed code: `--dry-run --clone-from <repo path> --branch <name>` clones that branch instead
 * (only allowed together with --dry-run; a real export always clones origin main).
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const HERE = resolve(import.meta.dir, "..");
export const INTEL_EXPORT_FILES = [
  "desk/src/data/gmail-news.ts",
  "desk/artifacts/sage/x-taste-last.json",
  "desk/src/data/x-taste.ts",
  "desk/src/data/sage-desk-config.ts",
  "desk/artifacts/sage/x-taste-refresh-last.json",
] as const;
const FORBIDDEN_ROOT = "/workspace/nexus-sage";

const arg = (k: string) => {
  const i = process.argv.indexOf(k);
  return i > 0 ? process.argv[i + 1] : undefined;
};
const mask = (u: string) => u.replace(/\/\/[^@/]+@/, "//***@");
function git(cwd: string, args: string[], quiet = false): string {
  const r = spawnSync("git", args, { cwd, encoding: "utf8" });
  if (r.status !== 0) throw new Error(`git ${args[0]} failed: ${mask(String(r.stderr || "").trim()).slice(0, 300)}`);
  if (!quiet && r.stdout.trim()) console.log(mask(r.stdout.trim()));
  return r.stdout.trim();
}
function bun(cwd: string, script: string, args: string[], env: Record<string, string> = {}) {
  const r = spawnSync("bun", [script, ...args], { cwd, encoding: "utf8", env: { ...process.env, ...env } });
  if (r.status !== 0) throw new Error(`${script} failed: ${String(r.stderr || r.stdout).trim().slice(0, 300)}`);
  return r.stdout.trim();
}

async function main() {
  if (process.env.CI || process.env.GITLAB_CI || process.env.GITHUB_ACTIONS) {
    console.log("intel-export: box-only (CI never exports Gmail/X) — nothing done");
    return;
  }
  const dry = process.argv.includes("--dry-run");
  const gmailIn = arg("--gmail");
  const xIn = arg("--x");
  if (!gmailIn && !xIn) throw new Error("usage: intel-export.ts --gmail <search.json> --x <capture.json> [--dry-run]");
  for (const p of [gmailIn, xIn]) if (p && !existsSync(resolve(p))) throw new Error(`input missing: ${p}`);

  const cloneFrom = arg("--clone-from");
  const branch = arg("--branch") ?? "main";
  if ((cloneFrom || branch !== "main") && !dry) throw new Error("--clone-from/--branch are dry-run only");
  const remote = cloneFrom ? resolve(cloneFrom) : git(HERE, ["remote", "get-url", "origin"], true);
  const tmp = mkdtempSync(join(tmpdir(), "intel-export-"));
  if (resolve(tmp).startsWith(FORBIDDEN_ROOT)) throw new Error("refusing to work under /workspace/nexus-sage");
  console.log(`intel-export: clone ${mask(remote)} → ${tmp}${dry ? " (dry-run)" : ""}`);
  try {
    git(tmp, ["clone", "--quiet", "--branch", branch, ...(cloneFrom ? ["--no-local"] : ["--depth", "50"]), remote, "repo"], true);
    const repo = join(tmp, "repo");
    const desk = join(repo, "desk");
    const nm = join(HERE, "node_modules");
    if (existsSync(nm) && !existsSync(join(desk, "node_modules"))) symlinkSync(nm, join(desk, "node_modules"));
    const base = git(repo, ["rev-parse", "HEAD"], true);

    if (gmailIn) {
      const payload = readFileSync(resolve(gmailIn), "utf8");
      writeFileSync(join(tmp, "gmail.json"), payload);
      writeFileSync(
        join(tmp, "gmail-render.ts"),
        `import { readFileSync, writeFileSync } from "node:fs";
import { loadSageConfig, applySageConfig } from "${desk}/src/lib/sage-config-disk";
import { ingestSearchPayload } from "${desk}/src/lib/gmail-news";
import { renderGmailNewsTs } from "${desk}/src/lib/gmail-news-render";
const l = loadSageConfig("${desk}", { write: false }); applySageConfig(l.config);
const r = ingestSearchPayload(JSON.parse(readFileSync("${tmp}/gmail.json", "utf8")));
if (!r.items.length) { console.log("gmail: 0 rows — snapshot kept"); process.exit(0); }
const stamp = new Date().toISOString().replace(/\\.\\d{3}Z$/, "Z");
writeFileSync("${desk}/src/data/gmail-news.ts", renderGmailNewsTs(r.items, stamp));
console.log("gmail: " + r.items.length + " rows");
`,
      );
      console.log(bun(desk, join(tmp, "gmail-render.ts"), []));
    }
    if (xIn) console.log(bun(desk, "scripts/x-taste-refresh.ts", ["--capture", resolve(xIn)]));

    const st = spawnSync("git", ["status", "--porcelain", "-z", "--untracked-files=all"], { cwd: repo, encoding: "utf8" });
    const changed = String(st.stdout).split("\0").filter(Boolean).map((l) => l.slice(3));
    const stray = changed.filter((f) => !(INTEL_EXPORT_FILES as readonly string[]).includes(f) && f !== "desk/node_modules");
    if (stray.length) throw new Error(`refusing: unexpected changed files ${stray.join(", ")}`);
    const files = changed.filter((f) => (INTEL_EXPORT_FILES as readonly string[]).includes(f));
    // Privacy gate (intel plan 3): the published Gmail snapshot never carries an address or a snippet field.
    const gm = readFileSync(join(repo, "desk/src/data/gmail-news.ts"), "utf8");
    if (/[a-z0-9._%+-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+/i.test(gm) || /\b(from|snippet|sender)\s*:/.test(gm)) throw new Error("refusing: gmail-news.ts carries an address or snippet field");
    if (!files.length) {
      console.log("intel-export: no snapshot change — nothing to commit");
      return;
    }
    console.log(git(repo, ["diff", "--stat", "--", ...files], true));
    if (dry) {
      console.log(`intel-export: DRY-RUN OK · base ${base.slice(0, 7)} · would commit ${files.length} file(s): ${files.join(", ")} · no commit, no push`);
      return;
    }
    git(repo, ["add", "--", ...files], true);
    git(repo, ["commit", "--quiet", "-m", "chore(sage): intel export — Gmail + X snapshots (box) [skip ci]", "--", ...files], true);
    git(repo, ["fetch", "--quiet", "origin", "main"], true);
    const ff = spawnSync("git", ["merge-base", "--is-ancestor", "origin/main", "HEAD"], { cwd: repo });
    if (ff.status !== 0) throw new Error("origin/main moved and is not an ancestor — not pushing (ff-only, no force)");
    git(repo, ["push", "--quiet", "origin", "HEAD:main"], true);
    console.log(`intel-export: pushed ${git(repo, ["rev-parse", "--short", "HEAD"], true)} (ff from ${base.slice(0, 7)})`);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

main().catch((e) => {
  console.error(`intel-export: FAIL ${e instanceof Error ? e.message : e}`);
  process.exit(1);
});
