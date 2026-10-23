import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  fetchRssSecurity,
  isExploitSensationalism,
  isSecurityBriefEligible,
  parseRssOrAtomCapped,
  SECURITY_FEEDS,
  toSecShelfItems,
  toSecurityItems,
  truncateAfterNthEntry,
  type SecurityLabId,
} from "@/lib/rss-security";
import { parseRssOrAtom } from "@/lib/rss-labs";
import { CYCLE } from "@/data/cycle";
import { fast } from "./tmp-cache";

const FIX = (name: string) =>
  readFileSync(resolve(import.meta.dir, "fixtures", name), "utf8");

const TOB = FIX("rss-tob-sample.xml");
const P0 = FIX("atom-projectzero-sample.xml");
const FOX = FIX("rss-foxit-remotepe.xml");
const ETR = FIX("rss-embracethered-sample.xml");

describe("Security RSS parse → schema", () => {
  test("Trail of Bits fixture · briefEligible false · digestRefOk", () => {
    const entries = parseRssOrAtom(TOB);
    expect(entries.length).toBeGreaterThanOrEqual(2);
    const items = toSecurityItems(entries, "trailofbits");
    expect(items.length).toBeGreaterThanOrEqual(1);
    const audit = items.find((i) => i.title.includes("Auditing agent"))!;
    expect(audit).toBeTruthy();
    expect(audit.lab).toBe("trailofbits");
    expect(audit.source).toBe("rss-security");
    expect(audit.briefEligible).toBe(false);
    expect(audit.digestRefOk).toBe(true);
    expect(audit.pulseEligible).toBe(true);
    expect(audit.summary.length).toBeLessThanOrEqual(400);
    expect(isSecurityBriefEligible(audit)).toBe(false);
  });

  test("ToB toolkit GitHub URL → shelfOnly, off Brief", () => {
    const items = toSecurityItems(parseRssOrAtom(TOB), "trailofbits");
    const toolkit = items.find((i) => /ModSecurity/i.test(i.title))!;
    expect(toolkit).toBeTruthy();
    expect(toolkit.shelfOnly).toBe(true);
    expect(toolkit.pulseEligible).toBe(false);
    expect(toolkit.briefEligible).toBe(false);
    const shelf = toSecShelfItems(items);
    expect(shelf.some((s) => s.reason === "rss-security-shelf")).toBe(true);
  });

  test("Project Zero Atom fixture (projectzero.google)", () => {
    const items = toSecurityItems(parseRssOrAtomCapped(P0, 12), "projectzero");
    expect(items.length).toBeGreaterThanOrEqual(1);
    expect(items[0]!.lab).toBe("projectzero");
    expect(items[0]!.title).toContain("0day trends");
    expect(items[0]!.briefEligible).toBe(false);
    expect(items[0]!.link).toContain("projectzero.google");
  }, { timeout: 30_000 });

  test("Fox-IT RemotePE fixture · briefEligible false · never Brief", () => {
    const entries = parseRssOrAtom(FOX);
    expect(entries.length).toBeGreaterThanOrEqual(3);
    const items = toSecurityItems(entries, "fox-it");
    expect(items.length).toBeGreaterThanOrEqual(2);
    const remote = items.find((i) => i.title.includes("RemotePE"))!;
    expect(remote).toBeTruthy();
    expect(remote.lab).toBe("fox-it");
    expect(remote.source).toBe("rss-security");
    expect(remote.briefEligible).toBe(false);
    expect(remote.digestRefOk).toBe(true);
    expect(remote.pulseEligible).toBe(true);
    expect(remote.link).toContain("blog.fox-it.com");
    expect(isSecurityBriefEligible(remote)).toBe(false);
    expect(items.some((i) => /Lazarus/i.test(i.title))).toBe(true);
    expect(items.some((i) => /Dissect/i.test(i.title))).toBe(true);
    for (const it of items) {
      expect(it.briefEligible).toBe(false);
      expect(it.id).not.toBe("hf-incident");
    }
  });

  test("parseRssOrAtomCapped stops at max entries", () => {
    const one = parseRssOrAtomCapped(P0, 1);
    expect(one).toHaveLength(1);
    expect(one[0]!.title).toContain("0day trends");
    const two = parseRssOrAtomCapped(P0, 2);
    expect(two.length).toBeGreaterThanOrEqual(2);
    const truncated = truncateAfterNthEntry(P0, 1);
    expect((truncated.match(/<\/entry>/gi) ?? []).length).toBe(1);
    expect(truncated.includes("Extra entry for capped parse")).toBe(false);
  }, { timeout: 30_000 });

  test("fetchRssSecurity offline fixtures for ToB + Fox-IT + Project Zero + Embrace The Red", async () => {
    const fixtures: Partial<Record<SecurityLabId, string>> = {
      trailofbits: TOB,
      "fox-it": FOX,
      projectzero: P0,
      embracethered: ETR,
    };
    // PASS-F2.2d feeds (unit42 / securityweek / railway) have no fixture here — keep this offline test to the S1.2 four.
    const r = await fetchRssSecurity({ ...fast(), fixtures, feeds: SECURITY_FEEDS.slice(0, 4) });
    expect(r.feedsOk.length).toBe(4);
    expect(r.feedsOk.map((f) => f.lab).sort()).toEqual([
      "embracethered",
      "fox-it",
      "projectzero",
      "trailofbits",
    ]);
    expect(r.pulse.length).toBeGreaterThanOrEqual(3);
    expect(r.items.some((i) => i.lab === "fox-it")).toBe(true);
    for (const it of r.items) {
      expect(it.briefEligible).toBe(false);
      expect(it.digestRefOk).toBe(true);
      expect(it.source).toBe("rss-security");
      expect(it.lab).not.toBe("ncc");
    }
  }, { timeout: 30_000 });
});

describe("classifyPost / DENY on security RSS", () => {
  test("Astra compromised Hugging Face → flatten drop", () => {
    const items = toSecurityItems(
      [
        {
          title: "Astra agents compromised Hugging Face",
          link: "https://blog.trailofbits.com/bad",
          guid: "deny-sec-1",
          published: "2026-09-01T00:00:00Z",
          summary: "",
        },
      ],
      "trailofbits",
    );
    expect(items).toHaveLength(0);
  });

  test("Sol = Astra → DENY flatten drop", () => {
    const items = toSecurityItems(
      [
        {
          title: "Persistent-Sol = Astra confirmed on HF",
          link: "https://blog.trailofbits.com/bad2",
          guid: "deny-sec-2",
          published: "2026-09-01T00:00:00Z",
          summary: "",
        },
      ],
      "trailofbits",
    );
    expect(items).toHaveLength(0);
  });

  test("exploit how-to sensationalism → rumor tag, never Brief", () => {
    expect(
      isExploitSensationalism(
        "Step-by-step remote code execution exploit tutorial",
      ),
    ).toBe(true);
    const items = toSecurityItems(
      [
        {
          title: "Step-by-step remote code execution exploit tutorial",
          link: "https://projectzero.google/2026/08/rce.html",
          guid: "sens-1",
          published: "2026-08-28T12:00:00Z",
          summary: "How to weaponize this bug with a complete exploit PoC walkthrough.",
        },
      ],
      "projectzero",
    );
    expect(items).toHaveLength(1);
    expect(items[0]!.tag).toBe("rumor");
    expect(items[0]!.briefEligible).toBe(false);
    expect(items[0]!.digestRefOk).toBe(true);
  });

  test("civilizations / announced deal → drop", () => {
    expect(
      toSecurityItems(
        [
          {
            title: "Announced deal reshapes civilizations",
            link: "https://blog.trailofbits.com/bad3",
            guid: "deny-sec-3",
            published: "2026-09-01T00:00:00Z",
            summary: "",
          },
        ],
        "trailofbits",
      ),
    ).toHaveLength(0);
  });
});

describe("never Brief · cycle locks · ToB+Fox-IT+P0 · NCC skip", () => {
  test("all fixture items briefEligible false; pin set unchanged", () => {
    for (const [lab, xml] of [
      ["trailofbits", TOB],
      ["fox-it", FOX],
      ["projectzero", P0],
    ] as const) {
      for (const it of toSecurityItems(
        lab === "projectzero" ? parseRssOrAtomCapped(xml, 12) : parseRssOrAtom(xml),
        lab,
      )) {
        expect(it.briefEligible).toBe(false);
        expect(isSecurityBriefEligible(it)).toBe(false);
        expect(it.id).not.toBe("hf-incident");
      }
    }
    expect(CYCLE.id).toBe("003");
    expect(CYCLE.pins[0]?.id).toBe("hf-incident");
    expect(CYCLE.pins[0]?.kind).toBe("lead");
    expect(CYCLE.pins.map((p) => p.id)).toEqual([
      "hf-incident",
      "astra-depth",
      "aisle-curl",
    ]);
  });

  test("SECURITY_FEEDS are ToB + Fox-IT + Project Zero + Embrace The Red (PASS-S1.2) — NCC out", () => {
    const labs = SECURITY_FEEDS.map((f) => f.lab);
    expect(labs).toEqual(["trailofbits", "fox-it", "projectzero", "embracethered", "unit42", "securityweek", "railway"]); // + PASS-F2.2d Scout Oct 23
    expect(labs).not.toContain("ncc");
    const fox = SECURITY_FEEDS.find((f) => f.lab === "fox-it")!;
    expect(fox.urls[0]).toBe("https://blog.fox-it.com/feed/");
    expect(fox.streamCap).toBeFalsy();
    const p0 = SECURITY_FEEDS.find((f) => f.lab === "projectzero")!;
    expect(p0.urls[0]).toBe("https://projectzero.google/feed.xml");
    expect(p0.streamCap).toBe(true);
    for (const f of SECURITY_FEEDS) {
      expect(f.urls.every((u) => /^https:\/\//.test(u))).toBe(true);
    }
  });

  test("bad XML fail-closed → empty parse", () => {
    expect(parseRssOrAtomCapped("<<<not xml", 5)).toEqual([]);
    expect(toSecurityItems([], "trailofbits")).toEqual([]);
  });

  test("Fox-IT empty channel soft-continues · brief still false", async () => {
    const empty = `<?xml version="1.0"?><rss version="2.0"><channel><title>x</title></channel></rss>`;
    const r = await fetchRssSecurity({
      ...fast(),
      feeds: [{ lab: "fox-it", urls: ["https://blog.fox-it.com/feed/"] }],
      fixtures: { "fox-it": empty },
    });
    expect(
      r.feedsOk.some((f) => f.lab === "fox-it") ||
        r.feedsSkipped.some((f) => f.lab === "fox-it"),
    ).toBe(true);
    expect(r.items.every((i) => i.briefEligible === false)).toBe(true);
  });
});

describe("PASS-S1.2 — Embrace The Red (one SECURITY_FEEDS entry)", () => {
  test("registry entry: first-party RSS URL, no streamCap", () => {
    const etr = SECURITY_FEEDS.find((f) => f.lab === "embracethered")!;
    expect(etr.urls).toEqual(["https://embracethered.com/blog/index.xml"]);
    expect(etr.streamCap).toBeFalsy();
  });
  test("real feed sample → SEC items: rss-sec:embracethered ids, never Brief, cap_per_feed applies", async () => {
    const items = toSecurityItems(parseRssOrAtom(ETR), "embracethered");
    expect(items.length).toBe(3);
    for (const it of items) {
      expect(it.id).toMatch(/^rss-sec:embracethered:[0-9a-f]{16}$/);
      expect(it.source).toBe("rss-security");
      expect(it.briefEligible).toBe(false);
      expect(it.link).toContain("embracethered.com/blog/posts/");
    }
    expect(items[0]!.title).toContain("Visual Studio Copilot");
    const r = await fetchRssSecurity({
      feeds: SECURITY_FEEDS.filter((f) => f.lab === "embracethered"),
      fixtures: { embracethered: ETR },
      maxPerFeed: 2,
      ...fast(),
    });
    expect(r.feedsOk).toEqual([{ lab: "embracethered", url: "fixture", count: 2 }]);
    expect(r.items.length).toBe(2);
  });
});
