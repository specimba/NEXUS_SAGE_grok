import { describe, expect, test } from "bun:test";
import {
  DIGEST_ITEMS,
  DROPPED,
  PACK_AT,
  PACK_SOURCE,
  type DigestItem,
} from "@/data/digest-pack";
import { kept, nextDue, renderPlan, renderReport } from "@/lib/digest-pack";

const KINDS = new Set(["lead", "companion", "rest", "drop"]);
const FILES = new Set(["hf-incident", "astra", "split", "other"]);
const CONF = new Set(["high", "medium", "low"]);
const REF_ROLES = new Set(["primary", "support", "wire"]);

function assertItemSchema(item: DigestItem) {
  expect(typeof item.id).toBe("string");
  expect(item.id.length).toBeGreaterThan(0);
  expect(KINDS.has(item.kind)).toBe(true);
  expect(typeof item.title).toBe("string");
  expect(typeof item.take).toBe("string");
  expect(typeof item.why).toBe("string");
  expect(typeof item.move).toBe("string");
  expect(FILES.has(item.file)).toBe(true);
  expect(CONF.has(item.confidence)).toBe(true);
  expect(Array.isArray(item.evidence)).toBe(true);
  expect(Array.isArray(item.steps)).toBe(true);
  expect(typeof item.doneWhen).toBe("string");
  expect(typeof item.unlockIf).toBe("string");
  expect(Array.isArray(item.refs)).toBe(true);
  for (const r of item.refs) {
    expect(typeof r.label).toBe("string");
    expect(typeof r.href).toBe("string");
    expect(REF_ROLES.has(r.role)).toBe(true);
  }
}

describe("digest-pack schema", () => {
  test("DIGEST_ITEMS match DigestItem schema", () => {
    expect(DIGEST_ITEMS.length).toBeGreaterThan(0);
    for (const item of DIGEST_ITEMS) assertItemSchema(item);
  });

  test("exactly one lead; lead files hf-incident", () => {
    const leads = DIGEST_ITEMS.filter((i) => i.kind === "lead");
    expect(leads).toHaveLength(1);
    expect(leads[0]!.file).toBe("hf-incident");
  });

  test("JSON round-trip preserves schema + ids", () => {
    const packed = {
      at: PACK_AT,
      source: PACK_SOURCE,
      items: DIGEST_ITEMS,
      dropped: DROPPED,
      plan: renderPlan(DIGEST_ITEMS),
    };
    const raw = JSON.stringify(packed);
    const back = JSON.parse(raw) as typeof packed;
    expect(back.at).toBe(PACK_AT);
    expect(back.source).toBe(PACK_SOURCE);
    expect(back.items).toHaveLength(DIGEST_ITEMS.length);
    expect(back.dropped).toEqual(DROPPED);
    for (let i = 0; i < DIGEST_ITEMS.length; i++) {
      assertItemSchema(back.items[i]!);
      expect(back.items[i]).toEqual(DIGEST_ITEMS[i]);
    }
    expect(back.plan.map((p) => p.id)).toEqual(renderPlan().map((p) => p.id));
  });

  test("renderPlan kept items only; renderReport round-trips markdown markers", () => {
    const plan = renderPlan();
    expect(plan.every((p) => p.kind !== "drop")).toBe(true);
    expect(plan.length).toBe(kept().length);
    const md = renderReport();
    expect(md).toContain("# SAGE digest pack");
    expect(md).toContain("compiled " + PACK_AT);
    expect(md).toContain("## Lead");
    expect(md).toContain("## Dropped");
    // re-parse identity via JSON twin of plan rows
    const twin = JSON.parse(JSON.stringify(plan));
    expect(twin).toEqual(plan);
  });

  test("nextDue cadence", () => {
    const due = nextDue(null, Date.parse("2026-09-04T00:00:00Z"));
    expect(due.due).toBe(true);
    const hold = nextDue("2026-09-04T00:00:00Z", Date.parse("2026-09-04T01:00:00Z"));
    expect(hold.due).toBe(false);
  });
});
