import { afterAll, describe, expect, test } from "bun:test";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const DESK = join(import.meta.dir, "../../..");
const GATE = join(DESK, "scripts/secret-gate.sh");
const NAMES = ["VYCE_API_KEY", "GH_PUSH_TOKEN", "OPENALEX_API_KEY", "CF_API_TOKEN", "DEPLOY_HOOK_URL", "LLM_BASE_URL", "SECRET_GATE_STRICT_URL"];
const tmp = mkdtempSync(join(tmpdir(), "secret-gate-"));
afterAll(() => rmSync(tmp, { recursive: true, force: true }));

function site(name: string, files: Record<string, string>) {
  const d = join(tmp, name);
  mkdirSync(join(d, "_next"), { recursive: true });
  writeFileSync(join(d, "index.html"), "<html><body>SAGE desk · build abc1234</body></html>");
  for (const [f, c] of Object.entries(files)) writeFileSync(join(d, f), c);
  return d;
}
function gate(dir: string, env: Record<string, string> = {}) {
  const clean = { ...process.env } as Record<string, string>;
  for (const k of NAMES) delete clean[k];
  const p = Bun.spawnSync(["bash", GATE, dir], { cwd: DESK, env: { ...clean, ...env } });
  return { code: p.exitCode, out: p.stdout.toString() + p.stderr.toString() };
}

describe("B3a secret gate", () => {
  const FAKE = "vk-FAKE-planted-0123456789abcdef";
  test("clean site passes", () => {
    const r = gate(site("clean", {}), { VYCE_API_KEY: FAKE });
    expect(r.code).toBe(0);
    expect(r.out).toContain("PASS");
  });
  test("planted secret VALUE fails the build and the value is never printed", () => {
    const d = site("value", { "_next/chunk.js": `const k="${FAKE}";` });
    const r = gate(d, { VYCE_API_KEY: FAKE });
    expect(r.code).toBe(1);
    expect(r.out).toContain("value:VYCE_API_KEY");
    expect(r.out).toContain("chunk.js");
    expect(r.out).not.toContain(FAKE);
  });
  test("planted secret NAME fails", () => {
    for (const n of ["VYCE_API_KEY", "GH_PUSH_TOKEN", "OPENALEX_API_KEY", "CF_API_TOKEN", "DEPLOY_HOOK_URL"]) {
      const r = gate(site(`name-${n}`, { "x.txt": `process.env.${n}` }));
      expect(r.code).toBe(1);
      expect(r.out).toContain(`name:${n}`);
    }
  });
  test("other secret values (GH_PUSH_TOKEN, DEPLOY_HOOK_URL) are gated too", () => {
    const hook = "https://api.cloudflare.com/client/v4/pages/webhooks/deploy_hooks/fake-hook-id-123";
    const r = gate(site("hook", { "a.json": JSON.stringify({ u: hook }) }), { DEPLOY_HOOK_URL: hook });
    expect(r.code).toBe(1);
    expect(r.out).not.toContain(hook);
  });
  test("Vyce base URL is a WARN by default, fatal only with SECRET_GATE_STRICT_URL=1", () => {
    const d = site("url", { "b.js": `fetch("https://vyceai.com/v1/chat")` });
    const warn = gate(d);
    expect(warn.code).toBe(0);
    expect(warn.out).toContain("WARN llm-base-url");
    expect(gate(d, { SECRET_GATE_STRICT_URL: "1" }).code).toBe(1);
  });
  test("missing dir fails closed", () => {
    expect(gate(join(tmp, "nope")).code).toBe(2);
  });
  test("real out/ export passes (when built)", () => {
    const out = join(DESK, "out");
    if (!Bun.file(join(out, "index.html")).size) return;
    expect(gate(out).code).toBe(0);
  });
});
