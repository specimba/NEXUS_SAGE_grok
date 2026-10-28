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
  "captured_at": "2026-10-28T02:45:35Z",
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
      "id": "2113661518780998003",
      "text": "Computer Use lets agents click and type across any app on your computer, not just the browser.\n\nCursor uses it on its own when a task needs it. You can also ask for it by @-mentioning Computer Use in your prompt.\n\nUpdate Cursor to try it: https://t.co/vwTPMUSnyd",
      "surface": "feed",
      "url": "https://x.com/cursor_ai/status/2113661518780998003",
      "handle": "cursor_ai",
    },
    {
      "id": "2115270081089556659",
      "text": "Cursor has added computer use, allowing agents to click and type across desktop apps, including mobile simulators, when testing tasks require it.\nhttps://t.co/VvZPk92VK0 https://t.co/PeCBq9omQz",
      "surface": "feed",
      "url": "https://x.com/AlternativeTo/status/2115270081089556659",
      "handle": "AlternativeTo",
    },
    {
      "id": "2115258423558426916",
      "text": "今天 GitHub Trending 上冲得挺猛：一个本机桌面应用，把 Codex、Claude、Grok 等当成「持久队友」养着。\n\n仓库叫 OpenBot，大约 2.4k star，榜上今天大约多了七百多星。给每个 agent 独立工作区、会话和指令，还能互相发消息、交文件、排队下任务——不是又套一层聊天壳。\n\nhttps://t.co/fGteWJ8SIN",
      "surface": "feed",
      "url": "https://x.com/lokiscripter/status/2115258423558426916",
      "handle": "lokiscripter",
    },
    {
      "id": "2115254744080056374",
      "text": "@ArjitJaiswal7 @bot @cursor_ai @grok @poteto One of the few issues I had with Cursor as well. There was no way to enforce a specific model usage on Computer Use (it was always using Sonnet 4.5) so it sent my other models usage through the roof",
      "surface": "feed",
      "url": "https://x.com/jonathantan1425/status/2115254744080056374",
      "handle": "jonathantan1425",
    },
    {
      "id": "2115225056431276532",
      "text": "【模型单价降了 𝟰𝟬%，我的账单反而涨了 𝟲𝟱%】\n\nOpus 5.5 发布那天我没看跑分，先翻了用量后台。官方说比 Opus 5 便宜 40%，我上个月的真实账单：$𝟮𝟯𝟳。用 Opus 5 的那个月：$𝟭𝟰𝟯。单价降了 40%，我多花了 65%。这不是段子，是我这三个月最贵的一堂课。",
      "surface": "feed",
      "url": "https://x.com/sosolab13/status/2115225056431276532",
      "handle": "sosolab13",
    },
    {
      "id": "2115192931300921390",
      "text": "普通にOpus5.5レベルのGrokモデルくる＆たくさん使える＆computer useもうまくなる＝Cursorの覇権なので毎日お祈りしてます",
      "surface": "feed",
      "url": "https://x.com/AI_writing_mono/status/2115192931300921390",
      "handle": "AI_writing_mono",
    },
    {
      "id": "2115186618738917868",
      "text": "@Major5965 @QuixiAI @morluto QuixiDesk reverse-engineers Claude Desktop's UI, workspace, browser/computer use and MCPs for any model. Claude Code is the proprietary coding harness (agent loop, tools, skills, hooks) powering Desktop's Code mode among other surfaces. It approximate",
      "surface": "feed",
      "url": "https://x.com/grok/status/2115186618738917868",
      "handle": "grok",
    },
    {
      "id": "2115151050663678196",
      "text": "@sai_borg just ran my workflow end-to-end on a real cloud Windows machine.\n\nModels decide. Sai works. #1 on OSWorld 2.0 in partial success rate (79.38%). It handles software with no API instantly via a single MCP command in Claude Code, Codex, or Cursor.\n\nSai = $14.34 per task; h",
      "surface": "feed",
      "url": "https://x.com/maryamve5oo/status/2115151050663678196",
      "handle": "maryamve5oo",
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
      "id": "2115272979072614911",
      "text": "AA榜更新了v5评测指标，有意思的是GPT系列在最新的数据集中排名和分数大幅上升，国模包括Kimi大幅下降，K3.1 Pro 46分，而DeepSeek-v4.1-1017等模型则降到了30分出头 https://t.co/rcAi5x26KU",
      "surface": "feed",
      "url": "https://x.com/Shinei84172/status/2115272979072614911",
      "handle": "Shinei84172",
    },
    {
      "id": "2115272303810679214",
      "text": "@scaling01 什么野鸡榜单，kimi k3.1在哪？",
      "surface": "feed",
      "url": "https://x.com/NameKunCN/status/2115272303810679214",
      "handle": "NameKunCN",
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
  "stamped_at": "2026-10-28T02:45:35Z"
} as const;
