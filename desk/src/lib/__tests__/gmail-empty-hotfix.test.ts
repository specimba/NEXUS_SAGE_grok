/**
 * Hotfix (before PASS-S1): a Gmail crawl with no rows (box soft-fail, no fetcher / empty cache) used to write
 * `GMAIL_NEWS = [\n,\n]` — a sparse array with one hole — and member-info / rank:snapshot crashed on `g.id`.
 * Empty must render `[]`, and rank:snapshot must run on it.
 */
import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import type { GmailNewsHit } from "@/lib/gmail-news";
import { renderGmailNewsTs } from "@/lib/gmail-news-render";

const DESK = resolve(import.meta.dir, "../../..");
const STAMP = "2026-10-16T00:00:00Z";

async function load(ts: string): Promise<{ GMAIL_NEWS: unknown[] }> {
  const dir = mkdtempSync(join(tmpdir(), "gmail-empty-"));
  const f = join(dir, "gmail-news.ts");
  writeFileSync(f, ts);
  return import(f);
}

describe("hotfix — empty Gmail renders [] (not a sparse [ , ])", () => {
  test("empty rows → `= [\\n];` and a real empty array", async () => {
    const ts = renderGmailNewsTs([], STAMP);
    expect(ts).toContain("export const GMAIL_NEWS: GmailNewsRow[] = [\n];");
    expect(ts).not.toMatch(/\[\n,\n\]/);
    const m = await load(ts);
    expect(m.GMAIL_NEWS).toEqual([]);
    expect(m.GMAIL_NEWS.length).toBe(0);
  });

  test("non-empty output unchanged (rows joined, trailing comma)", async () => {
    const hit = {
      id: "gmail:abc", messageId: "abc", threadId: "t", title: "AI weekly", link: "https://example.com/a", published: STAMP,
      summary: "s", from: "news@example.com", publisher: "example.com", source: "gmail-news", pulseEligible: true,
      briefEligible: false, pulse_only: true, digestRefOk: false, qi: 20, priority: "P2", tag: "rest",
    } as GmailNewsHit;
    const ts = renderGmailNewsTs([hit, { ...hit, id: "gmail:def" }], STAMP);
    expect(ts).toMatch(/pulse_only: true as const \},\n  \{ id: "gmail:def"[^\n]*\},\n\];\n$/);
    const m = await load(ts);
    expect((m.GMAIL_NEWS as { id: string }[]).map((r) => r.id)).toEqual(["gmail:abc", "gmail:def"]);
  });

  test("rank:snapshot runs on an empty Gmail module (copy of the desk, real script)", () => {
    const root = mkdtempSync(join(tmpdir(), "gmail-empty-rank-"));
    const d = join(root, "desk");
    for (const p of ["src", "scripts", "artifacts", "config", "tsconfig.json", "package.json"]) cpSync(join(DESK, p), join(d, p), { recursive: true });
    symlinkSync(join(DESK, "node_modules"), join(d, "node_modules"));
    writeFileSync(join(d, "src/data/gmail-news.ts"), renderGmailNewsTs([], STAMP));
    const r = spawnSync("bun", ["scripts/rank-snapshot.ts"], { cwd: d, encoding: "utf8", timeout: 60_000 });
    try {
      expect(r.stderr).not.toContain("TypeError");
      expect(r.status).toBe(0);
      expect(readFileSync(join(d, "src/data/gmail-news.ts"), "utf8")).toContain("= [\n];");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }, 60_000);
});
