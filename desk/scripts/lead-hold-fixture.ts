/**
 * UX-1 HELD fixture for the visual / overflow-390 proof build — rewrites ONLY the LEAD_* lines of src/data/desk-view.ts
 * with a HELD day built from real crawl data (src/lib/__tests__/fixtures/lead-hold.ts). Never commit the result:
 *   bun scripts/lead-hold-fixture.ts [gnw|age|none]   →  build  →  bun scripts/desk-view.ts (regenerates the real file)
 * gnw = closest candidate failed own-publisher (GNW_ONLY) · age = failed fresh (age>=36h) · none = nothing reached 2 SRC.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { heldHistory } from "../src/lib/__tests__/fixtures/lead-hold";
import { lastPickDate, leadClosest, yesterdayLead } from "../src/lib/lead-pick";
import { slimLead } from "../src/lib/desk-view";
import { withPub } from "../src/lib/desk-view-inputs";

const variant = process.argv[2] ?? "gnw";
const keep = variant === "age" ? (r: string) => r.startsWith("age>=") : variant === "none" ? () => false : (r: string) => r === "GNW_ONLY";
const { history, entry } = heldHistory(keep);
const path = fileURLToPath(new URL("../src/data/desk-view.ts", import.meta.url));
let s = readFileSync(path, "utf8");
const set = (name: string, type: string, v: unknown) => {
  const re = new RegExp(`^export const ${name}: ${type.replace(/[|]/g, "\\|")} = .*;$`, "m");
  if (!re.test(s)) throw new Error(`lead-hold-fixture: ${name} line not found`);
  s = s.replace(re, () => `export const ${name}: ${type} = ${JSON.stringify(v)};`);
};
set("LEAD_HELD", "boolean", true);
set("LEAD_FIRST_AT", "string | null", entry.first_at ?? null);
set("LEAD_TODAY", "SlimLead | null", withPub(entry));
set("LEAD_YESTERDAY", "SlimLead | null", slimLead(yesterdayLead(history)));
set("LEAD_CLOSEST", "LeadClosest | null", leadClosest(entry));
set("LEAD_LAST_PICK", "string | null", lastPickDate(history));
writeFileSync(path, s);
console.log(`lead-hold-fixture ${variant}: HELD ${entry.date} · closest ${JSON.stringify(leadClosest(entry))} · last pick ${lastPickDate(history)}`);
