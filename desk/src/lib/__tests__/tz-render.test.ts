/**
 * B1 · Cloudflare builds on UTC and the static page freezes what it renders. Every clock time must be
 * Istanbul (Intl, timeZone Europe/Istanbul, label UTC+3) whatever the host TZ, and the static HTML must
 * carry absolute times only (relative AGE is swapped in after mount).
 */
import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { istDateTime, istHHMM, istHHMMSS } from "@/lib/ist-time";
import { windowLabel } from "@/lib/topic-heat";

const DESK = join(import.meta.dir, "../../..");

/** Independent oracle: Istanbul has been fixed UTC+3 (no DST) since 2016. */
function oracleHHMM(iso: string): string {
  const d = new Date(Date.parse(iso) + 3 * 3_600_000);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

function render(tz: string) {
  const p = Bun.spawnSync(["bun", "src/lib/__tests__/fixtures/tz-render.tsx"], {
    cwd: DESK,
    env: { ...process.env, TZ: tz, NODE_ENV: "production" },
  });
  if (p.exitCode !== 0) throw new Error(p.stderr.toString());
  const line = p.stdout.toString().trim().split("\n").pop()!;
  return JSON.parse(line) as {
    tz: string;
    hostHour: number;
    ages: { at: string; text: string }[];
    paused: string | null;
    built: string | null;
    hasZ: boolean;
    hasRelAge: boolean;
    html: string;
  };
}

describe("Istanbul clock times (Intl, host TZ ignored)", () => {
  test("formatters", () => {
    expect(istHHMM("2026-09-25T11:16:08Z")).toBe("14:16");
    expect(istHHMMSS("2026-09-25T11:16:08Z")).toBe("14:16:08");
    expect(istDateTime("2026-09-25T22:30:00Z")).toBe("2026-09-26 01:30");
    expect(istHHMM("nope")).toBe("—");
    expect(windowLabel(Date.parse("2026-09-25T11:00:00Z"))).toBe("14");
    expect(windowLabel(Date.parse("2026-09-24T23:00:00Z"))).toBe("02");
  });

  test("static desk HTML under TZ=UTC shows Istanbul times — identical to TZ=Asia/Tokyo", () => {
    const utc = render("UTC");
    const tokyo = render("Asia/Tokyo");
    expect(utc.hostHour).toBe(0); // the child really ran on UTC
    expect(tokyo.hostHour).toBe(9);
    expect(utc.ages.length).toBeGreaterThan(20);
    for (const a of utc.ages) expect(a.text).toBe(oracleHHMM(a.at)); // absolute "HH:MM", 5 chars
    for (const a of utc.ages) expect(a.text).toHaveLength(5);
    expect(utc.paused).toBe("03:00"); // 2026-09-26T00:00Z
    expect(utc.built).toBe("2026-09-25 15:58");
    expect(utc.hasZ).toBe(false); // no raw "HH:MMZ" UTC clock left anywhere
    expect(utc.hasRelAge).toBe(false); // no relative AGE baked into static HTML
    expect(tokyo.html).toBe(utc.html); // host TZ has zero effect on the prerender
  }, 30_000);
});
