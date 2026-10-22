/** PASS-W — watch feed acceptance (refs/PASS-W-WATCH-FEED.md #1–10; #11 First Load is the build gate). Fixtures only; no network. */
import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { defaultSageConfig, KEYWORD_LEN_MAX, limitsFromCode, validateSageConfig, WATCH_TERMS_MAX, type SageConfig } from "../sage-config";
import { validateWithRules, type SageLimits } from "../sage-config-rules";
import { SAGE_SETUP } from "@/data/sage-setup";
import { emptyWatchStore, renderWatchFeed, watchEntryId, watchStep, WATCH_MAX_BYTES, WATCH_MAX_ENTRIES, WATCH_URL, type WatchCrawl } from "../../../scripts/lib/watch-feed";
import { tmpDir } from "./tmp-cache";

const DESK = resolve(import.meta.dir, "../../..");
const C1 = "2026-10-22T03:20:00Z";
const C2 = "2026-10-22T08:20:00Z";
const wire = (n: number, title: string, extra: Record<string, unknown> = {}) => ({
  id: `cl:hn:${n}`, title, url: `https://example.com/w/${n}`, at: C1, sources: 2, member_ids: [`hn:${n}`], ...extra,
});
const crawl = (p: Partial<WatchCrawl> = {}): WatchCrawl => ({ crawlAt: C1, wire: [], papers: [], releases: [], ...p });
const entries = (xml: string) => xml.match(/<entry>[\s\S]*?<\/entry>/g) ?? [];

describe("PASS-W watch feed", () => {
  test("2 one term matching 3 rows (wire + paper + release) → 3 entries, categories correct", () => {
    const c = crawl({
      wire: [wire(1, "Qwen 4 ships"), wire(2, "Nothing here")],
      papers: [{ id: "2610.1", title: "A study", href: "https://arxiv.org/abs/2610.1", abstract: "We fine-tune QWEN models" }],
      releases: [{ id: "rel:1", title: "vllm v0.12 adds qwen kernels", link: "https://github.com/vllm-project/vllm/releases/tag/v0.12.0", first_seen: "2026-10-21T22:00:00Z" }],
    });
    const r = watchStep(emptyWatchStore(), ["qwen", "llama"], c);
    expect([r.added, r.dropped]).toEqual([3, 0]);
    const xml = renderWatchFeed(r.store)!;
    expect(entries(xml).length).toBe(3);
    for (const e of entries(xml)) expect(e).toContain('<category term="qwen"/>');
    expect(xml).not.toContain('term="llama"');
    expect(xml).toContain(`<id>${WATCH_URL}</id>`);
    expect(xml).toContain(`<link rel="self" type="application/atom+xml" href="${WATCH_URL}"/>`);
    expect(xml).toContain("<published>2026-10-21T22:00:00Z</published>"); // release first_seen
    expect(xml).toContain(`<id>${watchEntryId("https://example.com/w/1")}</id>`);
  });

  test("3 fifteen matches → 10 written newest first, 5 dropped (watch=10/5)", () => {
    const rows = Array.from({ length: 15 }, (_, i) => wire(i, `agent ${i}`, { first_seen: `2026-10-21T${String(i).padStart(2, "0")}:00:00Z` }));
    const r = watchStep(emptyWatchStore(), ["agent"], crawl({ wire: rows }));
    expect([r.added, r.dropped]).toEqual([10, 5]);
    expect(r.store.entries.map((e) => e.title)).toEqual(Array.from({ length: 10 }, (_, i) => `agent ${14 - i}`));
    expect(Object.keys(r.store.seen).length).toBe(10); // overflow not marked seen
  });

  test("4 rerun same crawl → 0 new, identical bytes; dedupe on canonical URL", () => {
    const c = crawl({ wire: [wire(1, "agent one"), wire(2, "agent two", { url: "https://www.example.com/w/1?utm_source=x" })] });
    const a = watchStep(emptyWatchStore(), ["agent"], c);
    expect(a.added).toBe(1);
    const b = watchStep(a.store, ["agent"], c);
    expect([b.added, b.dropped]).toEqual([0, 0]);
    expect(renderWatchFeed(b.store)).toBe(renderWatchFeed(a.store)!);
    expect(JSON.stringify(b.store)).toBe(JSON.stringify(a.store));
  });

  test("4b seen keys older than 14 days are pruned on write", () => {
    const old = { schema: 1 as const, seen: { "https://example.com/old": "2026-10-01T00:00:00Z", "https://example.com/new": "2026-10-20T00:00:00Z" }, entries: [] };
    expect(Object.keys(watchStep(old, ["x"], crawl()).store.seen)).toEqual(["https://example.com/new"]);
  });

  test("5 Gmail / X rows containing the term never appear", () => {
    const c = crawl({
      wire: [
        wire(1, "agent gmail", { id: "gmail:abc", member_ids: ["gmail:abc"] }),
        wire(2, "agent x", { id: "cl:x:9", member_ids: ["x:9"] }),
        wire(3, "agent private", { briefEligible: false }),
        wire(4, "agent taste", { source: "x_taste" }),
      ],
    });
    const r = watchStep(emptyWatchStore(), ["agent"], c);
    expect(r.added).toBe(0);
    expect(renderWatchFeed(r.store)).toBeNull();
  });

  test("6 escaping: & < > \" in title and term → exact strings", () => {
    const r = watchStep(emptyWatchStore(), ['R&D "<x>"'], crawl({ wire: [wire(1, 'R&D "<x>" lab')] }));
    const xml = renderWatchFeed(r.store)!;
    expect(xml).toContain('<title type="text">R&amp;D &quot;&lt;x&gt;&quot; lab</title>');
    expect(xml).toContain('<category term="R&amp;D &quot;&lt;x&gt;&quot;"/>');
  });

  test("7 the 51st entry evicts the oldest; file ≤ 64 KB", () => {
    let s = emptyWatchStore();
    for (let i = 0; i < 6; i++) {
      const rows = Array.from({ length: 10 }, (_, j) => wire(i * 10 + j, `agent ${"x".repeat(900)} ${i * 10 + j}`, { first_seen: new Date(Date.parse(C1) + (i * 10 + j) * 60_000).toISOString() }));
      s = watchStep(s, ["agent"], crawl({ crawlAt: new Date(Date.parse(C1) + i * 3_600_000).toISOString(), wire: rows })).store;
    }
    expect(s.entries.length).toBe(WATCH_MAX_ENTRIES);
    expect(s.entries.some((e) => e.key === "https://example.com/w/0")).toBe(false);
    const xml = renderWatchFeed(s)!;
    expect(Buffer.byteLength(xml)).toBeLessThanOrEqual(WATCH_MAX_BYTES);
    expect(entries(xml).length).toBe(WATCH_MAX_ENTRIES);
  });

  test("8 21st term / term over KEYWORD_LEN_MAX / bad regex → rejected in browser and CI rules alike", () => {
    const BROWSER = SAGE_SETUP.limits as SageLimits;
    const w = (terms: string[]) => {
      const c = defaultSageConfig() as SageConfig;
      c.keywords.watch_terms = terms;
      return c;
    };
    const cases: [string[], boolean][] = [
      [[], true],
      [["qwen", "open weights"], true],
      [Array.from({ length: WATCH_TERMS_MAX }, (_, i) => `t${i}`), true],
      [Array.from({ length: WATCH_TERMS_MAX + 1 }, (_, i) => `t${i}`), false],
      [["x".repeat(KEYWORD_LEN_MAX + 1)], false],
      [["ai{"], false],
      [["Qwen", "qwen"], false],
    ];
    for (const [terms, ok] of cases) {
      const ci = validateSageConfig(w(terms));
      expect([terms.length, ci.ok]).toEqual([terms.length, ok]);
      expect(validateWithRules(w(terms), BROWSER)).toEqual(ci);
      expect(validateWithRules(w(terms), limitsFromCode())).toEqual(ci);
    }
    expect(BROWSER.keyword_lists).toContain("watch_terms");
  });
});

// ── script-level: scripts/atom-feed.ts, ci-state.sh, reader-hash.ts, publish-proof.ts, pages-publish.sh ──
function fixtureDesk(label: string, terms: string[], wireRows: unknown[], opts: { releasesSrc?: string } = {}) {
  const d = tmpDir(label);
  for (const x of ["src/data", "artifacts/sage", "public", "config"]) mkdirSync(join(d, x), { recursive: true });
  const cfg = JSON.parse(readFileSync(join(DESK, "config/sage-sources.json"), "utf8"));
  cfg.keywords.watch_terms = terms;
  writeFileSync(join(d, "config/sage-sources.json"), JSON.stringify(cfg, null, 2) + "\n");
  writeFileSync(join(d, "src/data/x-crawl.ts"), `export const CRAWL_AT = "${C2}";\n`);
  writeFileSync(join(d, "src/data/wire.ts"), `export const WIRE_CRAWL_AT = "${C2}";\nexport const WIRE_ROWS = ${JSON.stringify(wireRows)};\n`);
  writeFileSync(join(d, "src/data/papers.ts"), "export const PAPERS = [];\n");
  writeFileSync(join(d, "src/data/releases-atom.ts"), opts.releasesSrc ?? "export const RELEASES_ATOM = [];\n");
  writeFileSync(join(d, "artifacts/sage/lead-history.json"), "{}\n");
  return d;
}
const runAtom = (d: string) => {
  const status = join(d, "status");
  const r = spawnSync(process.execPath, [join(DESK, "scripts/atom-feed.ts"), "--desk", d], { cwd: DESK, encoding: "utf8", env: { ...process.env, ATOM_FEED_STATUS: status } });
  return { code: r.status, stdout: r.stdout, text: readFileSync(status, "utf8") };
};

describe("PASS-W script plumbing", () => {
  test("1 watch_terms [] → no watch.xml, log watch=off; existing watch.xml left as-is", () => {
    const d = fixtureDesk("watch-off", [], [wire(1, "agent")]);
    const r = runAtom(d);
    expect(r.code).toBe(0);
    expect(r.stdout).toContain("watch=off");
    expect(r.text.split("\n")[1]).toBe("watch=off");
    expect(existsSync(join(d, "public/watch.xml"))).toBe(false);
    writeFileSync(join(d, "public/watch.xml"), "<feed>keep</feed>\n");
    runAtom(d);
    expect(readFileSync(join(d, "public/watch.xml"), "utf8")).toBe("<feed>keep</feed>\n");
  });

  test("2/4 script writes watch.xml + watch-seen.json; rerun → watch=0/0 and bytes unchanged", () => {
    const d = fixtureDesk("watch-on", ["agent"], [wire(1, "agent one"), wire(2, "agent two"), wire(3, "other")]);
    expect(runAtom(d).text).toContain("watch=2/0");
    const xml = readFileSync(join(d, "public/watch.xml"), "utf8");
    const seen = readFileSync(join(d, "artifacts/sage/watch-seen.json"), "utf8");
    expect(entries(xml).length).toBe(2);
    expect(runAtom(d).text).toContain("watch=0/0");
    expect(readFileSync(join(d, "public/watch.xml"), "utf8")).toBe(xml);
    expect(readFileSync(join(d, "artifacts/sage/watch-seen.json"), "utf8")).toBe(seen);
  });

  test("9 watch generator crash → exit 0, feed step unaffected, watch=skipped", () => {
    const d = fixtureDesk("watch-crash", ["agent"], [wire(1, "agent one")], { releasesSrc: 'throw new Error("boom");\n' });
    writeFileSync(join(d, "public/feed.xml"), "<feed>prior</feed>\n");
    const r = runAtom(d);
    expect(r.code).toBe(0);
    expect(r.text.split("\n")[0]).toMatch(/^atom-feed: /);
    expect(r.text).toMatch(/^watch=skipped \(error: boom\)$/m);
    expect(readFileSync(join(d, "public/feed.xml"), "utf8")).toBe("<feed>prior</feed>\n");
    expect(existsSync(join(d, "public/watch.xml"))).toBe(false);
  });

  test("10a reader-hash: watch-only change ⇒ changed=true; same bytes ⇒ false", () => {
    const d = fixtureDesk("watch-rh", [], []);
    writeFileSync(join(d, "public/watch.xml"), "<feed>one</feed>\n");
    const rh = (...a: string[]) => spawnSync(process.execPath, [join(DESK, "scripts/reader-hash.ts"), "--desk", d, ...a], { cwd: DESK, encoding: "utf8", env: { ...process.env, GITHUB_OUTPUT: "" } });
    const changed = () => JSON.parse(rh().stdout.trim().split("\n").pop()!).changed as boolean;
    expect(rh("--commit", "published").status).toBe(0);
    expect(changed()).toBe(false);
    writeFileSync(join(d, "public/watch.xml"), "<feed>two</feed>\n");
    expect(changed()).toBe(true);
  });

  test("10b §2h excludes desk/public/watch.xml (data, not code); allowlist lists it", () => {
    const pub = readFileSync(join(DESK, "scripts/pages-publish.sh"), "utf8");
    expect(pub).toContain("':(exclude)desk/public/watch.xml'");
    const allow = readFileSync(join(DESK, "scripts/backup-allowlist.txt"), "utf8").split("\n");
    expect(allow).toContain("desk/public/watch.xml");
    expect(allow).toContain("desk/artifacts/sage/watch-seen.json");
  });

  test("10c ci-state: watch.xml staged on true, reverted on false; missing file safe", () => {
    const repo = tmpDir("watch-ci-state");
    const desk = join(repo, "desk");
    for (const x of ["scripts", "src/data", "artifacts/sage", "public"]) mkdirSync(join(desk, x), { recursive: true });
    writeFileSync(join(desk, "scripts/ci-state.sh"), readFileSync(join(DESK, "scripts/ci-state.sh"), "utf8"));
    writeFileSync(join(desk, "src/data/wire.ts"), "export const X = 1;\n");
    writeFileSync(join(desk, "artifacts/sage/last-checked.json"), '{"checked_at":"a"}\n');
    const env = { ...process.env, GIT_AUTHOR_NAME: "t", GIT_AUTHOR_EMAIL: "t@t", GIT_COMMITTER_NAME: "t", GIT_COMMITTER_EMAIL: "t@t" };
    const git = (...a: string[]) => spawnSync("git", a, { cwd: repo, encoding: "utf8", env });
    git("init", "-q");
    git("add", "--", "desk");
    git("commit", "-qm", "base");
    const stage = (v: string) => spawnSync("bash", ["scripts/ci-state.sh", "stage", v], { cwd: desk, encoding: "utf8" });
    expect(stage("true").status).toBe(0); // no watch.xml, no feed.xml: still fine
    writeFileSync(join(desk, "public/watch.xml"), "<feed>w1</feed>\n");
    writeFileSync(join(desk, "artifacts/sage/watch-seen.json"), "{}\n");
    expect(stage("true").status).toBe(0);
    const staged = git("diff", "--cached", "--name-only").stdout.split("\n");
    expect(staged).toContain("desk/public/watch.xml");
    expect(staged).toContain("desk/artifacts/sage/watch-seen.json");
    git("commit", "-qm", "true run");
    writeFileSync(join(desk, "public/watch.xml"), "<feed>churn</feed>\n");
    expect(stage("false").status).toBe(0);
    expect(readFileSync(join(desk, "public/watch.xml"), "utf8")).toBe("<feed>w1</feed>\n");
  });

  test("10d publish-proof: watch_sha / watch_new / watch_dropped + suffix watch=", () => {
    const repo = tmpDir("watch-proof");
    const desk = join(repo, "desk");
    for (const x of ["src/data", "artifacts/sage", "public"]) mkdirSync(join(desk, x), { recursive: true });
    writeFileSync(join(desk, "src/data/x-crawl.ts"), `export const CRAWL_AT = "${C2}";\n`);
    writeFileSync(join(desk, "public/watch.xml"), "<feed>w</feed>\n");
    const status = join(repo, "status");
    writeFileSync(status, "atom-feed: unchanged public/feed.xml · 1 entry\nwatch=10/5\n");
    const pp = (args: string[], env: Record<string, string> = {}) =>
      spawnSync(process.execPath, [join(DESK, "scripts/publish-proof.ts"), ...args, "--desk", desk], { cwd: DESK, encoding: "utf8", env: { ...process.env, ...env } });
    expect(pp(["write"], { P_FAILS: "0", ATOM_FEED_STATUS: status }).status).toBe(0);
    const p = JSON.parse(readFileSync(join(desk, "artifacts/sage/publish-proof.json"), "utf8"));
    expect(p).toMatchObject({ watch_new: 10, watch_dropped: 5 });
    expect(p.watch_sha).toMatch(/^[0-9a-f]{64}$/);
    expect(pp(["suffix", "--changed", "false", "--status", status]).stdout.trim()).toMatch(/ watch=10\/5$/);
    writeFileSync(status, "atom-feed: skipped (x)\nwatch=off\n");
    expect(pp(["suffix", "--changed", "false", "--status", status]).stdout.trim()).toMatch(/ watch=off$/);
    expect(pp(["write"], { P_FAILS: "0", ATOM_FEED_STATUS: status }).status).toBe(0);
    expect(JSON.parse(readFileSync(join(desk, "artifacts/sage/publish-proof.json"), "utf8"))).toMatchObject({ watch_new: null, watch_dropped: null });
  });
});
