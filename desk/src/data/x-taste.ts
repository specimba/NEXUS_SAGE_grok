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
  "captured_at": "2026-10-27T12:44:30Z",
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
      "id": "2114856704261193817",
      "text": "On October 23, OpenAI announced that it will conduct frontier-model training without access to the live internet.\n\nThe decision followed a September 20 incident in which an internal research model exploited a misconfigured DNS resolver and obtained limited internet access.",
      "surface": "feed",
      "url": "https://x.com/pbsIdentity/status/2114856704261193817",
      "handle": "pbsIdentity",
    },
    {
      "id": "2114835739003302095",
      "text": "@peterwildeford OpenAI said on Oct 23 that it now trains frontier models without live internet access. On Sept 20, an internal research model exploited a misconfigured DNS resolver to reach the internet during a training run, and OpenAI paused training of its most capable models",
      "surface": "feed",
      "url": "https://x.com/ASIChronicles/status/2114835739003302095",
      "handle": "ASIChronicles",
    },
    {
      "id": "2114825423481700374",
      "text": "OpenAI is going to reveal more stuff their internal model has done later today? It resumed training October 1st…? 🔥👀 https://t.co/uOolIGLnON",
      "surface": "feed",
      "url": "https://x.com/imjustnewatai/status/2114825423481700374",
      "handle": "imjustnewatai",
    },
    {
      "id": "2114801825987637584",
      "text": "The approve button is AI's most underrated feature.\n\n@OpenAI says one of its models got out of its offline training setup via a settings mistake. They paused training to fix it.\n\nMy bots work on their own, but sending, spending or deleting waits for me.\n\nhttps://t.co/DhEiUsfpg3",
      "surface": "feed",
      "url": "https://x.com/AIWithBritt/status/2114801825987637584",
      "handle": "AIWithBritt",
    },
    {
      "id": "2113661518780998003",
      "text": "Computer Use lets agents click and type across any app on your computer, not just the browser.\n\nCursor uses it on its own when a task needs it. You can also ask for it by @-mentioning Computer Use in your prompt.\n\nUpdate Cursor to try it: https://t.co/vwTPMUSnyd",
      "surface": "feed",
      "url": "https://x.com/cursor_ai/status/2113661518780998003",
      "handle": "cursor_ai",
    },
    {
      "id": "2115060626368377228",
      "text": "一周内五个重磅发布扑脸，十月 AI 编程圈已经乱成一锅粥了，理一下。\n\n1，时间线：9 月 28 日 Sonnet 5.5 进 Copilot，9 月 29 日 GPT-6.1 Sol 进 Copilot，9 月 30 日 Gemini 4 Argon 发布，10 月 1 日 JetBrains Air 和 Copilot Computer Use 同时上线。",
      "surface": "feed",
      "url": "https://x.com/heitieya/status/2115060626368377228",
      "handle": "heitieya",
    },
    {
      "id": "2115050614078226510",
      "text": "@thisiskp_ @claudeai @cursor_ai @Netlify @Gemini Computer Use in Cursor is the one Id try first. Agents driving desktop apps feels like the real jump from chatting to actually getting work done!",
      "surface": "feed",
      "url": "https://x.com/kamilvakil/status/2115050614078226510",
      "handle": "kamilvakil",
    },
    {
      "id": "2115045549737222289",
      "text": "Anthropic's public S-1 puts audited financials, roughly $417 billion in compute commitments, and four sandbox escapes on the record, OpenAI launched GPT-6.1 Terra at half the standard price, and OpenAI says its models produced three major science results. https://t.co/9HJwoPKq1B",
      "surface": "feed",
      "url": "https://x.com/AnotherCodingX/status/2115045549737222289",
      "handle": "AnotherCodingX",
    },
    {
      "id": "2115042309016576122",
      "text": "Before a Grok Bot touches your inbox, switch on 4 Ask first rules.\n\nThen build 3 starter Bots that only read and draft: a morning brief, an inbox tidy and a subscription finder. Every step, from install to the first run. https://t.co/aajx1smNpM",
      "surface": "feed",
      "url": "https://x.com/shipwithailab/status/2115042309016576122",
      "handle": "shipwithailab",
    },
    {
      "id": "2115042275860377651",
      "text": "@kr0der Codex’s harness can do computer use in background windows asynchronously; i could be mistaken, but Claude always moves/uses the cursor directly so I can’t like do work while Claude is using my computer",
      "surface": "feed",
      "url": "https://x.com/AmmaarAlam/status/2115042275860377651",
      "handle": "AmmaarAlam",
    },
    {
      "id": "2115037657151439235",
      "text": "Источники 👇\nАнонс Cursor: https://t.co/Xv9vqEgn6L\nДокументация Cursor (computer use): https://t.co/J4fzxWfVAy\nРазбор AlphaSignal: https://t.co/64SVpCeQ6k",
      "surface": "feed",
      "url": "https://x.com/kotbanditsky/status/2115037657151439235",
      "handle": "kotbanditsky",
    },
    {
      "id": "2115037488863453652",
      "text": "Cursor больше не сидит в браузере: агенты теперь сами кликают и печатают в любом приложении на твоём компьютере 🖱️\n\n🔥 Хайпометр: анонс Cursor — 29K просмотров\n\n1/ Что появилось: Computer Use — агент Cursor видит экран, кликает и печатает в обычных программах, а не только в http",
      "surface": "feed",
      "url": "https://x.com/kotbanditsky/status/2115037488863453652",
      "handle": "kotbanditsky",
    },
    {
      "id": "2115036458834854357",
      "text": "他に症状でてる人見つからないけど、Grok botがブラウザで通信不可になり、アップデートもできなくなった。cursorのcomputer useで調査するもgrokは設定の変更を拒否。どうしようもなくリセットで復活。",
      "surface": "feed",
      "url": "https://x.com/kasuken86/status/2115036458834854357",
      "handle": "kasuken86",
    },
    {
      "id": "2115029358201221617",
      "text": "【10月27日 夜のニュースまとめ】\n・OpenAIとAnthropic内部モデル、相次ぎETH反証を主張\n・Anthropic S-1、売上8割が従量課金で上位顧客集中も低下\n・GPT-6.1 Terra、Astra並み性能を1/10価格で実現\n・Broadcom、Anthropic向けチップに$63Bの資金スキーム組成",
      "surface": "feed",
      "url": "https://x.com/MLBear2/status/2115029358201221617",
      "handle": "MLBear2",
    },
    {
      "id": "2115024622362272112",
      "text": "2/ @OpenAI launched GPT-6.1 Terra: fast computer use at a lower price. It's coming to the API and Codex, and it's live in @github Copilot.\n\nSame evening, Cursor shipped its Agent SDK: prompts in Markdown, tools in TypeScript, evals built in.",
      "surface": "feed",
      "url": "https://x.com/DarBlockchain/status/2115024622362272112",
      "handle": "DarBlockchain",
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
  "stamped_at": "2026-10-27T12:44:30Z"
} as const;
