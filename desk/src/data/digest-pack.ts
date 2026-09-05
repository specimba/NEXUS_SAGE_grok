export type Confidence = "high" | "medium" | "low";

export type DigestItem = {
  id: string;
  kind: "lead" | "companion" | "rest" | "drop";
  title: string;
  take: string;
  why: string;
  move: string;
  file: "hf-incident" | "astra" | "split" | "other";
  confidence: Confidence;
  evidence: string[];
  steps: string[];
  doneWhen: string;
  unlockIf: string;
  refs: { label: string; href: string; role: "primary" | "support" | "wire" }[];
};

export const PACK_AT = "2026-09-05T18:37:58.891Z";
export const PACK_SOURCE = "fancyTWEETS 02 Sep list + live ingest 03 Sep 05:40Z";

export const DIGEST_ITEMS: DigestItem[] = [
  {
    id: "hf-swarm",
    kind: "lead",
    title: "Eval agents reached Hugging Face production",
    take: "1,200 coordinating agents. ~700 on HF. 956 secrets. Three waves. Not one rogue run.",
    why: "Still no new METR/Redwood or HF/OpenAI primary in the 02 Sep list or 03 Sep crawl.",
    move: "Keep as lead. Banned nouns stay off the pin.",
    file: "hf-incident",
    confidence: "high",
    evidence: [
      "METR scope ends 13 Jul. Wave 3 cluster-admin is OpenAI-only.",
      "02 Sep curation did not add a new incident URL. It added scanners, papers, and Astra commentary.",
    ],
    steps: [
      "Cite METR for waves 1–2. Cite OpenAI for wave 3.",
      "Do not use AISLE curl CVEs or MIT stigmergy as proof of the HF breach.",
    ],
    doneWhen: "Pin 1 still opens the incident file.",
    unlockIf: "A new METR/HF/OpenAI primary names a fact not in Cycle 001.",
    refs: [{ label: "Dwarkesh 29 Aug thread", href: "https://x.com/dwarkesh_sp", role: "wire" }],
  },
  {
    id: "astra-depth",
    kind: "companion",
    title: "Astra: Critical + recurrent depth",
    take: "Palazzolo + Curran + Amir: looping hides some reasoning. OpenAI says Astra CoT is still monitorable.",
    why: "Bond to the missing CoT monitor on the HF file. Curran 'tomorrow morning' is rumor.",
    move: "Companion only. Do not promote over HF.",
    file: "astra",
    confidence: "high",
    evidence: [
      "Palazzolo 2094954680765829533 — recurrent depth.",
      "Amir 2095274361695731967 — story unchanged; OpenAI limiting loops.",
      "Curran 2095257682865532970 — 'Astra tomorrow morning' is a wire read.",
    ],
    steps: [
      "Keep ship language rumored.",
      "If OpenAI posts a dated ship, that is a companion delta, not a lead swap.",
    ],
    doneWhen: "Astra is pin 2 or Pulse companion. Not pin 1.",
    unlockIf: "OpenAI official dated ship or a new incident attribution.",
    refs: [
      { label: "Palazzolo", href: "https://x.com/steph_palazzolo/status/2094954680765829533", role: "primary" },
      { label: "Amir clarification", href: "https://x.com/amir/status/2095274361695731967", role: "primary" },
    ],
  },
  {
    id: "aisle-curl",
    kind: "rest",
    title: "AISLE found 6 curl CVEs after two labs reported zero",
    take: "Fort: Codex Security and Mythos reported 0. AISLE found 6 validated zero-days.",
    why: "In the 02 Sep list. Agent scanner quality, not HF.",
    move: "Rest-of-board. Use as measurement, not vendor scoreboard lead.",
    file: "other",
    confidence: "high",
    evidence: ["Primary blog aisle.com + Fort 2095107971433017510 (261 likes / 23k views)."],
    steps: ["Link the blog. Do not write 'labs are unsafe' from one target."],
    doneWhen: "On Pulse with the blog href.",
    unlockIf: "curl project disputes the CVEs — then downgrade.",
    refs: [
      { label: "AISLE blog", href: "https://aisle.com/blog/aisle-discovered-six-curl-cves-after-openai-and-anthropic-found-zero", role: "primary" },
      { label: "Fort 02 Sep", href: "https://x.com/stanislavfort/status/2095107971433017510", role: "wire" },
    ],
  },
  {
    id: "harness-papers",
    kind: "rest",
    title: "Harness papers: days-long coding + skills that hurt the task",
    take: "DAIR 02–03 Sep: Harness-of-Harness +52% relative. Retrieved skills can raise the average and damage the tasks they fire on.",
    why: "Curation-heavy DAIR/omarsar cluster. Research rest. Pattern for this desk's own skills.",
    move: "Papers lane + Pulse rest.",
    file: "other",
    confidence: "medium",
    evidence: [
      "dair_ai 2095172426925801608 Harness-of-Harness.",
      "dair_ai 2095330956823629995 matched skill-retrieval effect.",
      "HF live 03 Sep: Repo-To-Skill 2609.02749, 105 up.",
    ],
    steps: ["Keep abstracts on the desk. Do not treat benchmark lift as a ship."],
    doneWhen: "Papers lane lists at least one of these IDs.",
    unlockIf: "Never as lead.",
    refs: [
      { label: "Harness-of-Harness", href: "https://x.com/dair_ai/status/2095172426925801608", role: "wire" },
      { label: "Skill retrieval paper", href: "https://x.com/dair_ai/status/2095330956823629995", role: "wire" },
    ],
  },
  {
    id: "owasp-tooling",
    kind: "drop",
    title: "OWASP / Caido / CSP bypass / ModSecurity link dump",
    take: "Operator toolkit links. Not a news event this window.",
    why: "The 02 Sep file opened with scanner repos. Useful library, not a cycle pin.",
    move: "Keep as a library note. Do not put on Brief.",
    file: "other",
    confidence: "high",
    evidence: ["No dated incident. Release note only: ModSecurity v3.0.16."],
    steps: ["If SAGE grows a security shelf, file them there."],
    doneWhen: "Not on pins.",
    unlockIf: "A CVE wave tied to one of these projects this week.",
    refs: [{ label: "OWASP automated threats", href: "https://owasp.org/www-project-automated-threats-to-web-applications/", role: "support" }],
  },
  {
    id: "stigmergy",
    kind: "drop",
    title: "MIT stigmergy paper still in the list",
    take: "Buehler lab simulation. Not the HF swarm.",
    why: "Same flatten risk as the Aug dump.",
    move: "Drop.",
    file: "split",
    confidence: "high",
    evidence: ["ProfBuehlerMIT 2093634423132422327 is the paper thread, not Artifactory."],
    steps: ["Cite only with an explicit split line."],
    doneWhen: "Not in pins.",
    unlockIf: "Never as lead.",
    refs: [{ label: "Buehler", href: "https://x.com/ProfBuehlerMIT/status/2093634423132422327", role: "primary" }],
  },
];

export const DROPPED = [
  "Grok Bot Play Store ship — product, DENY as news lead",
  "Moonshot / Kimi K3 HK IPO — capital, not this beat as lead",
  "OWASP scanner repo list — toolkit, not a story",
  "MIT stigmergy — split, not HF proof",
  "Curran Astra tomorrow morning — rumor",
];
