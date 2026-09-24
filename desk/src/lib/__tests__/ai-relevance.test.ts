import { describe, expect, test } from "bun:test";
import { isAiRelevant, isAiRelevantTitle, isLabItemRelevant, labItemDropReason } from "@/lib/ai-relevance";
import { feedCategories, parseRssOrAtom } from "@/lib/rss-labs";
import { isHnAiRelevant } from "@/lib/hn-pulse";

describe("shared AI-relevance gate", () => {
  test("GeForce NOW game title is rejected by the title gate (GNews)", () => {
    expect(isAiRelevantTitle("Contain the Chaos: ‘CONTROL Resonant’ Launches on GeForce NOW - NVIDIA Blog")).toBe(false);
  });

  test("must-reject: Antennagate (HN) — generic company name alone never qualifies", () => {
    const t = "Steve Jobs iPhone 4 Antennagate press conference Q&A";
    expect(isHnAiRelevant(t, "https://www.youtube.com/watch?v=x")).toBe(false);
    expect(isAiRelevant("Google fined under GDPR", "https://example.com")).toBe(false);
  });

});

// Real items from the 2026-09-24 blogs.nvidia.com / developer.nvidia.com / MS Research / Google Research feeds.
const GFN_CONTROL = {
  lab: "nvidia",
  link: "https://blogs.nvidia.com/blog/geforce-now-thursday-control-resonant/",
  categories: ["Gaming", "Cloud Gaming", "GeForce NOW"],
};
const GFN_ANIIMO = {
  lab: "nvidia",
  link: "https://blogs.nvidia.com/blog/geforce-now-thursday-aniimo/",
  categories: ["Gaming", "Cloud Gaming", "GeForce NOW"],
};

describe("lab feeds: AI by default; NVIDIA filtered by <category> / path, never title", () => {
  test("must-reject: both GeForce NOW game posts", () => {
    expect(isLabItemRelevant(GFN_CONTROL)).toBe(false);
    expect(isLabItemRelevant(GFN_ANIIMO)).toBe(false);
    expect(labItemDropReason(GFN_CONTROL)).toBe("category:GeForce NOW");
    // path alone is enough when a feed omits categories (fallback data)
    expect(isLabItemRelevant({ lab: "nvidia", link: GFN_ANIIMO.link })).toBe(false);
  });

  test("must-keep: RetroChimera / EvoLib (MS Research) — no title check on research-lab feeds", () => {
    expect(isLabItemRelevant({ lab: "ms-research", link: "https://www.microsoft.com/en-us/research/blog/retrochimera/" })).toBe(true);
    expect(isLabItemRelevant({ lab: "ms-research", link: "https://www.microsoft.com/en-us/research/blog/evolib/" })).toBe(true);
    expect(isLabItemRelevant({ lab: "google-research", link: "https://research.google/blog/millemiglia/" })).toBe(true);
    expect(isLabItemRelevant({ lab: "deepmind", link: "https://deepmind.google/blog/x/" })).toBe(true);
  });

  test("must-keep: NVIDIA data-center / people / research posts (NodeWright, Topograph, Sakeena Fiza, Open Science)", () => {
    expect(
      isLabItemRelevant({
        lab: "nvidia-dev",
        link: "https://developer.nvidia.com/blog/manage-kubernetes-node-fleets-with-nodewright/",
        categories: ["Data Center / Cloud", "Developer Tools & Techniques", "MLOps", "DSX", "Kubernetes"],
      }),
    ).toBe(true);
    expect(
      isLabItemRelevant({
        lab: "nvidia-dev",
        link: "https://developer.nvidia.com/blog/topology-aware-workload-scheduling-with-nvidia-topograph/",
        categories: ["Data Center / Cloud", "AI Factory", "Kubernetes", "Slurm"],
      }),
    ).toBe(true);
    expect(
      isLabItemRelevant({
        lab: "nvidia",
        link: "https://blogs.nvidia.com/blog/nvidia-life-sakeena-fiza/",
        categories: ["AI Infrastructure", "Hardware", "NVIDIA Life", "NVIDIA Rubin"],
      }),
    ).toBe(true);
    expect(
      isLabItemRelevant({
        lab: "nvidia",
        link: "https://blogs.nvidia.com/blog/open-protein-dataset/",
        categories: ["AI", "Research", "AI for Good", "Healthcare and Life Sciences", "Open Source"],
      }),
    ).toBe(true);
  });

  test("gaming category + an AI category keeps; gaming-only dev post drops", () => {
    expect(isLabItemRelevant({ lab: "nvidia-dev", link: "https://developer.nvidia.com/blog/ace/", categories: ["Gaming", "Agentic AI / Generative AI"] })).toBe(true);
    expect(isLabItemRelevant({ lab: "nvidia-dev", link: "https://developer.nvidia.com/blog/optix/", categories: ["Developer Tools & Techniques", "Gaming", "Ray Tracing / Path Tracing"] })).toBe(false);
  });

  test("feed parser reads RSS <category> (CDATA) and Atom term=", () => {
    expect(feedCategories("<category><![CDATA[GeForce NOW]]></category><category>Gaming</category>")).toEqual(["GeForce NOW", "Gaming"]);
    expect(feedCategories('<category scheme="s" term="Data Center / Cloud" /><category term="DSX"/>')).toEqual(["Data Center / Cloud", "DSX"]);
    const [e] = parseRssOrAtom(
      "<rss><channel><item><title>T</title><link>https://blogs.nvidia.com/blog/geforce-now-thursday-x/</link><category><![CDATA[GeForce NOW]]></category></item></channel></rss>",
    );
    expect(e.categories).toEqual(["GeForce NOW"]);
  });
});

describe("title gate (HN / GNews only)", () => {
  test("keeps AI posts from general-company feeds", () => {
    expect(isAiRelevantTitle("At AI Day Singapore, NVIDIA and Partners Showcase AI Advancements")).toBe(true);
    expect(isAiRelevantTitle("Speeding up LLM inference with TensorRT")).toBe(true);
    expect(isAiRelevantTitle("Automating coherent long-form video generation")).toBe(true);
  });

});

describe("AI-relevance recall on real 2026-09-24 drops", () => {
  test("keeps AI research titles without the literal word AI", () => {
    expect(isAiRelevantTitle("Transfer learning for genomic prediction in underrepresented populations")).toBe(true);
    expect(isAiRelevantTitle('ToolGrad: Efficient tool-use dataset generation with textual "gradients"')).toBe(true);
    expect(isAiRelevantTitle("GraphRAG: A Practitioner's Guide to 6 Advanced Architectural Patterns")).toBe(true);
    expect(isAiRelevantTitle("Turn Your Latest Observations Into Timely Weather Decisions With NVIDIA Earth-2")).toBe(true);
  });
  test("title gate still rejects game / non-AI titles (GNews)", () => {
    expect(isAiRelevantTitle("Cute Critters Come to the Cloud: ‘Aniimo’ Launches on GeForce NOW")).toBe(false);
    expect(isAiRelevantTitle("Nvidia, AMD Love This High-Tech Facilitator. So Does Wall Street.")).toBe(false);
  });
});
