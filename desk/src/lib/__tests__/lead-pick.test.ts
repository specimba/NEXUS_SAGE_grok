import { describe, expect, test } from "bun:test";
import {
  applyPick,
  currentLead,
  decidePick,
  groupFirstAt,
  politicsLeadReason,
  POLITICS_LEAD_TERMS,
  leadExcludeReason,
  inPickWindow,
  leadAgeHours,
  leadIsStale,
  istanbulDate,
  leadCandidates,
  GNW_ONLY,
  nonGnewsPublishers,
  yesterdayLead,
  type LeadHistory,
} from "@/lib/lead-pick";
import { wireCandidates, type WireCluster } from "@/lib/wire";

function cl(id: string, over: Partial<WireCluster> = {}): WireCluster {
  const lead = id.replace(/^cl:/, "");
  return {
    id,
    title: `OpenAI model story ${id}`,
    url: `https://example.com/${lead}`,
    lead_id: lead,
    lead_source: "hn-algolia",
    sources: ["hn-algolia", "gnews-rss"],
    member_ids: [lead, `gnews:${lead.replace(/\W/g, "")}`],
    size: 2,
    at: "2026-09-25T01:00:00Z",
    first_seen: null,
    is_new: false,
    ...over,
  };
}
const empty: LeadHistory = { schema: 1, entries: [] };
const PICK = "2026-09-25T03:11:00Z"; // 06:11 Istanbul
const LATER = "2026-09-25T11:11:00Z"; // 14:11 Istanbul, same day
const NEXT = "2026-09-26T03:11:00Z"; // next day 06:11

describe("daily lead pick — window + ranking", () => {
  test("pick is due from 06:00 Istanbul on (no upper bound); dates are Istanbul days", () => {
    expect(inPickWindow(PICK)).toBe(true);
    expect(inPickWindow(LATER)).toBe(true); // catch-up: 14:11 still due if the date has no pick
    expect(inPickWindow("2026-09-25T02:59:59Z")).toBe(false); // 05:59
    expect(inPickWindow("2026-09-24T22:09:31Z")).toBe(false); // 01:09
    expect(istanbulDate("2026-09-24T22:09:31Z")).toBe("2026-09-25");
  }, 30_000); // first tz-aware Intl formatter can take seconds to build under load

  test("strongest = most independent publishers → SIG → newer; self-repost counts 0", () => {
    const three = cl("cl:hn:1", { member_ids: ["hn:1", "gnews:1", "rss:openai:1"] });
    const selfy = cl("cl:hn:2", {
      member_ids: ["hn:2", "gnews:2", "rss:openai:2"],
      members: [
        { id: "hn:2", source: "hn-algolia" },
        { id: "gnews:2", source: "gnews-rss" },
        { id: "rss:openai:2", source: "rss-lab", self_repost: true },
      ],
    });
    const hiSig = cl("cl:hn:3", { at: "2026-09-25T00:00:00Z" });
    const newer = cl("cl:hn:4", { at: "2026-09-25T02:00:00Z" });
    const ids = leadCandidates([newer, hiSig, selfy, three], Date.parse(PICK), { scores: { "hn:3": 500, "hn:4": 10 } }).map((c) => c.id);
    expect(ids[0]).toBe("cl:hn:1");
    expect(ids.slice(1)).toEqual(["cl:hn:3", "cl:hn:4", "cl:hn:2"]);
  });

  test("never: age ≥24h, <2 SRC, briefEligible:false, Taste/X, non-AI", () => {
    const now = Date.parse(PICK);
    const bad = [
      cl("cl:hn:5", { at: "2026-09-24T02:00:00Z" }),
      cl("cl:hn:6", { member_ids: ["hn:6"], sources: ["hn-algolia"], size: 1 }),
      cl("cl:hn:7", { briefEligible: false }),
      cl("cl:x:8", { lead_id: "x:8", lead_source: "x", member_ids: ["x:8", "gnews:8"] }),
      cl("cl:hn:9", { title: "Local bakery wins award", url: "https://example.com/b" }),
      cl("cl:hn:10", { member_ids: ["hn:10", "gnews:t10"] }),
    ];
    expect(leadCandidates(bad, now, { tasteIds: ["t10"] })).toEqual([]);
  });
});

describe("daily lead pick — age = earliest member item", () => {
  test("first item 28h old + 1h-old repost ⇒ ineligible (late repost can't refresh)", () => {
    const now = Date.parse(PICK);
    const g = cl("cl:gnews:late", {
      at: new Date(now - 1 * 3_600_000).toISOString(),
      lead_id: "gnews:late",
      member_ids: ["gnews:late", "hn:old"],
    });
    const memberAt = { "hn:old": new Date(now - 28 * 3_600_000).toISOString(), "gnews:late": g.at };
    expect(groupFirstAt(g, memberAt)).toBe(now - 28 * 3_600_000);
    expect(leadExcludeReason(g, now, { memberAt })).toBe("age>=24h");
    expect(leadCandidates([g], now, { memberAt })).toEqual([]);
    expect(leadCandidates([g], now).map((c) => c.id)).toEqual(["cl:gnews:late"]); // without member times it'd pass
  });

  test("exclude predicate is an extension point (none by default)", () => {
    const now = Date.parse(PICK);
    const a = cl("cl:hn:1");
    expect(leadCandidates([a], now).length).toBe(1);
    expect(leadCandidates([a], now, { exclude: (c) => (c.id === "cl:hn:1" ? "ruled-out" : null) })).toEqual([]);
  });
});

describe("daily lead pick — partisan-politics exclusion", () => {
  const now = Date.parse(PICK);
  const axios = cl("cl:hn:49829312", {
    title: 'Scoop: Trump allies open new front against Anthropic CEO over AI "doomerism"',
    at: "2026-09-24T20:45:01Z",
  });
  const un = cl("cl:hn:49835056", {
    title: "OpenAI, Anthropic CEOs urge UN countries to cooperate on AI safety standards",
    at: "2026-09-24T19:00:00Z",
  });

  test("Axios Trump-allies headline: lead-ineligible but Wire-eligible; UN AI-safety headline: lead-eligible", () => {
    expect(politicsLeadReason(axios.title)).toBe("politics:trump");
    expect(politicsLeadReason(un.title)).toBeNull();
    expect(politicsLeadReason("Trumpet-shaped antenna for robots")).toBeNull(); // word boundary
    expect(politicsLeadReason("Newsom AI kill switch order")).toBeNull();
    expect(politicsLeadReason("EU AI Act enforcement begins for frontier models")).toBeNull();
    expect(politicsLeadReason("Senate bill on AI regulation; White House executive order; election campaign law")).toBeNull();
    expect(politicsLeadReason("GOP senators push AI moratorium")).toBe("politics:gop");
    expect(politicsLeadReason("Democratic lawmakers and Vance spar over chips")).toBe("politics:democratic");
    for (const w of ["senator", "congress", "white house", "election", "campaign"]) expect(POLITICS_LEAD_TERMS.join(" ")).not.toContain(w);
    expect(wireCandidates([axios]).map((c) => c.id)).toEqual(["cl:hn:49829312"]);
    expect(leadExcludeReason(axios, now)).toBe("politics:trump");
    expect(leadExcludeReason(un, now)).toBeNull();
    // even with the higher SIG the political story never wins the pick
    const ids = leadCandidates([axios, un], now, { scores: { "hn:49829312": 8, "hn:49835056": 3 } }).map((c) => c.id);
    expect(ids).toEqual(["cl:hn:49835056"]);
  });

  test("pick records excluded candidates with their reason", () => {
    const d = decidePick(empty, [axios, un], { crawlAt: PICK, at: PICK, scores: { "hn:49829312": 8 } });
    expect(d.action).toBe("picked");
    if (d.action !== "picked") return;
    expect(d.entry.cluster_id).toBe("cl:hn:49835056");
    expect(d.entry.excluded).toEqual([{ cluster_id: "cl:hn:49829312", headline: axios.title, reason: "politics:trump" }]);
  });
});

describe("daily lead pick — lead changes only at daily pick, stable across same-day crawls", () => {
  test("pick at 06:11, same-day crawls with a stronger story keep the lead; next day re-picks", () => {
    let h = empty;
    const a = cl("cl:hn:1");
    const d1 = decidePick(h, [a], { crawlAt: PICK, at: PICK });
    expect(d1.action).toBe("picked");
    h = applyPick(h, d1);
    expect(currentLead(h)?.cluster_id).toBe("cl:hn:1");

    const stronger = cl("cl:hn:2", { member_ids: ["hn:2", "gnews:2", "rss:openai:2"], at: "2026-09-25T10:00:00Z" });
    const d2 = decidePick(h, [a, stronger], { crawlAt: LATER, at: LATER });
    expect(d2).toEqual({ action: "none", why: "already-picked" });
    const d2f = decidePick(h, [a, stronger], { crawlAt: LATER, at: LATER, force: true });
    expect(d2f.action).toBe("none"); // force never re-picks a day that already has a pick
    h = applyPick(h, d2);
    expect(currentLead(h)?.cluster_id).toBe("cl:hn:1");
    expect(h.entries.length).toBe(1);

    const d3 = decidePick(h, [{ ...stronger, at: "2026-09-26T01:00:00Z" }], { crawlAt: NEXT, at: NEXT });
    h = applyPick(h, d3);
    expect(currentLead(h)?.cluster_id).toBe("cl:hn:2");
    expect(yesterdayLead(h)?.cluster_id).toBe("cl:hn:1");
  });

  test("before 06:00 nothing is picked unless LEAD_PICK_FORCE", () => {
    const a = cl("cl:hn:1", { at: "2026-09-24T22:00:00Z" });
    const EARLY = "2026-09-24T23:11:00Z"; // 02:11 Istanbul, 2026-09-25
    expect(decidePick(empty, [a], { crawlAt: EARLY, at: EARLY })).toEqual({ action: "none", why: "outside-window" });
    const f = decidePick(empty, [a], { crawlAt: EARLY, at: EARLY, force: true });
    expect(f.action).toBe("picked");
    if (f.action === "picked") expect(f.entry).toMatchObject({ date: "2026-09-25", cluster_id: "cl:hn:1", sources: 2, reason: "picked", forced: true });
  });

  test("nothing qualifies ⇒ HELD keeps yesterday's lead", () => {
    const h = applyPick(empty, decidePick(empty, [cl("cl:hn:1")], { crawlAt: PICK, at: PICK }));
    const d = decidePick(h, [], { crawlAt: NEXT, at: NEXT });
    expect(d.action).toBe("held");
    const h2 = applyPick(h, d);
    expect(currentLead(h2)).toMatchObject({ reason: "held", cluster_id: "cl:hn:1", date: "2026-09-26", note: "no qualifying story" });
    expect(yesterdayLead(h2)?.date).toBe("2026-09-25");
  });
});

describe("daily lead catch-up — keyed off the crawl's own start time", () => {
  const story = (at: string) => cl("cl:hn:7", { at, member_ids: ["hn:7", "gnews:7"] });

  test("late cron start (06:40) picks; it is the 06 slot, not a catch-up", () => {
    const start = "2026-09-25T03:40:00Z"; // 06:40 Istanbul
    const d = decidePick(empty, [story("2026-09-25T01:00:00Z")], { crawlAt: "2026-09-25T03:45:12Z", crawlStartedAt: start, at: start });
    expect(d.action).toBe("picked");
    if (d.action === "picked") {
      expect(d.entry.date).toBe("2026-09-25");
      expect(d.entry.catch_up).toBeUndefined();
      expect(d.entry.crawl_started_at).toBe(start);
      expect(d.entry.first_at).toBe("2026-09-25T01:00:00.000Z");
    }
  });

  test("missed 06 crawl ⇒ the 10 (or 14) crawl picks, marked catch_up", () => {
    for (const crawlAt of ["2026-09-25T07:16:00Z", "2026-09-25T11:16:08Z"]) {
      const d = decidePick(empty, [story("2026-09-25T05:00:00Z")], { crawlAt, at: crawlAt });
      expect(d.action).toBe("picked");
      if (d.action === "picked") expect(d.entry).toMatchObject({ date: "2026-09-25", cluster_id: "cl:hn:7", catch_up: true });
    }
  });

  test("no double pick on the same date (06 picks, 10 and 14 do nothing)", () => {
    let h = applyPick(empty, decidePick(empty, [story("2026-09-25T01:00:00Z")], { crawlAt: PICK, at: PICK }));
    const other = cl("cl:hn:8", { at: "2026-09-25T06:00:00Z", member_ids: ["hn:8", "gnews:8", "rss:openai:8"] });
    for (const crawlAt of ["2026-09-25T07:16:00Z", LATER]) {
      const d = decidePick(h, [other], { crawlAt, at: crawlAt });
      expect(d).toEqual({ action: "none", why: "already-picked" });
      h = applyPick(h, d);
    }
    expect(h.entries.length).toBe(1);
    expect(currentLead(h)?.cluster_id).toBe("cl:hn:7");
  });

  test("a crawl that STARTED before 06:00 does not pick even if its stamp lands after 06:00", () => {
    const d = decidePick(empty, [story("2026-09-25T01:00:00Z")], {
      crawlAt: "2026-09-25T03:03:00Z", // 06:03 stamp (completion)
      crawlStartedAt: "2026-09-25T02:58:00Z", // 05:58 start
      at: "2026-09-25T03:03:00Z",
    });
    expect(d).toEqual({ action: "none", why: "outside-window" });
  });

  test("HELD date retries on the next crawl that day; one HELD entry only", () => {
    const seed = applyPick(empty, decidePick(empty, [story("2026-09-24T01:00:00Z")], { crawlAt: "2026-09-24T03:11:00Z", at: "2026-09-24T03:11:00Z" }));
    let h = applyPick(seed, decidePick(seed, [], { crawlAt: PICK, at: PICK }));
    expect(currentLead(h)).toMatchObject({ reason: "held", date: "2026-09-25", first_at: "2026-09-24T01:00:00.000Z" });
    const again = decidePick(h, [], { crawlAt: "2026-09-25T07:16:00Z", at: "2026-09-25T07:16:00Z" });
    expect(again).toMatchObject({ action: "held", replace: true });
    h = applyPick(h, again);
    expect(h.entries.filter((e) => e.date === "2026-09-25").length).toBe(1); // updated in place, not appended
    expect(currentLead(h)?.attempts?.length).toBe(2);
    h = applyPick(h, decidePick(h, [story("2026-09-25T05:00:00Z")], { crawlAt: LATER, at: LATER }));
    expect(currentLead(h)).toMatchObject({ reason: "picked", date: "2026-09-25", catch_up: true });
    expect(h.entries.filter((e) => e.date === "2026-09-25").length).toBe(2);
  });

  test("LEAD_PICK_REPICK on a picked date appends a superseding entry (FORCE alone does not)", () => {
    const h = applyPick(empty, decidePick(empty, [story("2026-09-25T01:00:00Z")], { crawlAt: PICK, at: PICK }));
    const fresh = cl("cl:hn:9", { at: "2026-09-25T10:00:00Z", member_ids: ["hn:9", "gnews:9", "rss:openai:9"] });
    expect(decidePick(h, [fresh], { crawlAt: LATER, at: LATER, force: true })).toEqual({ action: "none", why: "already-picked" });
    const d = decidePick(h, [fresh], { crawlAt: LATER, at: LATER, repick: true });
    expect(d.action).toBe("picked");
    if (d.action === "picked") expect(d.entry).toMatchObject({ cluster_id: "cl:hn:9", forced: true, supersedes: "cl:hn:7" });
    expect(currentLead(applyPick(h, d))?.cluster_id).toBe("cl:hn:9");
  });

  test("Brief stale rule: lead story ≥24h old ⇒ HELD", () => {
    const now = Date.parse("2026-09-25T12:35:00Z");
    expect(leadIsStale("2026-09-23T22:17:39Z", now)).toBe(true); // the 01:14 hand pick, ~38h
    expect(Math.floor(leadAgeHours("2026-09-23T22:17:39Z", now)!)).toBe(38);
    expect(leadIsStale("2026-09-25T01:00:00Z", now)).toBe(false);
    expect(leadIsStale(null, now)).toBe(false);
  });
});

describe("Beat 5 — Google News confirms, never leads (GNW_ONLY)", () => {
  const now = Date.parse(PICK);
  const pubs = { "gnews:a1": "Reuters", "gnews:a2": "Bloomberg", "gnews:b2": "Reuters" };
  const gnwOnly = cl("cl:gnews:a1", {
    title: "OpenAI signs cloud deal with bank",
    lead_id: "gnews:a1",
    lead_source: "gnews-rss",
    sources: ["gnews-rss"],
    member_ids: ["gnews:a1", "gnews:a2"],
  });
  const gnwPlusHn = cl("cl:hn:b1", { member_ids: ["hn:b1", "gnews:b2"] });
  const gnwPlusSelfLab = cl("cl:gnews:c1", {
    lead_id: "gnews:c1",
    lead_source: "gnews-rss",
    member_ids: ["gnews:c1", "gnews:c2", "rss:openai:c3"],
    members: [
      { id: "gnews:c1", source: "gnews-rss" },
      { id: "gnews:c2", source: "gnews-rss" },
      { id: "rss:openai:c3", source: "rss-lab", self_repost: true },
    ],
  });

  test("all-GNW group (2 distinct GNews publishers = 2 SRC) is rejected with GNW_ONLY", () => {
    expect(nonGnewsPublishers(gnwOnly, pubs)).toEqual([]);
    expect(wireCandidates([gnwOnly], { publishers: pubs })[0]?.sources).toBe(2); // still 2 SRC on the Wire
    expect(leadExcludeReason(gnwOnly, now, { publishers: pubs })).toBe(GNW_ONLY);
    expect(leadCandidates([gnwOnly], now, { publishers: pubs })).toEqual([]);
  });

  test("GNW + HN group is eligible; GNews publisher still counts toward N SRC", () => {
    expect(nonGnewsPublishers(gnwPlusHn, pubs)).toEqual(["hn"]);
    const [c] = leadCandidates([gnwPlusHn], now, { publishers: pubs });
    expect(c?.id).toBe("cl:hn:b1");
    expect(c?.sources).toBe(2);
    // lab / security / paper members qualify too
    expect(nonGnewsPublishers(cl("cl:gnews:d", { lead_id: "gnews:d", member_ids: ["gnews:d", "rss-sec:krebs:d"] }))).toEqual(["lab:krebs"]);
  });

  test("a lab SELF-repost does not rescue a GNW-only group", () => {
    expect(nonGnewsPublishers(gnwPlusSelfLab)).toEqual([]);
    expect(leadExcludeReason(gnwPlusSelfLab, now)).toBe(GNW_ONLY);
  });

  test("nothing qualifies → HELD; GNW_ONLY recorded in excluded[] for Beat 11", () => {
    const d = decidePick(empty, [gnwOnly], { publishers: pubs, crawlAt: PICK, at: PICK });
    expect(d.action).toBe("held");
    if (d.action !== "held") throw new Error("expected held");
    expect(d.entry.reason).toBe("held");
    expect(d.entry.excluded).toEqual([{ cluster_id: "cl:gnews:a1", headline: "OpenAI signs cloud deal with bank", reason: GNW_ONLY }]);
  });

  test("catch-up path (14:11, no pick for the date) applies the same rule", () => {
    const d = decidePick(empty, [gnwOnly, gnwPlusHn], { publishers: pubs, crawlAt: LATER, at: LATER });
    expect(d.action).toBe("picked");
    if (d.action !== "picked") throw new Error("expected picked");
    expect(d.entry.cluster_id).toBe("cl:hn:b1");
    expect(d.entry.catch_up).toBe(true);
    expect(d.entry.excluded?.find((e) => e.cluster_id === "cl:gnews:a1")?.reason).toBe(GNW_ONLY);
  });

  test("REPICK that finds nothing → HELD carrying the previous DAY's lead, never the superseded GNW-only pick", () => {
    const yday = applyPick(empty, decidePick(empty, [cl("cl:hn:y1", { at: "2026-09-24T01:00:00Z" })], { crawlAt: "2026-09-24T03:11:00Z", at: "2026-09-24T03:11:00Z" }));
    const badToday: LeadHistory = {
      schema: 1,
      entries: [...yday.entries, { date: "2026-09-25", at: PICK, crawl_at: PICK, cluster_id: "cl:gnews:a1", headline: "GNW only", url: null, sources: 2, sig: null, reason: "picked" }],
    };
    const d = decidePick(badToday, [gnwOnly], { publishers: pubs, crawlAt: LATER, at: LATER, repick: true });
    expect(d.action).toBe("held");
    if (d.action !== "held") throw new Error("expected held");
    expect(d.entry.cluster_id).toBe("cl:hn:y1");
    expect(d.entry.supersedes).toBe("cl:gnews:a1");
  });
});

describe("HELD never locks the date — retries each ≥06:00 crawl, locks only on a real lead", () => {
  const seedDay = () =>
    applyPick(empty, decidePick(empty, [cl("cl:hn:1", { at: "2026-09-24T01:00:00Z" })], { crawlAt: "2026-09-24T03:11:00Z", at: "2026-09-24T03:11:00Z" }));
  const gnwOnly = cl("cl:gnews:5", { title: "OpenAI model story wire", member_ids: ["gnews:5", "gnews:6"], lead_id: "gnews:5", lead_source: "gnews-rss", sources: ["gnews-rss"], at: "2026-09-25T09:00:00Z" });
  const pubs = { "gnews:5": "Reuters", "gnews:6": "Bloomberg" };
  const T1416 = "2026-09-25T11:16:08Z";
  const T1811 = "2026-09-25T15:11:00Z";
  const T2211 = "2026-09-25T19:11:00Z";
  const real = cl("cl:hn:30", { at: "2026-09-25T14:00:00Z", member_ids: ["hn:30", "gnews:30"] });
  const stronger = cl("cl:hn:31", { at: "2026-09-25T18:30:00Z", member_ids: ["hn:31", "gnews:31", "rss:openai:31"] });

  test("HELD at 14:16 → lead picked at 18:11 (no REPICK) → no change at 22:11", () => {
    let h = seedDay();
    const d1 = decidePick(h, [], { crawlAt: T1416, at: T1416 });
    expect(d1.action).toBe("held");
    h = applyPick(h, d1);
    expect(currentLead(h)).toMatchObject({ date: "2026-09-25", reason: "held", note: "no qualifying story" });
    expect(currentLead(h)?.attempts).toEqual([{ at: T1416, crawl_at: T1416, excluded: [] }]);

    const d2 = decidePick(h, [real], { crawlAt: T1811, at: T1811 });
    expect(d2.action).toBe("picked");
    h = applyPick(h, d2);
    expect(currentLead(h)).toMatchObject({ date: "2026-09-25", reason: "picked", cluster_id: "cl:hn:30", catch_up: true });
    expect(currentLead(h)?.forced).toBeUndefined();
    // the HELD record (candidates + reasons) stays in the history for Beat 11
    expect(h.entries.filter((e) => e.date === "2026-09-25").map((e) => e.reason)).toEqual(["held", "picked"]);

    const d3 = decidePick(h, [real, stronger], { crawlAt: T2211, at: T2211 });
    expect(d3).toEqual({ action: "none", why: "already-picked" });
    h = applyPick(h, d3);
    expect(currentLead(h)?.cluster_id).toBe("cl:hn:30");
    expect(h.entries.length).toBe(3);
  });

  test("a HELD retry that still finds nothing updates the one HELD entry with its candidate/reason record", () => {
    let h = applyPick(seedDay(), decidePick(seedDay(), [], { crawlAt: T1416, at: T1416 }));
    const d = decidePick(h, [gnwOnly], { crawlAt: T1811, at: T1811, publishers: pubs });
    expect(d).toMatchObject({ action: "held", replace: true });
    h = applyPick(h, d);
    const held = h.entries.filter((e) => e.date === "2026-09-25");
    expect(held.length).toBe(1);
    expect(held[0]!.attempts!.map((a) => a.crawl_at)).toEqual([T1416, T1811]);
    expect(held[0]!.attempts![1]!.excluded).toEqual([{ cluster_id: "cl:gnews:5", headline: gnwOnly.title, reason: GNW_ONLY }]);
    expect(held[0]!.excluded).toEqual(held[0]!.attempts![1]!.excluded);
    expect(held[0]!.cluster_id).toBe("cl:hn:1"); // still carries yesterday's lead
  });

  test("before 06:00 a crawl neither picks nor retries (HELD stays, no attempt logged)", () => {
    const EARLY = "2026-09-24T23:11:00Z"; // 02:11 Istanbul, 2026-09-25
    const h0 = seedDay();
    expect(decidePick(h0, [real], { crawlAt: EARLY, at: EARLY })).toEqual({ action: "none", why: "outside-window" });
    // a HELD entry already on the date (e.g. a forced pick) is not retried before 06:00 either
    const h1 = applyPick(h0, decidePick(h0, [], { crawlAt: EARLY, at: EARLY, force: true }));
    expect(currentLead(h1)).toMatchObject({ date: "2026-09-25", reason: "held" });
    const EARLY2 = "2026-09-25T01:11:00Z"; // 04:11 Istanbul
    expect(decidePick(h1, [real], { crawlAt: EARLY2, at: EARLY2 })).toEqual({ action: "none", why: "outside-window" });
    expect(currentLead(h1)?.attempts?.length).toBe(1);
  });
});
