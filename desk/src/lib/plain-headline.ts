/**
 * PASS-F2.3a — plain headline: the publisher's own headline, cleaned (no rewording). Pure; used at crawl / build
 * time (rank-snapshot Wire + lead modules, TL;DR), never in the client bundle.
 *   decode HTML entities → collapse whitespace → strip one trailing site suffix (` | Site`, ` - Publisher`, ` — Publisher`).
 * A suffix is only stripped when it is short (≤ 40 chars, ≤ 5 words) and the headline left is ≥ 3 words, so a real
 * dash inside a headline ("GPT-5 - what changed and why it matters for agents") is kept.
 */
const NAMED: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", ndash: "–", mdash: "—", hellip: "…", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“" };

export function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === "#") {
      const n = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : m;
    }
    return NAMED[e.toLowerCase()] ?? m;
  });
}

const SUFFIX = /\s+(?:\||-|–|—)\s+([^|–—]{1,40})$/;

export function plainHeadline(title: string): string {
  let t = decodeEntities(String(title ?? "")).replace(/\s+/g, " ").trim();
  const m = SUFFIX.exec(t);
  if (m) {
    const head = t.slice(0, m.index).trim();
    const sep = t.slice(m.index).trim()[0];
    const words = m[1]!.trim().split(" ").length;
    if (head.split(" ").length >= 3 && (sep === "|" || words <= 5)) t = head;
  }
  return t;
}
