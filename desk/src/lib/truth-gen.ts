/**
 * PASS-U A — generator-side truth transforms (scripts / module renderers only; never imported by the desk client,
 * so they cost no First Load). The shipped data modules are already honest; the client renders them as-is.
 */
import type { DigestUnlockSnapshot } from "@/lib/digest-unlock";
import type { LeadLog } from "@/lib/lead-log";
import type { SlimLead } from "@/lib/desk-view";
import { publicHref } from "@/lib/truth";
import { IST_LABEL, istHHMM } from "@/lib/ist-time";

/**
 * U3: the Digest/Voice freeze happens at the pick, so a pick-time `repick: lead older than 12h` note (about the
 * PREVIOUS lead) is stale for this one (since_pick_h < 12 on the pick clock = the lead entry's crawl_at, the same
 * clock as lead-pick / crawl log / day tape). Cycle label goes off the primary MOVE line.
 */
export function truthUnlock(snap: DigestUnlockSnapshot, pickAt?: string | null): DigestUnlockSnapshot {
  const at = pickAt ?? snap.frozenAt ?? null;
  return { ...snap, lead: { ...snap.lead, why: leadWhy(snap.lead.why, at, at), move: leadMove(snap.lead.move) } };
}

/** U0: lead log — an inbox URL is never a public link nor a "mail.google.com" publisher. */
export function truthLeadLog(log: LeadLog): LeadLog {
  return {
    ...log,
    days: log.days.map((d) => ({
      ...d,
      url: d.url && publicHref(d.url) ? d.url : null,
      pubs: d.pubs.filter((p) => !/mail\.google\.com/i.test(p)),
    })),
  };
}

/** U0: desk-view lead rows — an inbox URL never ships to the desk. */
export function truthSlimLead(l: SlimLead | null): SlimLead | null {
  return l && l.url && !publicHref(l.url) ? { ...l, url: "" } : l;
}

const STALE_REPICK = /^repick: lead older than 12h/i;
/**
 * U3: lead Why on the live clock. The pick-time `repick: lead older than 12h` note describes the PREVIOUS lead;
 * once the live since_pick_h (clock − pick time, same clock as lead-pick / crawl log) is < 12 it is stale — drop it.
 */
export function leadWhy(why: string, pickAt: string | null | undefined, clockAt: string | null | undefined): string {
  if (!STALE_REPICK.test(why)) return why;
  const sincePickH = (Date.parse(clockAt ?? "") - Date.parse(pickAt ?? "")) / 3_600_000;
  if (!Number.isFinite(sincePickH) || sincePickH >= 12) return why;
  return `fresh pick · picked ${istHHMM(pickAt!)} ${IST_LABEL}`;
}

/** U3: cycle label is desk-details jargon — never on the primary MOVE line. */
export function leadMove(move: string): string {
  return move.replace(/\s*·\s*cycle label \S+/i, "").trim();
}

