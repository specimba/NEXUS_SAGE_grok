import { describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
// @ts-expect-error — plain .mjs shared with next.config.ts / check-current.mjs
import { checkCurrent, REQUIRED_DATA } from "../../../scripts/lib/current-gate.mjs";

const desk = resolve(import.meta.dir, "../../..");
const src = resolve(desk, "src");

/** Resolve an import specifier from `from` to a file under src (null = package / builtin). */
function resolveImport(spec: string, from: string): string | null {
  let base: string;
  if (spec.startsWith("@/")) base = resolve(src, spec.slice(2));
  else if (spec.startsWith(".")) base = resolve(dirname(from), spec);
  else return null;
  for (const cand of [base, `${base}.ts`, `${base}.tsx`, `${base}.js`, `${base}.mjs`, join(base, "index.ts"), join(base, "index.tsx")])
    if (existsSync(cand) && !cand.endsWith("/")) {
      try {
        readFileSync(cand);
        return cand;
      } catch {
        /* directory */
      }
    }
  return null;
}

/** Every local module reachable from the entry, with the raw import specifiers it uses. */
function importGraph(entry: string) {
  const seen = new Map<string, string[]>();
  const stack = [entry];
  while (stack.length) {
    const f = stack.pop()!;
    if (seen.has(f)) continue;
    const code = readFileSync(f, "utf8");
    const specs = [...code.matchAll(/(?:import|export)\s[^'"]*?from\s*["']([^"']+)["']|import\s*\(\s*["']([^"']+)["']\s*\)|require\(\s*["']([^"']+)["']\s*\)/g)].map(
      (m) => m[1] ?? m[2] ?? m[3]!,
    );
    seen.set(f, specs);
    for (const s of specs) {
      const r = resolveImport(s, f);
      if (r && !r.endsWith(".css") && !r.endsWith(".json")) stack.push(r);
    }
  }
  return seen;
}

const FS_SPEC = /^(node:)?(fs|fs\/promises|child_process|os)$/;

describe("static page — no request-time filesystem", () => {
  for (const entry of ["app/page.tsx", "app/layout.tsx"]) {
    test(`${entry}: no node:fs / child_process / process.cwd anywhere in its import graph`, () => {
      const g = importGraph(resolve(src, entry));
      expect(g.size).toBeGreaterThan(entry === "app/page.tsx" ? 10 : 0);
      const offenders: string[] = [];
      for (const [file, specs] of g) {
        for (const s of specs) if (FS_SPEC.test(s)) offenders.push(`${file.replace(desk + "/", "")} imports ${s}`);
        if (/process\.cwd\(\)/.test(readFileSync(file, "utf8"))) offenders.push(`${file.replace(desk + "/", "")} uses process.cwd()`);
      }
      expect(offenders).toEqual([]);
    });
  }

  test("static export: no force-dynamic, build stamp generated in prebuild, request-time readers gone", () => {
    const page = readFileSync(resolve(src, "app/page.tsx"), "utf8");
    expect(page).not.toContain("force-dynamic");
    expect(readFileSync(resolve(src, "lib/build-meta.ts"), "utf8")).toContain('from "@/data/build-stamp"');
    const pkg = JSON.parse(readFileSync(resolve(desk, "package.json"), "utf8"));
    expect(pkg.scripts.prebuild).toBe("bun scripts/check-current.mjs && bun scripts/build-stamp.mjs");
    expect(pkg.scripts.prestart).toBeUndefined();
    expect(pkg.scripts.start).toContain("serve-out.ts");
    expect(existsSync(resolve(src, "lib/require-current.ts"))).toBe(false);
    expect(existsSync(resolve(src, "lib/server-boot.ts"))).toBe(false);
    const cfg = readFileSync(resolve(desk, "next.config.ts"), "utf8");
    expect(cfg).toContain('output: "export"');
    expect(cfg).toContain("unoptimized: true");
    expect(cfg).toContain("PHASE_PRODUCTION_BUILD");
  });
});

describe("hard gate — repo-only, fails closed", () => {
  const lock = JSON.parse(readFileSync(resolve(desk, "artifacts/sage/CURRENT.json"), "utf8"));
  const crawled = Date.parse(lock.crawled_at);

  test("committed repo data passes (clock pinned 1h after the crawl)", () => {
    const r = checkCurrent({ deskRoot: desk, env: {}, now: crawled + 3_600_000 });
    expect(r.errors).toEqual([]);
    expect(r.ok).toBe(true);
    expect(r.path).toBe(resolve(desk, "artifacts/sage/CURRENT.json"));
  });

  test("stale beyond SAGE_MAX_DATA_AGE_H (default 72h) fails; override honoured", () => {
    const late = crawled + 73 * 3_600_000;
    expect(checkCurrent({ deskRoot: desk, env: {}, now: late }).ok).toBe(false);
    expect(checkCurrent({ deskRoot: desk, env: {}, now: late }).errors.join()).toContain("data stale");
    expect(checkCurrent({ deskRoot: desk, env: { SAGE_MAX_DATA_AGE_H: "100" }, now: late }).ok).toBe(true);
    expect(checkCurrent({ deskRoot: desk, env: {}, now: crawled - 3_600_000 }).errors.join()).toContain("future");
  });

  test("missing / broken / inconsistent lock and missing data fail", () => {
    const dir = mkdtempSync(join(tmpdir(), "sage-gate-"));
    try {
      const now = crawled + 3_600_000;
      expect(checkCurrent({ deskRoot: dir, env: {}, now }).errors[0]).toContain("missing CURRENT.json");
      mkdirSync(join(dir, "artifacts/sage"), { recursive: true });
      writeFileSync(join(dir, "artifacts/sage/CURRENT.json"), "{nope");
      expect(checkCurrent({ deskRoot: dir, env: {}, now }).errors[0]).toContain("cannot read/parse");
      writeFileSync(join(dir, "artifacts/sage/CURRENT.json"), JSON.stringify({ ...lock }));
      const noData = checkCurrent({ deskRoot: dir, env: {}, now });
      expect(noData.ok).toBe(false);
      expect(noData.errors.filter((e: string) => e.startsWith("missing generated data")).length).toBe(REQUIRED_DATA.length);
      mkdirSync(join(dir, "src/data"), { recursive: true });
      for (const rel of REQUIRED_DATA) writeFileSync(join(dir, rel), "export {};\n");
      writeFileSync(join(dir, "src/data/pulse-clusters.ts"), 'export const PULSE_CLUSTERS_AT = "2026-01-01T00:00:00Z";\n');
      expect(checkCurrent({ deskRoot: dir, env: {}, now }).errors.join()).toContain("different crawls");
      writeFileSync(join(dir, "src/data/pulse-clusters.ts"), `export const PULSE_CLUSTERS_AT = "${lock.crawled_at}";\n`);
      expect(checkCurrent({ deskRoot: dir, env: {}, now }).ok).toBe(true);
      // SAGE_CURRENT_PATH still overrides, and a missing override path fails closed
      expect(checkCurrent({ deskRoot: dir, env: { SAGE_CURRENT_PATH: join(dir, "nope.json") }, now }).ok).toBe(false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("gate has no box-only paths", () => {
    const strip = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
    const code = strip(
      ["scripts/lib/current-gate.mjs", "scripts/check-current.mjs", "scripts/build-stamp.mjs"].map((f) => readFileSync(resolve(desk, f), "utf8")).join("\n"),
    );
    expect(code).not.toMatch(/\/workspace|\/home\/box|\/tmp\/|dual-home|["'`\/]\.env\b/);
  });

  test("A1 routine reads the live crawl stamp from data-crawl-at and restarts via bun run start (serve-out)", () => {
    const a1 = readFileSync(join(desk, "scripts/a1-stale-ingest.mjs"), "utf8");
    expect(a1).toMatch(/data-crawl-at/);
    expect(a1).toMatch(/spawn\("bun", \["run", "start"\]/);
    expect(a1).toMatch(/fuser", \["-k", "3000\/tcp"\]/);
    const pkg = JSON.parse(readFileSync(join(desk, "package.json"), "utf8"));
    expect(pkg.scripts.start).toMatch(/^bun scripts\/serve-out\.ts\b.*--port 3000/);
    expect(pkg.scripts.prestart).toBeUndefined();
    const deskTsx = readFileSync(join(desk, "src/components/sage/desk.tsx"), "utf8");
    expect(deskTsx).toMatch(/data-crawl-at=\{CRAWL_AT\}/);
  });
});
