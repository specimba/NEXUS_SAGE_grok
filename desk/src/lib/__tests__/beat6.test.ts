import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { LANES, laneTabs } from "@/lib/lanes";
import { arxivYear, buildPaperRows, buildRows, selfRepostIds, type ClusterInput } from "@/lib/pulse-v5";
import { PAPERS } from "@/data/papers";

describe("lane tabs — exactly one active, always the current lane", () => {
  test("all 6 lanes: active index = lane index", () => {
    LANES.forEach((lane, i) => {
      const tabs = laneTabs(lane);
      const active = tabs.filter((t) => t.active);
      expect(active.length).toBe(1);
      expect(active[0].id).toBe(lane);
      expect(active[0].index).toBe(i + 1);
      expect(active[0].prefix).toBe(`[${String(i + 1).padStart(2, "0")}]`);
    });
  });

  test("before the hash is read no tab is filled (SSR brief default never paints on voice)", () => {
    expect(laneTabs("brief", false).some((t) => t.active)).toBe(false);
    expect(laneTabs("voice").find((t) => t.id === "brief")!.active).toBe(false);
  });

  test("CSS: inactive tabs never get a fill from hover/focus; background is not transitioned", () => {
    const css = readFileSync(resolve(import.meta.dir, "../../app/globals.css"), "utf8");
    const beat6 = css.slice(css.indexOf("Beat 6 — lane tab parity"));
    expect(beat6).toContain('.desk-lane-btn:not([aria-current="page"]):hover');
    expect(beat6).toMatch(/:not\(\[aria-current="page"\]\):active \{\s*background: transparent;/);
    expect(beat6).toMatch(/\.desk-lane-btn \{\s*transition: color 120ms ease;\s*\}/);
    expect(/#[0-9a-f]{3,8}\b/i.test(beat6)).toBe(false);
  });

  test("CSS: no amber anywhere on the tab row; inactive numbers are var(--muted) on every lane", () => {
    const css = readFileSync(resolve(import.meta.dir, "../../app/globals.css"), "utf8");
    const bare = css.replace(/\/\*[\s\S]*?\*\//g, "");
    const rules = [...bare.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({ sel: m[1].trim(), body: m[2] }));
    const tabRow = rules.filter((r) => /desk-lane|lane-prefix/.test(r.sel));
    expect(tabRow.length).toBeGreaterThan(5);
    for (const r of tabRow) expect(`${r.sel} { ${r.body}`).not.toMatch(/amber/i);
    const inactive = tabRow.filter((r) => /:not\(\[aria-current="page"\]\)[^,]*\.lane-prefix/.test(r.sel));
    expect(inactive.length).toBeGreaterThan(0);
    for (const r of inactive) expect(r.body).toMatch(/color:\s*var\(--muted\)/);
    // lane-specific overrides would reintroduce the [01]/[02] vs [03]–[06] split
    expect(tabRow.some((r) => /nth-child|data-lane/.test(r.sel))).toBe(false);
  });
});

describe("papers row builder", () => {
  test("columns: up · year · badges lit by enrich · abs/pdf · doi", () => {
    const [a, b] = buildPaperRows([
      {
        id: "2609.25804",
        title: "T",
        up: 118,
        href: "https://arxiv.org/abs/2609.25804",
        abstract: "x",
        pdfUrl: "https://arxiv.org/pdf/2609.25804",
        crossrefDoi: "https://doi.org/10.1/abc",
        year: 2025,
      },
      { id: "2610.00001", title: "U", up: 3, href: "https://arxiv.org/abs/2610.00001" },
    ]);
    expect(a.year).toBe(2025);
    expect(a.badges).toEqual([
      { label: "HF", lit: true },
      { label: "ARX", lit: true },
      { label: "OAX", lit: false },
      { label: "XREF", lit: true },
    ]);
    expect(a.doi).toBe("10.1/abc");
    expect(a.pdf).toContain("/pdf/");
    expect(b.year).toBe(2026);
    expect(b.pdf).toBeNull();
    expect(b.badges.filter((x) => x.lit).map((x) => x.label)).toEqual(["HF"]);
    expect(arxivYear("not-an-id")).toBeNull();
  });

  test("live data carries ≥14 rows for the 1280×800 pass mark", () => {
    expect(buildPaperRows(PAPERS as never).length).toBeGreaterThanOrEqual(14);
  });
});

describe("self_repost members (0 sources, SELF badge)", () => {
  const base: ClusterInput = {
    id: "cl:rss:openai:1",
    title: "OpenAI ships a thing",
    url: "https://openai.com/x",
    lead_id: "rss:openai:1",
    lead_source: "rss-lab",
    sources: ["rss-lab", "gnews-rss"],
    member_ids: ["rss:openai:1", "gnews:abc"],
    size: 2,
    at: "2026-09-24T20:00:00Z",
    first_seen: null,
    is_new: false,
  };
  const members = {
    "rss:openai:1": { badge: "OAI", publisher: "openai" },
    "gnews:abc": { badge: "GNW", publisher: "OpenAI" },
  };

  test("fixture with self_repost: GNews repost is SELF, not a source; row is single-source", () => {
    const fixture: ClusterInput = {
      ...base,
      members: [
        { id: "rss:openai:1", source: "rss-lab" },
        { id: "gnews:abc", source: "gnews-rss", self_repost: true },
      ],
    };
    const [r] = buildRows([fixture], members).rows;
    expect(r.selfBadges).toEqual(["GNW"]);
    expect(r.sourceCount).toBe(1);
    expect(r.multiSource).toBe(false);
    expect(r.alsoBadges).toEqual([]);
    expect(r.alsoPublishers).toEqual([]);
  });

  test("field absent ⇒ unchanged behaviour (real cross-source cluster)", () => {
    const [r] = buildRows([base], members).rows;
    expect(selfRepostIds(base).size).toBe(0);
    expect(r.selfBadges).toEqual([]);
    expect(r.sourceCount).toBe(2);
    expect(r.multiSource).toBe(true);
    expect(r.alsoBadges).toEqual(["GNW"]);
  });

  test("self_repost_ids form is honoured too", () => {
    const [r] = buildRows([{ ...base, self_repost_ids: ["gnews:abc"] }], members).rows;
    expect(r.sourceCount).toBe(1);
    expect(r.selfBadges).toEqual(["GNW"]);
  });
});
