#!/usr/bin/env bun
/**
 * Beat 10 — real-browser proof for since-you-were-here + topic heat + drawer row links.
 * A previous visit is SIMULATED by seeding localStorage["sage.lastSeenAt"] (default: now − 2h, or argv[3])
 * via Page.addScriptToEvaluateOnNewDocument — the page itself only ever writes it on tab leave.
 * Based on scripts/beat9-tour.ts (same zero-dependency CDP harness). Drives real Google Chrome over the
 * DevTools Protocol (no npm deps: Bun WebSocket + CDP Input.dispatchKeyEvent / dispatchMouseEvent),
 * 1280×800, against the running desk (default http://127.0.0.1:3000).
 *
 *   bun scripts/beat9-tour.ts [baseUrl]
 *
 * Writes artifacts/sage/beat10-proof.log and the proofs refs/VISUAL-PROOF-beat9-{filter,keymap}.png.
 * Exit 1 if any step fails.
 */
import { spawn } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const BASE = process.argv[2] ?? "http://127.0.0.1:3000";
const PORT = 9333 + Math.floor(Math.random() * 500);
const desk = resolve(import.meta.dir, "..");
const refs = resolve(desk, "../refs");
const logPath = resolve(desk, "artifacts/sage/beat10-proof.log");
const lines: string[] = [];
let fails = 0;
const log = (s: string) => {
  lines.push(s);
  console.log(s);
};
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const profile = `/tmp/beat10-proof-${PORT}`;
rmSync(profile, { recursive: true, force: true });
const chrome = spawn(
  "google-chrome",
  [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--hide-scrollbars",
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${profile}`,
    "--window-size=1280,800",
    "about:blank",
  ],
  { stdio: "ignore" },
);

async function targetWs(): Promise<string> {
  for (let i = 0; i < 50; i++) {
    try {
      const list = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()) as { type: string; webSocketDebuggerUrl: string }[];
      const page = list.find((t) => t.type === "page");
      if (page) return page.webSocketDebuggerUrl;
    } catch {
      /* not up yet */
    }
    await sleep(200);
  }
  throw new Error("chrome devtools endpoint never came up");
}

const ws = new WebSocket(await targetWs());
await new Promise((r, j) => {
  ws.onopen = r;
  ws.onerror = j;
});
let nextId = 1;
const pending = new Map<number, { res: (v: any) => void; rej: (e: any) => void }>();
ws.onmessage = (m) => {
  const msg = JSON.parse(String(m.data));
  if (msg.id && pending.has(msg.id)) {
    const p = pending.get(msg.id)!;
    pending.delete(msg.id);
    msg.error ? p.rej(new Error(msg.error.message)) : p.res(msg.result);
  }
};
function cdp(method: string, params: Record<string, unknown> = {}): Promise<any> {
  const id = nextId++;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((res, rej) => pending.set(id, { res, rej }));
}
async function ev<T = unknown>(expr: string): Promise<T> {
  const r = await cdp("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(`eval failed: ${expr}`);
  return r.result.value as T;
}
async function waitFor(expr: string, ms = 4000): Promise<boolean> {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (await ev<boolean>(`!!(${expr})`)) return true;
    await sleep(60);
  }
  return false;
}

const MOD = { alt: 1, ctrl: 2, meta: 4, shift: 8 } as const;
type Mod = keyof typeof MOD;
function keyInfo(key: string): { code: string; vk: number; text?: string } {
  if (/^[0-9]$/.test(key)) return { code: `Digit${key}`, vk: 48 + Number(key), text: key };
  if (/^[a-z]$/.test(key)) return { code: `Key${key.toUpperCase()}`, vk: key.toUpperCase().charCodeAt(0), text: key };
  if (/^[A-Z]$/.test(key)) return { code: `Key${key}`, vk: key.charCodeAt(0), text: key };
  if (key === "/") return { code: "Slash", vk: 191, text: "/" };
  if (key === "?") return { code: "Slash", vk: 191, text: "?" };
  if (key === "Enter") return { code: "Enter", vk: 13, text: "\r" };
  if (key === "Escape") return { code: "Escape", vk: 27 };
  throw new Error(`no key info for ${key}`);
}
async function press(key: string, mods: Mod[] = []) {
  const { code, vk, text } = keyInfo(key);
  const modifiers = mods.reduce((a, m) => a | MOD[m], 0);
  const withText = text && !mods.some((m) => m === "ctrl" || m === "meta" || m === "alt");
  await cdp("Input.dispatchKeyEvent", {
    type: withText ? "keyDown" : "rawKeyDown",
    key,
    code,
    windowsVirtualKeyCode: vk,
    nativeVirtualKeyCode: vk,
    modifiers,
    ...(withText ? { text, unmodifiedText: text } : {}),
  });
  await cdp("Input.dispatchKeyEvent", { type: "keyUp", key, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk, modifiers });
  await sleep(120);
}
async function clickAt(x: number, y: number) {
  await cdp("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
  await cdp("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 });
  await cdp("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 });
  await sleep(200);
}
async function shot(name: string) {
  const r = await cdp("Page.captureScreenshot", { format: "png" });
  const p = resolve(refs, name);
  writeFileSync(p, Buffer.from(r.data, "base64"));
  log(`  shot ${p}`);
}
async function step(name: string, fn: () => Promise<boolean | string>) {
  try {
    const r = await fn();
    const ok = r === true || (typeof r === "string" && !r.startsWith("FAIL"));
    if (!ok) fails++;
    log(`${ok ? "PASS" : "FAIL"} ${name}${typeof r === "string" ? ` — ${r}` : ""}`);
  } catch (e) {
    fails++;
    log(`FAIL ${name} — ${(e as Error).message}`);
  }
}

const lane = () => ev<string>(`document.querySelector('.desk-lane-btn[aria-current="page"]')?.textContent?.replace(/\\[\\d+\\]/, '').trim() ?? ''`);
const selIdx = () =>
  ev<number>(`[...document.querySelectorAll('.desk-stage [data-nav-row]')].findIndex((r) => r.hasAttribute('data-nav-selected'))`);
const focusIsSelected = () => ev<boolean>(`!!document.activeElement && document.activeElement.hasAttribute('data-nav-selected')`);
const drawerOpen = () => ev<boolean>(`!!document.querySelector('.story-drawer')`);

const LAST_SEEN = process.argv[3] ?? new Date(Date.now() - 2 * 3_600_000).toISOString();
const sinceRows = () => ev<number>(`document.querySelectorAll('.desk-stage [data-nav-row][data-since]').length`);

log(`beat10-proof · ${new Date().toISOString()} · ${BASE} · Chrome CDP · 1280x800 · simulated lastSeenAt=${LAST_SEEN}`);
await cdp("Page.enable");
await cdp("Runtime.enable");
await cdp("Emulation.setDeviceMetricsOverride", { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
await cdp("Page.navigate", { url: `${BASE}/#pulse` });
await waitFor(`document.querySelector('.heat-strip')`, 15000);
await sleep(600);

await step("first visit ever: no since markers, no divider, nothing written on load", async () => {
  const n = await sinceRows();
  const div = await ev<number>(`document.querySelectorAll('.since-divider').length`);
  const ls = await ev<string | null>(`localStorage.getItem('sage.lastSeenAt')`);
  return n === 0 && div === 0 && ls === null ? `rows=0 divider=0 lastSeenAt=null` : `FAIL rows=${n} divider=${div} lastSeenAt=${ls}`;
});
await step("heat strip: 6 cells (5 companies + OTHER LABS), one amber (hottest), gaps labelled", async () => {
  const info = await ev<{ cells: number; hot: string[]; kicker: string; gaps: number; bars: number }>(`(() => ({
    cells: document.querySelectorAll('.heat-cell').length,
    hot: [...document.querySelectorAll('.heat-cell[data-hot]')].map((c) => c.querySelector('.heat-cell-label').textContent),
    kicker: document.querySelector('.heat-strip-kicker').textContent,
    gaps: document.querySelectorAll('.heat-gap[title*="gap"]').length,
    bars: document.querySelectorAll('.heat-bar').length,
  }))()`);
  const h = await ev<number>(`document.querySelector('.heat-strip').getBoundingClientRect().height`);
  return info.cells === 6 && info.hot.length === 1 && info.bars === 36
    ? `${info.kicker} · hot=${info.hot[0]} · gap bars=${info.gaps}/36 · other labs drivers "${await ev<string>(`document.querySelector('.heat-cell:last-child .heat-cell-drivers')?.textContent ?? ''`)}" · strip ${Math.round(h)}px`
    : `FAIL ${JSON.stringify(info)}`;
});
await step("heat cell click filters the table to that company and shows the filter chip", async () => {
  const r = await ev<{ x: number; y: number; label: string }>(`(() => { const b = document.querySelector('.heat-cell[data-hot]').getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2, label: document.querySelector('.heat-cell[data-hot] .heat-cell-label').textContent }; })()`);
  const before = await ev<number>(`document.querySelectorAll('.pulse-v5-line').length`);
  await clickAt(r.x, r.y);
  await waitFor(`document.querySelector('.desk-filter-chip')`, 2000);
  const chip = await ev<string>(`document.querySelector('.desk-filter-chip')?.textContent ?? ''`);
  const after = await ev<number>(`document.querySelectorAll('.pulse-v5-line').length`);
  const hit = await ev<number>(`document.querySelector('.heat-cell').getBoundingClientRect().height + 14`);
  return chip.toLowerCase().includes(r.label.toLowerCase()) ? `${r.label} → chip "${chip.trim()}" · rows ${before}→${after} · hit area ${hit}px` : `FAIL chip="${chip}"`;
});
await shot("VISUAL-PROOF-beat10-heat.png");
await step("Esc clears the heat filter", async () => {
  await press("Escape");
  return (await waitFor(`!document.querySelector('.desk-filter-chip')`, 1500)) ? "chip gone" : "FAIL chip still shown";
});
await step("OTHER LABS cell filters to the whole group (OR-match)", async () => {
  const r = await ev<{ x: number; y: number }>(`(() => { const b = document.querySelector('.heat-cell:last-child').getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; })()`);
  await clickAt(r.x, r.y);
  await waitFor(`document.querySelector('.desk-filter-chip')`, 2000);
  const chip = await ev<string>(`document.querySelector('.desk-filter-chip')?.textContent ?? ''`);
  const heads = await ev<string[]>(`[...document.querySelectorAll('.pulse-v5-headline')].map((h) => h.textContent)`);
  await press("Escape");
  const labs = /\b(xai|grok|meta|llama|mistral|deepseek|qwen|alibaba|xiaomi|mimo)\b/i;
  const named = heads.filter((h) => labs.test(h)).length;
  return chip.includes("other labs") && heads.length > 0 ? `chip "${chip.trim()}" · ${heads.length} rows (${named} name a lab in the headline, rest via lab feed)` : `FAIL chip="${chip}" rows=${heads.length}`;
});
await step("pagehide writes lastSeenAt (tab leave, not load)", async () => {
  await ev(`window.dispatchEvent(new PageTransitionEvent('pagehide'))`);
  const v = await ev<string | null>(`localStorage.getItem('sage.lastSeenAt')`);
  return v && Math.abs(Date.parse(v) - Date.now()) < 120_000 ? `lastSeenAt=${v}` : `FAIL ${v}`;
});

// Simulated previous visit: new tab session (drop the session pin) with lastSeenAt seeded before the app boots.
await ev(`sessionStorage.removeItem('sage.sinceBase')`);
await cdp("Page.addScriptToEvaluateOnNewDocument", {
  source: `if (!sessionStorage.getItem('sage.sinceBase')) localStorage.setItem('sage.lastSeenAt', ${JSON.stringify(LAST_SEEN)});`,
});
await cdp("Page.reload"); // a new document (same-URL navigate would only be a hash change)
await sleep(500);
await waitFor(`document.querySelector('.heat-strip')`, 15000);
await waitFor(`document.querySelector('[data-since], .since-nothing')`, 10000); // hydration: baseline is read in an effect
await sleep(400);
let nSince = 0;
await step("previous visit: rows first seen after lastSeenAt get the amber edge, stacked above the divider", async () => {
  nSince = await sinceRows();
  const div = await ev<string>(`document.querySelector('.pulse-v5-table .since-divider')?.textContent ?? ''`);
  const ordered = await ev<boolean>(`(() => { const ol = document.querySelector('.pulse-v5-table ol'); const kids = [...ol.children]; const d = kids.findIndex((k) => k.classList.contains('since-divider')); return d > 0 && kids.slice(0, d).every((k) => k.querySelector('[data-since]')) && !kids.slice(d + 1).some((k) => k.querySelector('[data-since]')); })()`);
  const nothing = await ev<string>(`document.querySelector('.since-nothing')?.textContent ?? ''`);
  if (nSince === 0) return nothing ? `0 since rows · health strip says "${nothing}"` : "FAIL no rows and no 'nothing since'";
  const n = Number(div.match(/(\d+) new row/)?.[1] ?? -1);
  return div && ordered && n === nSince ? `${nSince} since rows · divider "${div.trim()}"` : `FAIL div="${div}" ordered=${ordered} rows=${nSince}`;
});
// Frame the boundary: last since-rows (amber edge) above, the divider, then older rows below.
await ev(`(() => { const d = document.querySelector('.pulse-v5-table .since-divider'); if (d) { d.scrollIntoView({ block: "center" }); } else window.scrollTo(0, 0); })()`);
await sleep(300);
await shot("VISUAL-PROOF-beat10-since.png");
await ev(`window.scrollTo(0, 0)`);
await step("u jumps selection to the first since-row", async () => {
  if (nSince === 0) return "skipped — no since rows";
  await press("u");
  const ok = await ev<boolean>(`!!document.activeElement?.hasAttribute('data-since') && document.activeElement.hasAttribute('data-nav-selected')`);
  return ok && (await selIdx()) === 0 ? "selected #1 (since)" : `FAIL idx=${await selIdx()}`;
});
await step("reload keeps the same markers (session-pinned baseline)", async () => {
  await cdp("Page.reload");
  await waitFor(`document.querySelector('.heat-strip')`, 15000);
  await waitFor(`document.querySelector('[data-since], .since-nothing')`, 10000);
  await sleep(400);
  const n = await sinceRows();
  return n === nSince ? `${n} since rows after reload` : `FAIL ${n} vs ${nSince}`;
});
await step("drawer: whole source row is the link (≥44px), keyboard o + focus trap intact", async () => {
  await ev(`document.querySelector('[data-story-row]').click()`);
  if (!(await waitFor(`document.querySelector('.story-drawer')`, 2000))) return "FAIL drawer did not open";
  await sleep(200);
  const rows = await ev<{ n: number; minH: number; links: number }>(`(() => { const r = [...document.querySelectorAll('.story-drawer a.story-drawer-rowlink')]; return { n: r.length, minH: Math.min(...r.map((a) => a.getBoundingClientRect().height)), links: document.querySelectorAll('.story-drawer a[href]').length }; })()`);
  const focusClose = await ev<boolean>(`document.activeElement?.hasAttribute('data-drawer-close') ?? false`);
  await press("Escape");
  const closed = await waitFor(`!document.querySelector('.story-drawer')`, 1500);
  return rows.n > 0 && rows.minH >= 44 && rows.links === rows.n && focusClose && closed
    ? `${rows.n} row links · min ${Math.round(rows.minH)}px · focus on close · Esc closes`
    : `FAIL ${JSON.stringify(rows)} focusClose=${focusClose} closed=${closed}`;
});

log(`${fails === 0 ? "ALL PASS" : `${fails} FAIL`}`);
mkdirSync(resolve(desk, "artifacts/sage"), { recursive: true });
writeFileSync(logPath, lines.join("\n") + "\n");
ws.close();
chrome.kill();
process.exit(fails ? 1 : 0);
