import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { crawlTableRows, renderCrawlTable } from "@/lib/crawl-table";

const DESK = join(import.meta.dir, "../../..");
const SH = readFileSync(join(DESK, "scripts/cf-build.sh"), "utf8");
const code = SH.split("\n").filter((l) => !/^\s*#/.test(l)).join("\n");

describe("B3 crawl table", () => {
  test("crawl_sources[] path: rows/status/ms, 0 rows → THROTTLED?, paused → PAUSED", () => {
    const d = {
      crawl_sources: [
        { id: "hn", label: "HN", status: "ok", rows: 42, duration_ms: 1200 },
        { id: "openalex", label: "OpenAlex", status: "ok", rows: 0, duration_ms: 300, reason: "HTTP 429" },
        { id: "gnews", label: "Google News", status: "paused", rows: 0, duration_ms: 0, paused_until: "2026-09-25T18:00:00Z" },
      ],
    };
    const { rows, legacy } = crawlTableRows(d);
    expect(legacy).toBe(false);
    expect(rows.map((r) => r.flag)).toEqual(["", "THROTTLED?", "PAUSED"]);
    expect(rows[0]).toMatchObject({ rows: 42, ms: 1200, status: "ok" });
    const t = renderCrawlTable(d);
    expect(t).toContain("THROTTLED? · HTTP 429");
    expect(t).toContain("THROTTLED? OpenAlex");
    expect(t).not.toContain("legacy");
  });
  test("legacy ingest-last (no crawl_sources[]) falls back to per-source blocks", () => {
    const d = { hn: { ok: true, count: 30 }, openalex: { ok: true, soft_fail: true, soft_fail_reason: "HTTP 429", enriched: 0 }, google_news: { ok: true, items: 80 } };
    const { rows, legacy } = crawlTableRows(d);
    expect(legacy).toBe(true);
    expect(rows.find((r) => r.id === "openalex")).toMatchObject({ rows: 0, flag: "THROTTLED?", ms: null });
    expect(rows.find((r) => r.id === "gnews")).toMatchObject({ rows: 80, flag: "" });
    expect(renderCrawlTable(d)).toContain("legacy ingest-last");
  });
  test("renders the real ingest-last.json without throwing", () => {
    const d = JSON.parse(readFileSync(join(DESK, "artifacts/sage/ingest-last.json"), "utf8"));
    expect(crawlTableRows(d).rows.length).toBeGreaterThan(0);
  });
});

describe("B3 cf-build.sh static guards", () => {
  test("bash -n passes", () => {
    expect(Bun.spawnSync(["bash", "-n", join(DESK, "scripts/cf-build.sh")]).exitCode).toBe(0);
  });
  test("no box-only paths, no xtrace", () => {
    expect(code).not.toMatch(/\/workspace|\/home\/box/);
    expect(code).not.toMatch(/set\s+-[a-z]*x/);
    expect(code).not.toMatch(/bash\s+-x/);
  });
  test("token never echoed, never in a URL or argv", () => {
    for (const l of code.split("\n").filter((x) => /GH_PUSH_TOKEN|\$AUTH\b|\$\{AUTH/.test(x))) {
      expect(l).not.toMatch(/\b(echo|log|printf '%s\\n')\b.*GH_PUSH_TOKEN/);
      expect(l).not.toMatch(/https:\/\/[^"\s]*\$\{?GH_PUSH_TOKEN/);
      expect(l).not.toMatch(/git [^;]*-c [^;]*AUTH/);
    }
    expect(code).toMatch(/GIT_CONFIG_VALUE_0="\$AUTH"/);
  });
  test("SHADOW guard precedes any push; push only after a crawl", () => {
    const shadow = code.indexOf('elif [ "$SHADOW" = 1 ]');
    const push = code.search(/\bpush -q\b/);
    const crawled = code.indexOf('if [ "$CRAWLED" != 1 ]');
    expect(shadow).toBeGreaterThan(0);
    expect(crawled).toBeGreaterThan(0);
    expect(crawled).toBeLessThan(shadow);
    expect(shadow).toBeLessThan(push);
    expect(code.match(/\bpush -q\b/g)!.length).toBe(1);
  });
  test("runs the secret gate and a frozen install, and hooks are no-op safe", () => {
    expect(code).toContain("bash scripts/secret-gate.sh out");
    expect(code).toContain("bun install --frozen-lockfile");
    expect(code).toMatch(/B9/);
  });
});
