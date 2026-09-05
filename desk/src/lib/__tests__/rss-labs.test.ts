import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  fetchRssLabs,
  isLabBriefEligible,
  LAB_FEEDS,
  parseRssOrAtom,
  toLabItems,
  toShelfItems,
  type LabId,
} from "@/lib/rss-labs";
import { classifyPost } from "@/lib/x-hygiene";
import { CYCLE } from "@/data/cycle";

const FIX = (name: string) =>
  readFileSync(resolve(import.meta.dir, "fixtures", name), "utf8");

const OPENAI = FIX("rss-openai-daybreak.xml");
const GOOGLE_AI = FIX("rss-google-ai-fairwind.xml");
const DEEPMIND = FIX("rss-deepmind-gemini38.xml");
const HF = FIX("rss-hf-neomme.xml");

describe("RSS labs parse → schema", () => {
  test("OpenAI Daybreak fixture maps briefEligible false", () => {
    const entries = parseRssOrAtom(OPENAI);
    expect(entries.length).toBeGreaterThanOrEqual(1);
    expect(entries[0]!.title).toContain("Daybreak");
    const items = toLabItems(entries, "openai");
    expect(items.length).toBeGreaterThanOrEqual(1);
    const daybreak = items.find((i) => i.title.includes("Daybreak"))!;
    expect(daybreak.lab).toBe("openai");
    expect(daybreak.source).toBe("rss-lab");
    expect(daybreak.briefEligible).toBe(false);
    expect(daybreak.pulseEligible).toBe(true);
    expect(daybreak.shelfOnly).toBe(false);
    expect(daybreak.link).toContain("daybreak-for-frontline-defenders");
    expect(daybreak.summary.length).toBeLessThanOrEqual(400);
    expect(daybreak.published).toMatch(/^2026-09-03T/);
    expect(isLabBriefEligible(daybreak)).toBe(false);
  });

  test("OpenAI Astra product post → companion Pulse, never Brief", () => {
    const items = toLabItems(parseRssOrAtom(OPENAI), "openai");
    const astra = items.find((i) => /astra/i.test(i.title))!;
    expect(astra).toBeTruthy();
    expect(astra.tag).toBe("companion");
    expect(astra.briefEligible).toBe(false);
    expect(astra.pulseEligible).toBe(true);
  });

  test("Google AI Fairwind fixture", () => {
    const items = toLabItems(parseRssOrAtom(GOOGLE_AI), "google-ai");
    expect(items).toHaveLength(1);
    expect(items[0]!.lab).toBe("google-ai");
    expect(items[0]!.title).toContain("cyber defense");
    expect(items[0]!.briefEligible).toBe(false);
    expect(items[0]!.pulseEligible).toBe(true);
  });

  test("DeepMind empty description still Pulse-eligible", () => {
    const items = toLabItems(parseRssOrAtom(DEEPMIND), "deepmind");
    expect(items.length).toBeGreaterThanOrEqual(1);
    const gemini = items.find((i) => /Gemini 3\.8/i.test(i.title))!;
    expect(gemini).toBeTruthy();
    expect(gemini.summary).toBe("");
    expect(gemini.briefEligible).toBe(false);
    expect(gemini.pulseEligible).toBe(true);
  });

  test("HF NeoMME title-only fixture", () => {
    const items = toLabItems(parseRssOrAtom(HF), "huggingface");
    expect(items).toHaveLength(1);
    expect(items[0]!.lab).toBe("huggingface");
    expect(items[0]!.title).toContain("NeoMME");
    expect(items[0]!.briefEligible).toBe(false);
  });

  test("fetchRssLabs offline fixtures for all four labs", async () => {
    const fixtures: Partial<Record<LabId, string>> = {
      openai: OPENAI,
      "google-ai": GOOGLE_AI,
      deepmind: DEEPMIND,
      huggingface: HF,
    };
    const r = await fetchRssLabs({ fixtures });
    expect(r.feedsOk.length).toBe(4);
    expect(r.pulse.length).toBeGreaterThanOrEqual(4);
    for (const it of r.items) {
      expect(it.briefEligible).toBe(false);
    }
    expect(r.pulse.every((i) => i.pulseEligible)).toBe(true);
  });
});

describe("classifyPost / DENY on RSS titles", () => {
  test("Astra compromised Hugging Face → flatten drop", () => {
    const r = classifyPost({
      text: "Astra agents compromised Hugging Face",
      handle: "openai",
    });
    expect(r.flatten).toBe(true);
    const items = toLabItems(
      [
        {
          title: "Astra agents compromised Hugging Face",
          link: "https://openai.com/index/bad",
          guid: "deny-rss-1",
          published: "2026-09-01T00:00:00Z",
          summary: "",
        },
      ],
      "openai",
    );
    expect(items).toHaveLength(0);
  });

  test("Sol = Astra → DENY flatten drop", () => {
    const items = toLabItems(
      [
        {
          title: "GPT-5.6 Sol = Astra confirmed",
          link: "https://openai.com/index/bad2",
          guid: "deny-rss-2",
          published: "2026-09-01T00:00:00Z",
          summary: "",
        },
      ],
      "openai",
    );
    expect(items).toHaveLength(0);
  });

  test("civilizations / announced deal → drop", () => {
    expect(
      toLabItems(
        [
          {
            title: "Announced deal reshapes civilizations",
            link: "https://openai.com/index/bad3",
            guid: "deny-rss-3",
            published: "2026-09-01T00:00:00Z",
            summary: "",
          },
        ],
        "openai",
      ),
    ).toHaveLength(0);
  });

  test("toolkit GitHub URL in lab post → shelfOnly, off Brief", () => {
    const items = toLabItems(
      [
        {
          title: "OWASP ModSecurity scanner notes",
          link: "https://github.com/owasp-modsecurity/ModSecurity",
          guid: "toolkit-rss-1",
          published: "2026-09-01T00:00:00Z",
          summary: "scanner release",
        },
      ],
      "huggingface",
    );
    expect(items).toHaveLength(1);
    expect(items[0]!.shelfOnly).toBe(true);
    expect(items[0]!.pulseEligible).toBe(false);
    expect(items[0]!.briefEligible).toBe(false);
    const shelf = toShelfItems(items);
    expect(shelf[0]!.reason).toBe("rss-lab-shelf");
  });
});

describe("never Brief · cycle locks · no Anthropic/Meta required", () => {
  test("all fixture items briefEligible false; pin set unchanged", () => {
    for (const [lab, xml] of [
      ["openai", OPENAI],
      ["google-ai", GOOGLE_AI],
      ["deepmind", DEEPMIND],
      ["huggingface", HF],
    ] as const) {
      for (const it of toLabItems(parseRssOrAtom(xml), lab)) {
        expect(it.briefEligible).toBe(false);
        expect(isLabBriefEligible(it)).toBe(false);
        expect(it.id).not.toBe("hf-incident");
      }
    }
    expect(CYCLE.id).toBe("003");
    expect(CYCLE.pins[0]?.id).toBe("hf-incident");
    expect(CYCLE.pins[0]?.kind).toBe("lead");
    expect(CYCLE.pins.map((p) => p.id)).toEqual([
      "hf-incident",
      "astra-depth",
      "aisle-curl",
    ]);
  });

  test("LAB_FEEDS are first-party only — no anthropic/meta", () => {
    const labs = LAB_FEEDS.map((f) => f.lab);
    expect(labs).toContain("openai");
    expect(labs).toContain("deepmind");
    expect(labs).toContain("google-ai");
    expect(labs).toContain("huggingface");
    expect(labs).not.toContain("anthropic");
    expect(labs).not.toContain("meta");
  });

  test("bad XML fail-closed → empty parse", () => {
    expect(parseRssOrAtom("<<<not xml")).toEqual([]);
    expect(parseRssOrAtom("")).toEqual([]);
  });
});
