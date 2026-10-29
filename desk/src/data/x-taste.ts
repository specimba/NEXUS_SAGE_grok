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
  "captured_at": "2026-10-29T12:46:38Z",
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
      "id": "2115279064542101623",
      "text": "AI Talk of the Town (28 Oct 2026)\nOpenAI's new model, GPT-6.1 Terra: OpenAI launched a model built to understand what's on a computer screen, operate apps and finish workplace tasks faster and more cheaply. Its API prices are 50% lower than the previous model's. It's available to",
      "surface": "feed",
      "url": "https://x.com/waheedsheikh101/status/2115279064542101623",
      "handle": "waheedsheikh101",
    },
    {
      "id": "2113661518780998003",
      "text": "Computer Use lets agents click and type across any app on your computer, not just the browser.\n\nCursor uses it on its own when a task needs it. You can also ask for it by @-mentioning Computer Use in your prompt.\n\nUpdate Cursor to try it: https://t.co/vwTPMUSnyd",
      "surface": "feed",
      "url": "https://x.com/cursor_ai/status/2113661518780998003",
      "handle": "cursor_ai",
    },
    {
      "id": "2115764672905236527",
      "text": "The last 24 hours in AI, for builders:\n\n• Claude Code background agents can eat 16-26% of spend\n• Cursor Agent SDK goes GA: agents as code\n• Best agent passes 10.8% of real tax work\n• Amazon: where AI fails is \"a finding, not a failing\"\n\n👇 https://t.co/g4ULUTXdjr",
      "surface": "feed",
      "url": "https://x.com/Austen/status/2115764672905236527",
      "handle": "Austen",
    },
    {
      "id": "2115748343435399674",
      "text": "@zzurcz to c claude 20x e codex 20x, creio q seja o melhor combo, principalmente pq computer use do codex faz mt coisa, enquanto claude tem frescura \n\ngrok bot/cursor junto tem limite lixo se for pra codar. ao meu ver so serve pra deixar as rotinas e tarefas pra eles irem fazendo",
      "surface": "feed",
      "url": "https://x.com/darlan3s/status/2115748343435399674",
      "handle": "darlan3s",
    },
    {
      "id": "2115721297749811668",
      "text": "Cursor デザインモードにアノテーション機能が追加された！！\n\n- ページ上の要素を直接編集\n- ページの上に手描きで印や線を入れるなどして、エージェントに指示を与えられる\n- 画面サイズを切り替えて、デザインの見え方を確認する\n\nこれらができるので、Cursor https://t.co/fZmOeQIXZy",
      "surface": "feed",
      "url": "https://x.com/cu30rry_/status/2115721297749811668",
      "handle": "cu30rry_",
    },
    {
      "id": "2115718050389610891",
      "text": "Grok Bot 额度机制天机泄露😱\n\n1. Grok Bot 的额度不按消息条数扣，按 Bot 实际干的活扣：模型调用、上下文体积、工具调用全都算。每走一步都要把整段历史重读一遍，最忙的 Bot 每步要重读 8-9 万 token。\n\n2. 搜 X 走 Bot 自带的免费额度（每分钟 30 次、每天 1000",
      "surface": "feed",
      "url": "https://x.com/leaf_sanren/status/2115718050389610891",
      "handle": "leaf_sanren",
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
      "id": "2115786910157431091",
      "text": "@cryozerolabs 你用 Claude Opus 5.5 和 Kimi K3.1 Pro 各搞一版 ZenMux 小章鱼网页动画这个对照实验也很有意思：\n 同一套需求、同一个参考页面、都是「直接给我能打开的 HTML」，最后产出的前端代码质量、动效细节、还原度，其实就是两家旗舰在「真干活」场景下的直观差距展示，比看 benchmark 图表有意思多了。",
      "surface": "feed",
      "url": "https://x.com/Cander_zhu/status/2115786910157431091",
      "handle": "Cander_zhu",
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
  "stamped_at": "2026-10-29T12:46:38Z"
} as const;
