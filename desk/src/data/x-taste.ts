/** Snapshot of artifacts/sage/x-taste-last.json — X-session taste shelf. Pulse only; never Brief lead. */
export type XTasteItem = {
  id: string;
  text: string;
  url?: string;
  handle?: string;
  surface: "bookmark" | "like" | "feed";
  at?: string;
  keyword?: string;
};

export type XTasteSnap = {
  captured_at: string;
  stamped_at?: string;
  briefEligible: false;
  pulseLeadEligible: false;
  paidApi: false;
  items: XTasteItem[];
  skipped: boolean;
  soft_fail: boolean;
  soft_fail_reason: string | null;
  land: string;
  counts: { seen: number; kept: number };
};

export const X_TASTE: XTasteSnap = {
  captured_at: "2026-09-07T07:02:00Z",
  stamped_at: "2026-09-07T07:07:12Z",
  briefEligible: false,
  pulseLeadEligible: false,
  paidApi: false,
  items: [],
  skipped: true,
  soft_fail: true,
  soft_fail_reason: "login_wall",
  land: "HOLD",
  counts: { seen: 0, kept: 0 },
} as const;
