/**
 * 1280x800 proof shot of one lane: bun scripts/lane-shot.ts <lane> <out.png> [url] [--scroll <css selector>]
 * lane = brief | pulse | … (clicks the lane tab by its text). No npm deps: Bun WebSocket + CDP.
 */
import { spawn } from "node:child_process";
import { rmSync } from "node:fs";

const [lane = "brief", out = "/tmp/lane.png"] = process.argv.slice(2);
const url = process.argv.find((a) => a.startsWith("http")) ?? "http://127.0.0.1:3000/";
const scrollSel = process.argv.includes("--scroll") ? process.argv[process.argv.indexOf("--scroll") + 1] : null;
const PORT = 9800 + Math.floor(Math.random() * 150);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const profile = `/tmp/lane-shot-${PORT}`;
rmSync(profile, { recursive: true, force: true });
const chrome = spawn("google-chrome", ["--headless=new", "--no-sandbox", "--disable-gpu", "--hide-scrollbars", `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, "--window-size=1280,800", "about:blank"], { stdio: "ignore" });
let wsUrl = "";
for (let i = 0; i < 60 && !wsUrl; i++) {
  try {
    const list = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()) as { type: string; webSocketDebuggerUrl: string }[];
    wsUrl = list.find((t) => t.type === "page")?.webSocketDebuggerUrl ?? "";
  } catch {}
  if (!wsUrl) await sleep(200);
}
const ws = new WebSocket(wsUrl);
await new Promise((r, j) => ((ws.onopen = r), (ws.onerror = j)));
let id = 1;
const pending = new Map<number, (v: any) => void>();
const logs: string[] = [];
ws.onmessage = (m) => {
  const msg = JSON.parse(String(m.data));
  if (msg.id && pending.has(msg.id)) (pending.get(msg.id)!(msg.result), pending.delete(msg.id));
  else if (msg.method === "Runtime.consoleAPICalled") logs.push(msg.params.args.map((a: any) => a.value ?? a.description).join(" "));
  else if (msg.method === "Runtime.exceptionThrown") logs.push(`EXC ${msg.params.exceptionDetails.exception?.description ?? msg.params.exceptionDetails.text}`);
};
const cdp = (method: string, params: Record<string, unknown> = {}) =>
  new Promise<any>((res) => {
    const n = id++;
    pending.set(n, res);
    ws.send(JSON.stringify({ id: n, method, params }));
  });
const ev = async (expression: string) => (await cdp("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true })).result?.value;
await cdp("Runtime.enable");
await cdp("Page.enable");
await cdp("Page.navigate", { url });
for (let i = 0; i < 80 && !(await ev("!!document.querySelector('[data-age-rel]')")); i++) await sleep(100);
await ev(`[...document.querySelectorAll('button,a,[role=tab]')].find((e) => new RegExp(${JSON.stringify(lane)}, 'i').test(e.textContent || ''))?.click()`);
await sleep(700);
if (scrollSel) await ev(`document.querySelector(${JSON.stringify(scrollSel)})?.scrollIntoView({ block: 'start' })`);
await sleep(300);
const png = await cdp("Page.captureScreenshot", { format: "png" });
await Bun.write(out, Buffer.from(png.data, "base64"));
console.log(JSON.stringify({ lane, out, console: logs }));
ws.close();
chrome.kill();
