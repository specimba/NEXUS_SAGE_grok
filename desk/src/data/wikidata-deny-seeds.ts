/**
 * Wikidata DENY grounding — curated seeds + allow/reject.
 * Spec: refs/WIRE-WIKIDATA-DENY.md
 * SoT: refs/SCOUT-WIKIDATA-DENY-QIDS.md (fold 2026-09-04)
 * Locks: 003 / hf-incident / Sol≠Astra / never Brief / never Pulse lead /
 * ≤3 seeds/tick rotate / free only / no cycle 004.
 */

export type WikidataDenySeed = {
  /** Canonical seed id (cache key slug). */
  seed: string;
  /** wbsearchentities queries for this seed (rotate one per tick). */
  queries: readonly string[];
  /** Accept only these Q-ids when present in search hits. Empty = never invent match. */
  allowedQids?: readonly string[];
  /** Hard-reject these Q-ids (Scout REJECT table) — checked before allowlist. */
  rejectQids?: readonly string[];
  /** Label/description false-friend reject (solar, pharma, SI metre, …). */
  rejectLabelRe?: RegExp;
  /** Intent note for operators / tests. */
  intent:
    | "flatten_guard"
    | "companion_ne_hf"
    | "org_grounding"
    | "eval_lab"
    | "lab_rss"
    | "security_rss"
    | "standards"
    | "model_family"
    | "concept"
    | "unresolved_guard";
};

/**
 * Primary rotate (wire): Sol, Astra, Hugging Face, METR.
 * Then labs/security from Scout curated table. ≤3 seeds / ingest tick.
 * Do not invent pins from unresolved / rejected hits.
 */
export const WIKIDATA_DENY_SEEDS: readonly WikidataDenySeed[] = [
  {
    seed: "Sol",
    queries: ["Persistent Sol", "Sol"] as const,
    // No WD person/agent for Persistent Sol — never invent.
    allowedQids: [] as const,
    rejectQids: [
      "Q34104679", // Persistent solar influence… (wire fixture)
      "Q60276667", // Persistent Solar Prominences
      "Q10673071", // Sol (given name)
      "Q904031", // sol (Martian day)
      "Q181780", // colloid (aliases: sol, sols)
      "Q48440", // solar radius
      "Q108695872", // Solana (alias SOL)
      "Q14646", // Solaris (OS)
    ] as const,
    // Scout suggested rejectLabelRe
    rejectLabelRe:
      /\b(solar|climate|holocene|urticaria|martian|colloid|solana|solaris)\b/i,
    intent: "flatten_guard",
  },
  {
    seed: "Astra",
    queries: ["Astra"] as const,
    // Companion actor not on Wikidata — reject pharma/cars/weapons.
    allowedQids: [] as const,
    rejectQids: [
      "Q731938", // AstraZeneca (wire fixture)
      "Q1350", // Opel Astra
      "Q1109155", // Vauxhall Astra
      "Q1137096", // Astra (missile)
      "Q12155952", // Astra (Hinduism weapon)
    ] as const,
    // Scout suggested rejectLabelRe
    rejectLabelRe:
      /\b(zeneca|pharma|opel|vauxhall|missile|vaccine|azd\d+)\b/i,
    intent: "companion_ne_hf",
  },
  {
    seed: "Hugging Face",
    queries: ["Hugging Face"] as const,
    // Scout SoT: org + Hub (not Q118182434 SAS drift)
    allowedQids: ["Q108943604", "Q131939003"] as const,
    rejectQids: [
      "Q87583026", // 🤗 / HUGGING FACE emoji
    ] as const,
    rejectLabelRe: /\b(unicode\s+character|emoji)\b/i,
    intent: "org_grounding",
  },
  {
    seed: "METR",
    // Short "METR" → SI metre false friends; deepen query finds eval nonprofit.
    queries: ["Model Evaluation and Threat Research", "METR"] as const,
    // Scout SoT: Q135185153 only (not Q131899485 Inc. twin)
    allowedQids: ["Q135185153"] as const,
    rejectQids: [
      "Q11573", // metre
      "Q160236", // Metropolitan Museum of Art
    ] as const,
    // Scout suggested rejectLabelRe
    rejectLabelRe:
      /\b(metre|meter|museum|metro-goldwyn|poetry|tonne)\b/i,
    intent: "eval_lab",
  },
  // --- labs / security (Scout curated; rotate after core four) ---
  {
    seed: "OpenAI",
    queries: ["OpenAI"] as const,
    allowedQids: ["Q21708200"] as const,
    intent: "lab_rss",
  },
  {
    seed: "DeepMind",
    queries: ["DeepMind"] as const,
    allowedQids: ["Q15733006"] as const,
    intent: "lab_rss",
  },
  {
    seed: "Anthropic",
    queries: ["Anthropic"] as const,
    allowedQids: ["Q116758847"] as const,
    intent: "lab_rss",
  },
  {
    seed: "Meta AI",
    queries: ["Meta AI"] as const,
    allowedQids: ["Q112114913"] as const,
    intent: "lab_rss",
  },
  {
    seed: "Fox-IT",
    queries: ["Fox-IT"] as const,
    allowedQids: ["Q5476521"] as const,
    intent: "security_rss",
  },
  {
    seed: "Project Zero",
    queries: ["Project Zero"] as const,
    allowedQids: ["Q18859887"] as const,
    rejectQids: [
      "Q2323933", // Fatal Frame (alias Project Zero)
      "Q135025558",
      "Q586400",
    ] as const,
    rejectLabelRe: /\b(fatal frame|video game|wii)\b/i,
    intent: "security_rss",
  },
  {
    seed: "OWASP",
    queries: ["OWASP"] as const,
    allowedQids: ["Q379297"] as const,
    intent: "standards",
  },
  {
    seed: "NIST",
    queries: ["NIST"] as const,
    allowedQids: ["Q176691"] as const,
    intent: "standards",
  },
  {
    seed: "MITRE",
    queries: ["MITRE Corporation", "MITRE"] as const,
    allowedQids: ["Q627039", "Q104434300"] as const,
    intent: "security_rss",
  },
  {
    seed: "JFrog",
    queries: ["JFrog"] as const,
    allowedQids: ["Q98608948"] as const,
    rejectQids: [
      "Q107385338", // artifactory Python lib
    ] as const,
    intent: "org_grounding",
  },
  {
    seed: "Trail of Bits",
    queries: ["Trail of Bits"] as const,
    // Scout: 0 WD hits → unresolved; do not invent Q-id
    allowedQids: [] as const,
    intent: "unresolved_guard",
  },
  {
    seed: "stigmergy",
    queries: ["stigmergy"] as const,
    allowedQids: ["Q2141158"] as const,
    intent: "concept",
  },
] as const;

export function seedSlug(seed: string): string {
  return seed
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function findSeed(seed: string): WikidataDenySeed | undefined {
  const s = seed.trim().toLowerCase();
  return WIKIDATA_DENY_SEEDS.find((x) => x.seed.toLowerCase() === s);
}
