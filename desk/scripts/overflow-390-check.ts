#!/usr/bin/env bun
/**
 * 390 gate (UX catch on 5026544): headless Chrome over CDP, no npm deps.
 *   bun scripts/overflow-390-check.ts [url]
 * On every lane (#brief … #governance) at a 390×844 mobile viewport, fails (exit 1) if any visible text
 * run's right edge (Range client rects over text nodes — so text clipped inside overflow-hidden boxes
 * still counts; text-overflow: ellipsis is exempt only when its own box ends ≤390) extends past x=390,
 * or any lead/headline element (HEADLINE_SEL) is ellipsized or line-clamped, or the document scrolls sideways. On Voice it also opens the archive
 * fold and requires its header to read "· open". ONLY exemption: EXEMPT_CLASSES (ticker scrolls by design).
 */
import { spawn } from "node:child_process";
import { rmSync } from "node:fs";

const EXEMPT_CLASSES = ["desk-ticker-item"];
const HEADLINE_SEL = ".sage-take-title, [data-unlock-lead], .sage-headline";
// List rows (Pulse / Wire / Digest items, Voice sub-rows) may ellipsize or line-clamp — explicit allowlist.
const ROW_ALLOW = "[data-row-clamp], .pulse-v5-taste-text, .pulse-v5-taste-skip";
const LANES = ["brief", "pulse", "digest", "papers", "voice", "governance"];
const W = 390;
const base = (process.argv.slice(2).find((a) => /^https?:\/\//.test(a)) ?? process.env.SAGE_DESK_URL ?? "http://127.0.0.1:3000/").replace(/#.*$/, "");
const PORT = 9800 + Math.floor(Math.random() * 150);
const profile = `/tmp/overflow-390-${PORT}`;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
rmSync(profile, { recursive: true, force: true });
const chrome = spawn(process.env.CHROME_BIN || "google-chrome",
  ["--headless=new", "--no-sandbox", "--disable-gpu", `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, `--window-size=${W},844`, "about:blank"],
  { stdio: "ignore" });
const done = (code: number) => { chrome.kill("SIGKILL"); rmSync(profile, { recursive: true, force: true }); process.exit(code); };
let wsUrl = "";
for (let i = 0; i < 100 && !wsUrl; i++) {
  try {
    const list = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()) as { type: string; webSocketDebuggerUrl: string }[];
    wsUrl = list.find((t) => t.type === "page")?.webSocketDebuggerUrl ?? "";
  } catch {}
  if (!wsUrl) await sleep(200);
}
if (!wsUrl) { console.error("overflow-390 FAIL\n - headless Chrome did not start (set CHROME_BIN)"); done(1); }
const ws = new WebSocket(wsUrl);
await new Promise((r, j) => ((ws.onopen = r), (ws.onerror = j)));
let id = 1;
const pending = new Map<number, (v: any) => void>();
ws.onmessage = (m) => { const msg = JSON.parse(String(m.data)); if (msg.id && pending.has(msg.id)) (pending.get(msg.id)!(msg.result ?? { error: msg.error }), pending.delete(msg.id)); };
const cdp = (method: string, params: Record<string, unknown> = {}) => new Promise<any>((res) => { const n = id++; pending.set(n, res); ws.send(JSON.stringify({ id: n, method, params })); });
const evalv = async (expression: string) => (await cdp("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true }))?.result?.value;

await cdp("Page.enable");
await cdp("Emulation.setDeviceMetricsOverride", { width: W, height: 844, deviceScaleFactor: 2, mobile: true });
const probe = `(() => {
  const EX = ${JSON.stringify(EXEMPT_CLASSES)}, W = ${W}, out = [], HEAD = ${JSON.stringify(HEADLINE_SEL)}, ROWS = ${JSON.stringify(ROW_ALLOW)};
  const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  for (let n = tw.nextNode(); n; n = tw.nextNode()) {
    if (!n.textContent.trim()) continue;
    const el = n.parentElement;
    if (!el || el.closest(EX.map((c) => "." + c).join(",")) || el.closest("script,style,noscript,[aria-hidden=true]")) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || +cs.opacity === 0) continue;
    const r = document.createRange(); r.selectNodeContents(n);
    let right = 0;
    for (const q of r.getClientRects()) if (q.width > 1 && q.height > 1) right = Math.max(right, q.right);
    // Lead / headline text must wrap at 390: any ellipsis or line-clamp on it fails outright.
    if (el.closest(HEAD) && !seen.has(el) && !el.closest(ROWS) && (cs.textOverflow === "ellipsis" || (cs.webkitLineClamp && cs.webkitLineClamp !== "none"))) {
      seen.add(el);
      out.push({ right: Math.round(right), tag: el.tagName.toLowerCase() + " (headline ellipsized/clamped)", text: n.textContent.trim().slice(0, 50) });
      continue;
    }
    // ONLY exemption besides EXEMPT_CLASSES: computed text-overflow: ellipsis AND the element's own box ends ≤ 390.
    // Every other overflow-hidden clip stays strict (judged by the text's own rects).
    if (right > W && cs.textOverflow === "ellipsis" && el.getBoundingClientRect().right <= W) right = el.getBoundingClientRect().right;
    if (right > W + 0.5 && !seen.has(el)) {
      seen.add(el);
      const cls = (el.className && el.className.baseVal === undefined ? el.className : "").toString().split(" ").slice(0, 3).join(".");
      out.push({ right: Math.round(right), tag: el.tagName.toLowerCase() + (cls ? "." + cls : ""), text: n.textContent.trim().slice(0, 50) });
    }
  }
  return { scrollW: document.documentElement.scrollWidth, items: out };
})()`;
const fails: string[] = [];
for (const lane of LANES) {
  await cdp("Page.navigate", { url: `${base}#${lane}` });
  for (let i = 0; i < 150; i++) { if ((await evalv("document.readyState")) === "complete") break; await sleep(200); }
  await sleep(1500);
  const r = await evalv(probe);
  if (!r) { fails.push(`${lane}: probe returned nothing`); continue; }
  if (r.scrollW > W) fails.push(`${lane}: horizontal scroll (scrollWidth ${r.scrollW} > ${W})`);
  for (const it of r.items) fails.push(`${lane}: text right edge ${it.right}px > ${W} · <${it.tag}> "${it.text}"`);
  if (lane === "voice") {
    const fold = await evalv(`(async () => {
      const q = () => document.querySelector(".lane-voice details.digest-archive-fold") || document.querySelector("details.digest-archive-fold");
      for (let i = 0; i < 50 && !q(); i++) await new Promise((r) => setTimeout(r, 200));
      const d = q();
      if (!d) return "missing";
      const before = d.querySelector("summary").textContent.trim();
      d.open = true; await new Promise((r) => setTimeout(r, 800));
      const after = d.querySelector("summary").textContent.trim();
      return before + " || " + after;
    })()`);
    const [before = "", after = ""] = String(fold).split(" || ");
    if (!/· closed$/.test(before) || !/· open$/.test(after)) fails.push(`voice: archive fold header must read "· closed" → "· open" (got "${before}" → "${after}")`);
    else console.log(`  fold: "${before}" → "${after}"`);
    // Voice script card: no two text runs from different elements may overlap — meta line vs HELD kicker.
    const ov = await evalv(`(() => {
      const card = document.querySelector('section[aria-label="Voice script"]'); if (!card) return ["card missing"];
      const tw = document.createTreeWalker(card, NodeFilter.SHOW_TEXT), boxes = [];
      for (let n = tw.nextNode(); n; n = tw.nextNode()) {
        if (!n.textContent.trim()) continue;
        const r = document.createRange(); r.selectNodeContents(n);
        for (const q of r.getClientRects()) if (q.width > 1 && q.height > 1) boxes.push({ q, el: n.parentElement, t: n.textContent.trim().slice(0, 24) });
      }
      const bad = [];
      for (let a = 0; a < boxes.length; a++) for (let b = a + 1; b < boxes.length; b++) {
        const A = boxes[a], B = boxes[b];
        if (A.el === B.el) continue;
        const x = Math.min(A.q.right, B.q.right) - Math.max(A.q.left, B.q.left);
        const y = Math.min(A.q.bottom, B.q.bottom) - Math.max(A.q.top, B.q.top);
        if (x > 2 && y > 0) bad.push('text overlap' + ' "' + A.t + '" ↔ "' + B.t + '" (' + y.toFixed(1) + 'px)');
      }
      return bad.slice(0, 6);
    })()`);
    for (const o of ov ?? []) fails.push(`voice: script card ${o}`);
    const r2 = await evalv(probe);
    for (const it of r2?.items ?? []) fails.push(`voice(fold open): text right edge ${it.right}px > ${W} · <${it.tag}> "${it.text}"`);
  }
}
if (fails.length) { console.error(`overflow-390 FAIL (${fails.length}) at ${base}`); for (const f of fails) console.error(" -", f); done(1); }
console.log(`overflow-390 OK · ${LANES.length} lanes at ${W}px · exempt: ${EXEMPT_CLASSES.join(",")} · ${base}`);
done(0);
