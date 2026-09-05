/**
 * X / Brief hygiene — rumor, flatten (Sol≠Astra), banned nouns.
 * Exact names restored from product spec test list.
 */

export const BANNED_NOUNS = [
  "civilizations",
  "announced deal",
  "missed-dna",
  "missed dna",
] as const;

export const RUMOR_PHRASES = [
  "available soon",
  "36 hours",
  "tomorrow morning",
  "coming thursday",
  "rolled out coming",
] as const;

export type PostClass =
  | "incident"
  | "companion"
  | "rest"
  | "rumor"
  | "drop"
  | "flatten";

export type ClassifyInput = {
  text: string;
  handle?: string;
  take?: string;
  /** Optional explicit file hint from curator */
  file?: "hf-incident" | "astra" | "split" | "other";
};

export type ClassifyResult = {
  class: PostClass;
  rumor: boolean;
  flatten: boolean;
  banned: string[];
  file: "hf-incident" | "astra" | "split" | "other";
  reasons: string[];
};

function lower(s: string): string {
  return s.toLowerCase();
}

export function bannedNounsIn(text: string): string[] {
  const t = lower(text);
  return BANNED_NOUNS.filter((n) => t.includes(n));
}

export function isRumorCopy(text: string): boolean {
  const t = lower(text);
  if (RUMOR_PHRASES.some((p) => t.includes(p))) return true;
  // Bloomberg wire dollar figures without official confirmation
  if (/\bbloomberg\b/.test(t) && /\$[\d.,]+\s*(b|bn|billion|m|million)?/i.test(text)) {
    return true;
  }
  // Bloomberg "sources say" / unverified pause language — rumor tag (not Brief)
  if (/\bbloomberg\b/.test(t) && /\b(sources?\s+say|reportedly|pausing)\b/.test(t)) {
    return true;
  }
  return false;
}

/** Sol ≠ Astra. Flatten = fail when both attributed as same attacker / same file. */
export function detectFlatten(text: string): boolean {
  const t = lower(text);
  const hasSol = /\b(persistent-?sol|sol)\b/.test(t) && !/\bsolar\b/.test(t);
  const hasAstra = /\bastra\b/.test(t);
  const hasHf =
    /\b(hugging\s*face|hf\b|artifactory|metr)\b/.test(t) ||
    /\bproduction\s+(swarm|rce|breach)\b/.test(t);
  const conflates =
    /\b(sol\s*(and|\/|&)\s*astra|astra\s*(and|\/|&)\s*sol|astra\s+did\s+hf|astra\s+hit\s+hugging|same\s+attacker)\b/.test(
      t,
    );
  // MIT stigmergy / Buehler as breach proof
  const stigmergyAsBreach =
    /\b(stigmergy|buehler)\b/.test(t) &&
    /\b(breach|hf\s+swarm|artifactory|incident)\b/.test(t) &&
    !/\bsplit\b/.test(t);
  if (stigmergyAsBreach) return true;
  if (conflates) return true;
  // Sol equated to Astra (Sol≠Astra lock)
  if (/\b(sol\s*(?:=|is|equals|==)\s*astra|astra\s*(?:=|is|equals|==)\s*sol)\b/.test(t)) {
    return true;
  }
  // Astra attributed as HF attacker / compromised HF → DENY flatten
  // (require Astra near the attack verb so "Sol did HF. Astra later…" stays ok)
  if (
    /\bastra\b[^\n.]{0,80}\b(compromised|attacked|breached|attacker)\b[^\n.]{0,60}\b(hugging\s*face|hf\b)/.test(
      t,
    ) ||
    /\bastra\b[^\n.]{0,40}\b(did|hit)\s+(the\s+)?(hf\b|hugging)/.test(t)
  ) {
    return true;
  }
  // Both Sol + Astra + HF without separation language
  if (hasSol && hasAstra && hasHf) {
    const separates =
      /\b(later|companion|not\s+the\s+hf|sol\s*≠|sol\s*!=|persistent-sol\s+did\s+hf)/.test(t);
    if (!separates) return true;
  }
  return false;
}

export function classifyPost(input: ClassifyInput): ClassifyResult {
  const blob = `${input.text} ${input.take ?? ""}`;
  const banned = bannedNounsIn(blob);
  const flatten = detectFlatten(blob);
  const rumor = isRumorCopy(blob);
  const t = lower(blob);
  const handle = (input.handle ?? "").replace(/^@/, "").toLowerCase();
  const reasons: string[] = [];

  if (flatten) {
    reasons.push("flatten: Sol≠Astra or stigmergy-as-breach");
    return { class: "flatten", rumor, flatten: true, banned, file: "split", reasons };
  }

  // Official OpenAI Astra posts are companion, not rumor — even with ship language nearby
  const officialAstra =
    (handle === "openai" || handle === "sama") && /\bastra\b/.test(t);
  if (officialAstra) {
    reasons.push("official Astra → companion, not rumor");
    return {
      class: "companion",
      rumor: false,
      flatten: false,
      banned,
      file: "astra",
      reasons,
    };
  }

  // Sol + HF on incident file
  const solHf =
    /\b(persistent-?sol)\b/.test(t) &&
    /\b(hugging\s*face|hf\b|artifactory|production)\b/.test(t);
  if (solHf || input.file === "hf-incident") {
    if (solHf) reasons.push("Persistent-Sol + HF → incident file");
    return {
      class: "incident",
      rumor: false,
      flatten: false,
      banned,
      file: "hf-incident",
      reasons,
    };
  }

  if (rumor) {
    reasons.push("rumor phrase or Bloomberg wire dollars");
    return {
      class: "rumor",
      rumor: true,
      flatten: false,
      banned,
      file: input.file ?? "other",
      reasons,
    };
  }

  if (/\bastra\b/.test(t) || input.file === "astra") {
    reasons.push("Astra companion file");
    return {
      class: "companion",
      rumor: false,
      flatten: false,
      banned,
      file: "astra",
      reasons,
    };
  }

  if (/\b(stigmergy|buehler)\b/.test(t) || input.file === "split") {
    reasons.push("stigmergy/split → drop");
    return { class: "drop", rumor: false, flatten: false, banned, file: "split", reasons };
  }

  if (banned.length) {
    reasons.push(`banned nouns: ${banned.join(", ")}`);
    return { class: "drop", rumor: false, flatten: false, banned, file: "other", reasons };
  }

  reasons.push("default rest");
  return {
    class: "rest",
    rumor: false,
    flatten: false,
    banned,
    file: input.file ?? "other",
    reasons,
  };
}
