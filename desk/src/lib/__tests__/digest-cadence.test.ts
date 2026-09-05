import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { CYCLE } from "@/data/cycle";
import { DIGEST_ITEMS } from "@/data/digest-pack";
import {
  CADENCE_MS,
  isDigestDue,
  nextDue,
  packStamp,
  renderPlan,
} from "@/lib/digest-pack";
import { readDigestLast } from "@/lib/digest-pack-disk";
import { nonDroppedCopy, refreshDigest } from "@/lib/digest-refresh";
import { runDigestTick } from "@/lib/digest-tick";

const NOW = Date.parse("2026-09-04T09:00:00Z");

function seedDesk(root: string) {
  const sage = join(root, "artifacts/sage");
  mkdirSync(sage, { recursive: true });
  writeFileSync(
    join(sage, "CURRENT.json"),
    JSON.stringify(
      {
        schema: 1,
        id: "003",
        compiled_at: "2026-09-03T05:40:00Z",
        crawled_at: "2026-09-04T08:39:51Z",
        note: "Lead still hf-incident. No cycle 004.",
      },
      null,
      2,
    ) + "\n",
  );
}

describe("digest cadence (WIRE-DIGEST-CADENCE)", () => {
  let deskRoot: string;

  beforeEach(() => {
    deskRoot = mkdtempSync(join(tmpdir(), "sage-digest-cadence-"));
    seedDesk(deskRoot);
  });

  afterEach(() => {
    rmSync(deskRoot, { recursive: true, force: true });
  });

  test("missing digest-last → due; second run within 6h → HOLD", () => {
    expect(readDigestLast(deskRoot)).toBeNull();
    expect(isDigestDue(null, NOW).due).toBe(true);

    const first = runDigestTick({ deskRoot, now: NOW });
    expect(first.status).toBe("WROTE");
    if (first.status !== "WROTE") return;

    const last = readDigestLast(deskRoot);
    expect(last).not.toBeNull();
    expect(last!.pack_id).toBe(packStamp(NOW));
    expect(Date.parse(last!.next_at)).toBe(NOW + CADENCE_MS);

    const hold = runDigestTick({ deskRoot, now: NOW + 60 * 60 * 1000 });
    expect(hold.status).toBe("HOLD");
    if (hold.status === "HOLD") {
      expect(hold.next_at).toBe(last!.next_at);
    }

    // nextDue helper still agrees on last_at window
    const nd = nextDue(last!.last_at, NOW + 60 * 60 * 1000);
    expect(nd.due).toBe(false);
  });

  test("overdue tick writes pack JSON+md; lead hf-incident; drop/stigmergy present", () => {
    const wrote = runDigestTick({ deskRoot, now: NOW });
    expect(wrote.status).toBe("WROTE");
    if (wrote.status !== "WROTE") return;

    expect(existsSync(wrote.paths.packJsonPath)).toBe(true);
    expect(existsSync(wrote.paths.packMdPath)).toBe(true);
    expect(existsSync(wrote.paths.cycleJsonPath)).toBe(true);
    expect(existsSync(wrote.paths.cycleMdPath)).toBe(true);

    const pack = JSON.parse(readFileSync(wrote.paths.packJsonPath, "utf8")) as {
      cycle: string;
      lead_id: string;
      plan: ReturnType<typeof renderPlan>;
    };
    expect(pack.cycle).toBe("003");
    expect(pack.lead_id).toBe("hf-incident");
    expect(Array.isArray(pack.plan)).toBe(true);
    const lead = pack.plan.find((p) => p.kind === "lead");
    expect(lead?.file).toBe("hf-incident");

    const digest = JSON.parse(readFileSync(wrote.paths.cycleJsonPath, "utf8")) as {
      items: typeof DIGEST_ITEMS;
      dropped: string[];
    };
    const stig = digest.items.find((i) => i.id === "stigmergy");
    expect(stig?.kind).toBe("drop");
    expect(digest.dropped.some((d) => /stigmergy/i.test(d))).toBe(true);

    const md = readFileSync(wrote.paths.packMdPath, "utf8");
    expect(md).toContain("# SAGE digest pack");
    expect(md).toContain("## Dropped");
  });

  test("no civilizations in non-Dropped lead/companion/rest copy", () => {
    const r = refreshDigest({ now: NOW, deskRoot });
    const blob = nonDroppedCopy(r.items);
    expect(blob.toLowerCase()).not.toContain("civilizations");
    for (const item of r.items.filter((i) => i.kind !== "drop")) {
      expect(item.title.toLowerCase()).not.toContain("civilizations");
      expect(item.take.toLowerCase()).not.toContain("civilizations");
    }
  });

  test("Brief pins untouched (003 / hf-incident); Astra companion; no 004", () => {
    const beforePins = JSON.stringify(CYCLE.pins);
    const wrote = runDigestTick({ deskRoot, now: NOW });
    expect(wrote.status).toBe("WROTE");
    if (wrote.status === "WROTE") {
      expect(wrote.cycleId).toBe("003");
      expect(wrote.leadId).toBe("hf-incident");
    }
    expect(JSON.stringify(CYCLE.pins)).toBe(beforePins);
    expect(CYCLE.id).toBe("003");
    expect(CYCLE.pins.find((p) => p.kind === "lead")?.id).toBe("hf-incident");

    const digest = JSON.parse(
      readFileSync(join(deskRoot, "artifacts/sage/digest-003.json"), "utf8"),
    ) as { items: typeof DIGEST_ITEMS; cycle: string };
    expect(digest.cycle).toBe("003");
    const astra = digest.items.find((i) => i.id === "astra-depth");
    expect(astra?.kind).toBe("companion");
    expect(astra?.file).toBe("astra");
  });

  test("does not require browser localStorage", () => {
    // tick path is pure disk — no global localStorage access
    const g = globalThis as { localStorage?: unknown };
    const had = g.localStorage;
    // @ts-expect-error intentional delete for isolation
    delete g.localStorage;
    try {
      const r = runDigestTick({ deskRoot, now: NOW });
      expect(r.status).toBe("WROTE");
      expect(readDigestLast(deskRoot)?.pack_id).toBe(packStamp(NOW));
    } finally {
      if (had !== undefined) g.localStorage = had;
    }
  });

  test("refresh is append-only on baseline prose (Scout field map)", () => {
    const base = DIGEST_ITEMS.find((i) => i.id === "hf-swarm")!;
    const r = refreshDigest({ now: NOW, deskRoot });
    const lead = r.items.find((i) => i.id === "hf-swarm")!;
    expect(lead.title).toBe(base.title);
    expect(lead.take).toBe(base.take);
    expect(lead.why).toBe(base.why);
    expect(lead.move).toBe(base.move);
    expect(lead.file).toBe("hf-incident");
    // may have appended evidence/refs
    expect(lead.evidence.length).toBeGreaterThanOrEqual(base.evidence.length);
  });
});
