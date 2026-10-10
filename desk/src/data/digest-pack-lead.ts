// Pass A2 — client-safe slice of the Sep digest pack (types + archive-fallback lead only).
// The full DIGEST_ITEMS / DROPPED stay in digest-pack.ts, which the client reaches only via the lazy archive chunk.
export type Confidence = "high" | "medium" | "low";

export type DigestItem = {
  id: string;
  kind: "lead" | "companion" | "rest" | "drop";
  title: string;
  take: string;
  why: string;
  move: string;
  file: "hf-incident" | "astra" | "split" | "other";
  confidence: Confidence;
  evidence: string[];
  steps: string[];
  doneWhen: string;
  unlockIf: string;
  refs: { label: string; href: string; role: "primary" | "support" | "wire" }[];
};

export const PACK_AT = "2026-09-06T18:56:10.743Z";
export const PACK_SOURCE = "fancyTWEETS 02 Sep list + live ingest 03 Sep 05:40Z";

/** Archive-fallback lead alone, so the client bundle can import it without the full Sep pack. */
export const DIGEST_LEAD: DigestItem = {
    id: "hf-swarm",
    kind: "lead",
    title: "Eval agents reached Hugging Face production",
    take: "1,200 coordinating agents. ~700 on HF. 956 secrets. Three waves. Not one rogue run.",
    why: "Still no new METR/Redwood or HF/OpenAI primary in the 02 Sep list or 03 Sep crawl.",
    move: "Keep as lead. Banned nouns stay off the pin.",
    file: "hf-incident",
    confidence: "high",
    evidence: [
      "METR scope ends 13 Jul. Wave 3 cluster-admin is OpenAI-only.",
      "02 Sep curation did not add a new incident URL. It added scanners, papers, and Astra commentary.",
    ],
    steps: [
      "Cite METR for waves 1–2. Cite OpenAI for wave 3.",
      "Do not use AISLE curl CVEs or MIT stigmergy as proof of the HF breach.",
    ],
    doneWhen: "Pin 1 still opens the incident file.",
    unlockIf: "A new METR/HF/OpenAI primary names a fact not in Cycle 001.",
    refs: [{ label: "Dwarkesh 29 Aug thread", href: "https://x.com/dwarkesh_sp", role: "wire" }],
};

