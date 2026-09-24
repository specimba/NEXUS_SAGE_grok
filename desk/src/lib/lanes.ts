/** Desk lane tabs (Beat 6). Exactly one tab is active — always the current lane. */
export const LANES = ["brief", "pulse", "digest", "papers", "voice", "governance"] as const;
export type Lane = (typeof LANES)[number];

export type LaneTab = { id: Lane; prefix: string; active: boolean; index: number };

/** `ready=false` (SSR / before hash read) ⇒ no tab active, so a stale default never paints filled. */
export function laneTabs(active: Lane, ready = true): LaneTab[] {
  return LANES.map((id, i) => ({
    id,
    index: i + 1,
    prefix: `[${String(i + 1).padStart(2, "0")}]`,
    active: ready && id === active,
  }));
}

export function isLane(raw: string): raw is Lane {
  return (LANES as readonly string[]).includes(raw);
}
