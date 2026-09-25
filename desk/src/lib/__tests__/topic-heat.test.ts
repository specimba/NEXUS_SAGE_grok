import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  OTHER_LABS, clusterOtherLabs, countOtherLabs, driversLine, HEAT_COMPANIES,
  bucketWindows, clusterCompanies, companyFilterMatch, countCompanies, deltaText, heatCells, heatLabel,
  realWindows, upsertCrawl, windowLabel, windowStart, type HeatCounts, type HeatCrawl,
} from "@/lib/topic-heat";

const C = (n: number, over: Partial<HeatCounts> = {}): HeatCounts => ({ anthropic: n, openai: n, google: n, nvidia: n, hf: n, other: n, ...over });
const crawl = (at: string, counts: HeatCounts): HeatCrawl => ({ crawl_at: at, counts });

describe("Beat 10 heat — 4h routine windows (Istanbul 02/06/10/14/18/22)", () => {
  test("window starts land on 02/06/10/14/18/22 Istanbul", () => {
    expect(windowLabel(windowStart(Date.parse("2026-09-24T23:11:00Z")))).toBe("02"); // 02:11 IST
    expect(windowLabel(windowStart(Date.parse("2026-09-24T22:59:59Z")))).toBe("22"); // 01:59 IST
    expect(windowLabel(windowStart(Date.parse("2026-09-25T03:00:00Z")))).toBe("06");
    expect(new Date(windowStart(Date.parse("2026-09-24T21:18:09Z"))).toISOString()).toBe("2026-09-24T19:00:00.000Z");
  });

  test("several hand runs minutes apart collapse to ONE window; the latest crawl in it wins", () => {
    const hand = [
      crawl("2026-09-24T21:18:09Z", C(1)),
      crawl("2026-09-24T21:29:34Z", C(2)),
      crawl("2026-09-24T21:43:33Z", C(3)),
      crawl("2026-09-24T22:13:06Z", C(9)),
    ];
    const w = bucketWindows(hand, "2026-09-24T22:13:06Z");
    expect(w).toHaveLength(6);
    expect(realWindows(w)).toBe(1);
    expect(w[5]!.crawl_at).toBe("2026-09-24T22:13:06Z");
    expect(w[5]!.counts!.anthropic).toBe(9);
    expect(heatLabel(w)).toBe("HEAT · 1/6 windows");
  });

  test("a missing window renders as a gap (null), never zero or padding", () => {
    const w = bucketWindows(
      [crawl("2026-09-24T15:10:00Z", C(4)), /* 22 IST window missing */ crawl("2026-09-24T23:11:00Z", C(6, { hf: 0 }))],
      "2026-09-24T23:11:00Z",
    );
    expect(w.map((x) => x.label)).toEqual(["06", "10", "14", "18", "22", "02"]);
    expect(w.map((x) => (x.counts ? x.counts.anthropic : null))).toEqual([null, null, null, 4, null, 6]);
    const cells = heatCells(w);
    const a = cells.find((c) => c.id === "anthropic")!;
    expect(a.bars).toEqual([null, null, null, 4, null, 6]);
    expect(a.delta).toBeNull(); // previous window is a gap — no invented delta
    expect(cells.find((c) => c.id === "hf")!.bars[5]).toBe(0); // a real zero stays a zero
  });

  test("six real windows ⇒ full label; delta vs previous window; only the hottest is hot (tie → biggest rise)", () => {
    const at = (h: number) => new Date(Date.parse("2026-09-24T03:05:00Z") + h * 3_600_000).toISOString();
    const crawls = [0, 4, 8, 12, 16, 20].map((h, i) => crawl(at(h), C(i, { openai: i === 5 ? 9 : 1, google: i === 5 ? 9 : 8 })));
    const w = bucketWindows(crawls, at(20));
    expect(realWindows(w)).toBe(6);
    expect(heatLabel(w)).toBe("HEAT · 6 windows");
    const cells = heatCells(w);
    expect(cells.filter((c) => c.hot).map((c) => c.id)).toEqual(["openai"]); // 9 each, openai rose 8 vs google 1
    expect(cells.find((c) => c.id === "openai")!.delta).toBe(8);
    expect(deltaText(8)).toBe("▲8");
    expect(deltaText(-2)).toBe("▼2");
    expect(deltaText(0)).toBe("=");
    expect(deltaText(null)).toBe("");
  });

  test("crawls after the latest stamp are ignored; upsert replaces same crawl_at", () => {
    const f = upsertCrawl(upsertCrawl(null, crawl("2026-09-24T22:13:06Z", C(1))), crawl("2026-09-24T22:13:06Z", C(2)));
    expect(f.crawls).toHaveLength(1);
    expect(f.crawls[0]!.counts.openai).toBe(2);
    const w = bucketWindows([crawl("2026-09-25T03:10:00Z", C(5))], "2026-09-24T22:13:06Z");
    expect(realWindows(w)).toBe(0);
  });
});

describe("Beat 10 heat — company matching", () => {
  test("headline aliases and lab feeds", () => {
    expect([...clusterCompanies({ title: "Claude discovers a novel enzyme", member_ids: [] })]).toEqual(["anthropic"]);
    expect([...clusterCompanies({ title: "Gemini 3.8 TTS", member_ids: [] })]).toEqual(["google"]);
    expect([...clusterCompanies({ title: "A post", member_ids: ["rss:nvidia-dev:abc"] })]).toEqual(["nvidia"]);
    expect([...clusterCompanies({ title: "Transformers runs llama.cpp", member_ids: ["rss:huggingface:x"] })]).toEqual(["hf"]);
    expect(clusterCompanies({ title: "GPT-6 is out", member_ids: [] }).has("openai")).toBe(true);
    expect(clusterCompanies({ title: "Soraya is a name", member_ids: [] }).size).toBe(0);
    const n = countCompanies([{ title: "OpenAI, Anthropic CEOs urge UN", member_ids: [] }]);
    expect(n).toEqual({ anthropic: 1, openai: 1, google: 0, nvidia: 0, hf: 0, other: 0 });
  });
  test("OTHER LABS: one exported map, word-boundary entity match, cluster counts once for the cell", () => {
    expect(Object.keys(OTHER_LABS)).toEqual(["xai", "meta", "mistral", "deepseek", "qwen", "xiaomi"]);
    expect(HEAT_COMPANIES.map((c) => c.id)).toEqual(["anthropic", "openai", "google", "nvidia", "hf", "other"]);
    expect(clusterOtherLabs({ title: "xAI ships Grok 5", member_ids: [] })).toEqual(["xai"]);
    expect(clusterOtherLabs({ title: "Xiaomi MiMo-VL open weights", member_ids: [] })).toEqual(["xiaomi"]);
    expect(clusterOtherLabs({ title: "Alibaba's Qwen 4 vs DeepSeek V4", member_ids: [] })).toEqual(["deepseek", "qwen"]);
    expect(clusterOtherLabs({ title: "Meta AI introduces Proactive Memory Agent", member_ids: [] })).toEqual(["meta"]);
    expect(clusterOtherLabs({ title: "Le Chat update", member_ids: ["rss:mistral:1"] })).toEqual(["mistral"]);
    // word boundaries: no false friends
    expect(clusterOtherLabs({ title: "A meta-analysis of groking mimosa and llama.cpp quants", member_ids: [] })).toEqual([]);
    const set = [
      { title: "Qwen 4 vs DeepSeek V4", member_ids: [] },
      { title: "xAI raises again", member_ids: [] },
      { title: "Grok 5 benchmarks", member_ids: [] },
    ];
    expect(countCompanies(set).other).toBe(3); // the Qwen+DeepSeek cluster counts ONCE for the cell
    expect(countOtherLabs(set)).toEqual({ qwen: 1, deepseek: 1, xai: 2 });
    expect(driversLine({ qwen: 1, deepseek: 1, xai: 2 })).toBe("xAI · DeepSeek +1");
    expect(driversLine({ xai: 1, xiaomi: 1 })).toBe("xAI · Xiaomi");
    expect(driversLine(null)).toBe("");
  });
  test("OTHER LABS can be the single amber cell; drivers come from the latest window; filter OR-matches the group", () => {
    const w = bucketWindows(
      [{ crawl_at: "2026-09-24T23:11:00Z", counts: C(2, { other: 7 }), labs: { xai: 4, xiaomi: 3 } }],
      "2026-09-24T23:11:00Z",
    );
    const cells = heatCells(w);
    expect(cells).toHaveLength(6);
    expect(cells.filter((c) => c.hot).map((c) => c.id)).toEqual(["other"]);
    expect(cells.find((c) => c.id === "other")!.drivers).toBe("xAI · Xiaomi");
    expect(companyFilterMatch("other labs", { title: "Xiaomi MiMo tops the chart", member_ids: [] })).toBe(true);
    expect(companyFilterMatch("other labs", { title: "Grok 5", member_ids: [] })).toBe(true);
    expect(companyFilterMatch("other labs", { title: "Claude 5", member_ids: [] })).toBe(false);
  });
  test("a record from before OTHER LABS existed renders that cell as a gap, not a zero", () => {
    const old = { crawl_at: "2026-09-24T23:11:00Z", counts: { anthropic: 1, openai: 1, google: 1, nvidia: 1, hf: 1 } as unknown as HeatCounts };
    const cells = heatCells(bucketWindows([old], old.crawl_at));
    expect(cells.find((c) => c.id === "other")!.bars[5]).toBeNull();
    expect(cells.find((c) => c.id === "hf")!.bars[5]).toBe(1);
  });
  test("heat-cell filter matches by company, the same rule as the counts", () => {
    expect(companyFilterMatch("anthropic", { title: "Claude discovers an enzyme", member_ids: [] })).toBe(true);
    expect(companyFilterMatch("google", { title: "DeepMind ships", member_ids: [] })).toBe(true);
    expect(companyFilterMatch("goo", { title: "DeepMind ships", member_ids: [] })).toBe(false);
  });
  test("generated data file is bucketed and never pads gaps with zeros", () => {
    const p = resolve(import.meta.dir, "../../data/topic-heat.ts");
    expect(existsSync(p)).toBe(true);
    const src = readFileSync(p, "utf8");
    expect(src).toContain("TOPIC_HEAT_WINDOWS");
    expect(src).toMatch(/"counts": null/); // < 6 real windows so far ⇒ explicit gaps
  });
});
