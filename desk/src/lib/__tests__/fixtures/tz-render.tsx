/**
 * Renders the desk to static HTML exactly as `next build` prerenders it (no effects ⇒ useNow() = null)
 * and prints the clock times it contains. Spawned by tz-render.test.ts under different TZ values.
 */
import { renderToString } from "react-dom/server";
import { Desk, PausesCtx, Pulse } from "@/components/sage/desk";

const pauses = { openalex: { until: "2026-09-26T00:00:00Z", reason: "HTTP 429" } };
// Desk = the static page (Brief lane); Pulse is a client lane switch — render it too for its AGE column + health strip.
const html =
  renderToString(
    <Desk
      buildId="test-build"
      builtAt="2026-09-25T12:58:33Z"
      pauses={pauses}
      commit="abcdef1234567890abcdef1234567890abcdef12"
      crawlCommit="0dffa0c2f1e92cb00260f83f213c7a729f36c5de"
      repoUrl="https://github.com/specimba/NEXUS_SAGE_grok"
    />,
  ) +
  renderToString(
    <PausesCtx.Provider value={pauses}>
      <Pulse />
    </PausesCtx.Provider>,
  );
const ages = [...html.matchAll(/data-age-at="([^"]+)"[^>]*>([^<]*)</g)].map((m) => ({ at: m[1], text: m[2] }));
const paused = /PAUSED · until (?:<!-- -->)?(\d\d:\d\d)/.exec(html)?.[1] ?? null;
const built = /built (?:<!-- -->)?([\d-]+ \d\d:\d\d) UTC\+3/.exec(html)?.[1] ?? null;
const stamp = /data-sage-stamp="([^"]+)"/.exec(html)?.[1] ?? null;
const stampLinks = [...html.matchAll(/class="desk-build-stamp-link" href="([^"]+)"/g)].map((m) => m[1]);
// Visible text + titles only (data-* attributes are machine ISO stamps, never displayed).
const shown = html.replace(/ data-[\w-]+="[^"]*"/g, "");
const hasZ = /\d\d:\d\d(?::\d\d)?Z\b/.test(shown);
const hasRelAge = html.includes('data-age-rel="1"');
console.log(JSON.stringify({ tz: process.env.TZ, hostHour: new Date("2026-09-25T00:00:00Z").getHours(), ages, paused, built, stamp, stampLinks, hasZ, hasRelAge, html }));
