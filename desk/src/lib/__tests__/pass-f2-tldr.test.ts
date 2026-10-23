/** PASS-F2.2 acceptance 8–14 (refs/PASS-F2-FRESH-TLDR-PLAIN.md). */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildTldr, TLDR_MAX } from "@/lib/tldr-24h";
import type { WireCluster } from "@/lib/wire";
import { renderAtomFeed, tldrStep, tldrEntryId, type EditionStore } from "../../../scripts/lib/atom-feed";
import { HF_NVIDIA_CAP, HF_TRENDING_CAP, nvidiaIsModel, pickOrgReleases, pickTrending, runHfModels, type HfModel } from "@/lib/hf-models";

const CRAWL = "2026-10-23T12:00:00Z";
const hAgo = (h: number) => new Date(Date.parse(CRAWL) - h * 3_600_000).toISOString().replace(/\.\d{3}Z$/, "Z");
let n = 0;
function cl(title: string, at: string, pubs = 2): WireCluster {
  const k = ++n;
  const mem = [`hn:${k}`, ...Array.from({ length: pubs - 1 }, (_, i) => `rss-sec:lab${i}x${k}:${k}`)];
  return { id: `cl:hn:${k}`, title, url: `https://example.com/${k}`, lead_id: `hn:${k}`, lead_source: "hn-algolia", sources: ["hn-algolia"], member_ids: mem, size: mem.length, at, first_seen: null, is_new: false };
}

describe("F2.2a — Past 24 hours", () => {
  test("8 · 10 qualifying stories: 7 bullets, publisher count then recency, ≤2 per company", () => {
    const cs = [
      cl("OpenAI ships agent A", hAgo(1), 3),
      cl("OpenAI ships agent B", hAgo(2), 4),
      cl("OpenAI ships agent C", hAgo(3), 5),
      cl("Anthropic Claude update", hAgo(4), 2),
      cl("Nvidia inference chip AI", hAgo(5), 2),
      cl("Mistral open weights model", hAgo(6), 2),
      cl("Qwen reasoning model AI", hAgo(7), 2),
      cl("DeepSeek AI model drop", hAgo(8), 2),
      cl("Hugging Face AI hub news", hAgo(9), 2),
      cl("Meta Llama AI release", hAgo(10), 2),
    ];
    const t = buildTldr(cs, { crawlAt: CRAWL, date: "2026-10-23" });
    expect(t.bullets).toHaveLength(TLDR_MAX);
    expect(t.bullets.filter((b) => /OpenAI/.test(b.title))).toHaveLength(2);
    expect(t.bullets.map((b) => b.title).slice(0, 2)).toEqual(["OpenAI ships agent C", "OpenAI ships agent B"]);
    for (let i = 1; i < t.bullets.length; i++) {
      const a = t.bullets[i - 1]!, b = t.bullets[i]!;
      expect(a.sources > b.sources || (a.sources === b.sources && Date.parse(a.at) >= Date.parse(b.at))).toBe(true);
    }
    expect(t.quiet).toBe(false);
  });
  test("9 · 2 qualifying stories: 2 bullets + quiet day; nothing older than 24h", () => {
    const t = buildTldr([cl("OpenAI AI news", hAgo(3)), cl("Anthropic AI news", hAgo(20)), cl("Old AI story", hAgo(30))], { crawlAt: CRAWL, date: "2026-10-23" });
    expect(t.bullets.map((b) => b.title)).toEqual(["OpenAI AI news", "Anthropic AI news"]);
    expect(t.quiet).toBe(true);
  });
});

describe("F2.2c — feed.xml TL;DR entry", () => {
  const ed = (date: string) => ({
    date, id: `tag:specimba.github.io,2026:nexus-sage/morning/${date}`, state: "picked" as const, published: `${date}T03:11:00Z`, updated: `${date}T03:11:00Z`,
    crawl_at: `${date}T03:11:00Z`, lead: { headline: `Lead ${date}`, url: "https://example.com/l", sources: 2, sig: null, age_band: "<24h", pick_slot: "06:11" }, held_note: null, wire: [], papers: [],
  });
  const store: EditionStore = { schema: 1, editions: [ed("2026-10-23"), ed("2026-10-22")] };
  const t1 = { date: "2026-10-23", crawl_at: "2026-10-23T08:11:00Z", quiet: false, bullets: [{ id: "cl:hn:1", title: "One", url: "https://e.com/1", sources: 2 }] };
  test("10 · rebuilt next crawl: entry 1 same id, newer updated, new content; morning editions byte-identical", () => {
    const a = tldrStep(null, t1, t1.crawl_at).entry!;
    const t2 = { ...t1, crawl_at: "2026-10-23T13:11:00Z", bullets: [...t1.bullets, { id: "cl:hn:2", title: "Two", url: "https://e.com/2", sources: 3 }] };
    const b = tldrStep(a, t2, t2.crawl_at).entry!;
    expect(b.id).toBe(a.id);
    expect(b.id).toBe(tldrEntryId("2026-10-23"));
    expect(Date.parse(b.updated)).toBeGreaterThan(Date.parse(a.updated));
    expect(b.published).toBe(a.published);
    const xa = renderAtomFeed(store, a)!, xb = renderAtomFeed(store, b)!;
    const entries = (x: string) => x.split("<entry>").slice(1);
    expect(entries(xb)[0]).toContain("tldr:2026-10-23");
    expect(entries(xb)[0]).toContain("Two");
    expect(entries(xb).slice(1)).toEqual(entries(xa).slice(1));
    expect(entries(xb).slice(1).join("")).toBe(entries(renderAtomFeed(store)!).join(""));
    // no-op crawl ⇒ same object ⇒ byte-identical
    expect(tldrStep(b, { ...t2, crawl_at: "2026-10-23T18:11:00Z" }, "2026-10-23T18:11:00Z")).toEqual({ entry: b, changed: false });
    // caps: TL;DR counts toward the 14
    const many: EditionStore = { schema: 1, editions: Array.from({ length: 20 }, (_, i) => ed(`2026-10-${String(i + 1).padStart(2, "0")}`)) };
    expect((renderAtomFeed(many, b)!.match(/<entry>/g) ?? []).length).toBe(14);
  });
  test("11 · escaping matches PASS-D: html escaped, then XML escaped once; bad URLs dropped", () => {
    const t = { ...t1, bullets: [{ id: "cl:hn:9", title: `R&D <b>"x"</b> it's`, url: "javascript:alert(1)", sources: 2 }] };
    const x = renderAtomFeed(store, tldrStep(null, t, t.crawl_at).entry)!;
    expect(x).toContain("R&amp;amp;D &amp;lt;b&amp;gt;&amp;quot;x&amp;quot;&amp;lt;/b&amp;gt; it&amp;#39;s");
    expect(x).not.toContain("javascript:");
    expect(x).not.toContain("<b>");
  });
});

describe("F2.2d — HF sources", () => {
  const NOW = Date.parse(CRAWL);
  test("12 · HF trending: non-allowlisted org dropped; ≤3 rows; failure soft-fails with last-good, crawl continues", async () => {
    const models: HfModel[] = [
      { id: "random-user/qwen-finetune", createdAt: hAgo(2) },
      { id: "moonshotai/Kimi-X", createdAt: hAgo(3) },
      { id: "Qwen/Qwen4-8B", createdAt: hAgo(5) },
      { id: "nvidia/Nemotron-9", createdAt: hAgo(6) },
      { id: "tencent/Hy-2", createdAt: hAgo(7) },
      { id: "google/old-model", createdAt: hAgo(100) },
    ];
    const rows = pickTrending(models, NOW);
    expect(rows.length).toBe(HF_TRENDING_CAP);
    expect(rows.map((r) => r.title)).toEqual(["moonshotai/Kimi-X", "Qwen/Qwen4-8B", "nvidia/Nemotron-9"]);
    expect(rows.every((r) => r.id.startsWith("rel:hf-trending:") && r.briefEligible === false)).toBe(true);
    const ok = await runHfModels(["hf-trending"], { repos: [], last: [] }, async () => models, NOW);
    const failed = await runHfModels(["hf-trending"], ok.seen, async () => { throw new Error("HTTP 503"); }, NOW + 60_000);
    expect(failed.softFail).toEqual([{ lab: "hf-trending", reason: "HTTP 503" }]);
    expect(failed.rows.map((r) => r.id)).toEqual(ok.rows.map((r) => r.id));
  });
  test("13 · HF org releases: new moonshotai repo ⇒ REL row; seen repo ⇒ none; Nvidia dataset/tool dropped, ≤2", () => {
    const seed = pickOrgReleases("moonshotai", [{ id: "moonshotai/Kimi-K3", createdAt: hAgo(900) }], [], NOW);
    expect(seed.rows).toEqual([]); // first run seeds
    const next = pickOrgReleases("moonshotai", [{ id: "moonshotai/Kimi-K3.1", createdAt: hAgo(2), pipeline_tag: "text-generation" }, { id: "moonshotai/Kimi-K3", createdAt: hAgo(900) }], seed.seen, NOW);
    expect(next.rows.map((r) => r.id)).toEqual(["rel:hf-moonshotai:moonshotai/Kimi-K3.1"]);
    expect(pickOrgReleases("moonshotai", [{ id: "moonshotai/Kimi-K3.1" }], next.seen, NOW).rows).toEqual([]);
    const nvSeed = pickOrgReleases("nvidia", [{ id: "nvidia/old" }], [], NOW).seen;
    const nv = pickOrgReleases("nvidia", [
      { id: "nvidia/Nemotron-A", pipeline_tag: "text-generation" },
      { id: "nvidia/Some-Dataset", pipeline_tag: "text-generation" },
      { id: "nvidia/cosmos-export-S5", pipeline_tag: "robotics" },
      { id: "nvidia/no-pipeline" },
      { id: "nvidia/Nemotron-B", pipeline_tag: "text-generation" },
      { id: "nvidia/Nemotron-C", pipeline_tag: "text-generation" },
    ], nvSeed, NOW);
    expect(nv.rows.length).toBe(HF_NVIDIA_CAP);
    expect(nv.rows.map((r) => r.tag)).toEqual(["Nemotron-A", "Nemotron-B"]);
    expect(nvidiaIsModel({ id: "nvidia/x", pipeline_tag: "text-generation", tags: ["dataset:foo"] })).toBe(false);
  });
  test("14 · the recall check table is in the PR note", () => {
    const note = readFileSync(join(import.meta.dir, "../../../../PR-NOTE-F2.md"), "utf8");
    expect(note).toMatch(/## Recall check/);
    for (const s of ["Kimi K3.1", "training pause", "Cursor Computer Use"]) expect(note).toContain(s);
  });
});
