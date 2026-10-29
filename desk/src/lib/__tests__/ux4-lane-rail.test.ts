/** UX-NEXT-4 pass 1 — lane counter rail (refs UX-NEXT-4.md §1). */
import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const tsx = readFileSync(join(import.meta.dir, "../../components/sage/desk.tsx"), "utf8");
const css = readFileSync(join(import.meta.dir, "../../app/globals.css"), "utf8");
const rail = css.slice(css.indexOf("UX-NEXT-4 pass 1"));

test("six cells on one sticky row, Skin V2 tokens only, inactive muted, no amber, no new hex", () => {
  expect(rail).toMatch(/\.lane-rail \{[^}]*position: sticky;[^}]*top: 0;/);
  expect(rail).toMatch(/grid-template-columns: repeat\(6, minmax\(0, 1fr\)\)/);
  expect(rail).toMatch(/:not\(\[aria-current="page"\]\) \{ color: var\(--muted-foreground\); \}/);
  expect(/#[0-9a-f]{3,8}\b/i.test(rail)).toBe(false);
  expect(rail).not.toMatch(/amber/i);
});

test("each lane's count comes from data on the page (never invented); governance off the reader rail", () => {
  for (const k of ["brief:", "pulse:", "digest:", "papers:", "voice:", "governance:"]) expect(tsx).toContain(`    ${k} `);
  expect(tsx).toContain("CYCLE.trust.deny.length");
  expect(tsx).toContain("m.PAPERS.length");
  expect(tsx).toContain("DIGEST_CADENCE.next_at");
  // PASS-U U1: governance left the reader rail (footer link / key 6); its count key stays for that view.
  expect(tsx).toContain('.filter((t) => t.id !== "governance")');
  expect(tsx).toContain('<span className="lane-rail-count tabular-nums">{railCount[t.id]}</span>');
});
