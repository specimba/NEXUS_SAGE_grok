import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const script = readFileSync(join(import.meta.dir, "../../../scripts/pages-publish.sh"), "utf8");
const line = script.split("\n").find((l) => l.startsWith('tok="$(grep -rIlE'))!;
const pattern = line.match(/grep -rIlE '([^']+)'/)![1];
const hits = (s: string) => spawnSync("grep", ["-qE", pattern], { input: s + "\n" }).status === 0;
const body = "T3BlbkFJx9Qw7Lm2Zr8Vb4Nc6Hd1Kf5Gj0Ps3Ua";

describe("pages-publish 2c sk- token check", () => {
  test("pattern extracted from script", () => {
    expect(pattern).toContain("sk-");
    expect(pattern).not.toContain("|sk-[A-Za-z0-9_-]{32,}|");
  });
  test.each([
    "https://huggingface.co/news/elon-musk-warns-debt-markets-are-overheating-and-ai-bubble-fears",
    '"href":"https://example.com/2026/10/sk-hynix-to-mass-produce-hbm4-chips-for-nvidia-next-gen-gpus"',
    "https://news.example/sk-hynix-reports-record-quarterly-profit-on-ai-memory-demand-surge",
    "flask-sqlalchemy-integration-guide-for-production-deployments-2026",
  ])("no false positive: %s", (s) => expect(hits(s)).toBe(false));
  test.each([
    `OPENAI_API_KEY=sk-${body}`,
    `"key":"sk-proj-${body}_aB3"`,
    `Authorization: sk-ant-api03-${body}`,
    `sk-${body}`,
  ])("real key matches: %s", (s) => expect(hits(s)).toBe(true));
});
