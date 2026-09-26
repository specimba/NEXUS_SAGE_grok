/** Operator toolkit + arXiv/RSS shelf — off Brief. Refresh via bun run ingest. */
export type ShelfItem = {
  href: string;
  label: string;
  reason: "toolkit" | "toolkit-github" | "arxiv-shelf" | "rss-lab-shelf" | "rss-security-shelf" | "github-search-shelf";
};

export const SHELF: ShelfItem[] = [
  { href: "https://github.com/albinowax/ActiveScanPlusPlus", label: "github.com/albinowax/ActiveScanPlusPlus", reason: "toolkit-github" as const },
  { href: "https://github.com/renniepak/CSPBypass", label: "github.com/renniepak/CSPBypass", reason: "toolkit-github" as const },
  { href: "https://github.com/rcbarnett/caido-scanner", label: "github.com/rcbarnett/caido-scanner", reason: "toolkit-github" as const },
  { href: "https://github.com/owasp/www-project-automated-threats-to-web-applications", label: "github.com/owasp/www-project-automated-threats-to-web-applications", reason: "toolkit-github" as const },
  { href: "https://github.com/owasp-modsecurity/ModSecurity", label: "github.com/owasp-modsecurity/ModSecurity", reason: "toolkit-github" as const },
  { href: "https://github.com/owasp-modsecurity/ModSecurity/releases/tag/v3.0.16", label: "github.com/owasp-modsecurity/ModSecurity/releases/tag/v3.0.16", reason: "toolkit-github" as const },
  { href: "https://github.com/OWASP/www-project-automated-threats-to-web-applications/tree/master/assets/files/EN", label: "github.com/OWASP/www-project-automated-threats-to-web-applications/tree/", reason: "toolkit-github" as const },
  { href: "https://github.com/fabiocicerchia/OWASP-CRS", label: "github.com/fabiocicerchia/OWASP-CRS", reason: "toolkit-github" as const },
  { href: "https://owasp.org/www-project-modsecurity/", label: "owasp.org/www-project-modsecurity/", reason: "toolkit" as const },
  { href: "https://owasp.org/www-project-automated-threats-to-web-applications/", label: "owasp.org/www-project-automated-threats-to-web-applications/", reason: "toolkit" as const },
  { href: "https://owasp.org/www-community/Virtual_Patching_Best_Practices", label: "owasp.org/www-community/Virtual_Patching_Best_Practices", reason: "toolkit" as const },
  { href: "https://cheatsheetseries.owasp.org/cheatsheets/Virtual_Patching_Cheat_Sheet.html", label: "cheatsheetseries.owasp.org/cheatsheets/Virtual_Patching_Cheat_Sheet.html", reason: "toolkit" as const },
  { href: "https://arxiv.org/abs/2609.30266", label: "arxiv.org/abs/2609.30266", reason: "arxiv-shelf" as const },
  { href: "https://arxiv.org/abs/2609.30264", label: "arxiv.org/abs/2609.30264", reason: "arxiv-shelf" as const },
  { href: "https://arxiv.org/abs/2609.30258", label: "arxiv.org/abs/2609.30258", reason: "arxiv-shelf" as const },
  { href: "https://arxiv.org/abs/2609.30250", label: "arxiv.org/abs/2609.30250", reason: "arxiv-shelf" as const },
  { href: "https://arxiv.org/abs/2609.30249", label: "arxiv.org/abs/2609.30249", reason: "arxiv-shelf" as const },
  { href: "https://github.com/hyperlight-dev/hyperagent", label: "hyperlight-dev/hyperagent", reason: "github-search-shelf" as const },
  { href: "https://github.com/aidan-mitchell-645/sandbox-escape-gb", label: "aidan-mitchell-645/sandbox-escape-gb", reason: "github-search-shelf" as const },
];
