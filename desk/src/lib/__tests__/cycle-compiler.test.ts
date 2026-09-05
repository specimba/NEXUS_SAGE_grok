import { describe, expect, test } from "bun:test";
import {
  assertCycle,
  bannedCopy,
  DEFAULT_LEAD_ID,
  DEFAULT_LEAD_POLICY,
  leadPolicy,
  PIN_BUDGET,
  pinBudget,
  selectPins,
} from "@/lib/cycle-compiler";
import { CYCLE } from "@/data/cycle";

describe("leadPolicy", () => {
  test("default unlock keeps hf-incident when no new primary", () => {
    const r = leadPolicy([
      { id: "hf-incident", file: "hf-incident", kind: "lead" },
      { id: "astra-depth", file: "astra", kind: "companion" },
    ]);
    expect(r.mode).toBe(DEFAULT_LEAD_POLICY);
    expect(r.leadId).toBe(DEFAULT_LEAD_ID);
  });

  test("non-HF delta does not swap lead", () => {
    const r = leadPolicy([
      { id: "hf-incident", file: "hf-incident", kind: "lead" },
      { id: "astra-ship", file: "astra", kind: "companion", delta: "OpenAI dated ship" },
    ]);
    expect(r.mode).toBe("unlock");
    expect(r.leadId).toBe("hf-incident");
  });

  test("HF new primary unlocks lead id to that story", () => {
    const r = leadPolicy(
      [
        { id: "hf-incident", file: "hf-incident", kind: "lead" },
        {
          id: "hf-wave4",
          file: "hf-incident",
          isNewPrimary: true,
          delta: "METR names new fact",
        },
      ],
      "hf-incident",
    );
    expect(r.mode).toBe("unlock");
    expect(r.leadId).toBe("hf-wave4");
  });
});

describe("selectPins", () => {
  test("max 3 pins; companion ≠ second lead; stigmergy dropped", () => {
    const pins = selectPins([
      {
        id: "hf-incident",
        file: "hf-incident",
        kind: "lead",
        title: "HF production swarm",
        take: "Persistent-Sol did HF. Astra later hit OpenAI.",
      },
      {
        id: "astra-depth",
        file: "astra",
        kind: "companion",
        title: "Astra recurrent depth",
        take: "Official Critical tag.",
      },
      {
        id: "aisle-curl",
        file: "other",
        kind: "rest",
        title: "AISLE curl CVEs",
        take: "Six CVEs after labs reported zero.",
      },
      {
        id: "extra-rest",
        file: "other",
        kind: "rest",
        title: "Extra",
        take: "Should not become pin 4.",
      },
      {
        id: "stigmergy",
        file: "split",
        kind: "drop",
        title: "MIT stigmergy",
        take: "Buehler paper.",
      },
    ]);
    expect(pins.length).toBeLessThanOrEqual(PIN_BUDGET);
    expect(pins.length).toBeLessThanOrEqual(pinBudget());
    expect(pins.filter((p) => p.kind === "lead")).toHaveLength(1);
    expect(pins[0]!.id).toBe("hf-incident");
    expect(pins.some((p) => p.id === "stigmergy")).toBe(false);
    expect(pins.filter((p) => p.kind === "companion").length).toBeLessThanOrEqual(1);
  });
});

describe("bannedCopy", () => {
  test("rejects civilizations", () => {
    const r = bannedCopy("three civilizations rose on the board");
    expect(r.ok).toBe(false);
    expect(r.hits.length).toBeGreaterThan(0);
  });
});

describe("assertCycle", () => {
  test("CYCLE 003 passes shape locks", () => {
    const r = assertCycle(CYCLE);
    expect(r.ok).toBe(true);
    expect(r.errors).toEqual([]);
  });

  test("unknown leadPolicy errors", () => {
    const r = assertCycle({
      ...CYCLE,
      leadPolicy: "maybe" as "unlock",
    });
    expect(r.ok).toBe(false);
    expect(r.errors.some((e) => /unknown leadPolicy/.test(e))).toBe(true);
  });

  test("pin budget exceeded errors", () => {
    const r = assertCycle({
      id: "003",
      leadPolicy: "unlock",
      pins: [
        ...CYCLE.pins,
        { id: "fourth", kind: "rest", title: "x", take: "y", why: "z", move: "m" },
      ],
      trust: CYCLE.trust,
    });
    expect(r.ok).toBe(false);
    expect(r.errors.some((e) => /pin budget/.test(e))).toBe(true);
  });
});
