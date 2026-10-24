/**
 * Pass F Gmail news data module renderer (moved out of scripts/ingest.ts so it is testable).
 * Hotfix: an empty crawl renders `[]`, never `[\n,\n]` (a sparse array whose hole crashed member-info / rank:snapshot).
 * Intel plan 3 (privacy): the published snapshot keeps publisher, link and a short summary only — no From
 * address and no mail body text. The summary is `via <publisher>`; the snippet never leaves the box.
 */
import type { GmailNewsHit } from "./gmail-news";

export type GmailPublishable = Pick<GmailNewsHit, "id" | "title" | "link" | "published" | "publisher" | "qi" | "priority" | "tag">;

/** Short public summary: names the newsletter publisher only (no snippet, no address). */
export function gmailPublicSummary(publisher: string): string {
  const p = String(publisher ?? "").replace(/[^\w.\- ]/g, "").trim().slice(0, 60);
  return p ? `via ${p}` : "via newsletter";
}

export function renderGmailNewsTs(rows: readonly GmailPublishable[], stamp: string): string {
  const body = rows
    .map((r) => {
      return `  { id: ${JSON.stringify(r.id)}, title: ${JSON.stringify(r.title)}, link: ${JSON.stringify(r.link)}, published: ${JSON.stringify(r.published)}, summary: ${JSON.stringify(gmailPublicSummary(r.publisher))}, publisher: ${JSON.stringify(r.publisher)}, source: "gmail-news" as const, qi: ${r.qi}, priority: ${JSON.stringify(r.priority)} as const, tag: ${JSON.stringify(r.tag)} as const, briefEligible: false as const, pulse_only: true as const }`;
    })
    .join(",\n");
  return `/** Pass F Gmail news Pulse — generated/refreshed by bun run ingest. Pulse-only; never Brief. */
export type GmailNewsRow = {
  id: string;
  title: string;
  link: string;
  published: string;
  summary: string;
  publisher: string;
  source: "gmail-news";
  qi: number;
  priority: "P1" | "P2" | "P3";
  tag: "rest" | "rumor" | "companion" | "incident";
  briefEligible: false;
  pulse_only: true;
};

export const GMAIL_NEWS_AT = ${JSON.stringify(stamp)};

export const GMAIL_NEWS: GmailNewsRow[] = [
${body ? `${body},\n` : ""}];
`;
}
