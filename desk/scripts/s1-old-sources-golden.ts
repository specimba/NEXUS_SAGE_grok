#!/usr/bin/env bun
/**
 * PASS-S1 test 2 — old sources unchanged. Two modes:
 *   bun scripts/s1-old-sources-golden.ts --capture   (run ONCE on the pre-S1 base, b4c8f44): freezes the committed
 *        crawl's old-source Pulse inputs + member info into fixtures/s1/old-sources-crawl.json and the pipeline
 *        output (clusters → Wire → lead candidates → pick) into fixtures/s1/old-sources-golden.json.
 *   (no flag) prints the pipeline output for the frozen fixture with the current code (what the test compares).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { oldSourcesPipeline, type S1Fixture } from "../src/lib/__tests__/s1-pipeline";

const desk = resolve(import.meta.dir, "..");
const fx = resolve(desk, "src/lib/__tests__/fixtures/s1");

if (process.argv.includes("--capture")) {
  const { PULSE_CLUSTERS_AT } = await import("@/data/pulse-clusters");
  const { HN_PULSE } = await import("@/data/hn-pulse");
  const { RSS_LABS } = await import("@/data/rss-labs");
  const { RSS_SECURITY } = await import("@/data/rss-security");
  const { GNEWS_RSS } = await import("@/data/gnews-rss");
  const { GMAIL_NEWS } = await import("@/data/gmail-news");
  const { memberInfo } = await import("@/lib/member-info");
  const toIso = (v: string) => {
    const t = Date.parse(v);
    return Number.isFinite(t) ? new Date(t).toISOString().replace(/\.\d{3}Z$/, "Z") : v;
  };
  // Same mapping as scripts/ingest.ts pulseInputs (old sources only), from the committed crawl modules.
  const inputs = [
    ...HN_PULSE.map((r) => ({ id: r.id, source: "hn-algolia", title: r.text, url: r.url, at: toIso(r.at), score: r.score })),
    ...RSS_LABS.map((r) => ({ id: r.id, source: "rss-lab", title: r.title, url: r.link, at: toIso(r.published), publisher: r.lab })),
    ...RSS_SECURITY.map((r) => ({ id: r.id, source: "rss-security", title: r.title, url: r.link, at: toIso(r.published), publisher: r.lab })),
    ...GNEWS_RSS.map((r) => ({ id: r.id, source: "gnews-rss", title: r.title, url: r.link, at: toIso(r.published), publisher: r.publisher })),
    ...GMAIL_NEWS.map((r) => ({ id: r.id, source: "gmail-news", title: r.title, url: r.link, at: toIso(r.published), publisher: r.publisher })),
  ];
  const members = memberInfo();
  const fixture: S1Fixture = {
    note: "PASS-S1 test 2 fixture: committed crawl at b4c8f44 (old sources only). Frozen; never regenerate after S1 code lands.",
    stamp: PULSE_CLUSTERS_AT,
    inputs: inputs as S1Fixture["inputs"],
    members: Object.fromEntries(Object.entries(members).filter(([id]) => !id.startsWith("x:"))),
  };
  writeFileSync(resolve(fx, "old-sources-crawl.json"), `${JSON.stringify(fixture, null, 1)}\n`);
  writeFileSync(resolve(fx, "old-sources-golden.json"), `${JSON.stringify(oldSourcesPipeline(fixture), null, 1)}\n`);
  console.log(`captured ${inputs.length} inputs @ ${PULSE_CLUSTERS_AT}`);
} else {
  const fixture = JSON.parse(readFileSync(resolve(fx, "old-sources-crawl.json"), "utf8")) as S1Fixture;
  process.stdout.write(`${JSON.stringify(oldSourcesPipeline(fixture), null, 1)}\n`);
}
