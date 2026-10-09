import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { readerHash, stripStamps } from "@/lib/reader-hash";

const dataDir = resolve(import.meta.dir, "../../data");
const load = () => {
  const files: Record<string, string> = {};
  for (const f of readdirSync(dataDir).filter((n) => n.endsWith(".ts"))) files[f] = readFileSync(resolve(dataDir, f), "utf8");
  return files;
};
const crawlOf = (files: Record<string, string>) => files["x-crawl.ts"].match(/CRAWL_AT\s*=\s*"([^"]+)"/)![1];
const swapAll = (files: Record<string, string>, a: string, b: string) =>
  Object.fromEntries(Object.entries(files).map(([k, v]) => [k, v.split(a).join(b)]));

describe("PASS-Q1 reader_hash gate", () => {
  test("stamp-only diff (CRAWL_AT, PACK_AT, captured_at, timings) → hash equal", () => {
    const a = load();
    const crawl = crawlOf(a);
    const next = "2031-01-01T00:11:00Z";
    let b = swapAll(a, crawl, next);
    b = Object.fromEntries(
      Object.entries(b).map(([k, v]) => [
        k,
        v
          .replace(/(PACK_AT\s*=\s*)"[^"]*"/, '$1"2031-01-01T00:12:00Z"')
          .replace(/(captured_at:\s*)"[^"]*"/g, '$1"2031-01-01T00:13:00Z"')
          .replace(/(duration_ms:\s*)\d+/g, "$1999"),
      ]),
    );
    expect(readerHash(b, next)).toBe(readerHash(a, crawl));
  });
  test("item diff → hash differs", () => {
    const a = load();
    const crawl = crawlOf(a);
    const b = { ...a, "wire.ts": a["wire.ts"] + "\n// fixture item: a new headline\n" };
    expect(readerHash(b, crawl)).not.toBe(readerHash(a, crawl));
  });
  test("lead diff → hash differs", () => {
    const a = load();
    const crawl = crawlOf(a);
    const b = { ...a, "lead-pick.ts": a["lead-pick.ts"].replace(/"cl:[^"]+"/, '"cl:hn:fixture-lead"') };
    expect(b["lead-pick.ts"]).not.toBe(a["lead-pick.ts"]);
    expect(readerHash(b, crawl)).not.toBe(readerHash(a, crawl));
  });
  test("stripStamps keeps titles", () => {
    expect(stripStamps('{ title: "Beam 501B", stamped_at: "2026-10-09T00:00:00Z" }')).toContain("Beam 501B");
  });
});
