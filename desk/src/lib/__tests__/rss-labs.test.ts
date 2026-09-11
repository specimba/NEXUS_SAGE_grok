import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  fetchRssLabs,
  isLabBriefEligible,
  LAB_FEEDS,
  looksLikeHtml,
  parseRssOrAtom,
  toLabItems,
  toShelfItems,
  type LabFeedDef,
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

const PHASE_A_IDS = ["openai", "deepmind", "google-ai", "huggingface"] as const;
const P2B_IDS = [
  "mistral",
  "nvidia",
  "nvidia-dev",
  "ms-research",
  "google-research",
] as const;
const PHASE_A_FEEDS: readonly LabFeedDef[] = LAB_FEEDS.filter((f) =>
  (PHASE_A_IDS as readonly string[]).includes(f.lab),
);
const P2B_FEEDS: readonly LabFeedDef[] = LAB_FEEDS.filter((f) =>
  (P2B_IDS as readonly string[]).includes(f.lab),
);

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
    const r = await fetchRssLabs({ fixtures, feeds: PHASE_A_FEEDS });
    expect(r.ok).toBe(true);
    expect(r.soft_fail).toBe(false);
    expect(r.brief).toBe(false);
    expect(r.pulse_only).toBe(true);
    expect(r.feedsOk.length).toBe(4);
    expect(r.feedsSoftFail).toHaveLength(0);
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

  test("LAB_FEEDS are first-party only — no anthropic/meta/cohere/xai", () => {
    const labs = LAB_FEEDS.map((f) => f.lab);
    expect(labs).toContain("openai");
    expect(labs).toContain("deepmind");
    expect(labs).toContain("google-ai");
    expect(labs).toContain("huggingface");
    for (const id of P2B_IDS) expect(labs).toContain(id);
    expect(labs).not.toContain("anthropic");
    expect(labs).not.toContain("meta");
    expect(labs).not.toContain("cohere");
    expect(labs).not.toContain("xai");
    // DENY: no Reddit / paid X / Bluesky URLs
    const urls = LAB_FEEDS.flatMap((f) => [...f.urls]).join(" ");
    expect(urls).not.toMatch(/reddit\.com|api\.x\.com|bluesky/i);
  });

  test("bad XML fail-closed → empty parse", () => {
    expect(parseRssOrAtom("<<<not xml")).toEqual([]);
    expect(parseRssOrAtom("")).toEqual([]);
  });
});


describe("P2 per-feed soft_fail harden", () => {
  test("looksLikeHtml detects Cloudflare/HTML walls", () => {
    expect(looksLikeHtml("<!DOCTYPE html><html><body>nope</body></html>")).toBe(true);
    expect(looksLikeHtml(OPENAI)).toBe(false);
    expect(looksLikeHtml(HF)).toBe(false);
  });

  test("one dead feed (403) ≠ kill ingest · HF/other labs keep", async () => {
    const fixtures: Partial<Record<LabId, string>> = {
      openai: "", // empty → soft_fail
      deepmind: DEEPMIND,
      "google-ai": GOOGLE_AI,
      huggingface: HF,
    };
    const r = await fetchRssLabs({ fixtures, feeds: PHASE_A_FEEDS });
    expect(r.ok).toBe(true);
    expect(r.soft_fail).toBe(true);
    expect(r.soft_fail_reason).toMatch(/openai:/);
    expect(r.feedsSoftFail.some((f) => f.lab === "openai" && f.soft_fail)).toBe(true);
    expect(r.feedsOk.map((f) => f.lab).sort()).toEqual([
      "deepmind",
      "google-ai",
      "huggingface",
    ]);
    expect(r.feedsOk.find((f) => f.lab === "huggingface")!.count).toBeGreaterThanOrEqual(1);
    for (const it of r.items) {
      expect(it.briefEligible).toBe(false);
    }
    expect(r.brief).toBe(false);
  });

  test("HTML body soft_fails that feed only", async () => {
    const fixtures: Partial<Record<LabId, string>> = {
      openai: OPENAI,
      deepmind: "<!DOCTYPE html><html><head></head><body>login</body></html>",
      "google-ai": GOOGLE_AI,
      huggingface: HF,
    };
    const r = await fetchRssLabs({ fixtures, feeds: PHASE_A_FEEDS });
    expect(r.ok).toBe(true);
    expect(r.soft_fail).toBe(true);
    expect(r.feedsSoftFail.some((f) => f.lab === "deepmind" && /HTML/.test(f.reason))).toBe(
      true,
    );
    expect(r.feedsOk.map((f) => f.lab)).toContain("huggingface");
    expect(r.feedsOk.map((f) => f.lab)).toContain("openai");
    expect(r.brief).toBe(false);
  });

  test("empty / bad XML soft_fail · no crash · never Brief", async () => {
    const fixtures: Partial<Record<LabId, string>> = {
      openai: "<<<not xml",
      deepmind: "<rss><channel></channel></rss>",
      "google-ai": GOOGLE_AI,
      huggingface: HF,
    };
    const r = await fetchRssLabs({ fixtures, feeds: PHASE_A_FEEDS });
    expect(r.ok).toBe(true);
    expect(r.soft_fail).toBe(true);
    expect(r.feedsSoftFail.length).toBeGreaterThanOrEqual(2);
    expect(r.feedsOk.some((f) => f.lab === "huggingface")).toBe(true);
    expect(r.pulse.every((i) => i.briefEligible === false)).toBe(true);
  });

  test("fetchImpl HTTP 403 soft_fails feed · others via fixtures keep", async () => {
    const fetchImpl = (async () =>
      new Response("forbidden", { status: 403 })) as typeof fetch;
    const r = await fetchRssLabs({
      feeds: [
        { lab: "openai", urls: ["https://openai.com/news/rss.xml"] },
        { lab: "huggingface", urls: ["https://huggingface.co/blog/feed.xml"] },
      ],
      fixtures: { huggingface: HF },
      fetchImpl,
      cacheDir: "/tmp/sage-rss-p2-softfail-cache",
      now: Date.now(),
    });
    expect(r.ok).toBe(true);
    expect(r.soft_fail).toBe(true);
    expect(r.feedsSoftFail.some((f) => f.lab === "openai" && /403/.test(f.reason))).toBe(
      true,
    );
    expect(r.feedsOk.some((f) => f.lab === "huggingface")).toBe(true);
    // stamp shape mirrors ingest-last.rss
    const stamp = {
      ok: r.ok,
      soft_fail: r.soft_fail,
      soft_fail_reason: r.soft_fail_reason ?? null,
      brief: r.brief,
      pulse_only: r.pulse_only,
      feeds_soft_fail: r.feedsSoftFail,
    };
    expect(stamp.soft_fail).toBe(true);
    expect(stamp.brief).toBe(false);
  });

  test("all feeds soft_fail → ok=false · empty items · no throw", async () => {
    const fixtures: Partial<Record<LabId, string>> = {
      openai: "",
      deepmind: "",
      "google-ai": "",
      huggingface: "",
    };
    const r = await fetchRssLabs({ fixtures, feeds: PHASE_A_FEEDS });
    expect(r.ok).toBe(false);
    expect(r.soft_fail).toBe(true);
    expect(r.items).toHaveLength(0);
    expect(r.pulse).toHaveLength(0);
    expect(r.feedsSoftFail).toHaveLength(4);
    expect(r.brief).toBe(false);
  });
});

describe("P2b first-party Phase B soft_fail", () => {
  test("LAB_FEEDS wires Scout P2b URLs exactly", () => {
    const byLab = Object.fromEntries(LAB_FEEDS.map((f) => [f.lab, f.urls[0]]));
    expect(byLab.mistral).toBe("https://mistral.ai/rss.xml");
    expect(byLab.nvidia).toBe("https://blogs.nvidia.com/feed/");
    expect(byLab["nvidia-dev"]).toBe("https://developer.nvidia.com/blog/feed");
    expect(byLab["ms-research"]).toBe(
      "https://www.microsoft.com/en-us/research/blog/feed/",
    );
    expect(byLab["google-research"]).toBe("https://research.google/blog/rss/");
    expect(P2B_FEEDS).toHaveLength(5);
  });

  test("new feed ids soft_fail per-feed · Phase A keep · never Brief", async () => {
    const fixtures: Partial<Record<LabId, string>> = {
      openai: OPENAI,
      deepmind: DEEPMIND,
      "google-ai": GOOGLE_AI,
      huggingface: HF,
      mistral: "",
      nvidia: "<!DOCTYPE html><html><body>wall</body></html>",
      "nvidia-dev": "<<<not xml",
      "ms-research": "<rss><channel></channel></rss>",
      "google-research": "",
    };
    const r = await fetchRssLabs({ fixtures });
    expect(r.ok).toBe(true);
    expect(r.soft_fail).toBe(true);
    expect(r.brief).toBe(false);
    expect(r.pulse_only).toBe(true);
    for (const id of P2B_IDS) {
      expect(
        r.feedsSoftFail.some((f) => f.lab === id && f.soft_fail === true),
      ).toBe(true);
    }
    expect(r.feedsOk.map((f) => f.lab).sort()).toEqual([
      "deepmind",
      "google-ai",
      "huggingface",
      "openai",
    ]);
    expect(r.feedsOk.find((f) => f.lab === "huggingface")!.count).toBeGreaterThanOrEqual(
      1,
    );
    for (const it of r.items) {
      expect(it.briefEligible).toBe(false);
      expect(it.source).toBe("rss-lab");
    }
    // ingest stamp shape
    const stamp = {
      soft_fail: r.soft_fail,
      soft_fail_reason: r.soft_fail_reason ?? null,
      brief: r.brief,
      feeds_soft_fail: r.feedsSoftFail,
    };
    expect(stamp.soft_fail).toBe(true);
    expect(stamp.brief).toBe(false);
    expect(stamp.feeds_soft_fail).toHaveLength(5);
    expect(stamp.soft_fail_reason).toMatch(/mistral:/);
  });

  test("P2b-only all soft_fail → ok=false · no throw", async () => {
    const fixtures: Partial<Record<LabId, string>> = {
      mistral: "",
      nvidia: "",
      "nvidia-dev": "",
      "ms-research": "",
      "google-research": "",
    };
    const r = await fetchRssLabs({ fixtures, feeds: P2B_FEEDS });
    expect(r.ok).toBe(false);
    expect(r.soft_fail).toBe(true);
    expect(r.items).toHaveLength(0);
    expect(r.feedsSoftFail).toHaveLength(5);
    for (const id of P2B_IDS) {
      expect(r.feedsSoftFail.some((f) => f.lab === id)).toBe(true);
    }
    expect(r.brief).toBe(false);
  });

  test("P2b fetchImpl 403 soft_fails that id only", async () => {
    const fetchImpl = (async () =>
      new Response("forbidden", { status: 403 })) as typeof fetch;
    const r = await fetchRssLabs({
      feeds: [
        { lab: "mistral", urls: ["https://mistral.ai/rss.xml"] },
        { lab: "huggingface", urls: ["https://huggingface.co/blog/feed.xml"] },
      ],
      fixtures: { huggingface: HF },
      fetchImpl,
      cacheDir: "/tmp/sage-rss-p2b-softfail-cache",
      now: Date.now(),
    });
    expect(r.ok).toBe(true);
    expect(r.soft_fail).toBe(true);
    expect(
      r.feedsSoftFail.some((f) => f.lab === "mistral" && /403/.test(f.reason)),
    ).toBe(true);
    expect(r.feedsOk.some((f) => f.lab === "huggingface")).toBe(true);
    expect(r.brief).toBe(false);
  });
});
