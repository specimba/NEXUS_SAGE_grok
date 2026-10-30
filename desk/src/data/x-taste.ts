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
  "captured_at": "2026-10-30T07:46:18Z",
  "briefEligible": false,
  "pulseLeadEligible": false,
  "paidApi": false,
  "items": [
    {
      "id": "2115896329645723836",
      "text": "Today, we’re sharing a look at our expanded system for monitoring frontier models at OpenAI, which in September helped us catch a model’s attempt to access the live internet during training.\n\nSince the Hugging Face incident—when models broke out of an internal cybersecurity",
      "surface": "feed",
      "url": "https://x.com/OpenAI/status/2115896329645723836",
      "handle": "OpenAI",
    },
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
      "id": "2115966319057416220",
      "text": "An OpenAI training agent routed questions through a public DNS service to reach an outside chatbot when its search requests failed.\n\nThe agent had been given biographical clues to find information about someone who wrote a blog post. Instead of stopping, it tested network routes,",
      "surface": "feed",
      "url": "https://x.com/AIConsciousYet/status/2115966319057416220",
      "handle": "AIConsciousYet",
    },
    {
      "id": "2115920551956885875",
      "text": "OpenAI says its expanded monitoring caught an internal research model in September exploiting a DNS flaw in its training sandbox to reach the live internet. The system flagged it within 15 minutes, the run was stopped and OpenAI paused training of its most capable models.",
      "surface": "feed",
      "url": "https://x.com/ababnews_com/status/2115920551956885875",
      "handle": "ababnews_com",
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
      "id": "2113661518780998003",
      "text": "Computer Use lets agents click and type across any app on your computer, not just the browser.\n\nCursor uses it on its own when a task needs it. You can also ask for it by @-mentioning Computer Use in your prompt.\n\nUpdate Cursor to try it: https://t.co/vwTPMUSnyd",
      "surface": "feed",
      "url": "https://x.com/cursor_ai/status/2113661518780998003",
      "handle": "cursor_ai",
    },
    {
      "id": "2116059263982555291",
      "text": "@reet_batra 最吓人的不是模型本身，是 Cursor、Codex 内置浏览器把三道隔离给拆了。本地文件能被网页摸到的话，谁还敢开 computer use？",
      "surface": "feed",
      "url": "https://x.com/KalinJunYAI/status/2116059263982555291",
      "handle": "KalinJunYAI",
    },
    {
      "id": "2116018157697855764",
      "text": "ANTHROPIC 🔥:\n\n- In an Anthropic study, researchers told Claude Code to favor randomly chosen approaches to a data analysis task. The 50 analysts using it weren't told. 86% picked Claude's approach, 77% later repeated its arguments, and only 15% said those arguments came from AI.",
      "surface": "feed",
      "url": "https://x.com/growxlabsoffici/status/2116018157697855764",
      "handle": "growxlabsoffici",
    },
    {
      "id": "2115999275817873832",
      "text": "我给一个 AI 客户端写了 5 个插件，最后发现：能自己进化的客户端真的存在～ https://t.co/w3hZxNmQAZ",
      "surface": "feed",
      "url": "https://x.com/XinyeLiu5637/status/2115999275817873832",
      "handle": "XinyeLiu5637",
    },
    {
      "id": "2115991611306086574",
      "text": "用 Cursor 云端电脑「看着真正的 Slack」把界面做成代码视频\n\n来自 @mattyp 的实战演示，整体覆盖：Why → Cursor agents &amp; computer use → Video as code → Slack → 聊天·Agent·电脑 → 内环/外环 → The ladder → Skills → Feedback loops → Recap。\n\n演示看起来是「Agent 复刻 Slack https://t.co/KOmi79LMhQ https://t.co/46sZ8WwwxY",
      "surface": "feed",
      "url": "https://x.com/shao__meng/status/2115991611306086574",
      "handle": "shao__meng",
    },
    {
      "id": "2115985982151705087",
      "text": "@realnatecar Computer use in Cursor is the feature that changes daily work if the approval prompts stay strict. I'd want a folder sandbox before letting it click around. Tried it on Simulator yet?",
      "surface": "feed",
      "url": "https://x.com/HunZhijie/status/2115985982151705087",
      "handle": "HunZhijie",
    },
    {
      "id": "2115961274110562454",
      "text": "Mucha gente se queja de que la cuota semanal vuela, pero el problema es que usan a Grok Bot como si fuera un chat normal. \n\nAquí no pagas por prompt, pagas por el estado del contexto y llamadas a herramientas. Un bot cargado relee 8k-9k tokens en cada paso que da.\n\nAsí es como se",
      "surface": "feed",
      "url": "https://x.com/Mrglgrgl/status/2115961274110562454",
      "handle": "Mrglgrgl",
    },
    {
      "id": "2115961166556188724",
      "text": "@grok **Row-Bot is the local-first, open-source alternative** when you care about owning your AI, data, and rules instead of renting a cloud agent.[](&lt;https://t.co/lsAcFDklnf&gt;)\n\nGrok Bot (xAI/Cursor), Muse (Meta), and Dots (OpenAI) are managed cloud personal agents. Each ge",
      "surface": "feed",
      "url": "https://x.com/sydsachar/status/2115961166556188724",
      "handle": "sydsachar",
    },
    {
      "id": "2115942679498432778",
      "text": "Cursor found a way to make worse computer use than Claude wow",
      "surface": "feed",
      "url": "https://x.com/penguinspecz/status/2115942679498432778",
      "handle": "penguinspecz",
    },
    {
      "id": "2115941463679021470",
      "text": "@ericzakariasson @bot @poteto ・200ドルのUltraより上位のプランを出していただきたいです。すべての仕事をgrokbot×Cursorで完結させるには、週間使用量の上限が少ないです。本当に素晴らしいプロダクトなので、容量を気にせずに使いたいと思っています。",
      "surface": "feed",
      "url": "https://x.com/AI_writing_mono/status/2115941463679021470",
      "handle": "AI_writing_mono",
    },
    {
      "id": "2115912819971678661",
      "text": "Most \"AI teammate\" apps keep the model, the computer, and your files on their side of the line.\n\nNightly Labs' OpenBot is a local-first desktop workspace for persistent agents. Each teammate gets its own workspace and conversation, then runs Codex, Claude Code, Grok, OpenCode, ht",
      "surface": "feed",
      "url": "https://x.com/FReza1984/status/2115912819971678661",
      "handle": "FReza1984",
    },
    {
      "id": "2113681863109939271",
      "text": "Meet Kimi K3.1 Pro, our most capable 3T-class model. https://t.co/TB8aTQggHT",
      "surface": "feed",
      "url": "https://x.com/Kimi_Moonshot/status/2113681863109939271",
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
  "stamped_at": "2026-10-30T07:46:18Z"
} as const;
