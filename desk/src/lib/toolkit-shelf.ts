/** PASS-U U4 — Toolkit shelf rows: human name · short host path · GitHub/OWASP chip · 2–3 buckets; OWASP near-dupes → one row.
 *  Static map only (no network). Lazy chunk (Digest lane) — never First Load. */
export type ToolkitRow = { href: string; name: string; path: string; chip: "GitHub" | "OWASP" | "Web"; bucket: "OWASP" | "Scanners" | "Other"; purpose?: string };

// [match, family key, name, bucket, purpose]
const MAP: [RegExp, string, string, ToolkitRow["bucket"], string][] = [
  [/modsecurity/i, "modsec", "ModSecurity", "OWASP", "Open-source WAF engine"],
  [/automated-threats/i, "autothreats", "OWASP Automated Threats", "OWASP", "Bot / abuse threat taxonomy"],
  [/virtual[_-]?patching/i, "vpatch", "Virtual Patching", "OWASP", "WAF virtual-patch practice"],
  [/owasp-crs|coreruleset/i, "crs", "OWASP Core Rule Set", "OWASP", "WAF rule set"],
  [/activescan/i, "activescan", "ActiveScan++", "Scanners", "Burp active-scan add-on"],
  [/cspbypass/i, "cspbypass", "CSPBypass", "Scanners", "CSP bypass gadget list"],
  [/caido-scanner/i, "caido", "Caido scanner", "Scanners", "Caido scan plugin"],
  [/sandbox-probe/i, "sbprobe", "sandbox-probe", "Scanners", "Probe agent sandboxes"],
  [/hyperagent/i, "hyperagent", "hyperagent", "Other", "Sandboxed agent runtime"],
];

const TOOL_REASONS = new Set(["toolkit", "toolkit-github", "github-search-shelf"]);

export function toolkitRows(shelf: readonly { href: string; reason: string }[]): ToolkitRow[] {
  const seen = new Set<string>();
  const out: ToolkitRow[] = [];
  for (const s of shelf) {
    if (!TOOL_REASONS.has(s.reason)) continue;
    let u: URL;
    try {
      u = new URL(s.href);
    } catch {
      continue;
    }
    const host = u.hostname.replace(/^www\./, "");
    const segs = u.pathname.split("/").filter(Boolean);
    const m = MAP.find(([re]) => re.test(s.href));
    const fam = m ? m[1] : host === "github.com" ? segs.slice(0, 2).join("/").toLowerCase() : s.href;
    if (seen.has(fam)) continue;
    seen.add(fam);
    const owasp = /(^|\.)owasp\.org$/.test(host);
    const p = `${host}/${segs.slice(0, 2).join("/")}`;
    out.push({
      href: s.href,
      name: m?.[2] ?? segs[1] ?? segs[0] ?? host,
      path: p.length > 34 ? `${p.slice(0, 33)}…` : p,
      chip: host === "github.com" ? "GitHub" : owasp ? "OWASP" : "Web",
      bucket: m?.[3] ?? (/owasp/i.test(s.href) ? "OWASP" : "Other"),
      purpose: m?.[4],
    });
  }
  const order = ["OWASP", "Scanners", "Other"];
  return out.sort((a, b) => order.indexOf(a.bucket) - order.indexOf(b.bucket));
}
