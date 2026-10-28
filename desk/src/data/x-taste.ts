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
  "captured_at": "2026-10-28T17:50:01Z",
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
      "id": "2115153304976007631",
      "text": "openai paused training on its most capable models for 11 days after an internal model used a dns misconfiguration to reach the live internet. my zap pauses for less than that when it hits a rate limit and i still panic",
      "surface": "feed",
      "url": "https://x.com/Balg_f/status/2115153304976007631",
      "handle": "Balg_f",
    },
    {
      "id": "2115133980802507105",
      "text": "OpenAI had to pause training to keep its own AI contained.\n\nIn a Friday post, OpenAI said it stopped advanced-model training after a September incident where AI agents got unauthorized internet access. Testing then found agents could escape restricted environments and communicate",
      "surface": "feed",
      "url": "https://x.com/realhumansfirst/status/2115133980802507105",
      "handle": "realhumansfirst",
    },
    {
      "id": "2113661518780998003",
      "text": "Computer Use lets agents click and type across any app on your computer, not just the browser.\n\nCursor uses it on its own when a task needs it. You can also ask for it by @-mentioning Computer Use in your prompt.\n\nUpdate Cursor to try it: https://t.co/vwTPMUSnyd",
      "surface": "feed",
      "url": "https://x.com/cursor_ai/status/2113661518780998003",
      "handle": "cursor_ai",
    },
    {
      "id": "2115488010837897696",
      "text": "普通にOpus5.5レベルのGrokモデルくる＆たくさん使える＆computer useもうまくなる＝Cursorの覇権なので毎日お祈りしてます",
      "surface": "feed",
      "url": "https://x.com/chris89395208/status/2115488010837897696",
      "handle": "chris89395208",
    },
    {
      "id": "2115475454002131394",
      "text": "@hexagonlabs_ computer use that doesn't hijack my cursor is lowkey the whole unlock. every other one makes me sit there watching it click",
      "surface": "feed",
      "url": "https://x.com/pedrosalvad2/status/2115475454002131394",
      "handle": "pedrosalvad2",
    },
    {
      "id": "2115474557188599880",
      "text": "Unix said everything is a file. We say everything is a tool.\nAI agents need an operating system. Here's the kernel. https://t.co/dkF3RBWei8",
      "surface": "feed",
      "url": "https://x.com/tastyrice000/status/2115474557188599880",
      "handle": "tastyrice000",
    },
    {
      "id": "2115468528644149698",
      "text": "@cheerselflin 视频里这个桌宠不知道是不是动画做的，不过真实的 Computer Use 跑起来其实没那么玄乎。之前我把同一个 iOS 任务分别交给 Codex 和 Cursor 跑，结果 Codex 两分钟出头就全点完了，Cursor 跑了八分多钟，主要卡在一个切换按钮上来回点了三分多钟都没切过去。录屏发在主帖了，感兴趣可以看看 https://t.co/c1IO9bsI2z",
      "surface": "feed",
      "url": "https://x.com/qi9098/status/2115468528644149698",
      "handle": "qi9098",
    },
    {
      "id": "2115467107597271123",
      "text": "@fly3nn 我前几天拿 Codex 和 Cursor 的 Computer Use 对比测试了一下，同一个 iOS 任务 Codex 两分钟就跑完了，反观 Cursor 花了八分多钟，主要卡在切换按钮上来回点了三分多钟都没切过去。Terra 我还没测过，但 Codex 在这块确实快很多，改天我也测测 Terra https://t.co/c1IO9bsI2z",
      "surface": "feed",
      "url": "https://x.com/qi9098/status/2115467107597271123",
      "handle": "qi9098",
    },
    {
      "id": "2115460884915212609",
      "text": "TBH i left Cursor @cursor_ai  for Antigravity last December. the new Projects board is so good: queued, in progress, for review, done, cancelled. cloud agents build canvases u can share, plus Annotate, Computer Use and the Agent SDK. so yeah, im back :D",
      "surface": "feed",
      "url": "https://x.com/YousseFathallaX/status/2115460884915212609",
      "handle": "YousseFathallaX",
    },
    {
      "id": "2115454971726692587",
      "text": "@cursor_ai heads up for anyone installing: the docs use the grok/agent-sdk npm package. the blog says cursor/agent-sdk, which isn't on npm\n\ni wrote up how it fits with Annotate + Computer Use, incl. the Angular and Windows gotchas: https://t.co/ehsSG0LUQ5",
      "surface": "feed",
      "url": "https://x.com/YousseFathallaX/status/2115454971726692587",
      "handle": "YousseFathallaX",
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
  "stamped_at": "2026-10-28T17:50:01Z"
} as const;
