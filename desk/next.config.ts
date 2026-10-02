import { resolve } from "node:path";
import type { NextConfig } from "next";
import { PHASE_PRODUCTION_BUILD } from "next/constants";
// Shared hard gate (also scripts/check-current.mjs, run in prebuild): repo-only, fails closed.
import { checkCurrent } from "./scripts/lib/current-gate.mjs";

/**
 * B1 static export (Cloudflare Pages): `next build` writes desk/out/. Build-time stamps come from
 * src/data/build-stamp.ts (scripts/build-stamp.mjs, prebuild); nothing is read at request time.
 */
/** GitHub Pages project site (public): https://specimba.github.io/NEXUS_SAGE_grok/ */
const PAGES_BASE_PATH = "/NEXUS_SAGE_grok";
const PAGES_SITE_URL = `https://specimba.github.io${PAGES_BASE_PATH}`;
/** :3000 static server (bun scripts/serve-out.ts). */
const LOCAL_SITE_URL = "http://localhost:3000";

export default function config(phase: string): NextConfig {
  if (phase === PHASE_PRODUCTION_BUILD) {
    // Defence in depth: a bare `next build` (skipping prebuild) still refuses bad data.
    const gate = checkCurrent({ deskRoot: resolve(__dirname) });
    if (!gate.ok) throw new Error(`SAGE HARD GATE (build): ${gate.errors.join(" · ")}`);
  }
  // GitHub Pages (PAGES=1): same static export under /NEXUS_SAGE_grok into desk/out-pages/ (distDir doubles as the
  // export dir for output:"export"). The default build stays at "/" in desk/out/ for :3000.
  // Absolute OG/canonical URLs come from SAGE_SITE_URL (never set metadataBase — together with basePath it doubles the path).
  const pages = process.env.PAGES === "1";
  return {
    output: "export",
    ...(pages ? { basePath: PAGES_BASE_PATH, distDir: "out-pages" } : {}),
    env: {
      SAGE_BASE_PATH: pages ? PAGES_BASE_PATH : "",
      SAGE_SITE_URL: pages ? PAGES_SITE_URL : (process.env.SAGE_SITE_URL || LOCAL_SITE_URL),
    },
    // Static export has no image optimizer; Pulse cards may hotlink X/CDN media.
    images: { unoptimized: true },
  };
}
