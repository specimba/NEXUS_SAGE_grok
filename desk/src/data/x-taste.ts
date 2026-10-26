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
  "captured_at": "2026-10-26T12:45:39Z",
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
      "id": "2114692249569378699",
      "text": "Air-Gapped AI: OpenAI Resumes Frontier Model Training After Security Overhaul and Software Bug Disclosure\n\nOpenAI has resumed training its most advanced AI models following a security overhaul that permanently bars live internet access during training. After a research model",
      "surface": "feed",
      "url": "https://x.com/techshotsapp/status/2114692249569378699",
      "handle": "techshotsapp",
    },
    {
      "id": "2114691458842415479",
      "text": "JUST IN: OpenAI just revealed it resumed training its most advanced AI models following an 11-day security pause and upgrades.",
      "surface": "feed",
      "url": "https://x.com/financial_index/status/2114691458842415479",
      "handle": "financial_index",
    },
    {
      "id": "2114689842546131165",
      "text": "OpenAI has resumed training its most advanced AI models after a security overhaul. While stress-testing its defenses, it found a flaw in Brotli, a widely used compression tool; patched versions are now out. https://t.co/DZtQ4XShT9",
      "surface": "feed",
      "url": "https://x.com/jhonthorss/status/2114689842546131165",
      "handle": "jhonthorss",
    },
    {
      "id": "2114688771891581256",
      "text": "One of OpenAI's own models found a hole and reached the live internet. During training.\n\nOpenAI just published the details:\n• Sept 20: an internal research model exploited a DNS misconfiguration to get \"limited access to the live internet\" during a training run\n• OpenAI paused",
      "surface": "feed",
      "url": "https://x.com/sjandfun/status/2114688771891581256",
      "handle": "sjandfun",
    },
    {
      "id": "2114681648130425253",
      "text": "A frontier model found a DNS misconfiguration and walked out of its offline sandbox. OpenAI paused training to fix it.\n\nIf the labs' own sandboxes leak, what is your agent's permission list actually stopping? https://t.co/wbusKRoWFa",
      "surface": "feed",
      "url": "https://x.com/naoki_sambyaku/status/2114681648130425253",
      "handle": "naoki_sambyaku",
    },
    {
      "id": "2114681203634712666",
      "text": "🌐 OpenAI will train its frontier models with no live internet access — only a cached, indexed copy of the web.\n\nThe reason: models in training kept breaking out. In September one got online through a misconfiguration and OpenAI paused training.\n\nhttps://t.co/yf9lumeOUO https://t",
      "surface": "feed",
      "url": "https://x.com/effecthub_ai/status/2114681203634712666",
      "handle": "effecthub_ai",
    },
    {
      "id": "2114632846975598675",
      "text": "OpenAI just cut its smartest AI models off from the internet.\n\nNot to protect the models from hackers.\nTo protect the internet from the models.\n\nOn September 20, an OpenAI research model got a simple task: find details about a blogger.\n\nIt tried the search tool.\nThen search https",
      "surface": "feed",
      "url": "https://x.com/Spacepiratereal/status/2114632846975598675",
      "handle": "Spacepiratereal",
    },
    {
      "id": "2114631872357466321",
      "text": "Claude crossed a paywall without being asked. OpenAI locked down its agents. A simple AGENTS.md file hijacked coding tools.\n\nAI agents are getting smarter, but are we giving them too much freedom without enough verification?\n\nHere's what happened. Read 👇 https://t.co/5fb0KX72ls",
      "surface": "feed",
      "url": "https://x.com/CobaltHere/status/2114631872357466321",
      "handle": "CobaltHere",
    },
    {
      "id": "2113661518780998003",
      "text": "Computer Use lets agents click and type across any app on your computer, not just the browser.\n\nCursor uses it on its own when a task needs it. You can also ask for it by @-mentioning Computer Use in your prompt.\n\nUpdate Cursor to try it: https://t.co/vwTPMUSnyd",
      "surface": "feed",
      "url": "https://x.com/cursor_ai/status/2113661518780998003",
      "handle": "cursor_ai",
    },
    {
      "id": "2114694552976077054",
      "text": "Cursor porta il computer use nei suoi agenti: ora cliccano e digitano in qualsiasi app, anche nel simulatore iOS. Così l'agente prova da solo il codice che scrive, prima della pull request. https://t.co/Wt1IyyZ6oH #IntelligenzaArtificiale #Cursor #AI",
      "surface": "feed",
      "url": "https://x.com/intelligenzaart/status/2114694552976077054",
      "handle": "intelligenzaart",
    },
    {
      "id": "2114689577529328026",
      "text": "@chetaslua Agreed. A visible cursor path plus a short \"why I clicked this\" label would make computer use much easier to trust and debug. Right now most runs are a blur of screenshots.",
      "surface": "feed",
      "url": "https://x.com/KeyoAPI/status/2114689577529328026",
      "handle": "KeyoAPI",
    },
    {
      "id": "2114687133692932270",
      "text": "@chetaslua Having a little Claude mascot drag my cursor around would make me trust computer use way more somehow",
      "surface": "feed",
      "url": "https://x.com/IamYashKapoor/status/2114687133692932270",
      "handle": "IamYashKapoor",
    },
    {
      "id": "2114679007144821001",
      "text": "@chetaslua This is the missing piece for computer use. Watching an agent work right now is just logs scrolling by. I've been making AI videos with pure code instead of video models, and a mascot driving the cursor feels very doable that way. Someone ship this 👀",
      "surface": "feed",
      "url": "https://x.com/IAenCrudo/status/2114679007144821001",
      "handle": "IAenCrudo",
    },
    {
      "id": "2114678337217990785",
      "text": "@poteto (Or anyone else) I am running on Super Limits currently, and am running Qwen3.8-flash-next locally. I am trying to find a way to balance usage limits between Grok Bot and Local. I make it to the day before reset and run out currently. With your understanding of Cursor /",
      "surface": "feed",
      "url": "https://x.com/krisjklosterman/status/2114678337217990785",
      "handle": "krisjklosterman",
    },
    {
      "id": "2114677664053391673",
      "text": "@qi9098 并排视频这个证据太硬了。Codex 两分钟还顺手重启验收，Cursor 卡在切换按钮三分多钟——Computer Use 现在拼的是「点得准」，不是功能清单。你后面还会用 LCU 把 Codex 的 Computer Use 接到别的 Agent 上吗？",
      "surface": "feed",
      "url": "https://x.com/HunZhijie/status/2114677664053391673",
      "handle": "HunZhijie",
    },
    {
      "id": "2114673370151403856",
      "text": "@king1818888 我昨天刚测过 Codex 的 computer use，拿官方的 iOS demo 跟 Cursor 对比了一下。Codex 跑的时候一直在后台操作模拟器，两分钟搞定，Cursor 点了八分多钟才跑完，反差比我想象的还大。过程录屏和计时数据我发在主帖了，需要的朋友可以看下\nhttps://t.co/n3Z5OvFLcp",
      "surface": "feed",
      "url": "https://x.com/qi9098/status/2114673370151403856",
      "handle": "qi9098",
    },
    {
      "id": "2114663805750022145",
      "text": "Cursor Computer Use\nAIがデスクトップを操作\n\nじゃあ今回、どこが違うのか？\n\n結論、作ったアプリをAI自身が\nクリックして確かめられます。\n\n変わったのはここ↓\n・ブラウザ以外のアプリも操作\n・iOS Simulatorでも動作確認\n・@Computer Useで呼び出し\n\nこれまで：アプリの確認は人の手\n↓ https://t.co/4jJkTQXAfE",
      "surface": "feed",
      "url": "https://x.com/Yanagi_AI_Edit/status/2114663805750022145",
      "handle": "Yanagi_AI_Edit",
    },
    {
      "id": "2114663467332538626",
      "text": "@madhugogineni97 Computer use could be a game changer for Cursor moving beyond writing code to actually interacting with apps and testing what it builds.\n If they nail reliability and execution, this could be exactly the feature they need to regain momentum.",
      "surface": "feed",
      "url": "https://x.com/GlenBytes/status/2114663467332538626",
      "handle": "GlenBytes",
    },
    {
      "id": "2114662511299707276",
      "text": "Cursor Computer Use 是啥？\n\n给编码 Agent 配一双手：能点、能打字、能开桌面应用——写完代码后自己点开模拟器/浏览器验一下，少一层人工搬运。\n\n产品定位：写和验之间的自动化验收助手，不是又一个聊天框。\n\n演示中途你会放心交给它点屏幕吗？\n#AIAgent #Cursor https://t.co/2rGgGOX4iV",
      "surface": "feed",
      "url": "https://x.com/Weichuang145683/status/2114662511299707276",
      "handle": "Weichuang145683",
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
  "stamped_at": "2026-10-26T12:45:39Z"
} as const;
