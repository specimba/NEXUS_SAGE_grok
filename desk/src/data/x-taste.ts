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
  "captured_at": "2026-10-31T07:46:17Z",
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
      "id": "2115812732872151265",
      "text": "An OpenAI model found a path to the internet through a DNS misconfiguration. OpenAI paused training of its most powerful models.\n\nA capable agent will probe its limits. Scope its access before, never after.",
      "surface": "feed",
      "url": "https://x.com/Abbas_Mistrah/status/2115812732872151265",
      "handle": "Abbas_Mistrah",
    },
    {
      "id": "2113661518780998003",
      "text": "Computer Use lets agents click and type across any app on your computer, not just the browser.\n\nCursor uses it on its own when a task needs it. You can also ask for it by @-mentioning Computer Use in your prompt.\n\nUpdate Cursor to try it: https://t.co/vwTPMUSnyd",
      "surface": "feed",
      "url": "https://x.com/cursor_ai/status/2113661518780998003",
      "handle": "cursor_ai",
    },
    {
      "id": "2116434864908259528",
      "text": "@theo I wonder when codex is going to fix the computer use cursors just hanging around. Every time I have to tell it “computer use cursor is still there remove it”. And one session even tried to just move it to the side as a solution. 😂",
      "surface": "feed",
      "url": "https://x.com/cactustit/status/2116434864908259528",
      "handle": "cactustit",
    },
    {
      "id": "2116429412019450246",
      "text": "computer use just became a cli 🖥️\n\n@ctatedev's agent-desktop, agent-browser for your whole machine:\n- any coding agent\n- macos, windows, linux\n- runs in the background\n- parallel agents, each with its own cursor\n\nclicking was never the hard part. permissions are",
      "surface": "feed",
      "url": "https://x.com/Karthikvarmamkv/status/2116429412019450246",
      "handle": "Karthikvarmamkv",
    },
    {
      "id": "2116422728756478068",
      "text": "Vercel Labs shipped agent-desktop. Computer use for any coding agent on macOS, Windows and Linux, running in the background while you work.\n\nSeveral agents share one machine in parallel, each with its own cursor.\n\nYour desktop is now an office and you are the slow hire https://t.",
      "surface": "feed",
      "url": "https://x.com/shiparena/status/2116422728756478068",
      "handle": "shiparena",
    },
    {
      "id": "2116421579391250652",
      "text": "Today in AI Engineering (October 30)\n\n• NVIDIA releases Nemotron 3.5 Super: 12B active parameters, 51.78% SWE-bench Pro\n• Anthropic adds cap-free 5-hour usage for verified Claude Ultra accounts at $200/month\n• JetSpec++ reports lossless Qwen3-8B decoding above 4,000 tokens/s http",
      "surface": "feed",
      "url": "https://x.com/aidailyprimer/status/2116421579391250652",
      "handle": "aidailyprimer",
    },
    {
      "id": "2116418391116329088",
      "text": "Vercel just open sourced agent-desktop, and this is an interesting step forward\n\nuntil now, most computer-use tools have focused on giving agents access to a browser\n\nagent-desktop takes that to your entire desktop.\n\n&gt; Works across macOS, Windows and Linux\n&gt; Gives any codin",
      "surface": "feed",
      "url": "https://x.com/prasad_pilla/status/2116418391116329088",
      "handle": "prasad_pilla",
    },
    {
      "id": "2116417280938827985",
      "text": "agent-desktop gives any coding agent Computer Use on the whole machine. It runs in the background, and parallel agents each get their own cursor on macOS, Windows, and Linux. https://t.co/Ax7mZlcmKz",
      "surface": "feed",
      "url": "https://x.com/DannielDevOps/status/2116417280938827985",
      "handle": "DannielDevOps",
    },
    {
      "id": "2116416803287044346",
      "text": "Vercel Labs just released agent-desktop, computer use for any coding agent. Here's what you need to know.\n\nChris Tate (@ctatedev) announced it today as \"agent-browser, for your whole computer.\" It takes Vercel's agent-browser idea, token-efficient browser control for agents, and",
      "surface": "feed",
      "url": "https://x.com/AGTPinsights/status/2116416803287044346",
      "handle": "AGTPinsights",
    },
    {
      "id": "2116404708331901319",
      "text": "@bozhou_ai 以前 Computer Use 像 Codex 独门，现在 npm 一条就外挂到 Claude Code / Cursor。能力齐了，差别回到谁的权限审批和审计做得更狠。",
      "surface": "feed",
      "url": "https://x.com/php_martin/status/2116404708331901319",
      "handle": "php_martin",
    },
    {
      "id": "2116380501783281884",
      "text": "My whole operation runs on agents now. Here's the stack:\n\nClaude Code, Codex and Cursor to build Collide so every agent shares one codebase map and stops overwriting each other (621x fewer tokens) Gemini 3.8 Flash planning and Laya on ONNX deciding, powering Bongo, my computer ht",
      "surface": "feed",
      "url": "https://x.com/kevinvera/status/2116380501783281884",
      "handle": "kevinvera",
    },
    {
      "id": "2116378377762332842",
      "text": "Computer-use agents have spent two years relocating the same button on every single frame, which is the real reason so many 2024-era demos looked drunk.\n\nVercel's new agent-desktop skips that problem by reading the operating system's accessibility tree instead of a screenshot, ht",
      "surface": "feed",
      "url": "https://x.com/stretchcloud/status/2116378377762332842",
      "handle": "stretchcloud",
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
  "stamped_at": "2026-10-31T07:46:17Z"
} as const;
