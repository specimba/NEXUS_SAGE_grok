#!/usr/bin/env bun
/**
 * PASS-D D6 — publish proof written to the repo (the GitLab job log is private).
 *   bun scripts/publish-proof.ts write [--desk <dir>]
 *       Called by pages-publish.sh on every publish attempt (pass or fail), from env:
 *       P_MAIN P_CRAWL P_OV (skipped|ran-pass|ran-fail) P_OVWHY P_FL (first-load bytes) P_CIS (chrome install s, or empty)
 *       P_FAILS (check-fail count ⇒ result) P_FONT (font gate: browser|static|static+browser|skipped)
 *       P_CHROME_BIN (set only when this run installed Chrome) P_CHROME_VER (pinned version) P_CHROME_ZIP (pinned zip sha256).
 *       The ONE publish-proof writer (PASS-D D6 + Q1G §2 amend: replaces ci-chrome's inline `bun -e` block, same fields).
 *       Writes artifacts/sage/publish-proof.json; first_load_prev_bytes = the previous proof's first_load_bytes;
 *       feed_* from public/feed.xml, feed_changed = feed bytes ≠ the committed HEAD:desk/public/feed.xml.
 *   bun scripts/publish-proof.ts suffix --changed <true|false> [--status <atom-feed status file>] [--desk <dir>]
 *       Prints the crawl.log suffix `feed=<sha8|same|skipped> ov390=<skipped|pass|fail> fl=<bytes|->`.
 *       The proof only counts when it is this run's (crawl_at = CRAWL_AT and main_sha = HEAD); otherwise ov390=skipped fl=-.
 * PASS-W W4: `watch_sha` (sha256 of public/watch.xml or null), `watch_new` / `watch_dropped` (from the atom-feed status
 *   file's `watch=<new>/<dropped>` line, $ATOM_FEED_STATUS; null when off/skipped/absent); the suffix gains
 *   `watch=<new>/<dropped>|off|skipped`.
 * Never fails the caller: errors print a WARN and exit 0.
 */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const argv = process.argv.slice(2);
const opt = (k: string) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] ?? null : null);
const desk = resolve(opt("--desk") || resolve(import.meta.dir, ".."));
const repo = resolve(desk, "..");
const proofPath = resolve(desk, "artifacts/sage/publish-proof.json");
const feedPath = resolve(desk, "public/feed.xml");
const watchPath = resolve(desk, "public/watch.xml");
/** PASS-W: the `watch=` token of an atom-feed status file ("skipped" when there is none). */
function watchToken(status: string): string {
  const m = /^watch=(\d+\/\d+|off)\b/m.exec(status);
  return m ? m[1]! : "skipped";
}
const readStatus = (f: string | null | undefined) => (f && existsSync(f) ? readFileSync(f, "utf8").trim() : "");

type ChromeProof = { version: string | null; pinned: string | null; zip_sha256: string | null; bin_sha256: string } | null;
type Proof = {
  main_sha: string | null;
  crawl_at: string | null;
  /** Wall time of the attempt (proof only; never in feed.xml). */
  at: string;
  result: "verified" | "check-fail";
  overflow_390: "skipped" | "ran-pass" | "ran-fail";
  overflow_why: string;
  font_check: string | null;
  first_load_bytes: number | null;
  first_load_prev_bytes: number | null;
  chrome_install_s: number | null;
  /** Only when this run installed Chrome: `--version`, pinned version, pinned zip sha256, binary sha256. */
  chrome: ChromeProof;
  feed_sha256: string | null;
  feed_entries: number;
  feed_changed: boolean;
  watch_sha: string | null;
  watch_new: number | null;
  watch_dropped: number | null;
};

const readJson = <T>(p: string): T | null => {
  try {
    return JSON.parse(readFileSync(p, "utf8")) as T;
  } catch {
    return null;
  }
};
const num = (v: string | undefined) => (v === undefined || v === "" || !Number.isFinite(Number(v)) ? null : Number(v));
const git = (...a: string[]) => spawnSync("git", ["-C", repo, ...a], { encoding: "buffer" });
const crawlAtNow = () => {
  try {
    return readFileSync(resolve(desk, "src/data/x-crawl.ts"), "utf8").match(/export const CRAWL_AT\s*=\s*"([^"]+)"/)?.[1] ?? null;
  } catch {
    return null;
  }
};

function write() {
  const e = process.env;
  const prev = readJson<Proof>(proofPath);
  const feed = existsSync(feedPath) ? readFileSync(feedPath) : null;
  const head = git("show", "HEAD:desk/public/feed.xml");
  const committed = head.status === 0 ? head.stdout : null;
  const wt = watchToken(readStatus(e.ATOM_FEED_STATUS)).split("/");
  const [wn, wd] = wt.length === 2 ? [Number(wt[0]), Number(wt[1])] : [null, null];
  const ov = e.P_OV === "ran-pass" || e.P_OV === "ran-fail" ? e.P_OV : "skipped";
  const bin = e.P_CHROME_BIN || "";
  let chrome: ChromeProof = null;
  if (bin) {
    const v = spawnSync(bin, ["--version"], { encoding: "utf8" });
    chrome = {
      version: v.status === 0 ? v.stdout.trim() : null,
      pinned: e.P_CHROME_VER || null,
      zip_sha256: e.P_CHROME_ZIP || null,
      bin_sha256: createHash("sha256").update(readFileSync(bin)).digest("hex"),
    };
  }
  const out: Proof = {
    main_sha: e.P_MAIN || null,
    crawl_at: e.P_CRAWL || null,
    at: new Date().toISOString(),
    result: Number(e.P_FAILS) ? "check-fail" : "verified",
    overflow_390: ov,
    overflow_why: e.P_OVWHY || "",
    font_check: e.P_FONT || null,
    first_load_bytes: num(e.P_FL),
    first_load_prev_bytes: prev?.first_load_bytes ?? null,
    chrome_install_s: num(e.P_CIS),
    chrome,
    feed_sha256: feed ? createHash("sha256").update(feed).digest("hex") : null,
    feed_entries: feed ? (feed.toString("utf8").match(/<entry>/g) ?? []).length : 0,
    feed_changed: feed ? !(committed && Buffer.compare(committed, feed) === 0) : false,
    watch_sha: existsSync(watchPath) ? createHash("sha256").update(readFileSync(watchPath)).digest("hex") : null,
    watch_new: wn,
    watch_dropped: wd,
  };
  mkdirSync(dirname(proofPath), { recursive: true });
  writeFileSync(proofPath, JSON.stringify(out, null, 2) + "\n");
  console.log(`publish-proof: ov390=${out.overflow_390} fl=${out.first_load_bytes ?? "-"} (prev ${out.first_load_prev_bytes ?? "-"}) feed=${out.feed_sha256?.slice(0, 8) ?? "none"} changed=${out.feed_changed}`);
}

function suffix() {
  const changed = opt("--changed") === "true";
  const statusFile = opt("--status");
  const status = readStatus(statusFile);
  const p = readJson<Proof>(proofPath);
  const headSha = git("rev-parse", "HEAD").stdout.toString().trim();
  const fresh = !!(changed && p && p.crawl_at && p.crawl_at === crawlAtNow() && p.main_sha === headSha);
  const feed = !status || /^atom-feed: skipped/.test(status) ? "skipped" : fresh && p!.feed_changed && p!.feed_sha256 ? p!.feed_sha256.slice(0, 8) : "same";
  const ov = fresh ? ({ skipped: "skipped", "ran-pass": "pass", "ran-fail": "fail" } as const)[p!.overflow_390] ?? "skipped" : "skipped";
  const fl = fresh && p!.first_load_bytes != null ? String(p!.first_load_bytes) : "-";
  console.log(`feed=${feed} ov390=${ov} fl=${fl} watch=${watchToken(status)}`);
}

try {
  if (argv[0] === "write") write();
  else if (argv[0] === "suffix") suffix();
  else console.error("usage: publish-proof.ts write | suffix --changed <true|false> [--status <file>] [--desk <dir>]");
} catch (err) {
  if (argv[0] === "suffix") console.log("feed=skipped ov390=skipped fl=- watch=skipped");
  else console.error(`publish-proof: WARN ${err instanceof Error ? err.message : String(err)}`);
}
process.exit(0);
