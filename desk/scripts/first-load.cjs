#!/usr/bin/env node
// PASS-Q1 gate: First Load JS for "/" exactly as next build prints it (gzip-size over app-build-manifest /page), ≤ 185 000 B.
//   node scripts/first-load.cjs [.next-pages]
const { resolve } = require("node:path");
const gz = require("next/dist/compiled/gzip-size");
const dir = resolve(__dirname, "..", process.argv[2] || ".next-pages");
const am = require(resolve(dir, "app-build-manifest.json"));
const CAP = Number(process.env.FIRST_LOAD_CAP || 185000);
(async () => {
  let s = 0;
  for (const f of [...new Set(am.pages["/page"])].filter((f) => f.endsWith(".js"))) s += await gz.file(resolve(dir, f));
  console.log(`first-load / = ${s} B (cap ${CAP}, headroom ${CAP - s} B)`);
  if (s > CAP) process.exit(1);
})();
