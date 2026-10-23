import { describe, expect, test } from "bun:test";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DESK = join(import.meta.dir, "../../..");

describe("F2.2 fix — new source ids type-check in generated data", () => {
  test("ingest emits the lib id types (no hand-kept unions)", () => {
    const src = readFileSync(join(DESK, "scripts/ingest.ts"), "utf8");
    expect(src).toContain("  lab: LabId;");
    expect(src).toContain("  lab: SecurityLabId;");
    expect(src).toContain("  feed: ReleaseFeedId;");
    expect(src).not.toMatch(/lab: "openai" \| "deepmind"|lab: "trailofbits" \| "fox-it"|feed: "llama\.cpp" \| "ollama"/);
  });

  test("a Decoder / Unit42 / SecurityWeek / Railway / Codex / HF row compiles against the committed data types", () => {
    const dir = mkdtempSync(join(DESK, "src/.f2-typecheck-"));
    try {
      const row = (k: string, v: string) => `{ id: "x", ${k}: "${v}" as const, title: "t", link: "l", published: "p", summary: "s" }`;
      writeFileSync(
        join(dir, "rows.ts"),
        `import type { RssLabRow } from "@/data/rss-labs";
import type { RssSecurityRow } from "@/data/rss-security";
import type { ReleaseAtomRow } from "@/data/releases-atom";
export const a: RssLabRow["lab"][] = ["the-decoder"];
export const b: RssSecurityRow["lab"][] = ["unit42", "securityweek", "railway"];
export const c: ReleaseAtomRow["feed"][] = ["codex", "hf-trending", "hf-moonshotai", "hf-nvidia", "hf-tencent"];
// @ts-expect-error unknown lab ids still fail
export const d: RssLabRow["lab"][] = ["not-a-lab"];
void ${JSON.stringify(row("lab", "the-decoder"))};
`,
      );
      writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ extends: "../../tsconfig.json", compilerOptions: { noEmit: true, incremental: false }, include: ["rows.ts", "../../next-env.d.ts"] }));
      execFileSync(join(DESK, "node_modules/.bin/tsc"), ["-p", join(dir, "tsconfig.json")], { cwd: DESK, stdio: "pipe" });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }, 60_000);
});
