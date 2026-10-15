/**
 * UX-NEXT-3 idea 2 — morning edition day tape (refs/UX-NEXT-3.md §2). Pure + browser-safe (the desk imports the view).
 *
 * Crawl field: artifacts/sage/crawl-tape.json = the last CRAWL_TAPE_KEEP crawl stamps with their new-cluster count
 * (`new` = Pulse clusters whose first_seen is that crawl's stamp, i.e. `is_new`). Written by every ingest
 * (recordCrawl), persisted by ci-state.sh with the rest of artifacts/sage on changed=true runs.
 * Desk field: DAY_TAPE (src/data/desk-view.ts) = buildDayTape(): yesterday's last crawl + today's crawls (Istanbul date of
 * CRAWL_AT), ≤ DAY_TAPE_MAX, with `pick` on the crawl that made LEAD_TODAY ("held" when that entry is HELD).
 * Nothing is invented: no log entry ⇒ no slot; the NOW slot's count always comes from the current crawl's clusters.
 */
import { LEAD_PICK_HOUR, LEAD_RETRY_BEFORE_HOUR } from "./lead-pick";
import { CRAWL_SLOT_MINUTE } from "./lead-view";

export type CrawlTapeEntry = { at: string; new: number };
export type CrawlTapeLog = { schema: 1; crawls: CrawlTapeEntry[] };
export type DayTapeSlot = { at: string; new: number; pick?: "pick" | "held" };
export type DayTapeLead = { date: string; crawl_at?: string; reason: string } | null;

export const CRAWL_TAPE_PATH = "artifacts/sage/crawl-tape.json";
export const CRAWL_TAPE_KEEP = 16;
/** Crawl slots on the tape; the 6th column is the NEXT ghost. */
export const DAY_TAPE_MAX = 5;

const IST_MS = 3 * 3_600_000; // Europe/Istanbul is fixed UTC+3 (no DST since 2016)
const ts = (iso: string) => Date.parse(iso);
/** Istanbul calendar date "YYYY-MM-DD". */
export const istDay = (iso: string) => new Date(ts(iso) + IST_MS).toISOString().slice(0, 10);

export function parseCrawlTape(raw: unknown): CrawlTapeLog {
  const list = (raw as { crawls?: unknown } | null)?.crawls;
  const crawls = Array.isArray(list)
    ? list.filter((c): c is CrawlTapeEntry => !!c && typeof c.at === "string" && Number.isFinite(ts(c.at)) && Number.isInteger(c.new) && c.new >= 0)
    : [];
  return { schema: 1, crawls: [...crawls].sort((a, b) => ts(a.at) - ts(b.at)) };
}

/** Add (or replace) one crawl, oldest first, newest `keep` kept. Idempotent for a rerun of the same stamp. */
export function recordCrawl(log: CrawlTapeLog, at: string, n: number, keep = CRAWL_TAPE_KEEP): CrawlTapeLog {
  const crawls = [...log.crawls.filter((c) => c.at !== at), { at, new: Math.max(0, Math.floor(n)) }].sort((a, b) => ts(a.at) - ts(b.at));
  return { schema: 1, crawls: crawls.slice(Math.max(0, crawls.length - keep)) };
}

/**
 * Yesterday's last crawl + today's crawls up to `crawlAt` (`nowNew` = the current crawl's own count, authoritative).
 * Over DAY_TAPE_MAX: keep yesterday's slot, the pick slot and NOW, then the newest of the rest.
 */
export function buildDayTape(log: CrawlTapeLog, crawlAt: string, nowNew: number, lead: DayTapeLead): DayTapeSlot[] {
  const all = recordCrawl(log, crawlAt, nowNew, Infinity).crawls.filter((c) => ts(c.at) <= ts(crawlAt));
  const today = istDay(crawlAt);
  const prev = all.filter((c) => istDay(c.at) < today).at(-1);
  let slots: DayTapeSlot[] = [...(prev ? [prev] : []), ...all.filter((c) => istDay(c.at) === today)].map((c) => ({ ...c }));
  const pickAt = lead && lead.date === today && lead.reason !== "seed" ? lead.crawl_at : undefined;
  for (const s of slots) if (s.at === pickAt) s.pick = lead!.reason === "held" ? "held" : "pick";
  if (slots.length > DAY_TAPE_MAX) {
    const keep = new Set<string>([prev?.at, pickAt, crawlAt].filter((x): x is string => !!x && slots.some((s) => s.at === x)));
    for (const s of [...slots].reverse()) if (keep.size < DAY_TAPE_MAX) keep.add(s.at);
    slots = slots.filter((s) => keep.has(s.at));
  }
  return slots;
}

export type DayTapeKind = "prev" | "pick" | "held" | "now" | "";
export type DayTapeViewSlot = { at: string; new: number; kind: DayTapeKind; now: boolean; h: number };
export type DayTapeView = {
  date: string;
  overnight: number;
  today: number;
  pick: { hhmmAt: string; held: boolean } | null;
  slots: DayTapeViewSlot[];
  /** Index of the slot under which `▲ you` sits (last slot at/before the since baseline), else null. */
  you: number | null;
};

const DOW = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MON = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
/** "THU 15 OCT" (Istanbul date of `iso`). */
export function editionDate(iso: string): string {
  const d = new Date(ts(iso) + IST_MS);
  return `${DOW[d.getUTCDay()]} ${d.getUTCDate()} ${MON[d.getUTCMonth()]}`;
}

/** Bar height %: log scale over the tape's max, so bars rank by `new`; 0 new ⇒ no bar, any new ⇒ ≥ 8%. */
export function slotHeight(n: number, max: number): number {
  if (n <= 0 || max <= 0) return 0;
  return Math.max(8, Math.round((100 * Math.log1p(n)) / Math.log1p(max)));
}

export function dayTapeView(tape: readonly DayTapeSlot[], crawlAt: string, since: string | null): DayTapeView {
  const today = istDay(crawlAt);
  const max = Math.max(0, ...tape.map((s) => s.new));
  const slots = tape.map((s): DayTapeViewSlot => {
    const now = s.at === crawlAt;
    const kind: DayTapeKind = s.pick ?? (now ? "now" : istDay(s.at) < today ? "prev" : "");
    return { at: s.at, new: s.new, kind, now, h: slotHeight(s.new, max) };
  });
  const todays = tape.filter((s) => istDay(s.at) === today);
  const picked = tape.find((s) => s.pick);
  let you: number | null = null;
  if (since && Number.isFinite(ts(since))) tape.forEach((s, i) => { if (ts(s.at) <= ts(since)) you = i; });
  return {
    date: editionDate(crawlAt),
    overnight: todays[0]?.new ?? 0,
    today: todays.reduce((a, s) => a + s.new, 0),
    pick: picked ? { hhmmAt: picked.at, held: picked.pick === "held" } : null,
    slots,
    you,
  };
}

/**
 * NEXT ghost: after a pick the next pick is tomorrow's first crawl (06:11); on a HELD day it is the HELD plate's own
 * `next try` slot while retries still run (06:00–20:59), else 06:11.
 */
export function nextPickSlot(held: boolean, nextTry: string): string {
  const h = Number(nextTry.slice(0, 2));
  return held && h >= LEAD_PICK_HOUR && h < LEAD_RETRY_BEFORE_HOUR ? nextTry : `${String(LEAD_PICK_HOUR).padStart(2, "0")}:${CRAWL_SLOT_MINUTE}`;
}
