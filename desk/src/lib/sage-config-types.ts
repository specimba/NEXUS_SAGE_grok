/** PASS-C2 config types — type-only, browser-safe (the Setup view chunk imports these; never node modules). */
export type SourceId =
  | "hn" | "hf_papers" | "lab_rss" | "sec_rss" | "gnews" | "github"
  | "openalex" | "crossref" | "arxiv" | "wikidata" | "gmail" | "x_taste"
  | "analyst_rss";

export type SageConfig = {
  schema: 1;
  sources: {
    hn: { on: boolean; cap: number };
    hf_papers: { on: boolean; cap: number };
    lab_rss: { on: boolean; cap_per_feed: number; timeout_s: number; feeds: string[] };
    sec_rss: { on: boolean; cap_per_feed: number; feeds: string[] };
    gnews: { on: boolean; cap: number };
    github: { on: boolean; cap: number };
    openalex: { on: boolean };
    crossref: { on: boolean };
    arxiv: { on: boolean };
    wikidata: { on: boolean };
    gmail: { on: boolean; fetch_cap: number; emit_cap: number; window_days: number };
    x_taste: { on: boolean; visible_cap: number };
    /** PASS-S1.1 analyst feeds (ANL) — registry ids only. */
    analyst_rss: { on: boolean; cap_per_feed: number; timeout_s: number; feeds: string[] };
  };
  keywords: { ai_terms: string[]; hn_sweep: string[]; gmail_seed: string[]; politics_deny: string[]; hn_title_queries: string[] };
  taste: { weight: number; max: number };
};
