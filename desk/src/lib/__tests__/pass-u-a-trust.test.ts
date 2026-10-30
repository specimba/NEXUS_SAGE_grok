/** PASS-U Commit A — Trust (U0 Gmail SRC trust · U3 truth pack). refs/PASS-U-USEFULNESS.md fixtures. */
import { describe, expect, test } from "bun:test";
import { buildRows, sourceUnits } from "@/lib/pulse-v5";
import { canonicalizeUrl } from "@/lib/canon-url";
import { clusterItems } from "@/lib/dedupe";
import { isNoise, rankAndEmit, toHit } from "@/lib/gmail-news";
import { publicHref } from "@/lib/truth";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { gmailDupKey, vendorPitchMail } from "@/lib/gmail-trust";
import { inflateClusters, inflateMembers } from "@/lib/desk-view";
import { MEMBER_ROWS, ORPHAN_CLUSTERS, WIRE_ROWS } from "@/data/desk-view";
import { TLDR_24H } from "@/data/tldr-24h";
import { DIGEST_UNLOCK } from "@/data/digest-unlock";
import { resolveUnlock } from "@/lib/digest-unlock";
import { leadMove, leadWhy, truthLeadLog, truthSlimLead, truthUnlock } from "@/lib/truth-gen";
import { LEAD_LOG } from "@/data/lead-log-view";
import { LEAD_TODAY } from "@/data/lead-pick";
import { compactAge } from "@/lib/pulse-v5";

const TL = "cl:gmail:1a1839eb125b5b98";
const TL_IDS = ["gmail:1a18370a4fc3a225", "gmail:1a18375f26bc1905", "gmail:1a18344702353fb3", "gmail:1a183741c635e892", "gmail:1a1835b027459309", "gmail:1a18331755af1a4c", "gmail:1a1839eb125b5b98", "gmail:1a1839bcfb0d45ed", "gmail:1a1836c59c34ed3d", "gmail:1a18369ba047a81b"];

describe("U0 — Gmail SRC trust", () => {
  test("ThreatLocker cluster (10 GML members, live crawl shape) counts SRC ≤ 1", () => {
    const c = { id: TL, lead_id: TL_IDS[6]!, lead_source: "gmail-news", sources: ["gmail-news"], member_ids: TL_IDS, title: "See new AI control from ThreatLocker in action", url: "https://mail.google.com/mail/#all/1a1839eb125b5b98", at: "2026-10-28T17:46:14Z", is_new: false, size: 10 };
    const { rows } = buildRows([c as never], {});
    expect(rows[0]!.sourceCount).toBeLessThanOrEqual(1);
    expect(rows[0]!.chips.map((x) => x.n)).toEqual([1]);
    // with per-member info from one sender too
    const info = Object.fromEntries(TL_IDS.map((id) => [id, { badge: "GML", publisher: "threatlocker.com", title: c.title, at: c.at }]));
    expect(sourceUnits(c as never, (id) => info[id]?.publisher, (id) => info[id]).length).toBe(1);
  });
  test("ThreatLocker vendor pitch is soft-dropped from Pulse / Brief Wire on the desk", () => {
    expect(isNoise({ subject: "See new AI control from ThreatLocker in action", sender: "ThreatLocker <news@threatlocker.com>", snippet: "" })).toBe(true);
    expect(vendorPitchMail({ id: TL, title: "See new AI control from ThreatLocker in action" })).toBe(true);
    // regenerated Brief Wire: the ThreatLocker cluster (now 1 SRC) is out of the ≥2-source pool
    expect(WIRE_ROWS.some((r) => r.id === TL)).toBe(false);
    // on the desk's current crawl data it renders as ONE source, never GML×10
    const c = inflateClusters(MEMBER_ROWS, ORPHAN_CLUSTERS).find((x) => x.id === TL);
    if (c) expect(buildRows([c], inflateMembers(MEMBER_ROWS)).rows[0]!.sourceCount).toBeLessThanOrEqual(1);
    // a real lab post is untouched
    expect(vendorPitchMail({ id: "cl:rss:openai:x", title: "OpenAI in action against model misuse" })).toBe(false);
  });
  test("a 10-copy Gmail flood counts as 1 (rankAndEmit + SRC)", () => {
    const now = Date.parse("2026-10-28T18:00:00Z");
    const raw = Array.from({ length: 10 }, (_, i) => ({
      id: `m${i}`,
      subject: "OpenAI releases new GPT model for agents",
      snippet: "OpenAI model release https://openai.com/index/new-model",
      sender: "The Batch <news@deeplearning.ai>",
      date: "2026-10-28T10:00:00Z",
    }));
    const hits = raw.map((m) => toHit(m, now)).filter((h) => h !== null);
    expect(hits.length).toBe(10);
    expect(rankAndEmit(hits).length).toBe(1);
    const c = { id: "cl:gmail:m0", lead_id: "gmail:m0", lead_source: "gmail-news", sources: ["gmail-news"], member_ids: hits.map((h) => h.id), title: "x", url: "", at: "2026-10-28T10:00:00Z", is_new: false, size: 10 };
    expect(buildRows([c as never], {}).rows[0]!.sourceCount).toBe(1);
    expect(gmailDupKey({ from: "A", subject: "Re: Hello  world", at: "2026-10-28T01:00:00Z" })).toBe(gmailDupKey({ from: "a", subject: "hello world", at: "2026-10-28T23:00:00Z" }));
  });
  test("no inbox URL is ever a public href or a cluster key", () => {
    expect(publicHref("https://mail.google.com/mail/#all/1a1839eb125b5b98")).toBeUndefined();
    expect(publicHref("#all/1a1839eb")).toBeUndefined();
    expect(publicHref("https://openai.com/x")).toBe("https://openai.com/x");
    expect(canonicalizeUrl("https://mail.google.com/mail/#all/abc")).toBe("");
    const h = toHit({ id: "z", subject: "Anthropic Claude model update for agents", snippet: "no link here", sender: "x@y.com", date: "2026-10-28T10:00:00Z", viewUrl: "https://mail.google.com/mail/#all/z" }, Date.parse("2026-10-28T12:00:00Z"));
    expect(h?.link ?? "").not.toContain("mail.google.com");
    // unrelated inbox mails no longer collapse into one cluster through the inbox URL
    const items = ["Nvidia GPU earnings surge", "Anthropic Claude agents launch", "Meta Llama licence change"].map((t, i) => ({
      id: `gmail:u${i}`, source: "gmail-news" as const, title: t, url: `https://mail.google.com/mail/#all/u${i}`, publisher: `p${i}.com`, at: "2026-10-28T10:00:00Z",
    }));
    expect(clusterItems(items as never).length).toBe(3);
  });
  test("generated Past-24h / Wire / lead log / lead rows carry no inbox URL", () => {
    expect(JSON.stringify(LEAD_LOG)).not.toContain("mail.google.com");
    expect(JSON.stringify(truthLeadLog({ lastAt: null, days: [{ url: "https://mail.google.com/mail/#all/x", pubs: ["mail.google.com"] } as never] }))).not.toContain("mail.google.com");
    expect(truthSlimLead({ url: "https://mail.google.com/mail/#all/x" } as never)!.url).toBe("");
    for (const b of TLDR_24H.bullets) expect(b.url).not.toContain("mail.google.com");
    for (const r of WIRE_ROWS) expect(publicHref(r.url) ?? "").not.toContain("mail.google.com");
  });
});

describe("U3 — truth pack", () => {
  test("lane badge: +N = rows the reader counts as new (NEW chip or since-visit); never +0", () => {
    const src = readFileSync(resolve(import.meta.dir, "../../components/sage/desk.tsx"), "utf8");
    // bare label when nothing is new — the `+0` path is gone
    expect(src).toContain('n ? `+${n}` : ""');
    expect(src).toContain('WIRE_ROWS.filter((r) => wireSt(r) === "new" || isSince(');
    expect(src).toContain("PULSE_LANE_ROWS.filter((c) => (c.is_new && !PULSE_BASELINE) || isSince(");
    // the reviewed state: Wire listed NEW rows with no since-visit baseline → old badge read "+0"; now +N with N = NEW rows
    const n = WIRE_ROWS.filter((r) => r.status === "new").length;
    const badge = n ? `+${n}` : "";
    expect(badge).not.toBe("+0");
    if (n) expect(badge).toBe(`+${n}`);
  });
  test("lead Why: stale repick note dropped when since_pick_h < 12; kept at ≥ 12; cycle label off MOVE", () => {
    const note = "repick: lead older than 12h since pick";
    expect(leadWhy(note, "2026-10-28T18:29:00Z", "2026-10-28T18:28:32Z")).not.toContain("older than 12h");
    expect(leadWhy(note, "2026-10-28T18:28:32Z", "2026-10-28T20:29:00Z")).toBe("fresh pick · picked 21:28 UTC+3");
    expect(leadWhy(note, "2026-10-28T00:00:00Z", "2026-10-28T13:00:00Z")).toBe(note);
    expect(leadWhy("picked", "2026-10-28T00:00:00Z", "2026-10-28T01:00:00Z")).toBe("picked");
    expect(leadMove("Digest/Voice follow Brief lead · cycle label 003")).toBe("Digest/Voice follow Brief lead");
    // the shipped Digest/Voice lead: stamp = the Brief's pick time (LEAD_TODAY.crawl_at → pick_slot), no stale note
    expect(DIGEST_UNLOCK.lead.why).toBe(`fresh pick · picked ${LEAD_TODAY!.pick_slot} UTC+3`);
    expect(DIGEST_UNLOCK.lead.move).not.toMatch(/cycle label/);
    const v = resolveUnlock({ held: false, today: LEAD_TODAY, lastGood: DIGEST_UNLOCK });
    expect(v.lead.why).not.toMatch(/older than 12h/);
    const t = truthUnlock({ ...DIGEST_UNLOCK, lead: { ...DIGEST_UNLOCK.lead, why: note, move: "x · cycle label 003" } }, LEAD_TODAY!.crawl_at);
    expect(t.lead.why).toBe(`fresh pick · picked ${LEAD_TODAY!.pick_slot} UTC+3`);
    expect(t.lead.move).toBe("x");
  });
  test("Past-24h ages use the story's first time (Genie-class ~30h story never reads 14m)", () => {
    const crawl = Date.parse(TLDR_24H.crawl_at);
    for (const b of TLDR_24H.bullets) {
      expect(crawl - Date.parse(b.at)).toBeLessThanOrEqual(24 * 3_600_000);
      expect(/Genie 4/.test(b.title)).toBe(false);
    }
    // the Genie story's first member (deepmind 2026-10-27T16:01:38Z) at the review clock reads 30h, not 14m
    expect(compactAge("2026-10-27T16:01:38Z", Date.parse("2026-10-28T22:30:00Z"))).toBe("30h");
  });
});
