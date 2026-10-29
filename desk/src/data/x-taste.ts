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
  "captured_at": "2026-10-29T07:47:34Z",
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
      "id": "2113661518780998003",
      "text": "Computer Use lets agents click and type across any app on your computer, not just the browser.\n\nCursor uses it on its own when a task needs it. You can also ask for it by @-mentioning Computer Use in your prompt.\n\nUpdate Cursor to try it: https://t.co/vwTPMUSnyd",
      "surface": "feed",
      "url": "https://x.com/cursor_ai/status/2113661518780998003",
      "handle": "cursor_ai",
    },
    {
      "id": "2115699262616924257",
      "text": "当AI Agent操作浏览器时，你只能干等着？ego lite用「Space隔离」给出了新答案：人和Agent共用一个浏览器、共享登录状态，但干活的地方分开。本文深度体验这款GitHub超2万星的AI浏览器，拆解它如何让Agent写代码而非敲命令，以及五类Agent浏览器产品的真实差异。 https://t.co/hx18Zh63Js",
      "surface": "feed",
      "url": "https://x.com/Xxgiaogiao/status/2115699262616924257",
      "handle": "Xxgiaogiao",
    },
    {
      "id": "2115656118412181704",
      "text": "Cursor 现在的价格页改了\n\n$8 的 Plus 只能用 Grok 模型，$30 的 Premium 是 Plus 的 4 倍用量，Claude 和 GPT 这些第三方模型要按 API 原价另外付\n\n我上周测 Cursor 的 Computer Use 用的就是 Grok 4.7，同一个 iOS 任务跑了 8 分多钟，Codex 两分钟出头\n\n所以主要用 Claude 或者 GPT 的话，在 Cursor",
      "surface": "feed",
      "url": "https://x.com/qi9098/status/2115656118412181704",
      "handle": "qi9098",
    },
    {
      "id": "2115656075773182150",
      "text": "APIのないサイトでも、AIエージェントが呼べる道具に変える。Y Combinatorの今期の支援先Pomeradoが、その仕組みをMITライセンスで公開している。",
      "surface": "feed",
      "url": "https://x.com/LaboNft/status/2115656075773182150",
      "handle": "LaboNft",
    },
    {
      "id": "2115655483994644841",
      "text": "goat computer use\nnow chasing codex\n(scripted but cursor makes \nhuman interaction ux great) https://t.co/q94c7hhsAR",
      "surface": "feed",
      "url": "https://x.com/claudeebum/status/2115655483994644841",
      "handle": "claudeebum",
    },
    {
      "id": "2115639768205943256",
      "text": "【海外で話題】\nCursorのエージェントが、作ったアプリを\n自分で開いて、触って確かめるようになりました😳\n\nhttps://t.co/vYuHHzg5T7\n\n新しく入った「Computer Use」という機能です↓↓\n・パソコンのアプリを、クリックや入力で動かせる\n・iPhoneの画面を再現するツールも操作できる https://t.co/MeDPj4E3q5 https://t.co/CqUtLk8sjn",
      "surface": "feed",
      "url": "https://x.com/nabetaro_agent/status/2115639768205943256",
      "handle": "nabetaro_agent",
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
  "stamped_at": "2026-10-29T07:47:34Z"
} as const;
