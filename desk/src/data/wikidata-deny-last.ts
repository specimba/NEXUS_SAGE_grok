/** Snapshot of ingest-last.wikidata — DENY hygiene only · never Brief. */
export type WikidataDenyHintRow = {
  seed: string;
  qid: string | null;
  label: string | null;
  status: string;
};

export type WikidataDenyLast = {
  at: string;
  brief: boolean;
  pulse_lead: boolean;
  deny_grounding_only: boolean;
  soft_fail: boolean;
  hints: WikidataDenyHintRow[];
};

export const WIKIDATA_DENY_LAST: WikidataDenyLast = {
  "at": "2026-09-04T09:52:21Z",
  "brief": false,
  "pulse_lead": false,
  "deny_grounding_only": true,
  "soft_fail": false,
  "hints": [
    {
      "seed": "Sol",
      "qid": "Q34104679",
      "label": "Persistent solar influence on North Atlantic climate during the Holocene.",
      "status": "rejected_false_friend"
    },
    {
      "seed": "Astra",
      "qid": "Q731938",
      "label": "AstraZeneca",
      "status": "rejected_false_friend"
    },
    {
      "seed": "Hugging Face",
      "qid": "Q108943604",
      "label": "Hugging Face",
      "status": "matched"
    }
  ]
};
