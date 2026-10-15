import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { CONFIG_SYNC_FILE, configSyncDecision } from "../desk-view-config-sync";

const desk = resolve(import.meta.dir, "../../..");
const H1 = "a".repeat(64);
const H2 = "b".repeat(64);

describe("PASS-C3 ruling (3): box publish regenerates desk-view (write) when desk/config changed, before --check", () => {
  test("decision: in sync → nothing; config unchanged → left for --check; config changed + only sage-setup stale → write", () => {
    expect(configSyncDecision({ stale: [], setupFileHash: H1, diskFileHash: H2, desk }).action).toBe("in-sync");
    expect(configSyncDecision({ stale: ["src/data/desk-view.ts"], setupFileHash: H1, diskFileHash: H1, desk }).action).toBe("no-config-change");
    const w = configSyncDecision({ stale: [CONFIG_SYNC_FILE], setupFileHash: H1, diskFileHash: H2, desk });
    expect(w.action).toBe("write");
    expect(w.msg).toContain("aaaaaaaaaaaa → bbbbbbbbbbbb");
    // a missing file_hash (pre-C3 module) counts as changed
    expect(configSyncDecision({ stale: [CONFIG_SYNC_FILE], setupFileHash: undefined, diskFileHash: H2, desk }).action).toBe("write");
  });
  test("unsafe (config changed AND other generated files stale) → fail with the exact command, never silent", () => {
    const d = configSyncDecision({ stale: [CONFIG_SYNC_FILE, "src/data/desk-view.ts"], setupFileHash: H1, diskFileHash: H2, desk });
    expect(d.action).toBe("fail");
    if (d.action !== "fail") return;
    expect(d.cmd).toBe(`cd ${desk} && bun run rank:snapshot && bun scripts/desk-view.ts --check`);
    expect(d.msg).toContain(`Run: ${d.cmd}`);
    expect(d.msg).toContain("src/data/desk-view.ts");
  });
  test("pages-publish.sh: step 0a runs `desk-view.ts --sync-config` before the 0b coherence (--check) and before any build; failure dies with its output", () => {
    const sh = readFileSync(resolve(desk, "scripts/pages-publish.sh"), "utf8");
    const sync = sh.indexOf("bun scripts/desk-view.ts --sync-config");
    const coh = sh.indexOf("bun scripts/pages-coherence.ts )");
    const build = sh.indexOf('log "build PAGES=1');
    expect(sync).toBeGreaterThan(0);
    expect(sync).toBeLessThan(coh);
    expect(coh).toBeLessThan(build);
    const line = sh.slice(sync, sh.indexOf("\n", sh.indexOf("|| die", sync)));
    expect(line).toContain('|| die "desk/config sync: ${sync_out');
    expect(line).toContain("bun scripts/desk-view.ts && bun scripts/desk-view.ts --check"); // exact command even with no output
    expect(sh.slice(sync, coh)).not.toMatch(/\|\|\s*true/); // never swallowed
  });
  test("desk-view.ts --sync-config on the committed tree: in sync, exit 0, writes nothing", () => {
    const before = readFileSync(resolve(desk, CONFIG_SYNC_FILE));
    const r = spawnSync("bun", ["scripts/desk-view.ts", "--sync-config"], { cwd: desk, encoding: "utf8" });
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("desk-view config-sync: in sync");
    expect(Buffer.compare(readFileSync(resolve(desk, CONFIG_SYNC_FILE)), before)).toBe(0);
  });
});
