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
    expect(again).toEqual({ action: "none", why: "already-picked" });
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
