/**
 * B1 proof — static export + client-side relative times.
 *   bun scripts/b1-clock-proof.ts [url] [--shot after.png] [--shot-before before.png] [--shot-paused paused.png]
 * 1. Static HTML (curl): AGE cells hold absolute Istanbul "HH:MM", no relative values.
 * 2. Real Chrome load: after mount AGE swaps to relative; console captured (zero hydration warnings).
 * 3. Clock shifted +4h (Date patched before any page script) → reload: AGE advanced by 4h, console clean.
 */
import { spawn } from "node:child_process";
import { rmSync } from "node:fs";
import { compactAge } from "../src/lib/pulse-v5";

const URL_ = process.argv.find((a) => a.startsWith("http")) ?? "http://127.0.0.1:3000/";
const argOf = (f: string) => (process.argv.includes(f) ? process.argv[process.argv.indexOf(f) + 1] : null);
const SHOT = argOf("--shot");
const SHOT_BEFORE = argOf("--shot-before");
const SHOT_PAUSED = argOf("--shot-paused");
const PORT = 9400 + Math.floor(Math.random() * 400);
const SHIFT = 4 * 3_600_000;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const staticHtml = await (await fetch(URL_)).text();
const staticAges = [...staticHtml.matchAll(/data-age-at="([^"]+)"[^>]*>([^<]*)</g)].map((m) => ({ at: m[1], text: m[2] }));

const profile = `/tmp/b1-clock-proof-${PORT}`;
rmSync(profile, { recursive: true, force: true });
const chrome = spawn("google-chrome", ["--headless=new", "--no-sandbox", "--disable-gpu", "--hide-scrollbars", `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, "--window-size=1280,800", "about:blank"], { stdio: "ignore" });
async function targetWs(): Promise<string> {
  for (let i = 0; i < 60; i++) {
    try {
      const list = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()) as { type: string; webSocketDebuggerUrl: string }[];
      const page = list.find((t) => t.type === "page");
      if (page) return page.webSocketDebuggerUrl;
    } catch {}
    await sleep(200);
  }
  throw new Error("chrome devtools never came up");
}
const ws = new WebSocket(await targetWs());
await new Promise((r, j) => ((ws.onopen = r), (ws.onerror = j)));
let nextId = 1;
const pending = new Map<number, { res: (v: any) => void; rej: (e: any) => void }>();
let phase = "load";
const log: { phase: string; kind: string; level: string; text: string }[] = [];
ws.onmessage = (m) => {
  const msg = JSON.parse(String(m.data));
  if (msg.id && pending.has(msg.id)) {
    const p = pending.get(msg.id)!;
    pending.delete(msg.id);
    msg.error ? p.rej(new Error(msg.error.message)) : p.res(msg.result);
  } else if (msg.method === "Runtime.consoleAPICalled") {
    const text = msg.params.args.map((a: any) => a.value ?? a.description ?? a.type).join(" ");
    log.push({ phase, kind: "console", level: msg.params.type, text });
  } else if (msg.method === "Runtime.exceptionThrown") {
    const d = msg.params.exceptionDetails;
    log.push({ phase, kind: "exception", level: "error", text: d.exception?.description ?? d.text });
  } else if (msg.method === "Log.entryAdded") {
    const e = msg.params.entry;
    log.push({ phase, kind: `log:${e.source}`, level: e.level, text: `${e.text}${e.url ? ` (${e.url})` : ""}` });
  }
};
const cdp = (method: string, params: Record<string, unknown> = {}): Promise<any> => {
  const id = nextId++;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((res, rej) => pending.set(id, { res, rej }));
};
async function ev<T>(expr: string): Promise<T> {
  const r = await cdp("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(`eval failed: ${expr}`);
  return r.result.value as T;
}
async function waitFor(expr: string, ms = 8000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (await ev<boolean>(`!!(${expr})`)) return true;
    await sleep(80);
  }
  return false;
}
const snapshot = () =>
  ev<{ now: number; ages: { at: string; text: string; rel: boolean }[]; chip: string; state: string | null; ticker: string }>(`(() => ({
    now: Date.now(),
    ages: [...document.querySelectorAll('[data-age-at]')].slice(0, 6).map((e) => ({ at: e.getAttribute('data-age-at'), text: e.textContent, rel: e.hasAttribute('data-age-rel') })),
    chip: document.querySelector('[data-crawl-state]')?.textContent ?? document.querySelector('.desk-chip[role=status]')?.textContent ?? '',
    state: document.querySelector('[data-crawl-state]')?.getAttribute('data-crawl-state') ?? null,
    ticker: [...document.querySelectorAll('.desk-chip')].map((e) => e.textContent).join(' | '),
  }))()`);

await cdp("Runtime.enable");
await cdp("Log.enable");
await cdp("Page.enable");
await cdp("Page.navigate", { url: URL_ });
await waitFor("document.querySelector('[data-age-rel]')");
await sleep(1500);
const before = await snapshot();
const shoot = async (path: string | null) => {
  if (!path) return;
  const png = await cdp("Page.captureScreenshot", { format: "png" });
  await Bun.write(path, Buffer.from(png.data, "base64"));
};
await shoot(SHOT_BEFORE);
// PAUSED cell lives in the Pulse lane health strip (after mount, re-checked against the browser clock).
let paused: { text: string; state: string; color: string; deco: string } | null = null;
await ev(`[...document.querySelectorAll('button,a,[role=tab]')].find((e) => /pulse/i.test(e.textContent || ''))?.click()`);
if (await waitFor("document.querySelector('.pulse-v5-health-cell[data-state=paused]')")) {
  paused = await ev(`(() => { const c = document.querySelector('.pulse-v5-health-cell[data-state=paused]'); c.scrollIntoView({ block: 'center' });
    const cs = getComputedStyle(c); return { text: c.textContent, state: c.getAttribute('data-state'), color: cs.color, deco: cs.textDecorationLine }; })()`);
  await sleep(300);
  await shoot(SHOT_PAUSED);
}
await ev(`[...document.querySelectorAll('button,a,[role=tab]')].find((e) => /brief/i.test(e.textContent || ''))?.click()`);
await sleep(300);

phase = "clock+4h";
await cdp("Page.addScriptToEvaluateOnNewDocument", {
  source: `(() => { const OFF = ${SHIFT}; const R = Date;
    function D(...a) { if (!new.target) return new R(R.now() + OFF).toString(); return a.length ? new R(...a) : new R(R.now() + OFF); }
    D.prototype = R.prototype; D.now = () => R.now() + OFF; D.parse = R.parse; D.UTC = R.UTC; globalThis.Date = D; })();`,
});
await cdp("Page.reload", { ignoreCache: true });
await sleep(300);
await waitFor("document.querySelector('[data-age-rel]')");
await sleep(1500);
const after = await snapshot();
await ev(`window.scrollTo(0, 0)`);
await shoot(SHOT);
ws.close();
chrome.kill();

const HYDRATION = /hydrat|did not match|server rendered|Minified React error #(418|423|425)|text content does not match/i;
const hydration = log.filter((l) => HYDRATION.test(l.text));
const shiftH = (after.now - before.now) / 3_600_000;
const rows = before.ages.map((b, i) => {
  const a = after.ages[i];
  return { at: b.at, static: staticAges[i]?.text, load: b.text, shifted: a?.text, expectLoad: compactAge(b.at, before.now), expectShift: compactAge(b.at, after.now) };
});
const ok =
  staticAges.length > 0 &&
  staticAges.every((s) => /^\d\d:\d\d$/.test(s.text)) &&
  !staticHtml.includes("data-age-rel") &&
  before.ages.every((a) => a.rel) &&
  rows.every((r) => r.load === r.expectLoad && r.shifted === r.expectShift) &&
  rows.some((r) => r.load !== r.shifted) &&
  shiftH > 3.9 &&
  (paused == null || /PAUSED · until \d\d:\d\d/.test(paused.text)) &&
  hydration.length === 0;
console.log(JSON.stringify({ url: URL_, shiftH: +shiftH.toFixed(2), chip: { load: before.chip, shifted: after.chip }, paused, rows, console: log, hydrationWarnings: hydration.length, ok }, null, 1));
process.exit(ok ? 0 : 1);
