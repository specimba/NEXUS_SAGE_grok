/**
 * PASS-NOISE — lifestyle / astrology junk off the desk.
 * Fixed code list (no config key). Pure; called from every entry→item mapper.
 * A match is a hard skip of that row only: drop reason `noise:lifestyle`.
 */
export const LIFESTYLE_NOISE_REASON = "noise:lifestyle";

/** Zodiac sign words — also used to lock GNews standing queries. */
export const ZODIAC_SIGNS = [
  "aries", "taurus", "gemini", "cancer", "leo", "virgo",
  "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces",
] as const;

const HARD = /\b(?:horoscopes?|astrology|astrological|zodiac|birth[- ]chart)\b/i;
const SIGN = new RegExp(`\\b(?:${ZODIAC_SIGNS.join("|")})\\b`, "i");
const SIGN_CO =
  /\b(?:horoscopes?|astrology|zodiac|moon sextile|mercury retrograde|in your sign|spiritual quote of the day|daily astrology)\b/i;
const FRAMES = /\b(?:spiritual quote of the day|daily astrology|tarot|numerology|lucky numbers? and colou?rs? today)\b/i;
const TITLE_ONLY = /\b(?:vastu tips?|feng shui)\b/i;

export function isLifestyleNoise(title: string, summary?: string | null): boolean {
  const t = String(title ?? "");
  const s = String(summary ?? "");
  for (const text of [t, s]) {
    if (!text) continue;
    if (HARD.test(text) || FRAMES.test(text)) return true;
    if (SIGN.test(text) && SIGN_CO.test(text)) return true;
  }
  return TITLE_ONLY.test(t);
}

/** True when a standing query is just a bare zodiac sign (e.g. "Gemini", "cancer"). */
export function isBareZodiacQuery(q: string): boolean {
  const k = String(q ?? "").trim().toLowerCase().replace(/^"|"$/g, "");
  return (ZODIAC_SIGNS as readonly string[]).includes(k);
}
