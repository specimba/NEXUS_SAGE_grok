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
  "captured_at": "2026-10-28T12:43:38Z",
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
      "id": "2113661518780998003",
      "text": "Computer Use lets agents click and type across any app on your computer, not just the browser.\n\nCursor uses it on its own when a task needs it. You can also ask for it by @-mentioning Computer Use in your prompt.\n\nUpdate Cursor to try it: https://t.co/vwTPMUSnyd",
      "surface": "feed",
      "url": "https://x.com/cursor_ai/status/2113661518780998003",
      "handle": "cursor_ai",
    },
    {
      "id": "2115416733498716481",
      "text": "Tu agente de IA ya no solo escribe código: con Computer Use, Cursor hace clic, escribe y toma capturas en cualquier app de tu computador. Abre el iOS Simulator y prueba lo que programó. Lo pides mencionándolo en tu prompt. Así lo pruebas sin riesgos 👇 https://t.co/GgKYGAHaS1",
      "surface": "feed",
      "url": "https://x.com/MDALatam/status/2115416733498716481",
      "handle": "MDALatam",
    },
    {
      "id": "2115390541999362197",
      "text": "if claude changes this weird ugly ass cursor i might trust their computer use more https://t.co/1B4i42RMe5",
      "surface": "feed",
      "url": "https://x.com/0nabilbk/status/2115390541999362197",
      "handle": "0nabilbk",
    },
    {
      "id": "2115368082092986538",
      "text": "【TechFeedまとめ】2026-10-28\n\n■ Zenn\n1. AIに「片付けて」と丸投げしたら、フォルダの外が消えたのは12回中0回。許可フラグを外しても rm -r は通った\nhttps://t.co/29AQ5qlOtZ\n\n2. 同じトレード戦略をAIでAlpacaとQuantConnect向けコードに変換して比較してみる\nhttps://t.co/OsMweQGYwv\n\n3.",
      "surface": "feed",
      "url": "https://x.com/Masato1864646/status/2115368082092986538",
      "handle": "Masato1864646",
    },
    {
      "id": "2115368049964675371",
      "text": "@illyism @dominikSnowRise @pranjalsoni_ @marclou Okay so no Google sub. Using Google inside cursor. \n\nSame setup here except $100 OpenAI but mostly use that for computer use I’m sure $20 be fine",
      "surface": "feed",
      "url": "https://x.com/awpthorp/status/2115368049964675371",
      "handle": "awpthorp",
    },
    {
      "id": "2115354522768089253",
      "text": "هالأسبوع شحن كثير للوكلاء: Duet، Computer Use في Cursor، موصلات نشر من الشات، وCLI للوسائط.\nأنا ما ألحق كل إطلاق — أختار واحد أجرّبه على مشكلة حقيقية هذا الأسبوع.\nاللي ما يدخل في عمل فعلي يبقى ضجيج تايملاين.\n#Ship",
      "surface": "feed",
      "url": "https://x.com/NoorErgsous/status/2115354522768089253",
      "handle": "NoorErgsous",
    },
    {
      "id": "2115333085877379279",
      "text": "@_junaidkhalid1 openai ships computer-use cheaper then cursor drops an agent sdk an hour later. which weekly task you'd hand to a screen-clicker is the real question",
      "surface": "feed",
      "url": "https://x.com/maomao000211/status/2115333085877379279",
      "handle": "maomao000211",
    },
    {
      "id": "2115324684296225175",
      "text": "I am having a delightful time using @bot.\n\nIt’s not like things like remote control, routines and computer use didn’t exist, but this has to be the most palatable form factor to use AI to do meaningful work.\n\nIn 48 hours, I’ve used it a fair bit pretty retentively, and created a",
      "surface": "feed",
      "url": "https://x.com/bharadwhat/status/2115324684296225175",
      "handle": "bharadwhat",
    },
    {
      "id": "2115315616282264027",
      "text": "@AiAdventurerx This Cursor Computer Use feature is insanely good for automated testing! But dealing with billing limits and constant subscription renewals can be such a headache for heavy devs.\n\nIf you need a smooth setup wi\nhttps://t.co/cHfzd0Hp5Y | 官方客服 @kawang555_bot",
      "surface": "feed",
      "url": "https://x.com/xreg2a66321ebb/status/2115315616282264027",
      "handle": "xreg2a66321ebb",
    },
    {
      "id": "2115315121551720959",
      "text": "Cursor Computer Use: agents that click and type in desktop apps like the iOS Simulator to test what they build\nhttps://t.co/fY1mjoM5f3\n https://t.co/OmSYTunL2r",
      "surface": "feed",
      "url": "https://x.com/AiAdventurerx/status/2115315121551720959",
      "handle": "AiAdventurerx",
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
  "stamped_at": "2026-10-28T12:43:38Z"
} as const;
