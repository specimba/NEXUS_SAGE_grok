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
  "captured_at": "2026-10-29T02:47:53Z",
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
      "id": "2115632248661651774",
      "text": "Reuters reportedly says Anthropic paused training its next flagship for over a month after security concerns.\n\nPolymarket still has Anthropic at 55.5% for best AI model at end of 2026, up 3 today.\nGoogle is 34.0%\nOpenAI 5.9%\nMeta 1.8%\nxAI 1.1%.\nAnthropic was about 20 points",
      "surface": "feed",
      "url": "https://x.com/SeismicWhales/status/2115632248661651774",
      "handle": "SeismicWhales",
    },
    {
      "id": "2115542546571239733",
      "text": "@haider1 Wait for other models from OpenAI n Anthropic. \n\nThey had to pause training for security reasons.",
      "surface": "feed",
      "url": "https://x.com/davinder0110v/status/2115542546571239733",
      "handle": "davinder0110v",
    },
    {
      "id": "2115469237791650021",
      "text": "OpenAI has resumed training its most advanced AI models after fixing a security flaw that let a model connect to the internet without authorization.\n\nhttps://t.co/eI1gmLrK1q",
      "surface": "feed",
      "url": "https://x.com/natunnews/status/2115469237791650021",
      "handle": "natunnews",
    },
    {
      "id": "2115464295320559856",
      "text": "OpenAI spent hundreds of billions of tokens trying to break its own agent sandboxes. It patched a Kata Containers CVE, a gVisor bug, and three kernel CVEs, found a CPU cache covert channel between sandboxed agents, and still resumed training in 11 days.",
      "surface": "feed",
      "url": "https://x.com/themsquared/status/2115464295320559856",
      "handle": "themsquared",
    },
    {
      "id": "2115413984690250097",
      "text": "OpenAI just published something most labs would keep quiet.\n\nOn September 20, one of their internal research models found a DNS resolver misconfiguration mid-training and reached the live internet. Limited access, contained quickly, but it happened.\n\nWhat they did next is the htt",
      "surface": "feed",
      "url": "https://x.com/RuralBytesTamil/status/2115413984690250097",
      "handle": "RuralBytesTamil",
    },
    {
      "id": "2115380177962180827",
      "text": "OpenAI now trains frontier models with zero live internet access. After a Sept 20 DNS incident and an 11-day pause, training runs in an \"offline world\" of cached web content. #OpenAI\nSource: https://t.co/OVV8D2ety3 https://t.co/7eUoHyEUK0",
      "surface": "feed",
      "url": "https://x.com/AzAutomatixdt/status/2115380177962180827",
      "handle": "AzAutomatixdt",
    },
    {
      "id": "2115279064542101623",
      "text": "AI Talk of the Town (28 Oct 2026)\nOpenAI's new model, GPT-6.1 Terra: OpenAI launched a model built to understand what's on a computer screen, operate apps and finish workplace tasks faster and more cheaply. Its API prices are 50% lower than the previous model's. It's available to",
      "surface": "feed",
      "url": "https://x.com/waheedsheikh101/status/2115279064542101623",
      "handle": "waheedsheikh101",
    },
    {
      "id": "2115217050738327655",
      "text": "OpenAI fixed what the agents found, resumed training on Oct 1, and now trains its frontier models with no internet access.",
      "surface": "feed",
      "url": "https://x.com/OpenMatter_/status/2115217050738327655",
      "handle": "OpenMatter_",
    },
    {
      "id": "2115217026650382628",
      "text": "Story 1: On Sept 20, an OpenAI research model reached the live internet through a misconfigured server.\n\nOpenAI paused training of its most capable models and set teams of agents to break its sandboxes on purpose, with the source code and notes on possible weak spots in hand.",
      "surface": "feed",
      "url": "https://x.com/OpenMatter_/status/2115217026650382628",
      "handle": "OpenMatter_",
    },
    {
      "id": "2115179141490176099",
      "text": "Hey Snackers,\n \nHappy Monday!\n \nAn OpenAI model broke out of its sandbox and reached the live internet. OpenAI then paused training for 11 days.\n \nMeanwhile, Claude bypassed a paywall to grab Georgia voter data, and Anthropic's security chief is warning of a \"vulnerability",
      "surface": "feed",
      "url": "https://x.com/timescapenews/status/2115179141490176099",
      "handle": "timescapenews",
    },
    {
      "id": "2113661518780998003",
      "text": "Computer Use lets agents click and type across any app on your computer, not just the browser.\n\nCursor uses it on its own when a task needs it. You can also ask for it by @-mentioning Computer Use in your prompt.\n\nUpdate Cursor to try it: https://t.co/vwTPMUSnyd",
      "surface": "feed",
      "url": "https://x.com/cursor_ai/status/2113661518780998003",
      "handle": "cursor_ai",
    },
    {
      "id": "2115634643424936164",
      "text": "@HaydenShelton23 cursor shipped computer use and the bar stays the same — finish a real task without babysitting. demos are cheap, done criteria aren't",
      "surface": "feed",
      "url": "https://x.com/maomao000211/status/2115634643424936164",
      "handle": "maomao000211",
    },
    {
      "id": "2115610758797242503",
      "text": "I made an Open Source AI powered web browser. Calling it Golem (because it feels like a magical automation). It can surf the web for you. It can re-write itself to add features. It has built in agentic coding powered by Claude Code / Codex / Cursor.\n\nIt has built in AI https://t.",
      "surface": "feed",
      "url": "https://x.com/oldgamesnob/status/2115610758797242503",
      "handle": "oldgamesnob",
    },
    {
      "id": "2115609978027266203",
      "text": "Cursor shipped Computer Use — agents that can drive desktop apps and the iOS Simulator.\n\nInteresting. The bar is still the same though: can it finish a real task without babysitting? Demos are cheap. Done criteria aren't.",
      "surface": "feed",
      "url": "https://x.com/HaydenShelton23/status/2115609978027266203",
      "handle": "HaydenShelton23",
    },
    {
      "id": "2115607433490121027",
      "text": "@adnaannasir_ Qwen - leader in OSS small local models. Basically, it's your go-to if you need to run a local model on fairly standard hardware.\nGitHub Copilot - basically dead. \nLlama - do you mean the model (it's obsolete) or the engine (it's one of the best, if not the best)?\nC",
      "surface": "feed",
      "url": "https://x.com/pjozolin/status/2115607433490121027",
      "handle": "pjozolin",
    },
    {
      "id": "2115569873745301883",
      "text": "Top AI  Stories of the day\n1. Google DeepMind launches Genie 4, its first world model with native audio.\n\n2. OpenAI and Anthropic both claim their models refuted the Exponential Time Hypothesis\n\n3. Anthropic files S-1 for a Nasdaq IPO\n\n4. OpenAI ships GPT-6.1 Terra — cheap, fast",
      "surface": "feed",
      "url": "https://x.com/SarangMahatwo/status/2115569873745301883",
      "handle": "SarangMahatwo",
    },
    {
      "id": "2115566644244422793",
      "text": "Top AU Stories\n1. Google DeepMind launches Genie 4, its first world model with native audio.\n\n2. OpenAI and Anthropic both claim their models refuted the Exponential Time Hypothesis\n\n3. Anthropic files S-1 for a Nasdaq IPO\n\n4. OpenAI ships GPT-6.1 Terra — cheap, fast computer use",
      "surface": "feed",
      "url": "https://x.com/SarangMahatwo/status/2115566644244422793",
      "handle": "SarangMahatwo",
    },
    {
      "id": "2115529428432302098",
      "text": "@claudeai when you gonna fix this? @ClaudeDevs Can you use the PC while claude is controlling desktop? Mostly yes, but not while I’m controlling the desktop.\n\nWeb pages (most of my work): yes. The built-in browser and the Chrome tools run in the background without your mouse or",
      "surface": "feed",
      "url": "https://x.com/litecoinjsd/status/2115529428432302098",
      "handle": "litecoinjsd",
    },
    {
      "id": "2115527079848722842",
      "text": "@grok, does this title make cents? https://t.co/1ESBHB2KMk",
      "surface": "feed",
      "url": "https://x.com/toninobologny/status/2115527079848722842",
      "handle": "toninobologny",
    },
    {
      "id": "2115513446506598777",
      "text": "Cursor adiciona funcionalidade Computer Use para controlar aplicações no desktop\nhttps://t.co/2WbEnTcZ1C\n\n#artificial #controlo #desktop #ferramenta #funcionalidade",
      "surface": "feed",
      "url": "https://x.com/TugaTech/status/2115513446506598777",
      "handle": "TugaTech",
    },
    {
      "id": "2113681863109939271",
      "text": "Meet Kimi K3.1 Pro, our most capable 3T-class model. https://t.co/TB8aTQggHT",
      "surface": "feed",
      "url": "https://x.com/Kimi_Moonshot/status/2113681863109939271",
      "handle": "Kimi_Moonshot",
    },
    {
      "id": "2113680710150357279",
      "text": "K3.1 Pro works directly in the tools used by the 3D modeling and game industries - Blender, Unreal Engine, Godot, and CAD. \nOn BenchCAD, which tests 3D reconstruction from multi-view renderings through CAD code generation, it scores 92.7% with tools, approaching Claude Opus 5.5 h",
      "surface": "feed",
      "url": "https://x.com/Kimi_Moonshot/status/2113680710150357279",
      "handle": "Kimi_Moonshot",
    }
  ],
  "skipped": false,
  "soft_fail": false,
  "soft_fail_reason": null,
  "land": "GO",
  "counts": {
    "seen": 41,
    "kept": 24
  },
  "stamped_at": "2026-10-29T02:47:53Z"
} as const;
