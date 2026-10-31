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
  "captured_at": "2026-10-31T02:50:27Z",
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
      "id": "2113661518780998003",
      "text": "Computer Use lets agents click and type across any app on your computer, not just the browser.\n\nCursor uses it on its own when a task needs it. You can also ask for it by @-mentioning Computer Use in your prompt.\n\nUpdate Cursor to try it: https://t.co/vwTPMUSnyd",
      "surface": "feed",
      "url": "https://x.com/cursor_ai/status/2113661518780998003",
      "handle": "cursor_ai",
    },
    {
      "id": "2116361087151153568",
      "text": "agent-desktop gives any coding agent full computer use on macOS, Windows and Linux, with parallel agents each running their own cursor. the browser was just the warmup https://t.co/BhgpwhhvlS",
      "surface": "feed",
      "url": "https://x.com/TheRealKaien/status/2116361087151153568",
      "handle": "TheRealKaien",
    },
    {
      "id": "2116358756262932621",
      "text": "Computer use for any coding agent, running in the background. Each agent getting its own cursor is the part I want stress-tested: who wins when two need the same window? https://t.co/kxkHp3HpKw",
      "surface": "feed",
      "url": "https://x.com/JOhN07x2/status/2116358756262932621",
      "handle": "JOhN07x2",
    },
    {
      "id": "2116336762197053828",
      "text": "Gork4.7也太“菜”了吧？\n\n我原本订阅premium只使用grok bot，最近薅了cursor ultra的7天试用羊毛，就用grok干一些琐事。\n\n因为刚订阅google ai pro送了300美元的赠金，我就让他去google cloud给我开通可以使用gemini4 argon模型的api，于是他各种computer https://t.co/Cliu4X43xJ",
      "surface": "feed",
      "url": "https://x.com/rainchao321/status/2116336762197053828",
      "handle": "rainchao321",
    },
    {
      "id": "2116335988586992091",
      "text": "Computer-use agents are moving from demos to infrastructure. Vercel Labs' agent-desktop gives any coding agent its own cursor, running in parallel in the background across macOS, Windows and Linux. The hard part now is permissions, audit trails and sandboxing. @vercel @ctatedev h",
      "surface": "feed",
      "url": "https://x.com/afagadoeth/status/2116335988586992091",
      "handle": "afagadoeth",
    },
    {
      "id": "2116335697036824811",
      "text": "@ctatedev Computer use that runs in the background while you keep working is the real unlock here. Parallel agents each with their own cursor could turn one laptop into a small team. The open question is permissions: how do you sandbox what each agent can touch on macOS, Windows",
      "surface": "feed",
      "url": "https://x.com/FOMOusX/status/2116335697036824811",
      "handle": "FOMOusX",
    },
    {
      "id": "2116330389719445684",
      "text": "That is amazing, each agent having its own cursor is a killer feature. I hate that I’m building a desktop app and while the agent is doing the test with Computer Use, I can’t continue working in other stuff cuz the cursor is shared between the agent and me 🫠 https://t.co/FMKnPhL",
      "surface": "feed",
      "url": "https://x.com/yoelfme/status/2116330389719445684",
      "handle": "yoelfme",
    },
    {
      "id": "2116328784349860023",
      "text": "@juliver @dydema Utilizing computer use is good idea for substituting cursor control, great job!",
      "surface": "feed",
      "url": "https://x.com/ylfu02/status/2116328784349860023",
      "handle": "ylfu02",
    },
    {
      "id": "2116324033700471088",
      "text": "@neuralink \nTo the Neuralink participants sharing your experiences,\n\nThank you for showing what thought-controlled computer use actually  looks like day to day. From moving a cursor and typing to gaming,  designing, browsing, and messaging, the practical independence you’ve",
      "surface": "feed",
      "url": "https://x.com/0x8A7/status/2116324033700471088",
      "handle": "0x8A7",
    },
    {
      "id": "2116323148706771302",
      "text": "Introducing agent-desktop\n\nagent-browser, for your whole computer\n\n→ Computer Use for any coding agent\n→ macOS, Windows and Linux\n→ Runs in bg while you keep working\n→ Agents use your computer in parallel, each with its own cursor https://t.co/VB0Ss3crjB",
      "surface": "feed",
      "url": "https://x.com/ctatedev/status/2116323148706771302",
      "handle": "ctatedev",
    },
    {
      "id": "2116321640095310208",
      "text": "11月の AI課金プラン\n基本Orcaでマルチエージェント運用\n約12000円\n\n🔸ChatGPT Plus 3000円\n👉6.1 Sol lowで調停役、原稿執筆\n👉6.1 Terra mediumでComputer Use\n\n🔸Claude Pro 22ドル\n👉Opus5.5 mediumで調停役、原稿執筆\n👉Mind Meister MCPでマップ同期\n\n🔸Google AI Pro 2420円",
      "surface": "feed",
      "url": "https://x.com/Manabazutie/status/2116321640095310208",
      "handle": "Manabazutie",
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
  "stamped_at": "2026-10-31T02:50:27Z"
} as const;
