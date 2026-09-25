import { describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { X_TASTE } from "@/data/x-taste";
import { tasteUrls } from "@/lib/taste-input";
import { scoreUrlList } from "@/lib/ingest/shelf";

const DESK = join(import.meta.dir, "../../..");

describe("cloud Taste = committed x-taste.ts (no box-only attachment)", () => {
  test("taste urls are exactly the committed X_TASTE entries, in order", () => {
    expect(tasteUrls()).toEqual(X_TASTE.items.map((i) => i.url!));
    expect(tasteUrls().length).toBe(X_TASTE.items.length);
  });

  test("clean env (temp cwd/HOME, no /workspace/attachments) gives the same entries", () => {
    const tmp = mkdtempSync(join(tmpdir(), "taste-clean-"));
    const code = `import { tasteUrls } from ${JSON.stringify(join(DESK, "src/lib/taste-input.ts"))}; console.log(JSON.stringify(tasteUrls()));`;
    const p = Bun.spawnSync(["bun", "-e", code], { cwd: tmp, env: { PATH: process.env.PATH ?? "", HOME: tmp } });
    expect(p.exitCode).toBe(0);
    expect(JSON.parse(p.stdout.toString().trim())).toEqual(X_TASTE.items.map((i) => i.url));
  });

  test("taste scores into the Pulse lane only (x-status), never shelf/Brief", () => {
    const s = scoreUrlList(tasteUrls());
    expect(s.pulse.length).toBe(X_TASTE.items.length);
    expect(s.pulse.every((p) => p.reason === "x-status")).toBe(true);
    expect(s.shelf.length + s.rest.length + s.dropped.length).toBe(0);
    expect(X_TASTE.briefEligible).toBe(false);
    expect(X_TASTE.pulseLeadEligible).toBe(false);
  });

  test("ingest reads no attachment file and no filesystem for Taste", () => {
    const ingest = readFileSync(join(DESK, "scripts/ingest.ts"), "utf8");
    expect(ingest).not.toMatch(/attachments|fancyTWEETS/i);
    expect(ingest).toMatch(/const urls = tasteUrls\(\);/);
    const helper = readFileSync(join(DESK, "src/lib/taste-input.ts"), "utf8");
    expect(helper).not.toMatch(/node:fs|readFileSync|existsSync|\/workspace/);
  });
});
