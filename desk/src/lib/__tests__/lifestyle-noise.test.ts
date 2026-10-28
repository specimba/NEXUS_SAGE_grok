import { describe, expect, test } from "bun:test";
import { isBareZodiacQuery, isLifestyleNoise, LIFESTYLE_NOISE_REASON } from "../lifestyle-noise";
import { GNEWS_LAB_QUERIES, GNEWS_WATCHLIST_QUERIES, gnewsQueriesSafe, gnewsStandingQueries, toGnewsItems } from "../gnews-rss";
import { wireExcludeReason } from "../wire";

const MUST_DIE = [
  "Cancer Horoscope Tomorrow, October 29, 2026: Gemini Moon Sextile Mars Helps You Rest and Recover - The Times of India",
  "Gemini Horoscope Tomorrow, October 29, 2026: Moon in Your Sign Sextile Jupiter Lifts Your Mood - The Times of India",
  "Daily Astrology News Alert, 28 October 2026: Gemini Moon Speeds Up Communication, Mercury Retrograde Coul - The Times of India",
  "Aries Horoscope Tomorrow, October 29, 2026: Gemini Moon Sextile Mars Helps You Finish Pending Errands - The Times of India",
  "Spiritual Quote of the Day, October 28: Gemini Moon Brings a Reminder That Not Every Thought Deserves You - The Times of India",
  "Your Weekly Horoscope: What the Stars Mean for Virgo",
  "Zodiac signs that will have a lucky week, per astrology",
];
const MUST_LIVE = [
  "Gemini 3.8 text-to-speech says hello",
  "Google ships Gemini agents for Workspace",
  "Gemma 3 open weights on Hugging Face",
  "AI model detects cancer in CT scans earlier than radiologists",
  "Mercury contamination found in chip fab wastewater",
  "Election deepfakes: how Gemini-class models change campaign security",
  "Claude and Gemini both refuse this prompt injection",
  "CUDA 13 release notes",
  "Nvidia inference chip for LLMs",
];

describe("PASS-NOISE isLifestyleNoise", () => {
  for (const t of MUST_DIE) test(`dies: ${t.slice(0, 40)}`, () => expect(isLifestyleNoise(t)).toBe(true));
  for (const t of MUST_LIVE) test(`lives: ${t.slice(0, 40)}`, () => expect(isLifestyleNoise(t)).toBe(false));
  test("summary-only match drops; sign without co-term lives", () => {
    expect(isLifestyleNoise("Your day ahead", "Leo: in your sign the moon...")).toBe(true);
    expect(isLifestyleNoise("Leo the robot", "a new humanoid")).toBe(false);
  });
  test("vastu / feng shui are title-only", () => {
    expect(isLifestyleNoise("Vastu tips for your home office")).toBe(true);
    expect(isLifestyleNoise("AI office planner", "ignores feng shui")).toBe(false);
  });
  test("recall leak: TOI lucky number/colour page (bare-Gemini fetch)", () => {
    expect(isLifestyleNoise("Lucky Number and Colour Today, October 28, 2026: Gemini Moon Speeds Up - The Times of India")).toBe(true);
    expect(isLifestyleNoise("Pick a lucky number: AI lottery scams rise")).toBe(false);
  });
  test("reason string", () => expect(LIFESTYLE_NOISE_REASON).toBe("noise:lifestyle"));
});

describe("PASS-NOISE query lock", () => {
  test("bare zodiac sign standing query fails", () => {
    for (const q of ["Gemini", "gemini", "Cancer", "Leo", " pisces "]) {
      expect(isBareZodiacQuery(q)).toBe(true);
      expect(() => gnewsStandingQueries([q])).toThrow();
      expect(gnewsQueriesSafe([q])).toBe(false);
    }
  });
  test("disambiguated form passes", () => {
    expect(gnewsQueriesSafe(["Gemini AI"])).toBe(true);
    expect(gnewsQueriesSafe(['Gemini (Google OR DeepMind OR "Google AI")'])).toBe(true);
  });
  test("shipped watchlists hold no bare sign", () => {
    for (const q of [...GNEWS_WATCHLIST_QUERIES, ...GNEWS_LAB_QUERIES]) expect(isBareZodiacQuery(q)).toBe(false);
    expect(GNEWS_LAB_QUERIES as readonly string[]).toContain("Gemini AI");
    expect(GNEWS_LAB_QUERIES as readonly string[]).not.toContain("Gemini");
  });
});

describe("PASS-NOISE mappers", () => {
  test("toGnewsItems drops lifestyle, keeps AI", () => {
    const entries = [...MUST_DIE, "Google ships Gemini agents for Workspace"].map((title, i) => ({
      title, link: `https://example.com/${i}`, guid: `g${i}`, published: "2026-10-28T10:00:00Z", summary: "",
    }));
    const out = toGnewsItems(entries as never, "Gemini AI");
    expect(out.map((o) => o.title)).toEqual(["Google ships Gemini agents for Workspace"]);
  });
  test("wire excludes lifestyle cluster even with keepNoise", () => {
    const c = { id: "gnews:x", lead_id: "gnews:x", member_ids: [], title: MUST_DIE[0], url: "https://x" } as never;
    expect(wireExcludeReason(c, new Set(), true)).toBe("noise:lifestyle");
  });
});
