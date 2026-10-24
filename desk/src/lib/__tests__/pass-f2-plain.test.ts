/** PASS-F2.3 acceptance 15–17 + gates 18–20 (refs/PASS-F2-FRESH-TLDR-PLAIN.md). */
import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { plainHeadline } from "@/lib/plain-headline";
import { defaultSageConfig } from "@/lib/sage-config";
import { configHash } from "@/lib/sage-config-disk";
import { SAGE_SETUP } from "@/data/sage-setup";

const DESK = resolve(import.meta.dir, "../../..");
const read = (p: string) => readFileSync(join(DESK, p), "utf8");

describe("F2.3a — plain headlines", () => {
  test("15 · 'Kimi K3.1 is out | The Decoder' displays as 'Kimi K3.1 is out'; entities decoded, whitespace collapsed", () => {
    expect(plainHeadline("Kimi K3.1 is out | The Decoder")).toBe("Kimi K3.1 is out");
    expect(plainHeadline("OpenAI trims valuation target after pitching higher price - Financial Times")).toBe("OpenAI trims valuation target after pitching higher price");
    expect(plainHeadline("R&amp;D  at&#32;the &quot;lab&quot;")).toBe('R&D at the "lab"');
    expect(plainHeadline("GPT-5 - what changed and why it matters for agents in production today")).toBe("GPT-5 - what changed and why it matters for agents in production today");
    // wired at crawl/build: Wire + lead modules (rank-snapshot), TL;DR (script + server component)
    expect(read("scripts/rank-snapshot.ts")).toContain("title: plainHeadline(r.title)");
    expect(read("scripts/rank-snapshot.ts")).toContain("plainLead(leadNow)");
    expect(read("src/components/sage/tldr-24h.tsx")).toContain("plainHeadline(b.title)");
  });
});

describe("F2.3b — internal labels behind desk details", () => {
  test("16 · no CYC/, Sol≠Astra or pack-id text outside the collapsed details; all present inside it", () => {
    const tsx = read("src/components/sage/desk.tsx");
    const a = tsx.indexOf("<details className=\"desk-details");
    const b = tsx.indexOf("</details>", a);
    expect(a).toBeGreaterThan(0);
    const inside = tsx.slice(a, b);
    expect(inside).not.toContain(" open");
    for (const s of ["CYC/{CYCLE.id}", "Sol≠Astra", "pack {DIGEST_CADENCE.pack_id}", "<summary>desk details</summary>"]) expect(inside).toContain(s);
    // Brief (default lane) + topbar: the visible JSX carries none of them.
    const top = tsx.slice(tsx.indexOf("<header className=\"desk-topbar"), tsx.indexOf("<nav className=\"desk-lane\""));
    const brief = tsx.slice(tsx.indexOf("function Brief("), tsx.indexOf("export function Pulse"));
    for (const part of [top.replace(inside, ""), brief]) {
      const text = part.replace(/\/\/.*$/gm, "").replace(/\{\/\*[\s\S]*?\*\/\}/g, "");
      expect(text).not.toMatch(/CYC\/|cyc\/|Sol≠Astra|DIGEST_CADENCE\.pack_id/);
    }
    // nothing deleted from the other lanes' labels: they now read from the same details (DOM)
    expect(tsx).toContain("CYC/{CYCLE.id}");
  });
});

describe("F2.3c — Atom MIME", () => {
  test("17 · feed.atom is byte-identical to feed.xml, written in the same step; head advertises it", () => {
    expect(existsSync(join(DESK, "public/feed.atom"))).toBe(true);
    expect(readFileSync(join(DESK, "public/feed.atom"))).toEqual(readFileSync(join(DESK, "public/feed.xml")));
    const step = read("scripts/atom-feed.ts");
    expect(step).toMatch(/writeIfChanged\(p\.feed, xml\);\n\s*writeIfChanged\(p\.feedAtom, xml\)/);
    expect(read("src/app/layout.tsx")).toContain('types: { "application/atom+xml": `${SITE_URL}/feed.atom` }');
    expect(read("scripts/ci-state.sh")).toContain("ATOM=public/feed.atom");
    expect(read("scripts/reader-hash.ts")).toContain('files["public/feed.atom"]');
    expect(read("scripts/pages-publish.sh")).toContain("':(exclude)desk/public/feed.atom'");
    expect(read("scripts/backup-allowlist.txt")).toContain("desk/public/feed.atom");
  });
});

describe("F2 gates", () => {
  const note = readFileSync(join(DESK, "../PR-NOTE-F2.md"), "utf8");
  test("18 · First Load within ±200 B of the base build (both numbers recorded in the PR note)", () => {
    const m = /First Load[^\n]*base (\d[\d,]*) B[^\n]*branch (\d[\d,]*) B/.exec(note);
    expect(m).not.toBeNull();
    const [base, branch] = [m![1]!, m![2]!].map((x) => Number(x.replace(/,/g, "")));
    expect(Math.abs(branch - base)).toBeLessThanOrEqual(200);
  });
  test("19 · overflow-390 clean, plain and seeded (recorded run)", () => {
    expect(note).toMatch(/overflow-390: OK \(plain\) · OK \(seeded\)/);
  });
  test("20 · config_hash moves only for the new source keys (lab_rss / sec_rss / releases_atom feed lists)", () => {
    const c = structuredClone(SAGE_SETUP.config) as ReturnType<typeof defaultSageConfig>;
    // The page payload omits gmail_senders (count only); restore the committed list before hashing.
    c.keywords.gmail_senders = JSON.parse(readFileSync(join(import.meta.dir, "../../../config/sage-sources.json"), "utf8")).keywords.gmail_senders;
    expect(SAGE_SETUP.config_hash).toBe(configHash(c));
    // Intel plan (Oct 24) appended three lab feeds after F2; strip them to compare against the F2 hash.
    const INTEL = new Set(["testingcatalog", "cursor", "huggingnews"]);
    c.sources.lab_rss.feeds = c.sources.lab_rss.feeds.filter((f) => !INTEL.has(f));
    // …and intel plan 2's Gmail config back to the F2 values.
    const d = defaultSageConfig();
    c.sources.gmail = d.sources.gmail;
    c.keywords.gmail_senders = d.keywords.gmail_senders;
    c.keywords.gmail_seed = d.keywords.gmail_seed;
    expect(configHash(c)).toBe("a116c3b25ffb");
    const F2 = new Set(["the-decoder", "unit42", "securityweek", "railway", "codex", "hf-trending", "hf-moonshotai", "hf-nvidia", "hf-tencent"]);
    for (const k of ["lab_rss", "sec_rss", "releases_atom"] as const) c.sources[k].feeds = c.sources[k].feeds.filter((f) => !F2.has(f));
    expect(configHash(c)).toBe("898c7ea45214"); // main before F2
  });
});
