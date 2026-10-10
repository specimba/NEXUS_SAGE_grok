/** A4 soft-fail meters — snapshot from ingest (Pass F Gmail · Pass E X-session). Pulse/rail only; never Brief. */
export type SoftFailState = "ok" | "soft" | "deny";

export type SoftFailChip = {
  id: string;
  label: string;
  state: SoftFailState;
  detail: string;
};

export type SoftFailMeters = {
  stamped_at: string;
  briefEligible: false;
  providers: SoftFailChip[];
  aggregate: string[];
  deny: string[];
  soft_count: number;
};

export const SOFT_FAIL_METERS: SoftFailMeters = {
  stamped_at: "2026-10-10T08:21:16Z",
  briefEligible: false,
  providers: [
    { id: "hn", label: "HN", state: "ok", detail: "ok" },
    { id: "hf", label: "HF", state: "ok", detail: "ok" },
    { id: "rss", label: "RSS", state: "ok", detail: "ok" },
    { id: "gnews", label: "GNews", state: "ok", detail: "landed" },
    { id: "gmail", label: "Gmail", state: "soft" as SoftFailState, detail: "box-only" },
    { id: "openalex", label: "OpenAlex", state: "ok", detail: "ok" },
    { id: "crossref", label: "Crossref", state: "ok", detail: "ok" },
    { id: "github", label: "GitHub", state: "ok", detail: "ok" },
    { id: "x_session", label: "X-session", state: "soft" as SoftFailState, detail: "taste stale" },
  ],
  aggregate: ["Gmail box-only","X-session taste stale"],
  deny: ["paid X", "Bluesky", "scrape farms"],
  soft_count: 2,
} as const;
