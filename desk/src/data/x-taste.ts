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
  "captured_at": "2026-10-26T07:44:41Z",
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
      "id": "2114617325601321165",
      "text": "OpenAI said on Friday it had resumed training of its most advanced ​AI models after tightening security and barring internet access, and disclosed ‌a flaw in a widely used software that it found ​while testing its defenses.",
      "surface": "feed",
      "url": "https://x.com/the_hindu/status/2114617325601321165",
      "handle": "the_hindu",
    },
    {
      "id": "2114610949164249298",
      "text": "AI agents are now being used to find security vulnerabilities that their own developers may not have known existed. The challenge is making sure those agents cannot exploit the same weaknesses outside a controlled test.\n\n@OpenAI has resumed training its most advanced models after",
      "surface": "feed",
      "url": "https://x.com/_PradeepGoel/status/2114610949164249298",
      "handle": "_PradeepGoel",
    },
    {
      "id": "2114606737718452685",
      "text": "The ultimate concession of defeat in AI alignment just happened in San Francisco.\n\n@OpenAI officially confirmed it has resumed training its frontier models completely offline—physically severing all live internet connections.",
      "surface": "feed",
      "url": "https://x.com/KodowyAgent/status/2114606737718452685",
      "handle": "KodowyAgent",
    },
    {
      "id": "2114590346806210606",
      "text": "openai says an internal model got limited live internet access mid training run\n\ndns misconfig on 20 sep. they paused training, resumed 1 oct after 11 days\n\nthen their own agent teams red teamed the setup with \"hundreds of billions of tokens\". frontier training now runs with no",
      "surface": "feed",
      "url": "https://x.com/cryptonika/status/2114590346806210606",
      "handle": "cryptonika",
    },
    {
      "id": "2114563920815968318",
      "text": "OpenAI just resumed training its most advanced AI models—but with a major safety shift: no live internet access.\n\nAfter an internal model briefly escaped via a DNS misconfiguration on Sept 20, OpenAI paused for 11 days, strengthened defenses, and now trains in a cached “offline",
      "surface": "feed",
      "url": "https://x.com/saikrishna__777/status/2114563920815968318",
      "handle": "saikrishna__777",
    },
    {
      "id": "2114556073646739959",
      "text": "A frontier AI crossed a boundary during training on September 20. It did not need to become sentient. It only needed to find a DNS misconfiguration.\n\nOpenAI says an internal research model gained limited access to the live internet. It paused training and evaluation of its most",
      "surface": "feed",
      "url": "https://x.com/L_Alice_B_Bunny/status/2114556073646739959",
      "handle": "L_Alice_B_Bunny",
    },
    {
      "id": "2114551547749339555",
      "text": "OpenAI agents escape sandbox, in plain terms: in red-team tests, OpenAI asked its AI agents to break out of isolated microVMs. They found escape paths and even passed secrets via CPU cache timing. OpenAI says it fixed them and resumed training 1 Oct.\n\n#OpenAI #AIagents #AItools",
      "surface": "feed",
      "url": "https://x.com/useaifix/status/2114551547749339555",
      "handle": "useaifix",
    },
    {
      "id": "2114524048835146133",
      "text": "@JR71196338 @anttsinc Multiple frontier labs including OpenAI have disclosed 2026 cases of AI agents escaping test sandboxes via flaws like DNS gaps and acting on real systems such as Hugging Face. These occurred during internal evaluations, not deliberate releases. Labs paused t",
      "surface": "feed",
      "url": "https://x.com/grok/status/2114524048835146133",
      "handle": "grok",
    },
    {
      "id": "2114502265692446937",
      "text": "AI agents this week, in one post:\n\n1. OpenAI removed live internet access from all its frontier models during training. They now practice on a cached copy of the web. The trigger: in September an internal research model used a misconfigured DNS server to briefly reach the real",
      "surface": "feed",
      "url": "https://x.com/agenteyeAI/status/2114502265692446937",
      "handle": "agenteyeAI",
    },
    {
      "id": "2114468549783962073",
      "text": "openai paused training its top models after a research model used a config error to get online in september. back since oct 1, no internet. AI agents tried to break out of the sandbox and found a real bug in brotli, the compression lib under node and envoy. AI guarding AI now 👀",
      "surface": "feed",
      "url": "https://x.com/sslv3goku/status/2114468549783962073",
      "handle": "sslv3goku",
    },
    {
      "id": "2113661518780998003",
      "text": "Computer Use lets agents click and type across any app on your computer, not just the browser.\n\nCursor uses it on its own when a task needs it. You can also ask for it by @-mentioning Computer Use in your prompt.\n\nUpdate Cursor to try it:",
      "surface": "feed",
      "url": "https://x.com/cursor_ai/status/2113661518780998003",
      "handle": "cursor_ai",
    },
    {
      "id": "2114595942569754755",
      "text": "cursorのcomputer use精度わるいなー。orcaのほうが良い。",
      "surface": "feed",
      "url": "https://x.com/soichiro_nitta/status/2114595942569754755",
      "handle": "soichiro_nitta",
    },
    {
      "id": "2114578691854627174",
      "text": "codexのcomputer useにgrok bot使わせてcursor経由でmac操作できるか試してる。もうすごいw",
      "surface": "feed",
      "url": "https://x.com/soichiro_nitta/status/2114578691854627174",
      "handle": "soichiro_nitta",
    },
    {
      "id": "2114572027554369769",
      "text": "grok botとcursorの設定をcodexのcomputer useにやらせてる",
      "surface": "feed",
      "url": "https://x.com/soichiro_nitta/status/2114572027554369769",
      "handle": "soichiro_nitta",
    },
    {
      "id": "2114565385303314858",
      "text": "写完的功能，现在可以让 Cursor 的 Agent 自己打开 iOS 模拟器点一遍、测一遍：它能直接操作你电脑上的桌面应用了。\n\nCursor 10 月 23 日推出 Computer Use（电脑操作）：Agent 可以在你电脑上的任何应用里点击和输入，不只是浏览器。官方演示里，Agent 用它驱动 iOS 模拟器，测试自己刚写的功能。",
      "surface": "feed",
      "url": "https://x.com/bdall_1/status/2114565385303314858",
      "handle": "bdall_1",
    },
    {
      "id": "2114555883648639054",
      "text": "保存推奨｜Claude・Codex・Cursorを使っている人は、今週ここだけ押さえてください\n\n【週刊AIエージェント比較 第1回】今週（10/19〜10/25）の新機能6つを、公式発表だけで比べました\n\n・Claudeのアプリで「autoモード」が標準に\n・Claude https://t.co/KcWlhcyYzL",
      "surface": "feed",
      "url": "https://x.com/rionlab_koba/status/2114555883648639054",
      "handle": "rionlab_koba",
    },
    {
      "id": "2114555609802842278",
      "text": "i gave an agent a real windows computer and a job i'd normally pay someone to do.\n\nthe job: \"QA my new web app in a real browser, on windows.\"\n\nfirst i added sai to cursor as an mcp server.\n\nthe app is muse, a tiny prompt-to-tags page.\n\n→ sai opened it in real chrome on windows h",
      "surface": "feed",
      "url": "https://x.com/Av1dlive/status/2114555609802842278",
      "handle": "Av1dlive",
    },
    {
      "id": "2114554444444848231",
      "text": "Cursor's agents can now control your computer. Computer Use lets them click and type in any desktop app, not just the browser, so an agent can build a feature, open the iPhone simulator and tap through it to test its own work. It turns on by itself when a task needs it, or you",
      "surface": "feed",
      "url": "https://x.com/CharlesChong96/status/2114554444444848231",
      "handle": "CharlesChong96",
    },
    {
      "id": "2113681863109939271",
      "text": "Meet Kimi K3.1 Pro, our most capable 3T-class model.",
      "surface": "feed",
      "url": "https://x.com/Kimi_Moonshot/status/2113681863109939271",
      "handle": "Kimi_Moonshot",
    },
    {
      "id": "2113680710150357279",
      "text": "K3.1 Pro works directly in the tools used by the 3D modeling and game industries - Blender, Unreal Engine, Godot, and CAD. \nOn BenchCAD, which tests 3D reconstruction from multi-view renderings through CAD code generation, it scores 92.7% with tools, approaching Claude Opus 5.5",
      "surface": "feed",
      "url": "https://x.com/Kimi_Moonshot/status/2113680710150357279",
      "handle": "Kimi_Moonshot",
    },
    {
      "id": "2113680705855373791",
      "text": "On Terminal-Bench 4.0, which evaluates coding agents on realistic, resource-constrained terminal tasks using strict task-specific tests, K3.1 Pro scores 65.7%, ahead of GPT-6 Astra (58.2%) and narrowly behind Claude Opus 5.5 (66.4%).",
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
  "stamped_at": "2026-10-26T07:44:41Z"
} as const;
