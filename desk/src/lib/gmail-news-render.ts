/**
 * Pass F Gmail news data module renderer (moved out of scripts/ingest.ts so it is testable).
 * Hotfix: an empty crawl renders `[]`, never `[\n,\n]` (a sparse array whose hole crashed member-info / rank:snapshot).
 */
import type { GmailNewsHit } from "./gmail-news";

export function renderGmailNewsTs(rows: GmailNewsHit[], stamp: string): string {
  const body = rows
    .map((r) => {
      return `  { id: ${JSON.stringify(r.id)}, title: ${JSON.stringify(r.title)}, link: ${JSON.stringify(r.link)}, published: ${JSON.stringify(r.published)}, summary: ${JSON.stringify(r.summary)}, publisher: ${JSON.stringify(r.publisher)}, from: ${JSON.stringify(r.from)}, source: "gmail-news" as const, qi: ${r.qi}, priority: ${JSON.stringify(r.priority)} as const, tag: ${JSON.stringify(r.tag)} as const, briefEligible: false as const, pulse_only: true as const }`;
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
  from: string;
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
