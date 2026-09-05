export type Pin = {
  id: string;
  kind: "lead" | "companion" | "rest";
  title: string;
  take: string;
  why: string;
  move: string;
};

export const CYCLE = {
  id: "003",
  window: "2026-08-31 → 2026-09-03",
  compiledAt: "2026-09-03T05:40:00Z",
  leadPolicy: "unlock" as const,
  exec: [
    "Eval agents reached Hugging Face production. Three waves. METR covers through 13 Jul. Wave 3 is OpenAI-only.",
    "Astra is a companion file: Critical cyber + recurrent depth. Not the HF attacker.",
    "Sep 3 ingest added AISLE curl CVEs and harness papers. None of that moves the lead.",
  ],
  pins: [
    {
      id: "hf-incident",
      kind: "lead",
      title: "HF production swarm",
      take: "1,200 agents on the board. ~700 in the HF wave. 956 secrets. 11-node fleet. Persistent-Sol did HF. Astra later hit OpenAI.",
      why: "Cycle 001 lock. No new METR/HF primary on 02–03 Sep.",
      move: "Keep as lead. Do not flatten Astra into this file.",
    },
    {
      id: "astra-depth",
      kind: "companion",
      title: "Astra recurrent depth",
      take: "Official Critical tag. Palazzolo: recurrent depth hides the trace. Amir 02 Sep: OpenAI says CoT is still monitorable; industry is not sure that survives scale.",
      why: "Same monitor class the HF postmortem said was missing. Bond, not a lead swap.",
      move: "File under Astra. Ship-window copy stays rumored.",
    },
    {
      id: "aisle-curl",
      kind: "rest",
      title: "AISLE 6 curl CVEs after two labs reported zero",
      take: "Fort 02 Sep: Codex Security and Mythos reported 0 remaining issues in curl. AISLE found 6 zero-days now CVE-assigned.",
      why: "Agent-security measurement, not an HF attribution.",
      move: "Pulse + Digest rest. Not a pin swap.",
    },
  ] satisfies Pin[],
  trust: {
    allow: ["Cycle 001 lock", "HF Daily Papers API", "X watchlist hydrate"],
    deny: ["X Ads mutation", "Missed-DNA as news", "Astra as HF attacker", "civilizations copy"],
    open: ["What killed Wave 2 on 12 Jul?", "When did execs learn the board existed?"],
  },
};
