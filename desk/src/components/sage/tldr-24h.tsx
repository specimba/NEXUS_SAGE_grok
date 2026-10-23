/**
 * PASS-F2.2 — Past 24 hours (server component: rendered at build into the static HTML, no client JS).
 * 5–7 Wire-gated stories from src/data/tldr-24h.ts (extractive), existing Brief Wire row styles, no new CSS file.
 * Age is the story age at the crawl (deterministic, never stale baked "now"); < 3 stories ⇒ "quiet day", never padded.
 */
import { TLDR_24H } from "@/data/tldr-24h";
import { compactAge } from "@/lib/pulse-v5";
import { plainHeadline } from "@/lib/plain-headline";

export function Tldr24() {
  const t = TLDR_24H;
  const crawl = Date.parse(t.crawl_at);
  return (
    <section className="brief-wire sage-panel sage-ticks mb-2" aria-label="Past 24 hours" data-tldr={t.date}>
      <div className="brief-wire-head">
        <span>Past 24 hours</span>
        {t.quiet ? <span className="brief-wire-prev">quiet day</span> : null}
      </div>
      <ol className="brief-wire-list">
        {t.bullets.map((b) => (
          <li key={b.id} className="brief-wire-row" data-tldr-row>
            <span className="brief-wire-mark">·</span>
            <span className="pulse-v5-age tabular-nums" data-age-at={b.at}>{compactAge(b.at, crawl)}</span>
            <a className="brief-wire-headline focus-phosphor" data-row-clamp="wire" href={b.url} target="_blank" rel="noreferrer">
              {plainHeadline(b.title)}
            </a>
            <span className="brief-wire-src">
              <span className="sage-src-chip sage-src-chip-multi tabular-nums">{b.sources} SRC</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
