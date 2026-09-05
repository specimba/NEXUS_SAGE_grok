/** Watchlist seeds from product spec — weight ≥ 3 get per-handle ingest. */

export type WatchHandle = {
  handle: string;
  weight: number;
  notes?: string;
};

export const WATCHLIST: WatchHandle[] = [
  { handle: "OpenAI", weight: 5, notes: "lab primary" },
  { handle: "AnthropicAI", weight: 5, notes: "lab primary" },
  { handle: "sama", weight: 4 },
  { handle: "ilyasut", weight: 4 },
  { handle: "ClementDelangue", weight: 4, notes: "HF / openweights" },
  { handle: "AndrewCurran_", weight: 4, notes: "wire / calendar" },
  { handle: "steph_palazzolo", weight: 4, notes: "Astra / CoT depth" },
  { handle: "testingcatalog", weight: 3 },
  { handle: "dair_ai", weight: 4, notes: "papers" },
  { handle: "dwarkesh_sp", weight: 3 },
  { handle: "ajeya_cotra", weight: 3 },
  { handle: "trailofbits", weight: 4, notes: "cyber" },
  { handle: "karpathy", weight: 3 },
  { handle: "ylecun", weight: 3 },
  { handle: "fchollet", weight: 3 },
  { handle: "DrJimFan", weight: 3 },
  { handle: "elder_plinius", weight: 3 },
];

export const TAG_SEEDS = [
  "agents",
  "safety",
  "memory",
  "openweights",
  "papers",
  "cyber",
  "capital",
] as const;

export const TAG_BLOCK = [
  "ai",
  "art",
  "anime",
  "hotwoman",
  "furry",
  "furryart",
  "kemono",
  "aiart",
] as const;

export function watchWeight(handle: string): number {
  const h = handle.replace(/^@/, "").toLowerCase();
  const hit = WATCHLIST.find((w) => w.handle.toLowerCase() === h);
  return hit?.weight ?? 1;
}

export function isBlockedTag(tag: string): boolean {
  const t = tag.replace(/^#/, "").toLowerCase();
  return (TAG_BLOCK as readonly string[]).includes(t);
}

export function ingestHandles(minWeight = 3): WatchHandle[] {
  return WATCHLIST.filter((w) => w.weight >= minWeight);
}
