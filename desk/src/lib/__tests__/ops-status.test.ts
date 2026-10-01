import { afterAll, describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  OPS_BEGIN,
  OPS_END,
  lastA2Result,
  upsertOpsStatus,
  writeOpsStatus,
} from "../../../scripts/lib/ops-status.mjs";

const tmp = mkdtempSync(join(tmpdir(), "ops-status-"));
afterAll(() => rmSync(tmp, { recursive: true, force: true }));

const count = (s: string, needle: string) => s.split(needle).length - 1;

const legacy = (ts: string) => `
## A1 dry-run evidence (${ts})

- Script: \`desk/scripts/a1-stale-ingest.mjs\` · FORCE=1 path exercised
- Crawl \`a\` → \`b\` · pack \`p.tar.gz\`
- Checklist: see \`refs/A1-DRY-RUN.md\` · Reviewer stamp pending · **cron not installed**
`;

const BASE = `# OPS A1–A3

## A1 — STALE auto-ingest

Real content stays.

### Reviewer stamp — 2026-09-07T01:37Z (Reviewer Gürok)

**A1–A3 CRONTAB PASS** (standing).
`;

const A2_LOG = [
  "[2026-10-01T15:20:29.196Z] A2 start — A2_FORCE_WINDOW=1",
  "[2026-10-01T15:20:29.213Z]   | digest:tick HOLD — next_at=2026-10-01T15:38:58.987Z (within CADENCE_MS)",
  "[2026-10-01T15:20:29.213Z] A2 HOLD — no pack:export",
  "",
].join("\n");

describe("OPS status block (replaced, not appended)", () => {
  test("running the update twice leaves exactly one block", () => {
    const ops = join(tmp, "OPS.md");
    const a2 = join(tmp, "a2.log");
    writeFileSync(ops, BASE + legacy("2026-09-30T23:19Z") + legacy("2026-10-01T03:20Z"));
    writeFileSync(a2, A2_LOG);
    const args = { opsPath: ops, crawlAt: "2026-10-01T15:19:43Z", pack: "sage-pack-003-1.tar.gz", a2LogPath: a2 };
    writeOpsStatus({ ...args, now: new Date("2026-10-01T15:21:00Z") });
    writeOpsStatus({ ...args, pack: "sage-pack-003-2.tar.gz", now: new Date("2026-10-01T19:21:00Z") });
    const out = readFileSync(ops, "utf8");
    expect(count(out, OPS_BEGIN)).toBe(1);
    expect(count(out, OPS_END)).toBe(1);
    expect(out).not.toContain("## A1 dry-run evidence");
    expect(out).not.toContain("cron not installed");
    expect(out).toContain("sage-pack-003-2.tar.gz");
    expect(out).not.toContain("sage-pack-003-1.tar.gz");
    expect(out).toContain("HOLD — no pack:export (2026-10-01T15:20Z)");
    expect(out).toContain("Real content stays.");
    expect(out).toContain("**A1–A3 CRONTAB PASS** (standing).");
  });

  test("duplicate blocks collapse to one, placed where the first was", () => {
    const line = "- status";
    const once = upsertOpsStatus(BASE, line);
    const doubled = once + "\nTrailer\n" + once.slice(once.indexOf(OPS_BEGIN));
    const fixed = upsertOpsStatus(doubled, "- status 2");
    expect(count(fixed, OPS_BEGIN)).toBe(1);
    expect(fixed).toContain("Trailer");
    expect(fixed.indexOf(OPS_BEGIN)).toBeLessThan(fixed.indexOf("Trailer"));
    expect(upsertOpsStatus(fixed, "- status 2")).toBe(fixed);
  });

  test("missing file is a no-op", () => {
    expect(writeOpsStatus({ opsPath: join(tmp, "nope.md"), crawlAt: "x", pack: "y" })).toBeNull();
  });

  test("lastA2Result reads the last terminal A2 line", () => {
    expect(lastA2Result(A2_LOG)).toBe("HOLD — no pack:export (2026-10-01T15:20Z)");
    expect(lastA2Result("[2026-10-02T07:00:01.000Z] A2 OK — DUE→WROTE→dual-home · p.tar.gz · sha256=abc\n"))
      .toBe("OK — DUE→WROTE→dual-home · p.tar.gz (2026-10-02T07:00Z)");
    expect(lastA2Result("[2026-10-02T07:00:01.000Z] FAIL — pack:export exit=1\n")).toBe("FAIL — pack:export exit=1 (2026-10-02T07:00Z)");
    expect(lastA2Result("")).toBe("unknown (no A2 log)");
  });
});
