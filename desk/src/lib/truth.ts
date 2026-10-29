/**
 * PASS-U A — the one Trust helper the desk client ships (U0). Generator-only helpers: truth-gen.ts, gmail-trust.ts.
 */

/** U0: inbox links (mail.google.com, `#all/<id>`) are private — never a public href. Publisher URL or nothing. */
const PRIVATE_MAIL = /^(?:https?:\/\/)?mail\.google\.com\b|^#all\//i;
export function publicHref(u: string | null | undefined): string | undefined {
  const s = (u ?? "").trim();
  return s && !PRIVATE_MAIL.test(s) ? s : undefined;
}
