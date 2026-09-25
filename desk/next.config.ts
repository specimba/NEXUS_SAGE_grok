import { resolve } from "node:path";
import type { NextConfig } from "next";
import { PHASE_PRODUCTION_BUILD } from "next/constants";
// Shared hard gate (also scripts/check-current.mjs, run in prebuild): repo-only, fails closed.
import { checkCurrent } from "./scripts/lib/current-gate.mjs";

/**
 * B1 static export (Cloudflare Pages): `next build` writes desk/out/. Build-time stamps come from
 * src/data/build-stamp.ts (scripts/build-stamp.mjs, prebuild); nothing is read at request time.
 */
export default function config(phase: string): NextConfig {
  if (phase === PHASE_PRODUCTION_BUILD) {
    // Defence in depth: a bare `next build` (skipping prebuild) still refuses bad data.
    const gate = checkCurrent({ deskRoot: resolve(__dirname) });
    if (!gate.ok) throw new Error(`SAGE HARD GATE (build): ${gate.errors.join(" · ")}`);
  }
  return {
    output: "export",
    // Static export has no image optimizer; Pulse cards may hotlink X/CDN media.
    images: { unoptimized: true },
  };
}
