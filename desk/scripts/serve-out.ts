#!/usr/bin/env bun
/**
 * B1 · local :3000 for the static export (next start cannot serve `output: "export"`).
 * Zero-dependency Bun static server over desk/out/. Files are read per request, so a rebuild
 * (which rewrites out/) is live without a restart; A1/A2 still kill :3000 and `bun run start`.
 *   bun scripts/serve-out.ts [--port 3000] [--host 0.0.0.0] [--root <dir>] [--base /NEXUS_SAGE_grok]
 * --root/--base: pages-publish.sh serves desk/out-pages under the Pages basePath for its pre-push font-check
 * (defaults stay desk/out at "/", i.e. :3000 is unchanged).
 */
import { existsSync, statSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";

const arg = (k: string, d: string) => {
  const i = process.argv.indexOf(k);
  return i > 0 && process.argv[i + 1] ? process.argv[i + 1]! : d;
};
const port = Number(arg("--port", process.env.PORT || "3000"));
const hostname = arg("--host", "0.0.0.0");
const root = resolve(arg("--root", resolve(import.meta.dir, "../out")));
const basePath = arg("--base", "").replace(/\/+$/, "");
if (!existsSync(join(root, "index.html"))) {
  console.error(`serve-out: ${root}/index.html missing — run \`bun run build\` first`);
  process.exit(1);
}

const TYPES: Record<string, string> = { ".html": "text/html; charset=utf-8", ".txt": "text/plain; charset=utf-8" };

function fileFor(pathname: string): string | null {
  const rel = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, "");
  const base = join(root, rel);
  if (!base.startsWith(root)) return null;
  for (const cand of [base, `${base}.html`, join(base, "index.html")]) {
    try {
      if (statSync(cand).isFile()) return cand;
    } catch {
      /* next */
    }
  }
  return null;
}

Bun.serve({
  port,
  hostname,
  fetch(req) {
    let { pathname } = new URL(req.url);
    if (basePath) {
      if (pathname === basePath) return Response.redirect(`${basePath}/`, 308);
      pathname = pathname.startsWith(`${basePath}/`) ? pathname.slice(basePath.length) : "\0";
    }
    const f = pathname === "\0" ? null : fileFor(pathname);
    if (!f) {
      const nf = join(root, "404.html");
      return new Response(existsSync(nf) ? Bun.file(nf) : "not found", { status: 404, headers: { "content-type": TYPES[".html"]! } });
    }
    const type = TYPES[extname(f)];
    const immutable = pathname.startsWith("/_next/static/");
    return new Response(Bun.file(f), {
      headers: {
        ...(type ? { "content-type": type } : {}),
        "cache-control": immutable ? "public, max-age=31536000, immutable" : "no-cache",
      },
    });
  },
});
console.log(`serve-out: http://${hostname}:${port}${basePath}/ ← ${root}`);
