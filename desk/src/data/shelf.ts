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
  { href: "https://arxiv.org/abs/2610.32982", label: "arxiv.org/abs/2610.32982", reason: "arxiv-shelf" as const },
  { href: "https://arxiv.org/abs/2610.32978", label: "arxiv.org/abs/2610.32978", reason: "arxiv-shelf" as const },
  { href: "https://arxiv.org/abs/2610.32971", label: "arxiv.org/abs/2610.32971", reason: "arxiv-shelf" as const },
  { href: "https://arxiv.org/abs/2610.32969", label: "arxiv.org/abs/2610.32969", reason: "arxiv-shelf" as const },
  { href: "https://arxiv.org/abs/2610.32964", label: "arxiv.org/abs/2610.32964", reason: "arxiv-shelf" as const },
  { href: "https://github.com/Shashank-VK/agent-harness-eval", label: "Shashank-VK/agent-harness-eval", reason: "github-search-shelf" as const },
  { href: "https://github.com/RitikPatill/agent-eval-lab-1792425379", label: "RitikPatill/agent-eval-lab-1792425379", reason: "github-search-shelf" as const },
  { href: "https://github.com/becominggiant/agent-eval-harness", label: "becominggiant/agent-eval-harness", reason: "github-search-shelf" as const },
  { href: "https://github.com/haggyroth/pokemon-agent", label: "haggyroth/pokemon-agent", reason: "github-search-shelf" as const },
  { href: "https://github.com/SudeepKarthik30/AgentSentinel-Enterprise-Agent-Evaluation-Policy-Guardrail-Harness", label: "SudeepKarthik30/AgentSentinel-Enterprise-Agent-Evaluation-Policy-Guardra", reason: "github-search-shelf" as const },
];
