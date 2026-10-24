import { describe, expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { SAGE_SETUP } from "@/data/sage-setup";
import { redactSetupForPage, renderSageSetupModule } from "@/lib/sage-setup";

const DESK = join(import.meta.dir, "../../..");
const EMAIL = /[a-z0-9._%+-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+/i;
const committed = JSON.parse(readFileSync(join(DESK, "config/sage-sources.json"), "utf8"));

describe("Intel privacy — the published setup payload shows a sender count, never an address", () => {
  test("committed config keeps all 14 senders (box use), incl. the SimpleLogin alias", () => {
    expect(committed.keywords.gmail_senders.length).toBe(14);
    expect(committed.keywords.gmail_senders).toContain("news_at_securityweek_com_yxdqtunr@simplelogin.co");
  });
  test("src/data/sage-setup.ts (what reaches Pages) has no email address; count = 14", () => {
    expect(readFileSync(join(DESK, "src/data/sage-setup.ts"), "utf8")).not.toMatch(EMAIL);
    expect(SAGE_SETUP.redacted).toEqual({ gmail_senders: 14 });
    expect(SAGE_SETUP.keywords.find((k) => k.id === "gmail_senders")).toEqual({ id: "gmail_senders", terms: [], count: 14 });
  });
  test("the renderer redacts even when handed the full list", () => {
    const full = JSON.parse(JSON.stringify(SAGE_SETUP));
    full.keywords.find((k: { id: string }) => k.id === "gmail_senders").terms = committed.keywords.gmail_senders;
    delete full.keywords.find((k: { id: string }) => k.id === "gmail_senders").count;
    full.config.keywords.gmail_senders = committed.keywords.gmail_senders;
    full.limits.defaults.keywords.gmail_senders = ["a@b.co"];
    delete full.redacted;
    expect(renderSageSetupModule(full)).not.toMatch(EMAIL);
    expect(redactSetupForPage(full).redacted).toEqual({ gmail_senders: 14 });
  });
  test("bay + editor render the count only", () => {
    const bay = readFileSync(join(DESK, "src/components/sage/setup-bay.tsx"), "utf8");
    expect(bay).toContain('{n} {id === "gmail_senders" ? (n === 1 ? "sender" : "senders") : "terms"} · box-only · edit by commit');
    expect(readFileSync(join(DESK, "src/components/sage/setup-editor.tsx"), "utf8")).toContain("is not in this copy — keep the committed list when pasting");
  });
  test("a built Pages export (when present) carries no sender address", () => {
    const out = join(DESK, "out-pages");
    // Only a build made from the current setup module counts (a stale export from another checkout is skipped).
    if (!existsSync(out) || statSync(out).mtimeMs < statSync(join(DESK, "src/data/sage-setup.ts")).mtimeMs) return;
    const walk = (d: string): string[] => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
    for (const f of walk(out).filter((f) => /\.(js|html|txt|json)$/.test(f)))
      for (const a of committed.keywords.gmail_senders) expect(readFileSync(f, "utf8").includes(a)).toBe(false);
  });
});
