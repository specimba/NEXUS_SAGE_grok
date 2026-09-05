/**
 * HF daily_papers merge — public API only, sort by upvotes.
 * Gen/sim tops (StudentSim, DreamX) must NOT displace kept agent papers.
 */

export type Paper = {
  id: string;
  title: string;
  up: number;
  href: string;
  abstract?: string;
  /** Populated by arXiv Atom enrich (optional). */
  pdfUrl?: string;
  authors?: string[];
  primaryCategory?: string;
  /** OpenAlex Papers enrich (optional) — id/year/DOI metadata. */
  doi?: string | null;
  year?: number | null;
  openalexId?: string;
  /** Secondary OpenAlex-only row (never Brief; never displaces HF agent keeps). */
  openalexEnrichOnly?: boolean;
  /** Crossref Papers DOI enrich (optional) — registered DOI / issued / type. */
  crossrefDoi?: string | null;
  crossrefIssued?: string | null;
  crossrefType?: string | null;
  crossrefUrl?: string | null;
  /** Secondary Crossref-only row (never Brief; never displaces HF agent keeps). */
  crossrefEnrichOnly?: boolean;
};

/** Titles / ids treated as generative-sim — may top the board without kicking agent papers. */
const GEN_SIM_RE =
  /\b(studentsim|dreamx|student\s*sim(?:ulator)?s?|generative\s+sim(?:ulation)?|world\s+sim(?:ulator)?)\b/i;

/** Agent / skill / harness class — protected when a gen/sim paper tops the day. */
const AGENT_RE =
  /\b(repo-to-skill|agent(?:ic)?|harness|tool[- ]?use|coding\s+agents?|ai4ai\s+skills?|retrieved\s+skills?)\b/i;

export function isGenSimPaper(p: Pick<Paper, "title" | "id">): boolean {
  return GEN_SIM_RE.test(p.title) || GEN_SIM_RE.test(p.id);
}

export function isAgentPaper(p: Pick<Paper, "title" | "id">): boolean {
  return AGENT_RE.test(p.title) || /^repo-to-skill$/i.test(p.id);
}

export function sortByUpvotes(papers: Paper[]): Paper[] {
  return [...papers].sort((a, b) => b.up - a.up || a.id.localeCompare(b.id));
}

/**
 * Merge live HF daily papers with an optional kept-agent set.
 * If the day's upvote top is gen/sim, every kept agent paper remains in the
 * result (displacing the lowest non-agent, non-kept slots — never another kept agent).
 */
export function mergeDailyPapers(
  live: Paper[],
  opts: { keptAgent?: Paper[]; limit?: number } = {},
): Paper[] {
  const limit = Math.max(1, opts.limit ?? 8);
  const sorted = sortByUpvotes(live);
  const kept = opts.keptAgent ?? live.filter(isAgentPaper);

  const keptUnique = dedupeById(kept.filter(isAgentPaper));
  const top = sorted[0];
  const protect = Boolean(top && isGenSimPaper(top) && keptUnique.length > 0);

  if (!protect) {
    return sorted.slice(0, limit);
  }

  // Seed with top-N by upvotes
  const out = sorted.slice(0, limit);
  const ids = new Set(out.map((p) => p.id));

  for (const k of keptUnique) {
    if (ids.has(k.id)) continue;
    // Prefer live copy if present (fresher upvotes)
    const liveCopy = sorted.find((p) => p.id === k.id) ?? k;
    // Displace lowest non-agent that is not itself a kept agent
    let displaced = false;
    for (let i = out.length - 1; i >= 0; i--) {
      const slot = out[i]!;
      const slotIsKeptAgent = keptUnique.some((x) => x.id === slot.id) || isAgentPaper(slot);
      if (slotIsKeptAgent) continue;
      out[i] = liveCopy;
      ids.add(liveCopy.id);
      displaced = true;
      break;
    }
    if (!displaced) {
      out.push(liveCopy);
      ids.add(liveCopy.id);
    }
  }

  return sortByUpvotes(out).slice(0, Math.max(limit, keptUnique.length));
}

function dedupeById(papers: Paper[]): Paper[] {
  const seen = new Set<string>();
  const out: Paper[] = [];
  for (const p of papers) {
    if (seen.has(p.id)) continue;
    seen.add(p.id);
    out.push(p);
  }
  return out;
}

/** Normalize a raw HF daily_papers row (public API shape). */
export function normalizeHfRow(row: unknown): Paper | null {
  if (!row || typeof row !== "object") return null;
  const r = row as Record<string, unknown>;
  const paper = (r.paper && typeof r.paper === "object" ? r.paper : r) as Record<
    string,
    unknown
  >;
  const id = String(paper.id ?? "");
  const title = String(paper.title ?? r.title ?? "");
  if (!id || !title) return null;
  const up = Number(paper.upvotes ?? r.upvotes ?? r.numUpvotes ?? 0);
  const abstract =
    typeof paper.summary === "string"
      ? paper.summary
      : typeof r.summary === "string"
        ? r.summary
        : undefined;
  return {
    id,
    title,
    up: Number.isFinite(up) ? up : 0,
    href: `https://arxiv.org/abs/${id}`,
    abstract,
  };
}

export const HF_DAILY_PAPERS_URL = "https://huggingface.co/api/daily_papers";
