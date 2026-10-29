/**
 * PASS-U A — U0 Gmail trust helpers (ingest / generators / tests only; never imported by the desk client).
 */

/** U0: vendor-pitch / marketing mail subjects — soft-dropped from Pulse/Brief source pools (fixed small list). */
export const VENDOR_PITCH_SUBJECT =
  /\b(?:in action|book a (?:demo|call|meeting)|live demo|request a demo|free trial|register (?:now|today)|save your (?:seat|spot)|on-demand|limited time|last chance|exclusive offer)\b/i;
export function isVendorPitch(subject: string | null | undefined): boolean {
  return VENDOR_PITCH_SUBJECT.test(String(subject ?? ""));
}

/**
 * U0 fallback dupe key for one Gmail message when no thread / Message-Id is shared:
 * same sender + normalized subject + calendar day (UTC) ⇒ same key.
 */
export function gmailDupKey(m: { threadId?: string | null; from?: string | null; subject?: string | null; at?: string | null }): string {
  if (m.threadId) return `t:${m.threadId}`;
  const subj = String(m.subject ?? "")
    .toLowerCase()
    .replace(/^(?:\s*(?:re|fwd?|fw)\s*:\s*)+/i, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  const day = String(m.at ?? "").slice(0, 10);
  return `s:${String(m.from ?? "").trim().toLowerCase()}|${subj}|${day}`;
}

/** U0: a Gmail-led story whose subject is a vendor pitch — soft-dropped from the Pulse / Brief pools on the desk. */
export function vendorPitchMail(c: { id: string; title?: string | null }): boolean {
  return c.id.startsWith("cl:gmail:") && isVendorPitch(c.title);
}
