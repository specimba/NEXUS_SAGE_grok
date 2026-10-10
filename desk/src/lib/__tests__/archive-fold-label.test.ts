import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { archiveFoldLabel } from "../archive-fold";

describe("archive fold header label", () => {
  test("reflects open / closed state", () => {
    expect(archiveFoldLabel(true)).toBe("open");
    expect(archiveFoldLabel(false)).toBe("closed");
  });
  test("desk renders the label from state, not a hardcoded '· closed'", () => {
    const src = readFileSync(join(import.meta.dir, "../../components/sage/desk.tsx"), "utf8");
    expect(src).not.toMatch(/pins · closed/);
    expect(src).toMatch(/archiveFoldLabel\(open\)/);
    expect(src).toMatch(/setOpen\(e\.currentTarget\.open\)/);
  });
});
