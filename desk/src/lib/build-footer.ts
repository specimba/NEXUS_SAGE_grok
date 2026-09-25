/**
 * B2 build stamp footer (UX-LIVE-SITE §1 wins on format): `build <short sha> · deployed 14:22 · crawl 14:16 UTC+3`.
 * All clock times Istanbul (Intl). Short sha links to the source commit; the crawl segment links to the crawl commit.
 */
import { IST_LABEL, istHHMM } from "@/lib/ist-time";

export type FooterInput = { commit: string; crawlCommit: string; builtAt: string; crawlAt: string; repoUrl: string };
export type FooterStamp = {
  short: string;
  crawlShort: string;
  deployed: string;
  crawl: string;
  text: string;
  commitHref: string | null;
  crawlHref: string | null;
};

export function footerStamp(i: FooterInput): FooterStamp {
  const short = i.commit ? i.commit.slice(0, 7) : "nogit";
  const crawlShort = i.crawlCommit ? i.crawlCommit.slice(0, 7) : "";
  const deployed = i.builtAt ? istHHMM(i.builtAt) : "—";
  const crawl = i.crawlAt ? istHHMM(i.crawlAt) : "—";
  const repo = (i.repoUrl || "").replace(/\/+$/, "");
  const ok = (sha: string) => /^[0-9a-f]{7,40}$/i.test(sha);
  return {
    short,
    crawlShort,
    deployed,
    crawl,
    text: `build ${short} · deployed ${deployed} · crawl ${crawl} ${IST_LABEL}`,
    commitHref: repo && ok(i.commit) ? `${repo}/commit/${i.commit}` : null,
    crawlHref: repo && ok(i.crawlCommit) ? `${repo}/commit/${i.crawlCommit}` : null,
  };
}
