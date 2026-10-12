// PASS-C2 proof harness: frozen-base clock + fetch record (old code) / replay (new code).
import { existsSync, readFileSync, writeFileSync } from "node:fs";
const T0 = Number(process.env.C2_T0);
const realNow = Date.now.bind(Date);
const start = realNow();
const RealDate = Date;
const fakeNow = () => T0 + (realNow() - start);
class FakeDate extends RealDate {
  constructor(...a: any[]) {
    if (a.length === 0) super(fakeNow());
    else super(...(a as [any]));
  }
  static now() { return fakeNow(); }
}
(globalThis as any).Date = FakeDate;
const mode = process.env.C2_MODE!;
const tape = process.env.C2_TAPE!;
type Rec = { key: string; status: number; statusText: string; headers: [string, string][]; body: string };
const recs: Rec[] = mode === "replay" ? JSON.parse(readFileSync(tape, "utf8")) : [];
const used = new Set<number>();
let misses = 0;
const realFetch = globalThis.fetch;
function keyOf(input: any, init?: any) {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  const method = (init?.method ?? (input as any)?.method ?? "GET").toUpperCase();
  const body = init?.body ? String(init.body) : "";
  return `${method} ${url} ${body}`;
}
globalThis.fetch = (async (input: any, init?: any) => {
  const key = keyOf(input, init);
  if (mode === "replay") {
    const i = recs.findIndex((r, j) => !used.has(j) && r.key === key);
    if (i < 0) {
      misses++;
      writeFileSync(tape + ".misses", `${misses}\n${key}\n`, { flag: "a" });
      throw new Error(`replay miss ${key}`);
    }
    used.add(i);
    const r = recs[i]!;
    if (r.status === 599 && r.statusText === "network error") throw new Error("replayed network error");
    return new Response(r.status === 204 || r.status === 304 ? null : Buffer.from(r.body, "base64"), { status: r.status, statusText: r.statusText, headers: r.headers });
  }
  try {
    const res = await realFetch(input, init);
    const buf = Buffer.from(await res.arrayBuffer());
    recs.push({ key, status: res.status, statusText: res.statusText, headers: [...res.headers.entries()], body: buf.toString("base64") });
    writeFileSync(tape, JSON.stringify(recs));
    return new Response(res.status === 204 || res.status === 304 ? null : buf, { status: res.status, statusText: res.statusText, headers: res.headers });
  } catch (e) {
    recs.push({ key, status: 599, statusText: "network error", headers: [], body: "" });
    writeFileSync(tape, JSON.stringify(recs));
    throw e;
  }
}) as typeof fetch;
process.on("exit", () => {
  if (mode === "replay") writeFileSync(tape + ".replay-summary", JSON.stringify({ recorded: recs.length, used: used.size, misses }));
});
