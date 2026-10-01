/**
 * OPS status block for refs/OPS-A1-A3-AUTOMATION.md.
 *
 * The A1 run used to APPEND a "## A1 dry-run evidence" section on every crawl (42 copies by
 * 2026-10-01). Now one marker-delimited block is REPLACED in place with a single current line:
 * last crawl · last pack · last A2 result. Running it any number of times leaves exactly one block.
 * Legacy appended evidence sections are stripped on write so a stale caller can't regrow the spam.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";

export const OPS_BEGIN = "<!-- OPS-STATUS:BEGIN -->";
export const OPS_END = "<!-- OPS-STATUS:END -->";

const BLOCK_RE = /\n*<!-- OPS-STATUS:BEGIN -->[\s\S]*?<!-- OPS-STATUS:END -->\n*/g;
// "## A1 dry-run evidence (…)" heading followed only by blank lines / "- " bullet lines.
const LEGACY_RE = /\n*^## A1 dry-run evidence \([^)\n]*\)\n(?:[ \t]*\n|- [^\n]*(?:\n|$))*/gm;

/** Strip the per-run appended "## A1 dry-run evidence" sections. */
export function stripLegacyEvidence(src) {
  return src.replace(LEGACY_RE, "\n\n");
}

/** Last terminal A2 result from logs/a2-digest.log text → "HOLD — no pack:export (2026-10-01T15:20Z)". */
export function lastA2Result(logText) {
  if (!logText) return "unknown (no A2 log)";
  const lines = logText.trimEnd().split("\n");
  for (let i = lines.length - 1; i >= 0; i--) {
    const m = lines[i].match(/^\[(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})[^\]]*\]\s+(?:A2 )?((?:OK|HOLD|SKIP|FAIL) — .*)$/);
    if (m) {
      const text = m[2].replace(/\s+·\s+sha256=[0-9a-f]+/, "").slice(0, 120);
      return `${text} (${m[1]}Z)`;
    }
  }
  return "unknown (no terminal A2 line)";
}

export function renderOpsStatusLine({ crawlAt, pack, a2, updatedAt }) {
  return `- **Updated** \`${updatedAt}\` · **last crawl** \`${crawlAt || "unknown"}\` · **last pack** \`${pack || "unknown"}\` · **last A2** ${a2 || "unknown"}`;
}

export function renderOpsBlock(line) {
  return [
    OPS_BEGIN,
    "## OPS status (auto · replaced each A1 run, not appended)",
    "",
    line,
    "",
    "Run history lives in `logs/a1-stale-ingest.log`, `logs/a2-digest.log` and the crawl commits; dry-run checklist in `refs/A1-DRY-RUN.md`.",
    OPS_END,
  ].join("\n");
}

/** Replace (or create) the single status block; drop legacy appended evidence and any duplicate blocks. */
export function upsertOpsStatus(src, line) {
  const block = renderOpsBlock(line);
  const cleaned = stripLegacyEvidence(src);
  const first = cleaned.search(/<!-- OPS-STATUS:BEGIN -->/);
  let out;
  if (first >= 0) {
    let placed = false;
    out = cleaned.replace(BLOCK_RE, () => {
      if (placed) return "\n\n";
      placed = true;
      return `\n\n${block}\n\n`;
    });
  } else {
    out = `${cleaned.trimEnd()}\n\n${block}\n`;
  }
  return out.replace(/\n{3,}/g, "\n\n").replace(/^\n+/, "").trimEnd() + "\n";
}

/**
 * Update the OPS file in place. Returns the new text, or null if the file is missing.
 * @param {{ opsPath: string, crawlAt: string, pack: string, a2LogPath?: string, now?: Date }} o
 */
export function writeOpsStatus({ opsPath, crawlAt, pack, a2LogPath, now = new Date() }) {
  if (!existsSync(opsPath)) return null;
  const a2Log = a2LogPath && existsSync(a2LogPath) ? readFileSync(a2LogPath, "utf8") : "";
  const line = renderOpsStatusLine({
    crawlAt,
    pack,
    a2: lastA2Result(a2Log),
    updatedAt: now.toISOString().replace(/\.\d+Z$/, "Z"),
  });
  const prev = readFileSync(opsPath, "utf8");
  const next = upsertOpsStatus(prev, line);
  if (next !== prev) writeFileSync(opsPath, next, "utf8");
  return next;
}
