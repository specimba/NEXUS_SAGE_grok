import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PULSE_CLUSTERS } from "@/data/pulse-clusters";
import { buildRows } from "@/lib/pulse-v5";
import {
  buildCoverage,
  drawerKicker,
  opensDrawer,
  readStoryParam,
  scoreContribution,
  stepId,
  writeStoryParam,
  type MemberItem,
} from "@/lib/story-drawer";

import enzymeFx from "./fixtures/enzyme-2026-09-24T2213Z.json";

/** Frozen real crawl (22:13Z) — live 4h crawls rotate GNews members out of the enzyme cluster. */
function fxItems(): Record<string, MemberItem> {
  const m: Record<string, MemberItem> = {};
  for (const h of enzymeFx.hn) m[h.id] = { title: h.text, publisher: `hn/${h.author}`, badge: "HN", at: h.at, url: h.url };
  for (const g of enzymeFx.gnews) m[g.id] = { title: g.title, publisher: g.publisher, badge: "GNW", at: g.published, url: g.link };
  return m;
}

describe("Beat 8 story drawer — coverage list", () => {
  const enzyme = enzymeFx.cluster as unknown as (typeof PULSE_CLUSTERS)[number];

  test("real Claude enzyme cluster (frozen 22:13Z crawl): HN + Al Jazeera + 1 more, SELF (Anthropic) struck and last", () => {
    expect(enzyme).toBeDefined();
    const cov = buildCoverage(enzyme!, fxItems());
    expect(cov.length).toBe(enzyme!.member_ids.length);
    const pubs = cov.map((c) => c.publisher);
    expect(pubs.some((p) => p.startsWith("hn/"))).toBe(true);
    expect(pubs).toContain("Al Jazeera");
    const last = cov[cov.length - 1]!;
    expect(last.self).toBe(true);
    expect(last.badge).toBe("SELF");
    expect(last.publisher).toBe("Anthropic");
    expect(cov.filter((c) => c.self).length).toBe(1);
    expect(cov.filter((c) => c.lead).length).toBe(1);
    // non-self rows are earliest first
    const times = cov.filter((c) => !c.self).map((c) => Date.parse(c.at!));
    expect([...times].sort((a, b) => a - b)).toEqual(times);
    // each source keeps its own headline
    expect(new Set(cov.map((c) => c.title)).size).toBeGreaterThan(1);
  });

  test("drawer only for multi-source rows; single-source keeps inline expand", () => {
    const { rows } = buildRows(PULSE_CLUSTERS, {});
    const multi = rows.filter(opensDrawer);
    expect(multi.length).toBeGreaterThan(0);
    expect(multi.every((r) => r.sourceCount >= 2)).toBe(true);
    expect(rows.some((r) => !opensDrawer(r))).toBe(true);
  });

  test("kicker, footer, lead-less member fallback", () => {
    expect(drawerKicker({ sources: 3, firstSeen: "2026-09-24T18:12:00Z", age: "4h", mark: "▲2" })).toBe(
      "3 SRC · first seen 21:12 · age 4h · ▲2",
    );
    expect(drawerKicker({ sources: 2, firstSeen: null, age: "1h" })).toBe("2 SRC · first seen --:-- · age 1h");
    expect(scoreContribution(3)).toBe("score contribution ×1.30 (3 SRC)");
    expect(scoreContribution(9)).toBe("score contribution ×1.45 (9 SRC)");
    const cov = buildCoverage(
      { id: "cl:x", title: "T", url: "u", lead_id: "hn:1", lead_source: "hn-algolia", sources: [], member_ids: ["hn:1", "gnews:2"], size: 2, at: "2026-09-24T10:00:00Z", first_seen: null, is_new: false },
      {},
    );
    expect(cov[0]).toMatchObject({ id: "hn:1", lead: true, title: "T" });
    expect(cov[1]).toMatchObject({ badge: "GNW", at: null });
  }, 30_000); // first tz-aware Intl formatter can be slow under load
});

describe("Beat 8 story drawer — Beat 9 key surface + URL", () => {
  test("next / prev wrap over drawer-capable ids", () => {
    const ids = ["a", "b", "c"];
    expect(stepId(ids, "a", 1)).toBe("b");
    expect(stepId(ids, "c", 1)).toBe("a");
    expect(stepId(ids, "a", -1)).toBe("c");
    expect(stepId(ids, null, 1)).toBe("a");
    expect(stepId(ids, null, -1)).toBe("c");
    expect(stepId([], "a", 1)).toBeNull();
  });

  test("?story=<clusterId> round-trips and keeps other params", () => {
    const s = writeStoryParam("?x=1", "cl:hn:49820134");
    expect(readStoryParam(s)).toBe("cl:hn:49820134");
    expect(new URLSearchParams(s).get("x")).toBe("1");
    expect(writeStoryParam(s, null)).toBe("?x=1");
    expect(writeStoryParam("", null)).toBe("");
  });

  test("dialog a11y + hook adds no key handlers; CSS tokens only", () => {
    const tsx = readFileSync(resolve(import.meta.dir, "../../components/sage/desk.tsx"), "utf8");
    expect(tsx).toContain('role="dialog"');
    expect(tsx).toContain('aria-modal="true"');
    expect(tsx).toContain("aria-labelledby={headId}");
    expect(tsx).toContain("company&apos;s own post · counts 0");
    const hook = readFileSync(resolve(import.meta.dir, "../use-story-drawer.ts"), "utf8");
    // the hook stays key-free; Beat 9's single desk-level listener is asserted in keys.test.ts
    expect(/(window|document)\.addEventListener\(\s*["']key/.test(hook)).toBe(false);
    const css = readFileSync(resolve(import.meta.dir, "../../app/globals.css"), "utf8");
    const block = css.slice(css.indexOf("/* Beat 8 — Pulse story drawer"));
    expect(block).toContain("width: 440px");
    expect(block).toContain("line-through");
    expect(block).toContain("prefers-reduced-motion");
    expect(block).toContain("160ms ease-out");
    expect(/#[0-9a-f]{3,8}\b/i.test(block)).toBe(false);
  });
});
