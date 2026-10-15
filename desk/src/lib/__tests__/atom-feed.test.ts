/** PASS-D Beat 13 — morning Atom feed acceptance (refs/PASS-D-ATOM-FEED.md D5 #1–13, amended de37cec). Fixtures only; no live data, no network. */
import { describe, expect, setSystemTime, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import {
  ATOM_NS,
  emptyStore,
  entryId,
  FEED_MAX_BYTES,
  FEED_MAX_ENTRIES,
  FEED_URL,
  renderAtomFeed,
  snapshotEditions,
  type CrawlInput,
  type EditionStore,
  type FeedLeadEntry,
} from "../../../scripts/lib/atom-feed";
import { tmpDir } from "./tmp-cache";

const DESK = resolve(import.meta.dir, "../../..");

// ── dependency-free XML checker: balanced tags, one root, entities, attributes; returns a tiny element tree ──
type El = { name: string; attrs: Record<string, string>; children: El[]; text: string };
const ENT: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
function unescapeXml(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === "#") return String.fromCodePoint(e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
    if (!(e in ENT)) throw new Error(`unknown entity ${m}`);
    return ENT[e]!;
  });
}
function parseXml(xml: string): El {
  const s = xml.replace(/^<\?xml[^?]*\?>\s*/, "");
  const root: El = { name: "#doc", attrs: {}, children: [], text: "" };
  const stack: El[] = [root];
  const re = /<(\/?)([A-Za-z_][\w:.-]*)((?:\s+[\w:.-]+\s*=\s*"[^"<]*")*)\s*(\/?)>|([^<]+)|(<)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    const top = stack[stack.length - 1]!;
    if (m[6]) throw new Error(`stray < at ${m.index}`);
    if (m[5] != null) {
      if (/&(?!(#x[0-9a-f]+|#\d+|[a-z]+);)/i.test(m[5])) throw new Error("bare & in text");
      top.text += unescapeXml(m[5]);
      continue;
    }
    const [, close, name, attrSrc, self] = m;
    if (close) {
      if (top.name !== name) throw new Error(`unbalanced </${name}> (open <${top.name}>)`);
      stack.pop();
      continue;
    }
    const attrs: Record<string, string> = {};
    for (const a of attrSrc!.matchAll(/([\w:.-]+)\s*=\s*"([^"]*)"/g)) attrs[a[1]!] = unescapeXml(a[2]!);
    const el: El = { name: name!, attrs, children: [], text: "" };
    top.children.push(el);
    if (!self) stack.push(el);
  }
  if (stack.length !== 1) throw new Error(`unclosed <${stack[stack.length - 1]!.name}>`);
  if (root.text.trim()) throw new Error("text outside the root");
  if (root.children.length !== 1) throw new Error(`expected one root, got ${root.children.length}`);
  return root.children[0]!;
}
const kids = (el: El, n: string) => el.children.filter((c) => c.name === n);
const kid = (el: El, n: string) => kids(el, n)[0];
const entries = (xml: string) => kids(parseXml(xml), "entry");
const contentOf = (e: El) => kid(e, "content")!.text; // unescaped once = the HTML

// ── fixtures ──
const D1 = "2026-10-14";
const D2 = "2026-10-15";
const C06 = "2026-10-15T03:21:16Z";
const C12 = "2026-10-15T09:11:40Z";
const C16 = "2026-10-15T13:22:12Z";
const wireRows = (n: number, tag = "w") =>
  Array.from({ length: n }, (_, i) => ({
    id: `cl:hn:${tag}${i + 1}`,
    title: `Wire story ${tag}${i + 1}`,
    url: `https://example.com/${tag}/${i + 1}`,
    sources: 2 + (i % 3),
    member_ids: [`hn:${tag}${i + 1}`, `gnews:${tag}${i + 1}`],
  }));
const papers = (n: number, tag = "p") =>
  Array.from({ length: n }, (_, i) => ({ id: `2610.${tag}${i}`, title: `Paper ${tag}${i + 1}`, href: `https://arxiv.org/abs/2610.1000${i}`, up: 60 - i }));
const picked = (date: string, crawl_at: string, at: string, over: Partial<FeedLeadEntry> = {}): FeedLeadEntry => ({
  date,
  at,
  crawl_at,
  reason: "picked",
  cluster_id: `cl:hn:lead-${date}`,
  headline: `Lead story for ${date}`,
  url: `https://example.org/lead/${date}`,
  sources: 3,
  sig: 42,
  age_band: "<24h",
  pick_slot: "06:21",
  ...over,
});
const held = (date: string, crawl_at: string, at: string, excluded: FeedLeadEntry["excluded"] = []): FeedLeadEntry => ({
  date,
  at,
  crawl_at,
  reason: "held",
  cluster_id: "cl:hn:carried",
  headline: "Carried lead from yesterday",
  url: "https://example.org/carried",
  sources: 2,
  sig: 9,
  note: "no qualifying story",
  attempts: [{ at, crawl_at, excluded }],
});
const hist = (...entries: FeedLeadEntry[]) => ({ schema: 1, entries });
const crawl = (crawlAt: string, wire = wireRows(7), pp = papers(9)): CrawlInput => ({ crawlAt, wire, papers: pp });
const run = (store: EditionStore, h: unknown, c: CrawlInput) => {
  const r = snapshotEditions(store, h, c);
  return { ...r, xml: renderAtomFeed(r.store)! };
};

describe("PASS-D atom feed (D5)", () => {
  test("1 well-formed + required elements", () => {
    const { xml } = run(emptyStore(), hist(picked(D2, C06, "2026-10-15T03:21:37.108Z")), crawl(C06));
    expect(xml.startsWith('<?xml version="1.0" encoding="utf-8"?>')).toBe(true);
    const feed = parseXml(xml);
    expect(feed.name).toBe("feed");
    expect(feed.attrs.xmlns).toBe(ATOM_NS);
    for (const n of ["id", "title", "updated", "author"]) expect(kid(feed, n)).toBeDefined();
    expect(kids(feed, "link").find((l) => l.attrs.rel === "self")?.attrs.href).toBe(FEED_URL);
    expect(FEED_URL).toBe("https://specimba.github.io/NEXUS_SAGE_grok/feed.xml");
    expect(kids(feed, "link").find((l) => l.attrs.rel === "alternate")?.attrs.href).toBe("https://specimba.github.io/NEXUS_SAGE_grok/");
    expect(kid(feed, "id")!.text).toBe("tag:specimba.github.io,2026:nexus-sage/feed");
    expect(kid(feed, "title")!.text).toBe("NEXUS SAGE · Morning edition");
    const es = kids(feed, "entry");
    expect(es.length).toBe(1);
    for (const e of es) {
      for (const n of ["id", "title", "updated", "content"]) expect(kid(e, n)).toBeDefined();
      expect(kid(e, "content")!.attrs.type).toBe("html");
      expect(kid(e, "updated")!.text).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    }
    expect(kid(feed, "updated")!.text).toBe(kid(es[0]!, "updated")!.text);
    // plain tags only in the html content
    expect(contentOf(es[0]!)).not.toMatch(/<(script|style|img|iframe)\b/i);
  });

  test("2 picked day: lead headline in title, exactly 5 wire <li> and 5 paper <li>", () => {
    const { xml } = run(emptyStore(), hist(picked(D2, C06, "2026-10-15T03:21:37Z")), crawl(C06, wireRows(7), papers(9)));
    const es = entries(xml);
    expect(es.length).toBe(1);
    expect(kid(es[0]!, "title")!.text).toBe(`Oct 15 · Lead story for ${D2}`);
    expect(kid(es[0]!, "id")!.text).toBe(entryId(D2));
    const html = contentOf(es[0]!);
    const [wirePart, paperPart] = html.split("<h3>Papers</h3>");
    expect(wirePart!.match(/<li>/g)?.length).toBe(5);
    expect(paperPart!.match(/<li>/g)?.length).toBe(5);
    expect(html).toContain("Wire story w5");
    expect(html).not.toContain("Wire story w6");
    expect(html).toContain("Paper p5");
    expect(html).not.toContain("Paper p6");
  });

  test("3 HELD day: title ends '· HELD', no excluded headline, no carried lead", () => {
    const excluded = [
      { cluster_id: "cl:hn:w1", headline: "Wire story w1", reason: "age>=36h" },
      { cluster_id: "cl:gnews:zz", headline: "Only Google News saw this", reason: "GNW_ONLY" },
    ];
    const { xml } = run(emptyStore(), hist(held(D2, C06, "2026-10-15T03:18:13Z", excluded)), crawl(C06));
    const e = entries(xml)[0]!;
    expect(kid(e, "title")!.text).toBe("Oct 15 · HELD");
    expect(kid(e, "title")!.text.endsWith("· HELD")).toBe(true);
    const html = contentOf(e);
    for (const x of excluded) expect(html).not.toContain(x.headline);
    expect(html).not.toContain("Carried lead from yesterday");
    expect(html).toContain("No lead today: nothing cleared the 2-publisher bar");
    expect(html).toContain("HELD · no qualifying story");
    expect(kids(e, "link")[0]!.attrs.href).toBe("https://specimba.github.io/NEXUS_SAGE_grok/");
    expect(html.split("<h3>Papers</h3>")[0]!.match(/<li>/g)?.length).toBe(5); // Wire still listed (w2..w6)
    // every Wire row was a ruled-out candidate ⇒ none listed, and the content says so (never "no rows")
    const allOut = wireRows(3).map((w) => ({ cluster_id: w.id, headline: w.title, reason: "age>=36h" }));
    const z = contentOf(entries(run(emptyStore(), hist(held(D2, C06, "2026-10-15T03:18:13Z", allOut)), crawl(C06, wireRows(3))).xml)[0]!);
    expect(z).not.toContain("Wire story w");
    expect(z).toContain("<p>3 Wire rows not listed: ruled out as lead today.</p>");
  });

  test("4 HELD then 16:11 pick: same id, updated advances, entry count unchanged", () => {
    const h0 = hist(picked(D1, "2026-10-14T03:20:00Z", "2026-10-14T03:20:30Z"), held(D2, C06, "2026-10-15T03:18:13Z"));
    const base = run(emptyStore(), h0, crawl("2026-10-14T03:20:00Z")).store; // yesterday from its own crawl
    const a = run(base, h0, crawl(C06));
    const h1 = hist(...h0.entries, picked(D2, C16, "2026-10-15T13:22:40Z", { pick_slot: "16:22" }));
    const b = run(a.store, h1, crawl(C16, wireRows(7, "late")));
    const ea = entries(a.xml), eb = entries(b.xml);
    expect(eb.length).toBe(ea.length);
    expect(eb.length).toBe(2);
    expect(kid(eb[0]!, "id")!.text).toBe(kid(ea[0]!, "id")!.text);
    expect(Date.parse(kid(eb[0]!, "updated")!.text)).toBeGreaterThan(Date.parse(kid(ea[0]!, "updated")!.text));
    expect(kid(eb[0]!, "published")!.text).toBe(kid(ea[0]!, "published")!.text);
    expect(kid(eb[0]!, "title")!.text).toBe(`Oct 15 · Lead story for ${D2}`);
    expect(b.changed).toEqual([`${D2} held→picked`]);
    // only once: a later forced re-pick on the same date does not rewrite again
    const h2 = hist(...h1.entries, picked(D2, "2026-10-15T18:21:00Z", "2026-10-15T18:21:30Z", { headline: "Another pick" }));
    const c = run(b.store, h2, crawl("2026-10-15T18:21:00Z"));
    expect(c.xml).toBe(b.xml);
  });

  test("5 idempotent: same inputs ⇒ byte-identical; non-pick 12:11 crawl leaves feed.xml unchanged", () => {
    const h = hist(picked(D2, C06, "2026-10-15T03:21:37Z"));
    const a = run(emptyStore(), h, crawl(C06));
    const a2 = run(emptyStore(), h, crawl(C06));
    expect(a2.xml).toBe(a.xml);
    const again = run(a.store, h, crawl(C06));
    expect(again.xml).toBe(a.xml);
    expect(again.changed).toEqual([]);
    const noon = run(a.store, h, crawl(C12, wireRows(6, "noon"), papers(4, "q")));
    expect(noon.changed).toEqual([]);
    expect(noon.xml).toBe(a.xml);
    expect(a.xml).not.toContain(C06); // no crawl time in the XML
  });

  test("6 frozen past: changing today's wire does not alter yesterday's entry", () => {
    const h1 = hist(picked(D1, "2026-10-14T03:20:00Z", "2026-10-14T03:20:30Z"));
    const y = run(emptyStore(), h1, crawl("2026-10-14T03:20:00Z", wireRows(7, "y"), papers(9, "y")));
    const h2 = hist(...h1.entries, picked(D2, C06, "2026-10-15T03:21:37Z"));
    const t1 = run(y.store, h2, crawl(C06, wireRows(7, "t"), papers(9, "t")));
    const t2 = run(y.store, h2, crawl(C06, wireRows(7, "changed"), papers(9, "changed")));
    const yA = entries(t1.xml).find((e) => kid(e, "id")!.text === entryId(D1))!;
    const yB = entries(t2.xml).find((e) => kid(e, "id")!.text === entryId(D1))!;
    expect(contentOf(yB)).toBe(contentOf(yA));
    expect(contentOf(yA)).toContain("Wire story y1");
    expect(contentOf(entries(t2.xml)[0]!)).toContain("Wire story changed1");
  });

  test("7 escaping (exact strings): title single, content double, href &, javascript: dropped", () => {
    const nasty = `R&D <beta> "x"`;
    const w = [
      { id: "cl:hn:x1", title: nasty, url: "javascript:alert(1)", sources: 3, member_ids: ["hn:x1", "gnews:x1"] },
      { id: "cl:hn:x2", title: "Amp link", url: "https://a.b/?x=1&y=2", sources: 2, member_ids: ["hn:x2", "gnews:x2"] },
      ...wireRows(2),
    ];
    const { xml } = run(emptyStore(), hist(picked(D2, C06, "2026-10-15T03:21:37Z", { headline: nasty, url: "javascript:alert(2)" })), crawl(C06, w));
    const rawTitle = xml.match(/<entry>[\s\S]*?<title type="text">([^<]*)<\/title>/)![1]!;
    expect(rawTitle).toContain("R&amp;D &lt;beta&gt; &quot;x&quot;"); // single
    expect(rawTitle).not.toContain("&amp;amp;");
    const rawContent = xml.match(/<content type="html">([^<]*)<\/content>/)![1]!;
    expect(rawContent).toContain("&lt;li&gt;R&amp;amp;D &amp;lt;beta&amp;gt; &amp;quot;x&amp;quot;"); // double
    expect(rawContent).toContain("href=&quot;https://a.b/?x=1&amp;amp;y=2&quot;");
    expect(xml).not.toContain("CDATA");
    expect(xml).not.toMatch(/javascript:/i);
    const e = entries(xml)[0]!;
    expect(kid(e, "title")!.text).toBe(`Oct 15 · ${nasty}`); // round-trips
    expect(contentOf(e)).toMatch(/<li>R&amp;D &lt;beta&gt; &quot;x&quot; · 3 SRC<\/li>/); // row kept, no href
    expect(kids(e, "link")[0]!.attrs.href).toBe("https://specimba.github.io/NEXUS_SAGE_grok/"); // invalid lead url ⇒ site
    for (const href of [...xml.matchAll(/href="([^"]+)"/g)].map((m) => m[1]!)) expect(href).toMatch(/^https:\/\//);
  });

  test("8 no private lanes: high-score Gmail and X-taste items never appear", () => {
    const w = [
      { id: "gmail:1a11250b91591834", title: "GMAIL newsletter scoop", url: "https://mail.example/1", sources: 9, score: 999, briefEligible: false, member_ids: ["gmail:1a11250b91591834"] },
      { id: "cl:x:2097935359384719537", title: "X taste viral post", url: "https://x.com/a/status/1", sources: 9, score: 999, member_ids: ["x:2097935359384719537"] },
      { id: "cl:hn:plain", title: "Gmail-free normal story", url: "https://example.com/p", sources: 2, briefEligible: false, member_ids: ["hn:p", "gnews:p"] },
      ...wireRows(3),
    ];
    const { xml } = run(emptyStore(), hist(picked(D2, C06, "2026-10-15T03:21:37Z")), crawl(C06, w));
    expect(xml).not.toContain("GMAIL newsletter scoop");
    expect(xml).not.toContain("X taste viral post");
    expect(xml).not.toContain("Gmail-free normal story"); // briefEligible:false
    expect(xml).toContain("Wire story w1");
    // a private / single-source "pick" is never promoted: the day reads HELD
    const g = run(emptyStore(), hist(picked(D2, C06, "2026-10-15T03:21:37Z", { cluster_id: "gmail:abc", headline: "Inbox lead" })), crawl(C06));
    expect(g.xml).not.toContain("Inbox lead");
    expect(kid(entries(g.xml)[0]!, "title")!.text).toBe("Oct 15 · HELD");
    const one = run(emptyStore(), hist(picked(D2, C06, "2026-10-15T03:21:37Z", { sources: 1, headline: "Lone source" })), crawl(C06));
    expect(one.xml).not.toContain("Lone source");
  });

  test("9 caps: 20 editions trimmed to 14, size ≤ 65,536 B", () => {
    let store = emptyStore();
    const all: FeedLeadEntry[] = [];
    for (let i = 1; i <= 20; i++) {
      const date = `2026-09-${String(i).padStart(2, "0")}`;
      const c = `${date}T03:20:00Z`;
      all.push(picked(date, c, `${date}T03:20:30Z`, { headline: `Day ${i} ${"long headline ".repeat(10)}` }));
      store = snapshotEditions(store, hist(...all), crawl(c, wireRows(7, `d${i}-${"x".repeat(150)}`), papers(9, `d${i}`))).store;
    }
    expect(store.editions.length).toBe(20); // the store keeps every past date (append-only)
    const xml = renderAtomFeed(store)!;
    const es = entries(xml);
    expect(es.length).toBeLessThanOrEqual(FEED_MAX_ENTRIES);
    expect(es.length).toBe(14);
    expect(kid(es[0]!, "id")!.text).toBe(entryId("2026-09-20")); // newest first
    expect(kid(es[13]!, "id")!.text).toBe(entryId("2026-09-07"));
    expect(Buffer.byteLength(xml)).toBeLessThanOrEqual(FEED_MAX_BYTES);
    // over the byte cap ⇒ oldest dropped until it fits
    const fat: EditionStore = { schema: 1, editions: store.editions.map((e) => ({ ...e, wire: e.wire.map((w) => ({ ...w, headline: w.headline + "W".repeat(1200) })) })) };
    const fx = renderAtomFeed(fat)!;
    expect(Buffer.byteLength(fx)).toBeLessThanOrEqual(FEED_MAX_BYTES);
    expect(entries(fx).length).toBeLessThan(14);
    expect(kid(entries(fx)[0]!, "id")!.text).toBe(entryId("2026-09-20"));
  });

  test("10 soft fail: corrupt lead-history ⇒ exit 0, prior feed.xml intact, log line", () => {
    const d = tmpDir("atom-softfail");
    mkdirSync(join(d, "artifacts/sage"), { recursive: true });
    mkdirSync(join(d, "src/data"), { recursive: true });
    mkdirSync(join(d, "public"), { recursive: true });
    const prior = '<?xml version="1.0" encoding="utf-8"?>\n<feed xmlns="http://www.w3.org/2005/Atom"><id>prior</id></feed>\n';
    writeFileSync(join(d, "public/feed.xml"), prior);
    writeFileSync(join(d, "artifacts/sage/lead-history.json"), '{"schema":1,"entries":[{"date":"2026-10-15",');
    writeFileSync(join(d, "src/data/x-crawl.ts"), `export const CRAWL_AT = "${C06}";\n`);
    writeFileSync(join(d, "src/data/wire.ts"), `export const WIRE_CRAWL_AT = "${C06}";\nexport const WIRE_ROWS = ${JSON.stringify(wireRows(3))};\n`);
    writeFileSync(join(d, "src/data/papers.ts"), `export const PAPERS = ${JSON.stringify(papers(3))};\n`);
    const r = spawnSync(process.execPath, [join(DESK, "scripts/atom-feed.ts"), "--desk", d], { cwd: DESK, encoding: "utf8" });
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("atom-feed: skipped (lead-history.json unparseable)");
    expect(readFileSync(join(d, "public/feed.xml"), "utf8")).toBe(prior);
    expect(existsSync(join(d, "artifacts/sage/morning-editions.json"))).toBe(false);
    // missing history: same soft fail
    const d2 = tmpDir("atom-softfail-missing");
    mkdirSync(join(d2, "public"), { recursive: true });
    writeFileSync(join(d2, "public/feed.xml"), prior);
    const r2 = spawnSync(process.execPath, [join(DESK, "scripts/atom-feed.ts"), "--desk", d2], { cwd: DESK, encoding: "utf8" });
    expect(r2.status).toBe(0);
    expect(r2.stdout).toMatch(/atom-feed: skipped \(lead-history\.json missing\)/);
    expect(readFileSync(join(d2, "public/feed.xml"), "utf8")).toBe(prior);
    // happy path through the script: picks today, writes, then a rerun is a byte-identical no-op
    writeFileSync(join(d, "artifacts/sage/lead-history.json"), JSON.stringify(hist(picked(D2, C06, "2026-10-15T03:21:37Z"))));
    const r3 = spawnSync(process.execPath, [join(DESK, "scripts/atom-feed.ts"), "--desk", d], { cwd: DESK, encoding: "utf8" });
    expect(r3.status).toBe(0);
    expect(r3.stdout).toContain("atom-feed: wrote public/feed.xml · 1 entry");
    const first = readFileSync(join(d, "public/feed.xml"), "utf8");
    const r4 = spawnSync(process.execPath, [join(DESK, "scripts/atom-feed.ts"), "--desk", d], { cwd: DESK, encoding: "utf8" });
    expect(r4.stdout).toContain("atom-feed: unchanged public/feed.xml");
    expect(readFileSync(join(d, "public/feed.xml"), "utf8")).toBe(first);
  });

  test("11 stored published: HELD→pick keeps <published> byte-equal; output independent of the wall clock", () => {
    const h0 = hist(held(D2, C06, "2026-10-15T03:18:13.174Z"));
    const h1 = hist(...h0.entries, picked(D2, C16, "2026-10-15T13:22:40.5Z"));
    const once = () => {
      const a = run(emptyStore(), h0, crawl(C06));
      const b = run(a.store, h1, crawl(C16));
      return { a, b };
    };
    const real = once();
    const pubA = real.a.xml.match(/<published>[^<]*<\/published>/)![0];
    const pubB = real.b.xml.match(/<published>[^<]*<\/published>/)![0];
    expect(pubB).toBe(pubA);
    expect(pubA).toBe("<published>2026-10-15T03:18:13Z</published>");
    expect(real.a.store.editions[0]!.published).toBe("2026-10-15T03:18:13Z"); // stored in the snapshot
    expect(real.b.xml).toContain("<updated>2026-10-15T13:22:40Z</updated>");
    setSystemTime(new Date(Date.now() + 2 * 86_400_000)); // faked clock, 2 days ahead
    try {
      const faked = once();
      expect(faked.a.xml).toBe(real.a.xml);
      expect(faked.b.xml).toBe(real.b.xml);
      expect(JSON.stringify(faked.b.store)).toBe(JSON.stringify(real.b.store));
    } finally {
      setSystemTime();
    }
  });

  test("12 ci-state: feed.xml modified ⇒ stage true stages it, stage false reverts it (fixture git repo)", () => {
    const repo = tmpDir("atom-ci-state");
    const desk = join(repo, "desk");
    for (const d of ["scripts", "src/data", "artifacts/sage", "public"]) mkdirSync(join(desk, d), { recursive: true });
    writeFileSync(join(desk, "scripts/ci-state.sh"), readFileSync(join(DESK, "scripts/ci-state.sh"), "utf8"));
    writeFileSync(join(desk, "src/data/wire.ts"), "export const X = 1;\n");
    writeFileSync(join(desk, "artifacts/sage/lead-history.json"), "{}\n");
    writeFileSync(join(desk, "artifacts/sage/last-checked.json"), '{"checked_at":"a"}\n');
    writeFileSync(join(desk, "public/feed.xml"), "<feed>old</feed>\n");
    const git = (...a: string[]) => spawnSync("git", a, { cwd: repo, encoding: "utf8", env: { ...process.env, GIT_AUTHOR_NAME: "t", GIT_AUTHOR_EMAIL: "t@t", GIT_COMMITTER_NAME: "t", GIT_COMMITTER_EMAIL: "t@t" } });
    git("init", "-q");
    git("add", "--", "desk");
    git("commit", "-qm", "base");
    const stage = (v: string) => spawnSync("bash", ["scripts/ci-state.sh", "stage", v], { cwd: desk, encoding: "utf8" });
    // true: modified feed (+ new publish-proof.json) staged
    writeFileSync(join(desk, "public/feed.xml"), "<feed>new</feed>\n");
    writeFileSync(join(desk, "artifacts/sage/publish-proof.json"), "{}\n");
    const t = stage("true");
    expect(t.status).toBe(0);
    const staged = git("diff", "--cached", "--name-only").stdout.split("\n").filter(Boolean);
    expect(staged).toContain("desk/public/feed.xml");
    expect(staged).toContain("desk/artifacts/sage/publish-proof.json");
    git("commit", "-qm", "true run");
    // false: modified feed reverted (not staged), last-checked kept + staged
    writeFileSync(join(desk, "public/feed.xml"), "<feed>churn</feed>\n");
    writeFileSync(join(desk, "src/data/wire.ts"), "export const X = 2;\n");
    writeFileSync(join(desk, "artifacts/sage/last-checked.json"), '{"checked_at":"b"}\n');
    const f = stage("false");
    expect(f.status).toBe(0);
    expect(readFileSync(join(desk, "public/feed.xml"), "utf8")).toBe("<feed>new</feed>\n");
    expect(readFileSync(join(desk, "src/data/wire.ts"), "utf8")).toBe("export const X = 1;\n");
    const staged2 = git("diff", "--cached", "--name-only").stdout.split("\n").filter(Boolean);
    expect(staged2).not.toContain("desk/public/feed.xml");
    expect(staged2).toContain("desk/artifacts/sage/last-checked.json");
    expect(git("status", "--porcelain", "--", "desk/public/feed.xml").stdout).toBe("");
  });

  test("13 reader-hash: only public/feed.xml changed ⇒ changed=true; identical feed ⇒ changed=false", () => {
    const d = tmpDir("atom-reader-hash");
    for (const x of ["src/data", "artifacts/sage", "public"]) mkdirSync(join(d, x), { recursive: true });
    writeFileSync(join(d, "src/data/x-crawl.ts"), `export const CRAWL_AT = "${C06}";\n`);
    writeFileSync(join(d, "src/data/wire.ts"), "export const WIRE_ROWS = [];\n");
    writeFileSync(join(d, "public/feed.xml"), "<feed>one</feed>\n");
    const rh = (...a: string[]) => spawnSync(process.execPath, [join(DESK, "scripts/reader-hash.ts"), "--desk", d, ...a], { cwd: DESK, encoding: "utf8", env: { ...process.env, GITHUB_OUTPUT: "" } });
    const changed = () => JSON.parse(rh().stdout.trim().split("\n").pop()!).changed as boolean;
    expect(rh("--commit", "published").status).toBe(0); // stores the hash
    expect(changed()).toBe(false); // identical feed
    writeFileSync(join(d, "public/feed.xml"), "<feed>one</feed>\n"); // rewritten, same bytes
    expect(changed()).toBe(false);
    writeFileSync(join(d, "public/feed.xml"), "<feed>two</feed>\n"); // feed-only change
    expect(changed()).toBe(true);
    rmSync(join(d, "public/feed.xml"));
    expect(changed()).toBe(true); // feed gone is a change too
  });

  test("14 publish-proof.ts: the one writer records ci-chrome's fields + feed_*; crawl.log suffix", () => {
    const repo = tmpDir("atom-proof");
    const desk = join(repo, "desk");
    for (const d of ["src/data", "artifacts/sage", "public"]) mkdirSync(join(desk, d), { recursive: true });
    writeFileSync(join(desk, "src/data/x-crawl.ts"), `export const CRAWL_AT = "${C06}";\n`);
    writeFileSync(join(desk, "public/feed.xml"), "<feed>one</feed>\n");
    const genv = { ...process.env, GIT_AUTHOR_NAME: "t", GIT_AUTHOR_EMAIL: "t@t", GIT_COMMITTER_NAME: "t", GIT_COMMITTER_EMAIL: "t@t" };
    spawnSync("git", ["init", "-q"], { cwd: repo });
    spawnSync("git", ["add", "--", "desk"], { cwd: repo });
    spawnSync("git", ["commit", "-qm", "base"], { cwd: repo, env: genv });
    const head = spawnSync("git", ["rev-parse", "HEAD"], { cwd: repo, encoding: "utf8" }).stdout.trim();
    const fakeChrome = join(repo, "chrome-headless-shell");
    writeFileSync(fakeChrome, "#!/bin/sh\necho 'Google Chrome for Testing 155.0.8059.79'\n", { mode: 0o755 });
    const pp = (args: string[], env: Record<string, string> = {}) =>
      spawnSync(process.execPath, [join(DESK, "scripts/publish-proof.ts"), ...args, "--desk", desk], { cwd: DESK, encoding: "utf8", env: { ...process.env, ...env } });
    const base = { P_MAIN: head, P_CRAWL: C06, P_OVWHY: "code changed since main@abc", P_FL: "178674", P_FAILS: "0", P_FONT: "static+browser" };
    // run 1: code-changed run that installed Chrome; feed unchanged vs HEAD
    expect(pp(["write"], { ...base, P_OV: "ran-pass", P_CIS: "21", P_CHROME_BIN: fakeChrome, P_CHROME_VER: "155.0.8059.79", P_CHROME_ZIP: "4cea4c32" }).status).toBe(0);
    const p1 = JSON.parse(readFileSync(join(desk, "artifacts/sage/publish-proof.json"), "utf8"));
    expect(p1).toMatchObject({
      main_sha: head, crawl_at: C06, result: "verified", overflow_390: "ran-pass", overflow_why: "code changed since main@abc",
      font_check: "static+browser", first_load_bytes: 178674, first_load_prev_bytes: null, chrome_install_s: 21,
      chrome: { version: "Google Chrome for Testing 155.0.8059.79", pinned: "155.0.8059.79", zip_sha256: "4cea4c32" },
      feed_entries: 0, feed_changed: false,
    });
    expect(p1.chrome.bin_sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(p1.feed_sha256).toMatch(/^[0-9a-f]{64}$/);
    writeFileSync(join(repo, "status"), "atom-feed: unchanged public/feed.xml · 1 entry\n");
    expect(pp(["suffix", "--changed", "true", "--status", join(repo, "status")]).stdout.trim()).toBe("feed=same ov390=pass fl=178674");
    // run 2: data-only, no Chrome, feed changed; prev first-load carried, check-fail recorded
    writeFileSync(join(desk, "public/feed.xml"), "<feed>two</feed>\n");
    expect(pp(["write"], { ...base, P_OV: "skipped", P_CIS: "", P_FAILS: "1", P_FONT: "static", P_FL: "178675" }).status).toBe(0);
    const p2 = JSON.parse(readFileSync(join(desk, "artifacts/sage/publish-proof.json"), "utf8"));
    expect(p2).toMatchObject({ result: "check-fail", overflow_390: "skipped", chrome_install_s: null, chrome: null, first_load_bytes: 178675, first_load_prev_bytes: 178674, feed_changed: true });
    writeFileSync(join(repo, "status"), "atom-feed: wrote public/feed.xml · 1 entry\n");
    expect(pp(["suffix", "--changed", "true", "--status", join(repo, "status")]).stdout.trim()).toBe(`feed=${p2.feed_sha256.slice(0, 8)} ov390=skipped fl=178675`);
    expect(pp(["suffix", "--changed", "false", "--status", join(repo, "status")]).stdout.trim()).toBe("feed=same ov390=skipped fl=-");
    expect(pp(["suffix", "--changed", "true", "--status", join(repo, "missing")]).stdout.trim()).toMatch(/^feed=skipped /);
  });
});
