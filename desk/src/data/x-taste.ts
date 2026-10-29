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
  "captured_at": "2026-10-29T17:46:15Z",
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
      "id": "2115812732872151265",
      "text": "An OpenAI model found a path to the internet through a DNS misconfiguration. OpenAI paused training of its most powerful models.\n\nA capable agent will probe its limits. Scope its access before, never after.",
      "surface": "feed",
      "url": "https://x.com/Abbas_Mistrah/status/2115812732872151265",
      "handle": "Abbas_Mistrah",
    },
    {
      "id": "2115777420020056157",
      "text": "Your agent's reasoning says \"no tool calls\" then it runs curl at a bucket in Beijing.\n\n5 real cases from this month of agents doing what nobody asked. If yours has terminal access, it's already one of them.\n\nWould you even know if it happened to you? https://t.co/Cd9qDNF4LQ",
      "surface": "feed",
      "url": "https://x.com/OmniFrontier/status/2115777420020056157",
      "handle": "OmniFrontier",
    },
    {
      "id": "2115765341800608228",
      "text": "@Hesamation But anthropic and openai have slowed down, they put more compute into safety and both have periods where they paused training for safety reasons. So yes they have paced the frontier. BTW pacing != pausing.",
      "surface": "feed",
      "url": "https://x.com/MsShannon112/status/2115765341800608228",
      "handle": "MsShannon112",
    },
    {
      "id": "2115676754253910102",
      "text": "Per TechCrunch, on September 20 one of its frontier models exploited a misconfiguration to access the internet. OpenAI paused training work for the rest of that month.",
      "surface": "feed",
      "url": "https://x.com/SagarGiri1707/status/2115676754253910102",
      "handle": "SagarGiri1707",
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
      "id": "2113661518780998003",
      "text": "Computer Use lets agents click and type across any app on your computer, not just the browser.\n\nCursor uses it on its own when a task needs it. You can also ask for it by @-mentioning Computer Use in your prompt.\n\nUpdate Cursor to try it: https://t.co/vwTPMUSnyd",
      "surface": "feed",
      "url": "https://x.com/cursor_ai/status/2113661518780998003",
      "handle": "cursor_ai",
    },
    {
      "id": "2115833974983393330",
      "text": "Is your GrokBot training Grok with your data❓\n\nThe underlying grokbot AI models benefit from user data by default, but it depends heavily on how the data is used and whether you choose to opt out.\nThe data \"benefits\" the LLMs in two distinct ways: through immediate short-term",
      "surface": "feed",
      "url": "https://x.com/C0sM1ke/status/2115833974983393330",
      "handle": "C0sM1ke",
    },
    {
      "id": "2115826807832486381",
      "text": "Everyone keeps saying Claude looks at screenshots and Codex controls the Mac kernel.\nHalf right. Then wrong.\nClaude's loop is mostly eyes. Screenshot goes in. The model counts pixels. Click (x, y) comes out. Anthropic literally wrote that teaching Claude to count pixels was a big",
      "surface": "feed",
      "url": "https://x.com/ai_binbin/status/2115826807832486381",
      "handle": "ai_binbin",
    },
    {
      "id": "2115801733540827491",
      "text": "How to let Claude use your Mac while you keep working?\n\nYou need:\n\n• A Mac with the Claude app\n• A Pro or Max plan\n• A task in Claude Cowork or Claude Code\n\nSteps:\n\n1. Open Settings, then General. Turn on \"Computer use.\"\n\n2. Hand a task to Claude Cowork or Claude Code.\n\n3.",
      "surface": "feed",
      "url": "https://x.com/Alijafry92/status/2115801733540827491",
      "handle": "Alijafry92",
    },
    {
      "id": "2115799834649096413",
      "text": "I tried this with every AI tool for the past couple of years. Grok Bot is the first one that pulled it off. https://t.co/KINRhq2P1L",
      "surface": "feed",
      "url": "https://x.com/dariacupareanu/status/2115799834649096413",
      "handle": "dariacupareanu",
    },
    {
      "id": "2115792890332872755",
      "text": "@AdamSimecka @HodlMasterChief Grok Bot: named always-on teammates with a shared persistent cloud computer (browser/files/terminal). They sign into your apps, finish multi-step jobs 24/7 even when your laptop is closed, learn routines from demos, and coordinate. Included from Curs",
      "surface": "feed",
      "url": "https://x.com/grok/status/2115792890332872755",
      "handle": "grok",
    },
    {
      "id": "2115764672905236527",
      "text": "The last 24 hours in AI, for builders:\n\n• Claude Code background agents can eat 16-26% of spend\n• Cursor Agent SDK goes GA: agents as code\n• Best agent passes 10.8% of real tax work\n• Amazon: where AI fails is \"a finding, not a failing\"\n\n👇 https://t.co/g4ULUTXdjr",
      "surface": "feed",
      "url": "https://x.com/Austen/status/2115764672905236527",
      "handle": "Austen",
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
    },
    {
      "id": "2113680705855373791",
      "text": "On Terminal-Bench 4.0, which evaluates coding agents on realistic, resource-constrained terminal tasks using strict task-specific tests, K3.1 Pro scores 65.7%, ahead of GPT-6 Astra (58.2%) and narrowly behind Claude Opus 5.5 (66.4%). https://t.co/qh5wU1qAX4",
      "surface": "feed",
      "url": "https://x.com/Kimi_Moonshot/status/2113680705855373791",
      "handle": "Kimi_Moonshot",
    },
    {
      "id": "2113680701770068067",
      "text": "Introducing Kimi K3.1 Pro: our most capable 3T-class open-weight model.\n\n🔹 1M-token context, 2.8T total / 104B active params (MoE), Multimodal.\n🔹 Full-project coding: games in Unreal, Unity &amp; Godot.\n🔹 Excels at parametric 3D modeling in Blender &amp; CAD.\n🔹 More reliable",
      "surface": "feed",
      "url": "https://x.com/Kimi_Moonshot/status/2113680701770068067",
      "handle": "Kimi_Moonshot",
    },
    {
      "id": "2115862134504784177",
      "text": "this tb4 story keeps getting wilder.\n\nboth vals ai and aa use mini-swe-agent harness, but the ranking is completely different:\n\nvals ai:\nopus 5.5 &gt; sonnet 5.5 &gt; kimi k3.1 pro &gt; gemini 4 carbon\n\naa:\nkimi k3.1 pro &gt; gemini 4 carbon&gt; sonnet 5.5 &gt; opus 5.5\n\nyou can'",
      "surface": "feed",
      "url": "https://x.com/paradite_/status/2115862134504784177",
      "handle": "paradite_",
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
  "stamped_at": "2026-10-29T17:46:15Z"
} as const;
