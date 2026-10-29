import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { calmMeterLine } from "../pulse-v5";
import { offtopicNoiseReason } from "../pulse-offtopic";
import { toolkitRows } from "../toolkit-shelf";
import { SHELF } from "@/data/desk-view";
import { inflateClusters } from "@/lib/desk-view";
import { MEMBER_ROWS, ORPHAN_CLUSTERS, SOURCE_HEALTH } from "@/data/desk-view";

const desk = readFileSync(resolve(import.meta.dir, "../../components/sage/desk.tsx"), "utf8");
const header = desk.slice(desk.indexOf('<header className="desk-topbar'), desk.indexOf("</header>"));
const openHeader = header.replace(/<details[\s\S]*?<\/details>/g, "");

describe("PASS-U B · U1 Brief ops chrome", () => {
  test("open top chrome: no BRIEF=FALSE / VISUAL PHOSPHOR / Wikidata reject; Δ LIVE folded", () => {
    for (const s of [/brief=false/i, /visual phosphor/i, /wikidata/i, /reject/i, /Δ LIVE/]) expect(openHeader).not.toMatch(s);
    expect(header).toContain("Δ LIVE"); // still there, inside the closed ops fold
  });
  test("Governance absent from primary lane buttons; reachable from footer", () => {
    expect(desk).toContain('.filter((t) => t.id !== "governance")');
    expect(desk).toContain('href="#governance"');
  });
  test("three waves board is a closed fold; Digest Ops buries bun run", () => {
    expect(desk).toMatch(/<details\s+className="sage-panel sage-ticks sage-wave-dense/);
    const ops = desk.slice(desk.indexOf("{/* Quiet ops chrome"), desk.indexOf("<ToolkitShelf />"));
    // bun run survives only in the header tooltip and the downloaded JSON note — never visible copy.
    expect(ops.replace(/title=\{`[^`]*`\}/g, "").replace(/note: "[^"]*"/g, "")).not.toContain("bun run");
    expect(ops).not.toMatch(/\n\s*durable · bun run/);
    expect(ops).toContain("Preview report");
    expect(ops).toContain("Download report.md");
  });
});

describe("PASS-U B · U2 Moved", () => {
  const moved = desk.slice(desk.indexOf('aria-label="Moved since last crawl"'), desk.indexOf("{/* Quiet ops chrome"));
  test("header + exact idle copy; no briefEligible / never-ranked sentence", () => {
    expect(moved).toContain('<div className="sage-panel-header">Moved since last crawl</div>');
    expect(moved).toContain(">No rank change this crawl</p>");
    expect(moved).not.toContain("briefEligible");
    expect(moved).not.toMatch(/never ranked/i);
  });
  test("× math only inside the closed Rank detail", () => {
    const open = moved.replace(/<details[\s\S]*?<\/details>/g, "");
    expect(open).not.toContain("1.45");
    expect(open).not.toContain('data-label="×"');
    expect(moved).toContain("<summary>Rank detail</summary>");
  });
  test("move row primary text is a headline (movedTitle), slug only in detail", () => {
    const open = moved.replace(/<details[\s\S]*?<\/details>/g, "");
    expect(open).toContain("{movedTitle(m.id)}");
    expect(open).not.toMatch(/>\s*\{m\.id\}/);
  });
});

describe("PASS-U B · U4 Toolkit", () => {
  const rows = toolkitRows(SHELF);
  test("header count = rows; no classifyUrl / TOOLKIT-GITHUB / NEVER BRIEF", () => {
    expect(desk).toContain("Toolkit · {rows.length}");
    expect(desk).toContain("rows.map((r, i)");
    const tk = desk.slice(desk.indexOf("function ToolkitShelf"), desk.indexOf("/** PASS-U U2"));
    for (const s of [/classifyUrl/, /toolkit-github/i, /never brief/i]) expect(tk).not.toMatch(s);
    for (const r of rows) expect(["GitHub", "OWASP", "Web"]).toContain(r.chip);
  });
  test("≤1 row per OWASP tool family; human names; 2–3 buckets", () => {
    const names = rows.map((r) => r.name);
    expect(new Set(names).size).toBe(names.length);
    expect(names.filter((n) => /modsecurity/i.test(n)).length).toBe(1);
    expect(names.filter((n) => /automated threats/i.test(n)).length).toBe(1);
    expect(names.filter((n) => /virtual patching/i.test(n)).length).toBe(1);
    expect(names).toContain("ActiveScan++");
    expect(new Set(rows.map((r) => r.bucket)).size).toBeLessThanOrEqual(3);
    for (const r of rows) expect(r.path.length).toBeLessThanOrEqual(34);
  });
});

describe("PASS-U B · U5 meters", () => {
  test("cells never show raw codes; one calm line", () => {
    expect(desk).not.toContain("healthReasonShort(s.fail_reason");
    const line = calmMeterLine(
      [
        { id: "hn", status: "fail", state: "fail", fail_reason: "timeout after 30000ms budget" },
        { id: "wikidata", status: "fail", state: "flaky", fail_reason: "HTTP 503" },
        { id: "gnews", status: "ok", state: "ok" },
      ],
      (id) => ({ hn: "HN", wikidata: "WD" })[id] ?? id,
    )!;
    expect(line).toBe("HN timed out · WD unavailable · using last good");
    expect(line).not.toMatch(/\bTIMEOUT\b|\b503\b/);
  });
  test("flaky-but-last-run-ok sources stay quiet (live snapshot)", () => {
    expect(calmMeterLine(SOURCE_HEALTH, (id) => id)).toBeNull();
  });
});

describe("PASS-U B · U6 off-topic Pulse", () => {
  test("live Bitcoin title dropped; lab misuse security post stays", () => {
    expect(offtopicNoiseReason("OpenAI Says Its AI Refuted the Exponential Time Hypothesis. Is Bitcoin Safe?")).toBe("noise:offtopic");
    expect(offtopicNoiseReason("Disrupting malicious uses of AI: threat actors misuse models for cyber operations")).toBeNull();
    expect(offtopicNoiseReason("LLM Heist: Hijacking LiteLLM for Traffic Interception, Key Theft, and Tool-Call Injection")).toBeNull();
    const pulse = inflateClusters(MEMBER_ROWS, ORPHAN_CLUSTERS).filter((c) => !offtopicNoiseReason(c.title));
    expect(pulse.some((c) => /Is Bitcoin Safe/i.test(c.title))).toBe(false);
    expect(desk).toContain(".filter((c) => !offtopicNoiseReason(c.title))");
  });
});
