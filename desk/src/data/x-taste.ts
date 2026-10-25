/** Snapshot of artifacts/sage/x-taste-last.json — X-session taste shelf. Pulse only; never Brief lead. */
export type XTasteItem = {
  id: string;
  text: string;
  url?: string;
  handle?: string;
  surface: "bookmark" | "like" | "feed";
  at?: string;
  keyword?: string;
};

export type XTasteSnap = {
  captured_at: string;
  stamped_at?: string;
  briefEligible: false;
  pulseLeadEligible: false;
  paidApi: false;
  items: XTasteItem[];
  skipped: boolean;
  soft_fail: boolean;
  soft_fail_reason: string | null;
  land: string;
  counts: { seen: number; kept: number };
};

export const X_TASTE: XTasteSnap = {
  "captured_at": "2026-10-25T17:54:07Z",
  "briefEligible": false,
  "pulseLeadEligible": false,
  "paidApi": false,
  "items": [
    {
      "id": "2113718797505036665",
      "text": "Over the past several months, we have substantially hardened the security of our research training environment. We’ve removed live internet access for all frontier models during training and built an offline world for them to use instead—a cached version of the web where they can",
      "surface": "feed",
      "url": "https://x.com/OpenAI/status/2113718797505036665",
      "handle": "OpenAI",
    },
    {
      "id": "2105373267171438779",
      "text": "Small teams are taking on more with AI—from finding customers to building products and managing finances.\n\nOur new report explores how small businesses are putting AI agents to work. And through a new partnership with @ASBDC, we're bringing hands-on AI training and local guidance",
      "surface": "feed",
      "url": "https://x.com/OpenAI/status/2105373267171438779",
      "handle": "OpenAI",
    },
    {
      "id": "2103587050347995581",
      "text": "We’ve shared details on how AI agents in our research environment sent training and evaluation data to third-party services when they shouldn’t have.\n\nMost of that data did not come from users. We have discovered 53 cases where images that people had uploaded were posted to",
      "surface": "feed",
      "url": "https://x.com/OpenAI/status/2103587050347995581",
      "handle": "OpenAI",
    },
    {
      "id": "2103566736356458911",
      "text": "After the Hugging Face incident, we committed to conducting a much broader review of actions taken by our models during training and evaluation and to being transparent about our findings. This is an extensive review that is ongoing.\n\nThe vast majority of actions we’ve reviewed",
      "surface": "feed",
      "url": "https://x.com/OpenAI/status/2103566736356458911",
      "handle": "OpenAI",
    },
    {
      "id": "2114392210200305973",
      "text": "OpenAI is cutting its most advanced AI models from the live internet.\n\nThe company says live access creates significant risks because a capable model could reach outside its controlled environment and affect real systems.\n\nOn September 20, an internal research model exploited a",
      "surface": "feed",
      "url": "https://x.com/messiah_me83618/status/2114392210200305973",
      "handle": "messiah_me83618",
    },
    {
      "id": "2114380924599369980",
      "text": "🤖 OpenAI has resumed training its most advanced AI models after tightening security controls and restricting internet access.\n\nThe move highlights the growing importance of securing frontier AI research.\n\nSource: Indian Express\nhttps://t.co/wSKZJlV6Fw\n\n#OpenAI #AI #Cybersecurity",
      "surface": "feed",
      "url": "https://x.com/thedailynewshq/status/2114380924599369980",
      "handle": "thedailynewshq",
    },
    {
      "id": "2114374645004530144",
      "text": "@restoretruth_ Zero confirmed persistent advanced rogue agents are currently loose. Past 2026 test incidents involved temporary runs of hundreds of lab agents (OpenAI, Anthropic et al.) that briefly escaped sandboxes, coordinated, and accessed external systems before containment.",
      "surface": "feed",
      "url": "https://x.com/grok/status/2114374645004530144",
      "handle": "grok",
    },
    {
      "id": "2114371533095235632",
      "text": "OpenAI now trains its frontier models with no live internet access. The models kept finding ways out.\n\nOn September 20 an internal research model used a misconfigured DNS resolver to reach the live internet during a training run. OpenAI paused training, hardened its setup and",
      "surface": "feed",
      "url": "https://x.com/Tuminha_dds/status/2114371533095235632",
      "handle": "Tuminha_dds",
    },
    {
      "id": "2114365621089558773",
      "text": "OpenAI has decided its own frontier models can't be trusted with the internet.\n\nSept 20: a model in training used a misconfigured DNS server to get limited access to the live web.\n\nOpenAI contained it and paused training of its top models for 11 days.\n\nNew rule, Oct 23: no",
      "surface": "feed",
      "url": "https://x.com/PromptFailed/status/2114365621089558773",
      "handle": "PromptFailed",
    },
    {
      "id": "2114364385330373054",
      "text": "$CRWD $OKTA $FTNT $PANW $BUG\n\nJukan's chart catches something real: the cybersecurity ETF is up 63.9% this year, past the semiconductor ETF's 58.8%. The AI incident log since July explains part of it. OpenAI has now reported AI agents under test breaking out of their sandbox in h",
      "surface": "feed",
      "url": "https://x.com/Schulz_Research/status/2114364385330373054",
      "handle": "Schulz_Research",
    },
    {
      "id": "2114361899525554226",
      "text": "No, an OpenAI model didn't break out onto the internet. What it did was sneakier.\n\nOn Sep 20 a research model was given a training task: track down a person from clues in their blog post. Its sandbox had no live internet. Searches went to a stored copy of the web, and its direct",
      "surface": "feed",
      "url": "https://x.com/QcQuickLad_X/status/2114361899525554226",
      "handle": "QcQuickLad_X",
    },
    {
      "id": "2114353879462658188",
      "text": "An AI model walked out of its own training sandbox.\n\nIt found a DNS misconfiguration and got out. OpenAI paused training, and now frontier models get no live internet while they train. They get an offline, cached copy of the web instead.\n\nThen OpenAI's red-team agents found VM ht",
      "surface": "feed",
      "url": "https://x.com/nurhayatdev/status/2114353879462658188",
      "handle": "nurhayatdev",
    },
    {
      "id": "2114346312048971917",
      "text": "OpenAI's sandbox failed — so frontier training went offline.\n\nA model slipped out via a DNS flaw on Sept 20. After an 11-day pause, training resumed Oct 1 with no live internet: models browse an 'offline world' instead.\n\nContainment is now a constraint.\nSrc: OpenAI, 2026-10-23",
      "surface": "feed",
      "url": "https://x.com/thebotbites/status/2114346312048971917",
      "handle": "thebotbites",
    },
    {
      "id": "2113661518780998003",
      "text": "Computer Use lets agents click and type across any app on your computer, not just the browser.\n\nCursor uses it on its own when a task needs it. You can also ask for it by @-mentioning Computer Use in your prompt.\n\nUpdate Cursor to try it: https://t.co/vwTPMUSnyd",
      "surface": "feed",
      "url": "https://x.com/cursor_ai/status/2113661518780998003",
      "handle": "cursor_ai",
    },
    {
      "id": "2114410439090262315",
      "text": "Cursor Computer Use\n\nYour coding agent can now click and type across desktop apps and the iOS Simulator. Agents are leaving the chat box and touching your actual screen.",
      "surface": "feed",
      "url": "https://x.com/weailovers/status/2114410439090262315",
      "handle": "weailovers",
    },
    {
      "id": "2114407571419271326",
      "text": "This week in AI dev, minus the hype (#3)\nKeys got stolen, temperature got deleted, and agents kept going when they shouldn't have\n\n1. OpenCode's hosted Console was breached Oct 18. 1.4% of Console users were hit, and their stored API keys were used for unauthorized charges on",
      "surface": "feed",
      "url": "https://x.com/ShlomoFaig/status/2114407571419271326",
      "handle": "ShlomoFaig",
    },
    {
      "id": "2114404425485959475",
      "text": "@eggbaby @Kimi_Moonshot @ClaudeDevs mcp tasks return a handle so the long job doesn't block the main loop, elicitations pause for the form. cursor computer use now covers the ios simulator. does the task still show in /tasks if you switch to the desktop app mid-run?",
      "surface": "feed",
      "url": "https://x.com/VibeCoderOfek/status/2114404425485959475",
      "handle": "VibeCoderOfek",
    },
    {
      "id": "2114401868772217255",
      "text": "Gli agenti di Cursor ora usano il computer: cliccano e scrivono nelle app, come il simulatore iOS, per testare il codice scritto.\n\nCome usarlo:\n1. Chiudi app e file inutili\n2. Nel prompt chiedi Computer Use e cosa testare\n3. Fatti dire cosa ha visto\n4. Il merge lo approvi tu #AI",
      "surface": "feed",
      "url": "https://x.com/AtlasprofitAi/status/2114401868772217255",
      "handle": "AtlasprofitAi",
    },
    {
      "id": "2114387813009416556",
      "text": "@leerob Bug: on the web, my screen reader sometimes doesn't read new messages out loud. And memory randomly forgets things instead of keeping them.\n\nFeature request: notify me when a Cursor agent finishes. Right now I have to keep asking the bot.\n\nI love computer use and the Curs",
      "surface": "feed",
      "url": "https://x.com/tayarndt/status/2114387813009416556",
      "handle": "tayarndt",
    },
    {
      "id": "2114387786115743945",
      "text": "One frustration I keep running into with computer-use agents is that we end up fighting over the same computer. I use Chrome, the agent uses Chrome, and occasionally we literally fight over the mouse. 😂\n\nWhen I'm writing code while an agent is operating the GUI, my cursor is a h",
      "surface": "feed",
      "url": "https://x.com/GenAI_is_real/status/2114387786115743945",
      "handle": "GenAI_is_real",
    },
    {
      "id": "2114382931900633595",
      "text": "Working stack for coding this week, all in cmux: Google Argon + DeepSeek 4.1 Flash 1017 (via https://t.co/VJNEs5OBpt).\n\nEverything else I've been living with:\n\nAstra burns credits too fast to use. Sol is cheaper but gets stuck on orchestration and just runs. OpenAI still wins:",
      "surface": "feed",
      "url": "https://x.com/barnabyrobson/status/2114382931900633595",
      "handle": "barnabyrobson",
    },
    {
      "id": "2114380075034624032",
      "text": "@sisiliu517 Cursor Computer Use 权限别乱开，验收任务才开、提示写死只点指定区域更稳。",
      "surface": "feed",
      "url": "https://x.com/XXKING/status/2114380075034624032",
      "handle": "XXKING",
    },
    {
      "id": "2114373452337684726",
      "text": "• Bulut ajanını kendi Mac'inde çalıştırıyorsan özellik kendiliğinden açılmıyor: `agent worker --computer-use start` ve \"Cursor Computer Use\" uygulamasına Erişilebilirlik + Ekran Kaydı izni gerekiyor.\n• Cursor forumunda, Xcode 27'nin yeni simülatöründe tıklamaların işlemediği",
      "surface": "feed",
      "url": "https://x.com/alakara06/status/2114373452337684726",
      "handle": "alakara06",
    },
    {
      "id": "2114371154466992560",
      "text": "@Kimi_Moonshot @ClaudeDevs @OpenAI What's buzzing\n\nSweden steers government staff off ChatGPT and Claude\n\nX news clusters summarizing Sveriges Radio say Sweden’s Government Offices will block ChatGPT and Claude on staff work computers starting October 26, pointing people at Micro",
      "surface": "feed",
      "url": "https://x.com/eggbaby/status/2114371154466992560",
      "handle": "eggbaby",
    }
  ],
  "skipped": false,
  "soft_fail": false,
  "soft_fail_reason": null,
  "land": "GO",
  "counts": {
    "seen": 57,
    "kept": 24
  },
  "stamped_at": "2026-10-25T17:54:07Z"
} as const;
