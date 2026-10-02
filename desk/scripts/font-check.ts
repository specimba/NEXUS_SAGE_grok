#!/usr/bin/env bun
/**
 * Font gate (UX audit 2026-10-02 fix 0): headless Chrome over CDP, no npm deps.
 *   bun scripts/font-check.ts [url]      (default http://127.0.0.1:3000/)
 * Fails (exit 1) unless, after `await document.fonts.ready`:
 *  - the FIRST family of the computed font-family on <body> AND on a .sage-panel-header matches
 *    /Share[ _]Tech[ _]Mono|JetBrains[ _]Mono/ and is not a "Fallback" face (next/font vars must resolve at
 *    :root — they did not when the classes sat on <body> ⇒ Times New Roman);
 *  - document.fonts has ≥1 non-Fallback FontFace per font (spaced or hashed "__Share_Tech_Mono_ab12" names) with
 *    status "loaded". Fallback faces point at local Arial and read "loaded" even when the woff2 404s, and
 *    document.fonts.check() alone returns true even for fonts that never exist;
 *  - document.fonts.check() is true for both faces;
 *  - no font request returned 4xx/5xx or failed (a basePath font 404 silently falls back to serif).
 * Called by scripts/visual-check.mjs; works against the GitHub Pages URL too.
 */
import { spawn } from "node:child_process";
import { rmSync } from "node:fs";

const url = process.argv.slice(2).find((a) => /^https?:\/\//.test(a)) ?? process.env.SAGE_DESK_URL ?? "http://127.0.0.1:3000/";
const PORT = 9500 + Math.floor(Math.random() * 300);
const profile = `/tmp/font-check-${PORT}`;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
rmSync(profile, { recursive: true, force: true });
const chrome = spawn(
  process.env.CHROME_BIN || "google-chrome",
  ["--headless=new", "--no-sandbox", "--disable-gpu", `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, "--window-size=1280,800", "about:blank"],
  { stdio: "ignore" },
);
const done = (code: number) => {
  chrome.kill("SIGKILL");
  rmSync(profile, { recursive: true, force: true });
  process.exit(code);
};
let wsUrl = "";
for (let i = 0; i < 100 && !wsUrl; i++) {
  try {
    const list = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()) as { type: string; webSocketDebuggerUrl: string }[];
    wsUrl = list.find((t) => t.type === "page")?.webSocketDebuggerUrl ?? "";
  } catch {}
  if (!wsUrl) await sleep(200);
}
if (!wsUrl) {
  console.error("font-check FAIL\n - headless Chrome did not start (set CHROME_BIN)");
  done(1);
}
const ws = new WebSocket(wsUrl);
await new Promise((r, j) => ((ws.onopen = r), (ws.onerror = j)));
let id = 1;
const pending = new Map<number, (v: any) => void>();
const fontBad: string[] = [];
const reqs = new Map<string, { url: string; type: string }>();
ws.onmessage = (m) => {
  const msg = JSON.parse(String(m.data));
  if (msg.id && pending.has(msg.id)) (pending.get(msg.id)!(msg.result ?? { error: msg.error }), pending.delete(msg.id));
  else if (msg.method === "Network.requestWillBeSent") reqs.set(msg.params.requestId, { url: msg.params.request.url, type: msg.params.type });
  else if (msg.method === "Network.responseReceived" && msg.params.type === "Font" && msg.params.response.status >= 400)
    fontBad.push(`${msg.params.response.status} ${msg.params.response.url}`);
  else if (msg.method === "Network.loadingFailed" && msg.params.type === "Font" && !msg.params.canceled)
    fontBad.push(`${msg.params.errorText} ${reqs.get(msg.params.requestId)?.url ?? "?"}`);
};
const cdp = (method: string, params: Record<string, unknown> = {}) =>
  new Promise<any>((res) => {
    const n = id++;
    pending.set(n, res);
    ws.send(JSON.stringify({ id: n, method, params }));
  });
await cdp("Network.enable");
await cdp("Network.setCacheDisabled", { cacheDisabled: true });
await cdp("Page.enable");
await cdp("Page.navigate", { url });
for (let i = 0; i < 150; i++) {
  const r = await cdp("Runtime.evaluate", { expression: "document.readyState", returnByValue: true });
  if (r?.result?.value === "complete") break;
  await sleep(200);
}
const FONTS = [
  { name: "Share Tech Mono", re: "Share[ _]Tech[ _]Mono" },
  { name: "JetBrains Mono", re: "JetBrains[ _]Mono" },
] as const;
const probe = `(async () => {
  await document.fonts.ready;
  await new Promise((r) => setTimeout(r, 500));
  await document.fonts.ready;
  const ANY = /Share[ _]Tech[ _]Mono|JetBrains[ _]Mono/;
  const fonts = ${JSON.stringify(FONTS)};
  const norm = (s) => String(s).replace(/["']/g, "").trim();
  const ok = (fam) => !!fam && ANY.test(fam) && !/Fallback/i.test(fam);
  const stack = (el) => (el ? getComputedStyle(el).fontFamily : null);
  const first = (el) => (el ? norm(stack(el).split(",")[0]) : null);
  const hdr = document.querySelector(".sage-panel-header");
  const faces = [...document.fonts].map((f) => ({ family: norm(f.family), status: f.status }));
  const real = (re) => faces.filter((f) => new RegExp(re).test(f.family) && !/Fallback/i.test(f.family));
  return {
    body: first(document.body), bodyOk: ok(first(document.body)), bodyFull: stack(document.body),
    header: first(hdr), headerOk: ok(first(hdr)), headerFull: stack(hdr),
    loaded: Object.fromEntries(fonts.map((f) => [f.name, real(f.re).filter((x) => x.status === "loaded").length])),
    families: Object.fromEntries(fonts.map((f) => [f.name, [...new Set(real(f.re).map((x) => x.family))]])),
    check: Object.fromEntries(fonts.map((f) => {
      const fam = real(f.re)[0]?.family ?? f.name;
      return [f.name, document.fonts.check('16px "' + fam + '"')];
    })),
  };
})()`;
const r = await cdp("Runtime.evaluate", { expression: probe, awaitPromise: true, returnByValue: true });
const v = r?.result?.value;
const errors: string[] = [];
if (!v) errors.push(`probe failed: ${JSON.stringify(r?.exceptionDetails ?? r?.error ?? r).slice(0, 200)}`);
else {
  if (!v.bodyOk) errors.push(`body font-family stack starts with "${v.body}" (${v.bodyFull}) — want Share Tech Mono | JetBrains Mono, not Fallback`);
  if (v.header == null) errors.push("no .sage-panel-header on the page");
  else if (!v.headerOk) errors.push(`.sage-panel-header font-family stack starts with "${v.header}" (${v.headerFull})`);
  for (const f of FONTS) {
    if (!v.loaded[f.name]) errors.push(`no non-Fallback FontFace matching ${f.re} with status loaded (faces: ${JSON.stringify(v.families[f.name])})`);
    if (!v.check[f.name]) errors.push(`document.fonts.check("${f.name}") is false`);
  }
}
for (const b of fontBad) errors.push(`font request failed: ${b}`);
if (errors.length) {
  console.error(`font-check FAIL (${url})`);
  for (const e of errors) console.error(" -", e);
  done(1);
}
console.log(`font-check OK (${url}) body="${v.body}" header="${v.header}" loaded=${JSON.stringify(v.loaded)} check=${JSON.stringify(v.check)}`);
done(0);
