/**
 * Clock times on the desk — ALWAYS Intl with timeZone "Europe/Istanbul" (label UTC+3), never the
 * host zone: Cloudflare builds on UTC and a static page freezes what it renders at build time.
 * Formatters are cached (the first tz-aware Intl formatter is slow to construct).
 */
export const IST_TZ = "Europe/Istanbul";
export const IST_LABEL = "UTC+3";

let HM: Intl.DateTimeFormat | undefined;
let HMS: Intl.DateTimeFormat | undefined;
let DT: Intl.DateTimeFormat | undefined;

function parts(fmt: Intl.DateTimeFormat, iso: string): Record<string, string> | null {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return null;
  return Object.fromEntries(fmt.formatToParts(t).map((p) => [p.type, p.value]));
}

/** "14:16" (Istanbul), "—" when unparseable. */
export function istHHMM(iso: string): string {
  HM ??= new Intl.DateTimeFormat("en-GB", { timeZone: IST_TZ, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  const p = parts(HM, iso);
  return p ? `${p.hour}:${p.minute}` : "—";
}

/** "14:16:08" (Istanbul). */
export function istHHMMSS(iso: string): string {
  HMS ??= new Intl.DateTimeFormat("en-GB", { timeZone: IST_TZ, hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });
  const p = parts(HMS, iso);
  return p ? `${p.hour}:${p.minute}:${p.second}` : "—";
}

/** "2026-09-25 14:16" (Istanbul). */
export function istDateTime(iso: string): string {
  DT ??= new Intl.DateTimeFormat("en-GB", {
    timeZone: IST_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const p = parts(DT, iso);
  return p ? `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}` : "—";
}
