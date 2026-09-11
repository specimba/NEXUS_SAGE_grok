/** A4 soft-fail meters — snapshot from artifacts/sage/ingest-last.json. Pulse/rail only; never Brief. */
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

/**
 * Stamp-truth from ingest-last @ 2026-09-11T09:29:29Z + x_session_taste.
 * Only real soft_fails enter aggregate — never invent.
 */
export const SOFT_FAIL_METERS: SoftFailMeters = {
  stamped_at: "2026-09-11T09:29:29Z",
  briefEligible: false,
  providers: [
    { id: "hn", label: "HN", state: "ok", detail: "ok" },
    { id: "hf", label: "HF", state: "ok", detail: "ok" },
    { id: "rss", label: "RSS", state: "ok", detail: "ok" },
    { id: "gnews", label: "GNews", state: "ok", detail: "landed" },
    { id: "openalex", label: "OpenAlex", state: "soft", detail: "HTTP 429" },
    { id: "crossref", label: "Crossref", state: "ok", detail: "ok" },
    { id: "github", label: "GitHub", state: "ok", detail: "ok" },
    { id: "x_session", label: "X-session", state: "ok", detail: "landed" },
  ],
  aggregate: ["OpenAlex 429"],
  deny: ["paid X", "Bluesky", "scrape farms"],
  soft_count: 1,
} as const;
