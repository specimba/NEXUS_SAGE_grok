/**
 * Synthetic WORST-CASE desk-view input: every source at its DESK_VIEW_CAPS item cap, X / papers at their caps,
 * every field at its max length, Wire at WIRE_MAX rows (all pinned), links as incompressible as real Google News
 * URLs. Deterministic (seeded). Used by desk-view.test.ts (budget assertion) and the one-off worst-case build proof.
 */
import { DESK_VIEW_CAPS, defaultBadge, type DeskViewInput } from "@/lib/desk-view";
import type { DeskViewExtras } from "@/lib/desk-view-module";
import { LEAD_LOG_CAPS, type LeadLog } from "@/lib/lead-log";
import { WIRE_MAX } from "@/lib/wire";
import type { PulseMemberInfo } from "@/lib/pulse-v5";

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 800 English / tech words (2026-10-03 crawl vocabulary, frozen) — real-text letter mix, random order ⇒ few long matches. */
const WORDS = [
  "0-click", "10", "100", "11", "13", "14", "2026", "38", "3B", "3D", "50", "60", "64GB", "AI", "API", "AWS",
  "Accelerating", "Access", "Across", "Action", "Agent", "Agentic", "Agents", "Albertsons", "Algorithms", "All",
  "AlphaGenome", "An", "And", "Android", "Anthropic", "Applications", "Argo-Bench", "Argon", "As", "Asia", "Ask",
  "Astra", "At", "Atlas", "Australian", "Authored", "Authors", "Automatic", "Automating", "Beam", "Because",
  "Benchmark", "Better", "Bio", "Bits", "Blackwell", "Broadening", "Build", "Building", "But", "CARE-X", "Cactus",
  "California", "Can", "Centre", "Challenging", "ChatGPT", "Chatham", "Chegg", "Chinese", "Christina", "Claude",
  "Claude-Shaped", "Clinically", "Cloudera", "Codex", "Compute", "Conscious", "CoreWeave", "DGX", "DNA", "DSX", "Data",
  "Day", "Debate", "Decentralized", "Decision", "DeepMind", "Defender", "Design", "Detection", "DevDay", "DevFest",
  "Developers", "Diffusion", "Dissect", "Distillation", "Do", "Don't", "Dots", "Dumbest", "E-MoE", "EDR", "Each",
  "Earth", "Economy", "Education", "Efficient", "Enclaves", "Endpoint", "Enhanced", "Enterprise", "Erik", "European",
  "Every", "Explore", "FTC", "Face", "Factories", "Fewer", "Fine-Tuning", "Fiza", "Flash", "Flow", "For",
  "Forecasting", "Fox-IT", "From", "Frontier", "Future", "GDPO", "GPT-6", "GPT-61", "GPU", "GPUs", "GRPO", "Gemini",
  "General", "Generating", "Generation", "Generative", "GetProcessHandleFromHwnd", "Gifted", "GigaPath-Flash",
  "GigaTIME-Flash", "Gives", "Google", "Googles", "Graduate", "Group", "HN", "HTTP", "Hacked", "Has", "Help", "How",
  "However", "Hu", "Hugging", "In", "Inference", "Instead", "Intelligence", "Introducing", "Introduction", "Is",
  "Isaac", "It", "Its", "James", "KMS", "Koch", "Koomen", "LLM", "LLMs", "Labs", "Language", "Last", "Launches",
  "Lazarus", "Learn", "Learning", "Linux", "Live", "LoRA", "Local", "Loop", "Looped", "MCP", "MLLMs", "MPC", "Made",
  "Major", "Making", "Malware", "Management", "Manyika", "Mapping", "Master-Mind", "Measurement", "Memory", "Meta",
  "Meta's", "Mick", "Microsoft", "MindTopo", "Mistral", "Mixture-of-Experts", "Model", "Models", "More", "Most",
  "Mozilla", "Multi-Reward", "Multidisciplinary", "Multimodal", "Muse", "Mutational", "NCC", "NVIDIA", "Navigate",
  "Neighborhood", "New", "News", "Nitro", "Not", "Now", "OPSD", "Offloaded", "Omni-Embed-Mini", "On-Policy",
  "On-policy", "One", "OneStreamer", "Open", "OpenAI", "OpenAIs", "OpenTumorBoard", "Opens", "Orchard", "Our", "Part",
  "Patch", "Penske", "Persona", "PersonaDose", "PhysVista", "Pixel", "Planet", "Preference", "Prison", "Private",
  "Proactive", "Proof", "Provenance", "Python", "Quine", "Qwen3-8B", "ROS", "Radiology", "Real-World", "Real-world",
  "Recent", "Research", "Researchers", "RetroChimera", "Reward", "Robostral", "Robot", "Robotics", "Rogue", "Rust",
  "SAML", "SDK", "SILSA", "Safety", "Sakeena", "Scale", "Schamper", "Science", "Search", "Security",
  "Self-Distillation", "September", "Shieldstral", "Show", "Signal", "Since", "Singapore", "Skala", "Skills", "Sol",
  "Source", "Spark", "State", "Streaming", "Subpoenas", "Supervision", "SynthID", "TEEs", "Tabular", "Tech",
  "TensorRT", "That", "The", "Their", "Theorem", "Theory", "They", "Thinking", "This", "Three", "Times", "To",
  "Tokens", "Toward", "Towards", "Trail", "Training", "Transformers", "Triggered", "UI", "UN", "Ultrafast", "Uniswap",
  "Useful", "VLMs", "VM", "Video", "Vision", "Vultur", "Watch", "Ways", "We", "We're", "Were", "What", "When", "While",
  "Why", "Window", "Windows", "With", "Without", "Work", "XPRIZE", "Yann", "Yet", "Your", "Yun", "Zheng", "abilities",
  "about", "academia", "accelerate", "access", "accessible", "accuracy", "accurate", "across", "act", "action",
  "actions", "activities", "activity", "add", "adding", "advanced", "advancing", "advantage", "advantages", "after",
  "against", "age", "agent", "agentic", "agents", "aggregate", "alerts", "all", "allowing", "along", "already", "an",
  "analysis", "analytics", "and", "announced", "antitrust", "antivirus", "any", "app", "application", "applications",
  "approach", "approaches", "architectural", "architecture", "are", "as", "aspect", "at", "available", "back", "be",
  "becomes", "becoming", "been", "before", "behavior", "behavioral", "behind", "benchmark", "benchmarks", "between",
  "beyond", "billion", "biological", "biology", "blog", "bloggoogle", "breakthroughs", "bringing", "browser", "bug",
  "bugs", "build", "builders", "built", "businesses", "but", "by", "campaign", "can", "capabilities", "capital",
  "caption", "capture", "cases", "chain", "challenge", "challenges", "client", "cloud", "code", "codebase", "coding",
  "coming", "community", "companies", "competence", "complete", "complex", "complexity", "computation",
  "computational", "compute", "computing", "conditions", "consistency", "constraints", "contain", "context",
  "continuous", "control", "controller", "cooling", "coordinated", "corrections", "corresponding", "costly", "could",
  "covers", "create", "creates", "creator", "cryptocurrency", "custom", "customers", "cyber", "cybersecurity", "data",
  "days", "decoding", "dense", "depth", "design", "developers", "different", "distillation", "do", "documents",
  "during", "earlier", "effective", "either", "embedding", "energy", "engineers", "enough", "enterprise", "era",
  "evaluate", "even", "events", "every", "everyday", "evidence", "execution", "existing", "expensive", "experts",
  "exploits", "explore", "expression", "external", "factory", "fast", "faster", "feedback", "few", "file", "financial",
  "find", "first", "fit", "fix", "fixed", "floor", "follow", "for", "form", "found", "foundation", "framework", "from",
  "frontier", "frozen", "future", "generate", "generation", "generative", "get", "getting", "global", "goal",
  "grammar", "groups", "has", "have", "help", "helps", "hours", "how", "human", "image", "images", "improve", "in",
  "incident", "incidents", "including", "increasingly", "industry", "inference", "information", "infrastructure",
  "inside", "instead", "intelligence", "into", "introduce", "introduces", "is", "issues", "it", "its", "joint", "just",
  "keep", "key", "known", "lab", "language", "large", "latest", "layer", "learned", "learning", "less", "lets", "like",
  "limited", "lines", "lives", "local", "locally", "look", "loops", "make", "making", "malicious", "many", "may",
  "memory", "minutes", "model", "models", "molecules", "more", "most", "multimodal", "multiple", "must", "need",
  "needs", "never", "new", "news", "next", "not", "objectives", "of", "often", "on", "one", "only", "open",
  "open-source", "opens", "or", "organizations", "our", "out", "over", "own", "paper", "parameter", "part",
  "partnering", "path", "perception", "performance", "persona", "physical", "planning", "plans", "policy", "positions",
  "possible", "post", "posts", "power", "powerful", "prediction", "predictive", "pretrained", "pretraining", "private",
  "privileged", "process", "production", "professional", "progress", "proteins", "provides", "public", "published",
  "range", "reaches", "read", "real", "real-world", "reasoning", "recently", "record", "recurrent", "reference",
  "rejects", "relative", "reliably", "remains", "report", "reported", "requested", "require", "requires", "research",
  "researchers", "response", "responses", "results", "retrieval", "reward", "rewards", "right", "risks", "robotics",
  "rollout", "run", "safety", "same", "sample", "sampling", "satisfy", "says", "scale", "science", "search", "secure",
  "security", "server", "servers", "service", "set", "setting", "several", "shared", "short", "single", "sits",
  "skills", "small", "smaller", "so", "software", "sovereign", "space", "spatial", "standard", "still", "strong",
  "structure", "students", "study", "subgroup", "such", "support", "system", "systems", "target", "task", "tasks",
  "teacher", "team", "technology", "text", "than", "that", "the", "their", "them", "then", "these", "they", "this",
  "through", "time", "to", "today", "together", "token", "tokens", "too", "tools", "train", "trained", "training",
  "two", "typically", "under", "understand", "unified", "until", "up", "use", "uses", "using", "validation", "verify",
  "via", "video", "visual", "was", "way", "we", "weather", "weights", "what", "when", "where", "whether", "which",
  "while", "will", "with", "without", "work", "workflows", "world", "year", "yet", "you", "your",
];

export function synth(seed = 7) {
  const r = rng(seed);
  const pick = <T,>(a: readonly T[]) => a[Math.floor(r() * a.length)]!;
  const text = (n: number) => {
    let s = "";
    while (s.length < n) s += (s ? " " : "") + pick(WORDS);
    return s.slice(0, n);
  };
  const b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  const blob = (n: number) => Array.from({ length: n }, () => pick([...b64])).join("");
  const url = (n: number) => `https://news.google.com/rss/articles/${blob(n - 37)}`;
  const iso = (k: number) => new Date(Date.UTC(2026, 9, 3, 7, 0, 0) - k * 61_000).toISOString().replace(".000Z", "Z");
  const C = DESK_VIEW_CAPS.chars;

  const members: Record<string, PulseMemberInfo> = {};
  const gnews: { id: string; title: string; publisher: string }[] = [];
  const clusters: DeskViewInput["clusters"][number][] = [];
  const srcName: Record<string, string> = { hn: "hn-algolia", gnews: "gnews", rss: "rss", "rss-sec": "rss-sec" };
  let k = 0;
  for (const [src, cap] of Object.entries(DESK_VIEW_CAPS.items)) {
    const ids: string[] = [];
    for (let n = 0; n < cap; n++) {
      const id = src === "hn" ? `hn:${50_000_000 + k}` : src === "gnews" ? `gnews:${blob(16)}` : `${src}:${text(12).replace(/\W/g, "")}lab:${blob(16)}`;
      const publisher = text(C.publisher);
      members[id] = {
        badge: defaultBadge(id, publisher) ?? "HN",
        publisher,
        title: text(C.title),
        at: iso(k++),
        url: url(C.url),
        summary: text(400),
        ...(src === "hn" ? { score: 999 } : {}),
        ...(src === "rss-sec" ? { security: true } : {}),
      };
      if (src === "gnews") gnews.push({ id, title: `${text(C.title)} - ${publisher}`, publisher });
      ids.push(id);
    }
    // ~1 story in 4 groups 3 items (multi-source chips + member lists; seeded); the rest are single.
    for (let n = 0; n < ids.length; ) {
      const size = r() < 0.25 && n + 3 <= ids.length ? 3 : 1;
      const mids = ids.slice(n, n + size);
      const lead = mids[0]!;
      clusters.push({
        id: `cl:${lead}`, title: text(C.title), url: url(C.url), lead_id: lead, lead_source: srcName[src]!,
        sources: size > 1 ? [srcName[src]!, "gnews", "hn-algolia"] : [srcName[src]!], member_ids: mids, size,
        at: members[lead]!.at!, first_seen: iso(n * 7), is_new: n % 9 === 0,
      });
      n += size;
    }
  }
  const xPosts = Array.from({ length: DESK_VIEW_CAPS.xPosts }, (_, n) => ({ id: `@${blob(14)}`, take: text(C.take), href: `https://x.com/${blob(C.xUrl - 14)}`, at: iso(n) }));
  // Same shape memberInfo() gives X posts: summary = `take — text`, url = href.
  for (const p of xPosts) members[`x:${p.id}`] = { badge: "X", publisher: `@${text(C.publisher - 1)}`, summary: `${p.take} — ${text(400)}`, url: p.href, score: 99_999 };
  const papers = Array.from({ length: DESK_VIEW_CAPS.papers }, (_, n) => ({
    id: `26${10 - (n % 2)}.${String(10_000 + n * 37).padStart(5, "0")}`, title: text(C.paperTitle), up: 999,
    href: `https://arxiv.org/abs/${blob(C.paperUrl - 22)}`, abstract: text(900), pdfUrl: `https://arxiv.org/pdf/${blob(C.paperUrl - 22)}`,
    primaryCategory: "cs.CL", crossrefDoi: `10.48550/${blob(20)}`, year: 2026, openalexId: `W${blob(10)}`,
  }));
  const input: DeskViewInput = { clusters, members, gnews, xPosts, papers };

  // Small crawl modules at their producers' bounds: Wire at WIRE_MAX rows (pinned), today-sized rank / heat / health.
  const wire = clusters.slice(0, WIRE_MAX).map((c, n) => ({
    id: c.id, title: text(C.title), url: url(C.url), at: c.at, sources: 3, score: 99, member_ids: c.member_ids, is_new: false, rank: n + 1, prev_rank: null, status: "new" as const,
  }));
  return { input, wire };
}

/** Worst-case holotape: LEAD_LOG_CAPS days × passes × outs, every headline / detail at max. */
export function synthLeadLog(seed = 11): LeadLog {
  const r = rng(seed);
  const t = (n: number) => {
    let s = "";
    while (s.length < n) s += `${s ? " " : ""}${WORDS[Math.floor(r() * WORDS.length)]}`;
    return s.slice(0, n);
  };
  const C = LEAD_LOG_CAPS;
  return {
    lastAt: "2026-10-03T07:13:20.223Z",
    days: Array.from({ length: C.days }, (_, d) => ({
      date: `2026-09-${String(30 - d).padStart(2, "0")}`, state: "picked" as const, at: "2026-09-30T03:17:00Z",
      headline: t(C.headline), url: `https://example.com/${t(C.url - 20).replace(/ /g, "-")}`, sources: 9, sig: 99, pubs: [t(C.detail), t(C.detail), t(C.detail)],
      passes: Array.from({ length: C.passes }, () => ({
        at: "2026-09-30T03:17:00Z", held: false, lead: { headline: t(C.headline), sources: 9, sig: 99 },
        out: Array.from({ length: C.outs }, () => ({ code: "FILTER" as const, headline: t(C.headline), detail: t(C.detail) })), tags: ["manual", "catch-up"],
      })),
    })),
  };
}

/** Real today-sized extras with the Wire swapped for the synthetic WIRE_MAX rows. */
export function synthExtras(real: DeskViewExtras, wire: ReturnType<typeof synth>["wire"]): DeskViewExtras {
  return { ...real, WIRE_ROWS: wire };
}
