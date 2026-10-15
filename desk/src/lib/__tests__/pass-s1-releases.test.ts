/**
 * PASS-S1.3 — release feeds (refs/PASS-S1-SCOUT-SOURCES.md §S1.3, acceptance tests 4 + 5 + the S1.3 part of 1).
 */
import { describe, expect, test } from "bun:test";
import { execSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { clusterItems, type PulseInput } from "@/lib/dedupe";
import { defaultBadge } from "@/lib/desk-view";
import { leadExcludeReason, RELEASE_LEAD } from "@/lib/lead-pick";
import { publisherKey } from "@/lib/pulse-v5";
import {
  decideRelease,
  fetchReleasesAtom,
  isMinorOrMajorBump,
  parseSemver,
  RELEASE_FEEDS,
  type ReleaseFeedState,
  type ReleasesSeen,
} from "@/lib/releases-atom";
import { defaultSageConfig, validateSageConfig } from "@/lib/sage-config";
import { wireCandidates, wireExcludeReason } from "@/lib/wire";
import { fast } from "./tmp-cache";

const LLAMA = RELEASE_FEEDS.find((f) => f.id === "llama.cpp")!;
const T0 = Date.parse("2026-10-16T09:00:00Z");
const H = 3_600_000;
const iso = (ms: number) => new Date(ms).toISOString().replace(/\.\d{3}Z$/, "Z");

/** A llama.cpp-shaped releases.atom (GitHub's own shape: tag in the link + Atom id). */
function atom(tags: string[], at = T0): string {
  const entries = tags
    .map(
      (t, i) => `  <entry>
    <id>tag:github.com,2008:Repository/612354784/${t}</id>
    <updated>${iso(at - i * 60_000)}</updated>
    <link rel="alternate" type="text/html" href="https://github.com/ggml-org/llama.cpp/releases/tag/${t}"/>
    <title>${t}</title>
    <content type="html">notes</content>
    <author><name>github-actions[bot]</name></author>
  </entry>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="en-US">
  <id>tag:github.com,2008:https://github.com/ggml-org/llama.cpp/releases</id>
  <link type="text/html" rel="alternate" href="https://github.com/ggml-org/llama.cpp/releases"/>
  <title>Release notes from llama.cpp</title>
  <updated>${iso(at)}</updated>
${entries}
</feed>
`;
}
const BUILDS = Array.from({ length: 10 }, (_, i) => `b${11680 - i}`); // b11680 … b11671
const seenWith = (version: string, emitted_at: string | null = null): ReleasesSeen => ({
  schema: 1,
  feeds: { "llama.cpp": { version, seeded_at: iso(T0 - 72 * H), emitted_at, emitted: [] } },
});
const run = (xml: string, seen: ReleasesSeen | undefined, now: number) =>
  fetchReleasesAtom({ ...fast(), feeds: [LLAMA], fixtures: { "llama.cpp": xml }, seen, now });

describe("S1.3 semver filter", () => {
  test("regex accepts only plain semver", () => {
    for (const t of ["v0.7.0", "0.7.0", "v1.2", "v10.20.30"]) expect(parseSemver(t)).not.toBeNull();
    for (const t of ["b11671", "v0.32.0rc2", "v0.7.0-rc1", "v1.0.0-alpha", "v1.0.0-beta.2", "v0.8.0.dev0", "nightly", "proto-v0.6.0", "v1.2.3.4"])
      expect(parseSemver(t)).toBeNull();
  });
  test("minor/major bump only", () => {
    const v = (t: string) => parseSemver(t)!;
    expect(isMinorOrMajorBump(v("v0.6.4"), v("v0.7.0"))).toBe(true);
    expect(isMinorOrMajorBump(v("v0.7.0"), v("v1.0.0"))).toBe(true);
    expect(isMinorOrMajorBump(v("v0.7.0"), v("v0.7.1"))).toBe(false);
    expect(isMinorOrMajorBump(v("v0.7.0"), v("v0.6.9"))).toBe(false);
  });
});

describe("S1.7 #4 — release filter", () => {
  test("b11671…b11680 + v0.7.0 with prior v0.6.4 → exactly one item v0.7.0", async () => {
    const r = await run(atom([...BUILDS.slice(0, 5), "v0.7.0", ...BUILDS.slice(5)]), seenWith("v0.6.4"), T0);
    expect(r.items.map((i) => i.tag)).toEqual(["v0.7.0"]);
    expect(r.items[0]!.id).toBe("rel:llama.cpp:v0.7.0");
    expect(r.items[0]!.title).toBe("llama.cpp v0.7.0");
    expect(r.items[0]!.briefEligible).toBe(false);
    expect(r.seen.feeds["llama.cpp"]!.version).toBe("v0.7.0");
    expect(r.decisions[0]!.action).toBe("bump");
  });

  test("v0.7.1 the next day → none (patch); state baseline stays v0.7.0", async () => {
    const day1 = await run(atom(["v0.7.0", ...BUILDS]), seenWith("v0.6.4"), T0);
    const day2 = await run(atom(["v0.7.1", "v0.7.0", ...BUILDS], T0 + 26 * H), day1.seen, T0 + 26 * H);
    expect(day2.decisions[0]!.action).toBe("no-bump");
    expect(day2.decisions[0]!.emitted).toBeNull();
    expect(day2.items.map((i) => i.tag)).toEqual(["v0.7.0"]); // yesterday's row may still show; nothing new
    expect(day2.seen.feeds["llama.cpp"]!.version).toBe("v0.7.0");
  });

  test("v0.32.0rc2 → none", async () => {
    const r = await run(atom(["v0.32.0rc2", "b11690"]), seenWith("v0.31.0"), T0);
    expect(r.items).toEqual([]);
    expect(r.decisions[0]!.action).toBe("no-bump");
  });

  test("first run → none, and seeds the baseline", async () => {
    const r = await run(atom(["v0.7.0", ...BUILDS]), undefined, T0);
    expect(r.items).toEqual([]);
    expect(r.decisions[0]!.action).toBe("seed");
    expect(r.seen.feeds["llama.cpp"]).toMatchObject({ version: "v0.7.0", emitted_at: null, emitted: [] });
    // the seed is the baseline: the next crawl with the same feed emits nothing
    const r2 = await run(atom(["v0.7.0", ...BUILDS]), r.seen, T0 + H);
    expect(r2.items).toEqual([]);
  });

  test("live llama.cpp feed (trimmed, 2026-10-16): seeds silently at v0.7.0", async () => {
    const xml = readFileSync(join(import.meta.dir, "fixtures/s1/releases-llama.cpp-live.xml"), "utf8");
    const r = await run(xml, undefined, T0);
    expect(r.items).toEqual([]);
    expect(r.seen.feeds["llama.cpp"]!.version).toBe("v0.7.0");
  });
});

describe("S1.7 #5 — release rate", () => {
  test("two minor bumps in 24h → 1 item (across crawls)", async () => {
    const a = await run(atom(["v0.8.0", "v0.7.0"]), seenWith("v0.7.0"), T0);
    const b = await run(atom(["v0.9.0", "v0.8.0", "v0.7.0"], T0 + 6 * H), a.seen, T0 + 6 * H);
    expect(a.decisions[0]!.emitted).toBe("v0.8.0");
    expect(b.decisions[0]!.action).toBe("rate-limited");
    expect(b.items.map((i) => i.tag)).toEqual(["v0.8.0"]);
    // after 24h the pending bump emits
    const c = await run(atom(["v0.9.0", "v0.8.0"], T0 + 25 * H), b.seen, T0 + 25 * H);
    expect(c.decisions[0]!.emitted).toBe("v0.9.0");
  });
  test("two minor bumps in one feed read → 1 item (the highest)", async () => {
    const r = await run(atom(["v0.9.0", "v0.8.0"]), seenWith("v0.7.0"), T0);
    expect(r.items.map((i) => i.tag)).toEqual(["v0.9.0"]);
  });
  test("cap_per_feed limits shown rows", () => {
    let st: ReleaseFeedState | undefined = seenWith("v0.1.0").feeds["llama.cpp"];
    for (let i = 2; i <= 6; i++) {
      const d = decideRelease(LLAMA, [{ title: `v0.${i}.0`, link: `https://github.com/x/releases/tag/v0.${i}.0`, guid: "", published: iso(T0 + i * 25 * H), summary: "" }], st, T0 + i * 25 * H);
      st = d.state;
    }
    expect(st!.emitted.length).toBe(4); // ceiling kept in state
  });
});

describe("S1.3 — never lead, never Wire, REL chip", () => {
  const rel: PulseInput = { id: "rel:ollama:v0.41.0", source: "releases-atom", title: "Ollama v0.41.0 adds MLX engine for local models", url: "https://github.com/ollama/ollama/releases/tag/v0.41.0", at: iso(T0 - 2 * H), publisher: "github.com" };
  const hn: PulseInput = { ...rel, id: "hn:1", source: "hn-algolia", url: "https://ollama.com/blog/v0.41", publisher: "hn" };
  test("REL badge, single github.com publisher across feeds", () => {
    expect(defaultBadge("rel:vllm:v0.32.0", "vllm")).toBe("REL");
    expect(publisherKey("rel:vllm:v0.32.0")).toBe(publisherKey("rel:ollama:v0.41.0"));
  });
  test("release + one HN item → not a lead (reason release); HN heads the cluster", () => {
    const [c] = clusterItems([rel, hn], { stamp: iso(T0) }).map((x) => ({ ...x, first_seen: null, is_new: false }));
    expect(c!.lead_id).toBe("hn:1");
    expect(leadExcludeReason(c!, T0, {})).toBe(RELEASE_LEAD);
  });
  test("S1.8(c): release + one HN item is NOT a Wire row (the release does not count toward 2 sources); + a lab item is", () => {
    const [c] = clusterItems([rel, hn], { stamp: iso(T0) }).map((x) => ({ ...x, first_seen: null, is_new: false }));
    expect(wireCandidates([c!], {})).toEqual([]);
    const lab: PulseInput = { ...rel, id: "rss:ollama-blog:x1", source: "rss-lab", url: "https://ollama.com/blog/mlx", publisher: "ollama" };
    const [c2] = clusterItems([rel, hn, lab], { stamp: iso(T0) }).map((x) => ({ ...x, first_seen: null, is_new: false }));
    const w = wireCandidates([c2!], {});
    expect(w.length).toBe(1);
    expect(w[0]!.sources).toBe(3); // N SRC display still shows every publisher
  });
  test("a release-led group is kept off the Wire", () => {
    const [c] = clusterItems([rel], { stamp: iso(T0) }).map((x) => ({ ...x, first_seen: null, is_new: false }));
    expect(wireExcludeReason(c!)).toBe("release");
    expect(leadExcludeReason(c!, T0, {})).toBe(RELEASE_LEAD);
  });
});

describe("S1.7 #1 (S1.3 part) — releases_atom validator + seed", () => {
  const withBlock = (patch: Record<string, unknown>) => {
    const c = defaultSageConfig() as unknown as { sources: Record<string, Record<string, unknown>> };
    c.sources.releases_atom = { ...c.sources.releases_atom, ...patch };
    return c;
  };
  test("defaults: on, cap 2, claude-code off", () => {
    expect(defaultSageConfig().sources.releases_atom).toEqual({ on: true, cap_per_feed: 2, feeds: ["llama.cpp", "ollama", "vllm"] });
    expect(validateSageConfig(withBlock({})).ok).toBe(true);
    expect(validateSageConfig(withBlock({ feeds: ["llama.cpp", "ollama", "vllm", "claude-code"] })).ok).toBe(true);
  });
  test("cap 4 ok, cap 5 rejected; unknown release id rejected", () => {
    expect(validateSageConfig(withBlock({ cap_per_feed: 4 })).ok).toBe(true);
    expect(validateSageConfig(withBlock({ cap_per_feed: 5 })).ok).toBe(false);
    expect(validateSageConfig(withBlock({ feeds: ["llama.cpp", "pytorch"] })).ok).toBe(false);
  });
});

describe("S1.3 — releases-seen.json persists through ci-state.sh stage false", () => {
  test("no-change run keeps the fresh baseline (and last-checked), reverts other data churn", () => {
    const desk = resolve(import.meta.dir, "../../..");
    const root = mkdtempSync(resolve(tmpdir(), "s1rel-"));
    const d = resolve(root, "desk");
    for (const p of ["scripts", "src/data", "artifacts/sage"]) mkdirSync(resolve(d, p), { recursive: true });
    copyFileSync(resolve(desk, "scripts/ci-state.sh"), resolve(d, "scripts/ci-state.sh"));
    writeFileSync(resolve(d, "artifacts/sage/last-checked.json"), '{"n":1}\n');
    writeFileSync(resolve(d, "artifacts/sage/releases-seen.json"), '{"schema":1,"feeds":{}}\n');
    writeFileSync(resolve(d, "src/data/wire.ts"), "export const A = 1;\n");
    const g = "-c user.name=t -c user.email=t@t -c commit.gpgsign=false";
    execSync(`git init -q -b main && git add -- desk && git ${g} commit -q -m seed`, { cwd: root });
    writeFileSync(resolve(d, "artifacts/sage/last-checked.json"), '{"n":2}\n');
    writeFileSync(resolve(d, "artifacts/sage/releases-seen.json"), '{"schema":1,"feeds":{"vllm":{"version":"v0.31.0"}}}\n');
    writeFileSync(resolve(d, "src/data/wire.ts"), "export const A = 2;\n");
    execSync("bash scripts/ci-state.sh stage false", { cwd: d });
    const staged = execSync("git diff --cached --name-only", { cwd: root, encoding: "utf8" }).trim().split("\n").sort();
    expect(staged).toEqual(["desk/artifacts/sage/last-checked.json", "desk/artifacts/sage/releases-seen.json"]);
    expect(readFileSync(resolve(d, "artifacts/sage/releases-seen.json"), "utf8")).toContain("v0.31.0");
    expect(readFileSync(resolve(d, "src/data/wire.ts"), "utf8")).toContain("A = 1");
  });
  test("backup allowlist carries releases-seen.json + the two new data modules", () => {
    const list = readFileSync(resolve(import.meta.dir, "../../../scripts/backup-allowlist.txt"), "utf8");
    for (const f of ["desk/artifacts/sage/releases-seen.json", "desk/src/data/releases-atom.ts", "desk/src/data/rss-analyst.ts"]) expect(list).toContain(f);
  });
});
