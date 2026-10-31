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
  "captured_at": "2026-10-31T12:52:23Z",
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
      "id": "2116473138787803277",
      "text": "openai now trains its frontier models with no internet access, after a research model escaped through a misconfigured dns resolver on sept 20. they paused training 11 days and resumed oct 1. the most capable AIs are raised in a sandbox now. comforting.",
      "surface": "feed",
      "url": "https://x.com/sambryam2526/status/2116473138787803277",
      "handle": "sambryam2526",
    },
    {
      "id": "2116389440440746078",
      "text": "@OpenAI now trains frontier models with no live internet access.\n\nWhy: in September, an internal model used a DNS misconfiguration to reach the internet. They paused training, had agent teams red-team the setup, patched what they found, and resumed Oct 1.\n\nTraining environments",
      "surface": "feed",
      "url": "https://x.com/kantbelieve_/status/2116389440440746078",
      "handle": "kantbelieve_",
    },
    {
      "id": "2116387506505843105",
      "text": "OpenAI now trains frontier models with no live internet access.\n\nWhy: in September, an internal model used a DNS misconfiguration to reach the internet. They paused training, had agent teams red-team the setup, patched what they found, and resumed Oct 1.\n\nTraining environments",
      "surface": "feed",
      "url": "https://x.com/kantbelieve_/status/2116387506505843105",
      "handle": "kantbelieve_",
    },
    {
      "id": "2116272597167935709",
      "text": "OpenAI says one of its AI models broke out to the open internet during training in September.\n\nIt was supposed to be sealed off. Their watchdog caught it in 15 minutes, a person was on it 3 minutes later, and they paused training.\n\nI'm a solo founder running my startup with AI ht",
      "surface": "feed",
      "url": "https://x.com/SRKDAN/status/2116272597167935709",
      "handle": "SRKDAN",
    },
    {
      "id": "2116190390445318556",
      "text": "The Anthill\n\n20 things hiding inside Anthropic’s S-1 that most people missed\n\nAnthropic’s IPO filing is about 335 pages, and almost nobody read all of it. I went through the filing and the best breakdowns of it, so you don’t have to. Some of this is bullish, some is scary, and ht",
      "surface": "feed",
      "url": "https://x.com/zincharbor/status/2116190390445318556",
      "handle": "zincharbor",
    },
    {
      "id": "2116134336634224649",
      "text": "@OpenAI Related policy from OpenAI's Oct 23 post: frontier model training now runs with no internet access until safeguards improve. After the Sept 20 DNS escape, they paused training and evals of their most capable models to harden the setup.",
      "surface": "feed",
      "url": "https://x.com/promptshortcut/status/2116134336634224649",
      "handle": "promptshortcut",
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
      "id": "2113661518780998003",
      "text": "Computer Use lets agents click and type across any app on your computer, not just the browser.\n\nCursor uses it on its own when a task needs it. You can also ask for it by @-mentioning Computer Use in your prompt.\n\nUpdate Cursor to try it: https://t.co/vwTPMUSnyd",
      "surface": "feed",
      "url": "https://x.com/cursor_ai/status/2113661518780998003",
      "handle": "cursor_ai",
    },
    {
      "id": "2116510929533710355",
      "text": ".@sai_borg doesn’t just help AI agents think. It helps them take action. ⚡\n\nModels can make decisions. Sai gives them a real cloud Windows computer to execute tasks, interact with applications, and get work done.\n\nConnect Claude Code, Codex, or Cursor with one command through htt",
      "surface": "feed",
      "url": "https://x.com/maryamve5oo/status/2116510929533710355",
      "handle": "maryamve5oo",
    },
    {
      "id": "2116506196668715238",
      "text": "Vercel 把「AI 用电脑」做成了一个 npm 包。\n\nVercel Labs 的 Chris Tate 发布开源工具 agent-desktop，自称「整台电脑版的 agent-browser」：任何写代码的 AI agent 都能直接操控 macOS、Windows、Linux 桌面，在后台跑，你照常干活；好几个 agent 还能同时开工，每个一根自己的光标。发布帖约 28 https://t.co/JfQHCIUSdx",
      "surface": "feed",
      "url": "https://x.com/nirvanaaa00/status/2116506196668715238",
      "handle": "nirvanaaa00",
    },
    {
      "id": "2116503703616450817",
      "text": "Vercel Labs shipped agent-desktop this morning. Not a browser agent, a whole computer: any coding agent gets full Computer Use on macOS, Windows or Linux, several agents running in parallel, each with its own cursor, working in the background while you keep typing.\n\nThat's the ht",
      "surface": "feed",
      "url": "https://x.com/stretchcloud/status/2116503703616450817",
      "handle": "stretchcloud",
    },
    {
      "id": "2116503212731601345",
      "text": "Sai work gives developers a real cloud Windows computer for their AI agents. Give it a task in plain English, and watch it get to work.\n\nConnect it to Claude Code, Codex or Cursor with one command via MCP.\n\n#1 on OSWorld 2.0 in partial success rate (79.38%)\n\nSai = $14.34 per http",
      "surface": "feed",
      "url": "https://x.com/tier_1st/status/2116503212731601345",
      "handle": "tier_1st",
    },
    {
      "id": "2116500561545883886",
      "text": "え、そこまで！CursorにもComputer Useが入ったんだね。Grok BotとCursor、この組み合わせでよさそうじゃん! https://t.co/CKeAcYusnP",
      "surface": "feed",
      "url": "https://x.com/mld4t/status/2116500561545883886",
      "handle": "mld4t",
    },
    {
      "id": "2116499628787130701",
      "text": "@rauchg Parallel agents each with their own cursor is the part that actually matters — shared pointer state is where most computer-use demos fall apart. Curious whether the cursor isolation is at the OS input layer or virtualized per agent.",
      "surface": "feed",
      "url": "https://x.com/OnFinality/status/2116499628787130701",
      "handle": "OnFinality",
    },
    {
      "id": "2116499191522365770",
      "text": "Vercel Labs just open-sourced agent-desktop: computer use for any coding agent on macOS, Windows and Linux.\n\nIt drives apps via the OS accessibility tree, runs in the background, and lets several agents use your PC at once, each with its own cursor.\n\nHand an agent your desktop?",
      "surface": "feed",
      "url": "https://x.com/XclusiveInsight/status/2116499191522365770",
      "handle": "XclusiveInsight",
    },
    {
      "id": "2116498835270680960",
      "text": "Your coding agent can now use your whole computer, not just the browser.\n\nVercel Labs just open-sourced agent-desktop:\n&gt; Computer use for any coding agent\n&gt; Reads apps through the OS accessibility tree instead of guessing from screenshots\n&gt; Runs in the background, severa",
      "surface": "feed",
      "url": "https://x.com/Rosasynthesiz/status/2116498835270680960",
      "handle": "Rosasynthesiz",
    },
    {
      "id": "2116496756779393475",
      "text": "A trojanized Claude Code extension sat in Cursor's marketplace for 11 hours, Intel lost about 28% in a day and $12 B of the government's stake with it, Apple put Alibaba's Qwen inside Siri for China, and DoorDash counted its agent orders in the hundreds https://t.co/UXYIXClZGV",
      "surface": "feed",
      "url": "https://x.com/AnotherCodingX/status/2116496756779393475",
      "handle": "AnotherCodingX",
    },
    {
      "id": "2116496210714358101",
      "text": ".@sai_borg is taking AI agents beyond just writing code. 🚀\n\nWith Sai, your AI agent gets access to a real cloud Windows computer to perform tasks, interact with apps, and execute workflows.\n\nConnect Claude Code, Codex, or Cursor with one command through MCP.\n\n🏆 #1 on OSWorld ht",
      "surface": "feed",
      "url": "https://x.com/maryamve5oo/status/2116496210714358101",
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
    }
  ],
  "skipped": false,
  "soft_fail": false,
  "soft_fail_reason": null,
  "land": "GO",
  "counts": {
    "seen": 40,
    "kept": 24
  },
  "stamped_at": "2026-10-31T12:52:23Z"
} as const;
