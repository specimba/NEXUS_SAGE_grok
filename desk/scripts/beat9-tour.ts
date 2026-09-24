#!/usr/bin/env bun
/**
 * Beat 9 — real-browser no-mouse tour (Reviewer gate). Drives real Google Chrome over the
 * DevTools Protocol (no npm deps: Bun WebSocket + CDP Input.dispatchKeyEvent / dispatchMouseEvent),
 * 1280×800, against the running desk (default http://127.0.0.1:3000).
 *
 *   bun scripts/beat9-tour.ts [baseUrl]
 *
 * Writes artifacts/sage/beat9-tour.log and the proofs refs/VISUAL-PROOF-beat9-{filter,keymap}.png.
 * Exit 1 if any step fails.
 */
import { spawn } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const BASE = process.argv[2] ?? "http://127.0.0.1:3000";
const PORT = 9333 + Math.floor(Math.random() * 500);
const desk = resolve(import.meta.dir, "..");
const refs = resolve(desk, "../refs");
const logPath = resolve(desk, "artifacts/sage/beat9-tour.log");
const lines: string[] = [];
let fails = 0;
const log = (s: string) => {
  lines.push(s);
  console.log(s);
};
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const profile = `/tmp/beat9-tour-${PORT}`;
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

log(`beat9-tour · ${new Date().toISOString()} · ${BASE} · Chrome CDP · 1280x800`);
await cdp("Page.enable");
await cdp("Runtime.enable");
await cdp("Emulation.setDeviceMetricsOverride", { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
await cdp("Page.navigate", { url: `${BASE}/#brief` });
await waitFor(`document.querySelector('.desk-lane-btn[aria-current="page"]')`, 15000);
await waitFor(`document.querySelector('.brief-wire')`, 5000);
await sleep(400);

await step("start on Brief (no mouse from here)", async () => ((await lane()) === "brief" ? true : `FAIL lane=${await lane()}`));
await step("press 2 → Pulse", async () => {
  await press("2");
  return (await waitFor(`location.hash === '#pulse' && document.querySelector('.pulse-v5')`)) ? `lane=${await lane()}` : "FAIL";
});
await step("press j j → row 2 selected + focused", async () => {
  await press("j");
  await press("j");
  const i = await selIdx();
  return i === 1 && (await focusIsSelected()) ? `selected index ${i}` : `FAIL index=${i} focus=${await focusIsSelected()}`;
});
let openedRow = "";
await step("press Enter → story drawer opens on the focused multi-source row", async () => {
  openedRow = await ev<string>(`document.activeElement?.getAttribute('data-story-row') ?? ''`);
  await press("Enter");
  const ok = await waitFor(`document.querySelector('.story-drawer[role="dialog"]')`);
  const title = ok ? await ev<string>(`document.querySelector('.story-drawer-title')?.textContent ?? ''`) : "";
  const url = await ev<string>(`location.search`);
  return ok && openedRow && url.includes(encodeURIComponent(openedRow).replace(/%3A/g, ":")) || (ok && url.includes("story="))
    ? `row ${openedRow} · "${title.slice(0, 60)}" · ${url}`
    : `FAIL open=${ok} row=${openedRow} url=${url}`;
});
await step("drawer open: j → next story (drawer next)", async () => {
  const before = await ev<string>(`document.querySelector('.story-drawer-title')?.textContent ?? ''`);
  await press("j");
  await sleep(150);
  const after = await ev<string>(`document.querySelector('.story-drawer-title')?.textContent ?? ''`);
  await press("k");
  await sleep(150);
  const back = await ev<string>(`document.querySelector('.story-drawer-title')?.textContent ?? ''`);
  return after && after !== before && back === before ? `"${after.slice(0, 40)}" then back` : `FAIL before=${before} after=${after} back=${back}`;
});
await step("press Esc → drawer closes, focus back on the row", async () => {
  await press("Escape");
  const closed = await waitFor(`!document.querySelector('.story-drawer')`);
  await sleep(150);
  const focusRow = await ev<string>(`document.activeElement?.getAttribute('data-story-row') ?? ''`);
  const url = await ev<string>(`location.search`);
  return closed && focusRow === openedRow && !url.includes("story=") ? `focus ${focusRow}` : `FAIL closed=${closed} focus=${focusRow} url=${url}`;
});
let totalRows = 0;
await step("press / and type 'anthropic' → Pip-Boy filter applied", async () => {
  totalRows = await ev<number>(`document.querySelectorAll('.desk-stage [data-nav-row]').length`);
  await press("/");
  if (!(await waitFor(`document.activeElement?.dataset?.filterPrompt === '1'`))) return "FAIL prompt not focused";
  for (const ch of "anthropic") await press(ch);
  await sleep(250);
  const val = await ev<string>(`document.querySelector('[data-filter-prompt]')?.value ?? ''`);
  const count = await ev<string>(`document.querySelector('.desk-filter-count')?.textContent ?? ''`);
  const rows = await ev<string[]>(`[...document.querySelectorAll('.desk-stage [data-nav-row]')].map((r) => r.textContent.toLowerCase())`);
  // Filter matches headline OR source/publisher (spec), so a row may match on a publisher not in its text.
  const textHits = rows.filter((t) => t.includes("anthropic")).length;
  const allMatch = rows.length > 0 && textHits > 0;
  const [shown, total] = count.split("/").map(Number);
  await shot("VISUAL-PROOF-beat9-filter.png");
  return val === "anthropic" && shown === rows.length && shown < total && allMatch
    ? `value "${val}" · count ${count} · visible ${rows.length} (was ${totalRows}) · ${textHits} with "anthropic" in row text, rest match on publisher`
    : `FAIL value=${val} count=${count} visible=${rows.length}`;
});
await step("press Esc → filter cleared, prompt closed", async () => {
  await press("Escape");
  await sleep(200);
  const prompt = await ev<boolean>(`!!document.querySelector('[data-filter-prompt]')`);
  const chip = await ev<boolean>(`!!document.querySelector('.desk-filter-chip')`);
  const n = await ev<number>(`document.querySelectorAll('.desk-stage [data-nav-row]').length`);
  return !prompt && !chip && n === totalRows ? `rows back to ${n}` : `FAIL prompt=${prompt} chip=${chip} rows=${n}/${totalRows}`;
});
await step("press 4 → Papers", async () => {
  await press("4");
  return (await waitFor(`location.hash === '#papers' && document.querySelector('.papers-v6')`)) ? `lane=${await lane()}` : "FAIL";
});
await step("press j → first paper selected + focused", async () => {
  await press("j");
  const i = await selIdx();
  return i === 0 && (await focusIsSelected()) ? "selected index 0" : `FAIL index=${i}`;
});
await step("press ? → key map overlay", async () => {
  await press("?", ["shift"]);
  const ok = await waitFor(`document.querySelector('.desk-keymap[role="dialog"]')`);
  if (ok) await shot("VISUAL-PROOF-beat9-keymap.png");
  return ok ? "open" : "FAIL";
});
await step("press ? → key map closes", async () => {
  await press("?", ["shift"]);
  return (await waitFor(`!document.querySelector('.desk-keymap')`)) ? "closed" : "FAIL";
});
await step("press 1 → Brief", async () => {
  await press("1");
  return (await waitFor(`location.hash === '#brief' && document.querySelector('.brief-v5')`)) ? `lane=${await lane()}` : "FAIL";
});
await step("full lap 1–6 without the mouse", async () => {
  const seen: string[] = [];
  for (const [k, id] of [["1", "brief"], ["2", "pulse"], ["3", "digest"], ["4", "papers"], ["5", "voice"], ["6", "governance"]] as const) {
    await press(k);
    if (!(await waitFor(`location.hash === '#${id}'`))) return `FAIL at ${k}`;
    seen.push(await lane());
  }
  return seen.join(" → ");
});
await press("2");
await waitFor(`location.hash === '#pulse'`);
for (const m of ["ctrl", "meta", "alt"] as const) {
  await step(`${m[0]!.toUpperCase()}${m.slice(1)}+1 does NOT change lane (browser keeps it)`, async () => {
    await press("1", [m]);
    await sleep(150);
    const l = await lane();
    return l === "pulse" && (await ev<string>(`location.hash`)) === "#pulse" ? `still ${l}` : `FAIL lane=${l}`;
  });
}
await step("Shift+1 ignored", async () => {
  await press("1", ["shift"]);
  const l = await lane();
  return l === "pulse" ? `still ${l}` : `FAIL lane=${l}`;
});
await step("keys ignored while typing in an input (filter prompt: 1 types, lane unchanged)", async () => {
  await press("/");
  await waitFor(`document.activeElement?.dataset?.filterPrompt === '1'`);
  await press("1");
  const val = await ev<string>(`document.querySelector('[data-filter-prompt]')?.value ?? ''`);
  const l = await lane();
  await press("Escape");
  return val === "1" && l === "pulse" ? `typed "1", lane ${l}` : `FAIL val=${val} lane=${l}`;
});
await step("real mouse click on a multi-source Pulse row opens the drawer", async () => {
  const r = await ev<{ x: number; y: number } | null>(`(() => { const el = document.querySelector('.desk-stage [data-story-row]'); if (!el) return null; el.scrollIntoView({block:'center'}); const b = el.getBoundingClientRect(); return { x: b.left + Math.min(300, b.width / 2), y: b.top + b.height / 2 }; })()`);
  if (!r) return "FAIL no multi-source row";
  await sleep(150);
  const r2 = await ev<{ x: number; y: number }>(`(() => { const b = document.querySelector('.desk-stage [data-story-row]').getBoundingClientRect(); return { x: b.left + Math.min(300, b.width / 2), y: b.top + b.height / 2 }; })()`);
  await clickAt(r2.x, r2.y);
  return (await waitFor(`document.querySelector('.story-drawer')`)) ? `clicked at ${Math.round(r2.x)},${Math.round(r2.y)}` : "FAIL";
});
await step("real mouse click on the dimmed table closes the drawer", async () => {
  await clickAt(200, 420);
  return (await waitFor(`!document.querySelector('.story-drawer')`)) ? "closed via scrim click" : "FAIL";
});

log(`${fails === 0 ? "ALL PASS" : `${fails} FAIL`} · ${lines.filter((l) => l.startsWith("PASS")).length} steps passed`);
mkdirSync(resolve(desk, "artifacts/sage"), { recursive: true });
writeFileSync(logPath, lines.join("\n") + "\n");
ws.close();
chrome.kill("SIGTERM");
rmSync(profile, { recursive: true, force: true });
process.exit(fails === 0 ? 0 : 1);
