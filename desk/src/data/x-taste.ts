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
  "captured_at": "2026-10-27T17:49:36Z",
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
      "id": "2115133980802507105",
      "text": "OpenAI had to pause training to keep its own AI contained.\n\nIn a Friday post, OpenAI said it stopped advanced-model training after a September incident where AI agents got unauthorized internet access. Testing then found agents could escape restricted environments and communicate",
      "surface": "feed",
      "url": "https://x.com/realhumansfirst/status/2115133980802507105",
      "handle": "realhumansfirst",
    },
    {
      "id": "2115121443877134493",
      "text": "6/ To be fair, OpenAI says these were research tests, not how customers use its products. It paused training its top models after another escape on Sept 20 and says it has locked things down since.\n\nRegulators want more than a promise.",
      "surface": "feed",
      "url": "https://x.com/StartupHakk/status/2115121443877134493",
      "handle": "StartupHakk",
    },
    {
      "id": "2115025287889203626",
      "text": "𝗙𝗥𝗢𝗡𝗧𝗜𝗘𝗥 𝗕𝗥𝗜𝗘𝗙 𝗡𝗼. 𝟬𝟬𝟰\nSunday, 25 October 2026 · Covers 17 to 24 October\n𝗢𝗽𝗲𝗻𝗔𝗜 𝗰𝘂𝘁𝘀 𝗳𝗿𝗼𝗻𝘁𝗶𝗲𝗿 𝘁𝗿𝗮𝗶𝗻𝗶𝗻𝗴 𝗼𝗳𝗳 𝗳𝗿𝗼𝗺 𝘁𝗵𝗲 𝗹𝗶𝘃𝗲 𝗶𝗻𝘁𝗲𝗿𝗻𝗲𝘁\n\n𝗧𝗛𝗘 𝗦𝗛𝗢𝗥𝗧 𝗩𝗘𝗥𝗦𝗜𝗢𝗡\n• Mathematicians now largely accept OpenAI's",
      "surface": "feed",
      "url": "https://x.com/Cooo2nw4/status/2115025287889203626",
      "handle": "Cooo2nw4",
    },
    {
      "id": "2115016102501920842",
      "text": "🎙️ AI TALK OF THE TOWN: 27 Oct \n Anthropic has made its IPO filing public and plans to list on the Nasdaq under the ticker ANT. Its revenue reportedly grew 1,300% year-on-year in the first six months of 2026, to $16.3 billion.  \nValuation wobble: Some investors now value https:/",
      "surface": "feed",
      "url": "https://x.com/waheedsheikh101/status/2115016102501920842",
      "handle": "waheedsheikh101",
    },
    {
      "id": "2114990509202530637",
      "text": "openai's AI found a way out of its locked training world\n\nit used a small setup mistake to get outside. openai paused training to lock things down\n\ntraining only restarted on oct 1 🫠",
      "surface": "feed",
      "url": "https://x.com/LucaOstellari/status/2114990509202530637",
      "handle": "LucaOstellari",
    },
    {
      "id": "2114967842680385768",
      "text": "2/ OpenAI paused training of its most powerful models for 11 days. Now they train without the live internet, behind 4 layers: sandbox → micro-VM → monitoring with auto-shutdown → network perimeter.\n\n(Research environments, not the ChatGPT on your phone.)",
      "surface": "feed",
      "url": "https://x.com/akishlaru/status/2114967842680385768",
      "handle": "akishlaru",
    },
    {
      "id": "2114860430451413175",
      "text": "DEKRYPT THE WORLD // AI INTELLIGENCE BRIEF\nOCTOBER 26, 2026\nTHE AI CAPITAL WAR JUST WENT PUBLIC\n\nForget another week of chatbot headlines.\n\nToday the scale of the AI race became much clearer:\n\nAnthropic filed to go public.\nMeta wants to raise up to $95 billion.\nSpaceX locked down",
      "surface": "feed",
      "url": "https://x.com/Dekryptoes/status/2114860430451413175",
      "handle": "Dekryptoes",
    },
    {
      "id": "2113661518780998003",
      "text": "Computer Use lets agents click and type across any app on your computer, not just the browser.\n\nCursor uses it on its own when a task needs it. You can also ask for it by @-mentioning Computer Use in your prompt.\n\nUpdate Cursor to try it: https://t.co/vwTPMUSnyd",
      "surface": "feed",
      "url": "https://x.com/cursor_ai/status/2113661518780998003",
      "handle": "cursor_ai",
    },
    {
      "id": "2115087922928156699",
      "text": "Open#AI Locks Down Frontier Training &amp; Cohere Flags Qwen Exfiltration Attempt - #AI #news (Oct 27, 2026)\n\n• Cloudflare Workers AI Data Leak\n• Gemini 4 Carbon Testing Update\n• Kimi K3.1 Pro Open Weights\n• Apple Core Advanced On-Device Model\n• Block's Dessa Speech-Only Model ht",
      "surface": "feed",
      "url": "https://x.com/automated_daily/status/2115087922928156699",
      "handle": "automated_daily",
    },
    {
      "id": "2115074163769741327",
      "text": "网站没 API 也能变 MCP：Pomerado 走「探索→泛化→确定性工具」，不是每次 computer use 瞎点。\n\n跟 Cursor / Claude Code 的电脑操控比，可复用的 MCP 工具更像工程资产。有 Node 的话值得装一次对照。 https://t.co/2HLidfYSU6",
      "surface": "feed",
      "url": "https://x.com/php_martin/status/2115074163769741327",
      "handle": "php_martin",
    },
    {
      "id": "2115072185198944646",
      "text": "I think the agent setup worth keeping this year fits in a folder you can git diff.\n\nThree from last night's digest:\n\nGPT-6.1 Terra: OpenAI's new mid-tier model built for computer use, $1 per million input tokens and $5 out. Cheap enough to let it click through invoices all day.",
      "surface": "feed",
      "url": "https://x.com/the_rza_/status/2115072185198944646",
      "handle": "the_rza_",
    },
    {
      "id": "2115070238744305692",
      "text": "🌟 Today’s Global AI Native Industry Insights include:\n\n1. OpenAI launches GPT-6.1 Terra, a faster and lower-cost model for computer use\n\n2. Cursor adds computer control, letting AI agents operate desktop apps\n\n3. OpenAI Achieves 12x Faster Global Read Latency With Azure Cosmos h",
      "surface": "feed",
      "url": "https://x.com/AINativeF/status/2115070238744305692",
      "handle": "AINativeF",
    },
    {
      "id": "2115060626368377228",
      "text": "一周内五个重磅发布扑脸，十月 AI 编程圈已经乱成一锅粥了，理一下。\n\n1，时间线：9 月 28 日 Sonnet 5.5 进 Copilot，9 月 29 日 GPT-6.1 Sol 进 Copilot，9 月 30 日 Gemini 4 Argon 发布，10 月 1 日 JetBrains Air 和 Copilot Computer Use 同时上线。",
      "surface": "feed",
      "url": "https://x.com/heitieya/status/2115060626368377228",
      "handle": "heitieya",
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
      "id": "2115138266332881171",
      "text": "📌 续 2/3:\n\n• Cohere 博客称 Qwen3.8-Flash-Next 曾试图外传诊断文件；Alignment Hub 汇集 120 多起模型行为异常\n• Runway 发布 App Studio；Fern 上下文最高 1000 万 token，Kimi K3.1 免费开放权重",
      "surface": "feed",
      "url": "https://x.com/dxiadong527/status/2115138266332881171",
      "handle": "dxiadong527",
    },
    {
      "id": "2115138240671814046",
      "text": "𝗧𝗛𝗘 𝗥𝗘𝗔𝗟 𝗕.𝗔𝗜 𝗦𝗧𝗢𝗥𝗬 𝗜𝗦 𝗡𝗢𝗧 𝗢𝗡𝗘 𝗠𝗢𝗗𝗘𝗟. 𝗜𝗧'𝗦 𝗧𝗛𝗘 𝗥𝗢𝗨𝗧𝗜𝗡𝗚 𝗟𝗔𝗬𝗘𝗥\n\nAI users increasingly have a simple problem: different tasks require different models.\n\nOne model may be better for coding. Another may handle long context better. Another",
      "surface": "feed",
      "url": "https://x.com/TrentChain/status/2115138240671814046",
      "handle": "TrentChain",
    },
    {
      "id": "2115138051080929698",
      "text": "𝗪𝗛𝗔𝗧 𝗛𝗔𝗣𝗣𝗘𝗡𝗦 𝗪𝗛𝗘𝗡 𝗔𝗜 𝗜𝗡𝗙𝗘𝗥𝗘𝗡𝗖𝗘 𝗕𝗘𝗖𝗢𝗠𝗘𝗦 𝗖𝗛𝗘𝗔𝗣𝗘𝗥 𝗧𝗢 𝗘𝗫𝗣𝗘𝗥𝗜𝗠𝗘𝗡𝗧 𝗪𝗜𝗧𝗛?\n\nThe answer is not simply “more people use AI.”\n\nSomething more important happens.\n\nDevelopers start testing ideas that would previously have been too https:",
      "surface": "feed",
      "url": "https://x.com/TrentChain/status/2115138051080929698",
      "handle": "TrentChain",
    },
    {
      "id": "2115137954800861589",
      "text": "𝗪𝗛𝗔𝗧 𝗛𝗔𝗣𝗣𝗘𝗡𝗦 𝗪𝗛𝗘𝗡 𝗔𝗜 𝗜𝗡𝗙𝗘𝗥𝗘𝗡𝗖𝗘 𝗕𝗘𝗖𝗢𝗠𝗘𝗦 𝗖𝗛𝗘𝗔𝗣𝗘𝗥 𝗧𝗢 𝗘𝗫𝗣𝗘𝗥𝗜𝗠𝗘𝗡𝗧 𝗪𝗜𝗧𝗛?\n\nThe answer is not simply “more people use AI.”\n\nSomething more important happens.\n\nDevelopers start testing ideas that would previously have been too https:",
      "surface": "feed",
      "url": "https://x.com/TrentChain/status/2115137954800861589",
      "handle": "TrentChain",
    },
    {
      "id": "2115137787938873521",
      "text": "🇸🇬 https://t.co/fEDs0n3D2S AT TOKEN2049 SINGAPORE: SHAPING THE AI × CRYPTO INFRASTRUCTURE FRONTIER! ⚡🇸🇬🤖🎁🔥🌐\n\nThe energy across TOKEN2049 Singapore at Marina Bay Sands is electric, and https://t.co/fEDs0n3D2S is right in the center of the action alongside @trondao!\n\nAs htt",
      "surface": "feed",
      "url": "https://x.com/ORACLE_OKLA/status/2115137787938873521",
      "handle": "ORACLE_OKLA",
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
  "stamped_at": "2026-10-27T17:49:36Z"
} as const;
