import { describe, expect, test } from "bun:test";
import { companyOf, companyOfPublisher, companyOfUrl, isSelfRepost } from "@/lib/publisher-company";
import { countSources, sourceKey } from "@/lib/corroboration";

describe("publisher/domain → company map", () => {
  test("company domains", () => {
    expect(companyOfUrl("https://blogs.nvidia.com/blog/ai-day-singapore/")).toBe("nvidia");
    expect(companyOfUrl("https://developer.nvidia.com/blog/x")).toBe("nvidia");
    expect(companyOfUrl("https://deepmind.google/blog/x")).toBe("google");
    expect(companyOfUrl("https://openai.com/index/x")).toBe("openai");
    expect(companyOfUrl("https://www.anthropic.com/news/x")).toBe("anthropic");
    expect(companyOfUrl("https://huggingface.co/blog/x")).toBe("huggingface");
    expect(companyOfUrl("https://techcrunch.com/2026/09/23/x")).toBeNull();
    expect(companyOfUrl("https://www.aljazeera.com/news/x")).toBeNull();
    expect(companyOfUrl("https://x.com/OpenAI/status/1")).toBe("openai");
    expect(companyOfUrl("https://x.com/steph_palazzolo/status/1")).toBeNull();
  });

  test("Google News publishers: brand names and bare domains; mentions never match", () => {
    expect(companyOfPublisher("blogs.nvidia.com")).toBe("nvidia");
    expect(companyOfPublisher("NVIDIA Developer")).toBe("nvidia");
    expect(companyOfPublisher("NVIDIA Technical Blog - NVIDIA Developer")).toBe("nvidia");
    expect(companyOfPublisher("NVIDIA Blog")).toBe("nvidia");
    expect(companyOfPublisher("Anthropic")).toBe("anthropic");
    expect(companyOfPublisher("Google DeepMind")).toBe("google");
    expect(companyOfPublisher("Hugging Face")).toBe("huggingface");
    expect(companyOfPublisher("TechCrunch")).toBeNull();
    expect(companyOfPublisher("techcrunch.com")).toBeNull();
    expect(companyOfPublisher("Al Jazeera")).toBeNull();
    expect(companyOfPublisher("Nvidia stock news")).toBeNull();
    expect(companyOfPublisher("Investor's Business Daily")).toBeNull();
  });

  test("GNews item company comes from <source>, not the news.google.com link", () => {
    const g = { source: "gnews-rss", url: "https://news.google.com/rss/articles/CBMi?oc=5" };
    expect(companyOf({ ...g, publisher: "blogs.nvidia.com" })).toBe("nvidia");
    expect(companyOf({ ...g, publisher: "Al Jazeera" })).toBeNull();
    // lab RSS publisher is a feed id — URL decides
    expect(companyOf({ source: "rss-lab", url: "https://blogs.nvidia.com/blog/x/", publisher: "nvidia" })).toBe("nvidia");
  });

  test("NVIDIA repost counts 0; TechCrunch / Al Jazeera count 1", () => {
    const origin = new Set(["nvidia"]);
    const g = { source: "gnews-rss", url: "https://news.google.com/rss/articles/CBMi?oc=5" };
    expect(isSelfRepost({ ...g, publisher: "blogs.nvidia.com" }, origin)).toBe(true);
    expect(isSelfRepost({ ...g, publisher: "techcrunch.com" }, origin)).toBe(false);
    expect(isSelfRepost({ ...g, publisher: "Al Jazeera" }, new Set(["anthropic"]))).toBe(false);
    expect(isSelfRepost({ ...g, publisher: "Anthropic" }, new Set(["anthropic"]))).toBe(true);
  });
});

describe("corroboration shares the map", () => {
  test("company blog + company-affiliated handle collapse to one source; outlets add one each", () => {
    expect(sourceKey("https://blogs.nvidia.com/blog/x/")).toBe("co:nvidia");
    const nv = countSources({
      id: "nv",
      kind: "rest",
      refs: [
        { href: "https://blogs.nvidia.com/blog/x/" },
        { href: "https://developer.nvidia.com/blog/x" },
        { href: "https://x.com/nvidia/status/1" },
      ],
    });
    expect(nv.n).toBe(1);
    const withOutlets = countSources({
      id: "nv",
      kind: "rest",
      refs: [
        { href: "https://blogs.nvidia.com/blog/x/" },
        { href: "https://techcrunch.com/2026/09/23/x" },
        { href: "https://www.aljazeera.com/news/x" },
      ],
    });
    expect(withOutlets.n).toBe(3);
    expect(withOutlets.keys).toEqual(["aljazeera.com", "co:nvidia", "techcrunch.com"]);
  });

  test("a crawl cluster led by the item's own company adds 0; its independent GNews class still counts", () => {
    const item = { id: "aisle-curl", kind: "rest" as const, refs: [{ href: "https://aisle.com/blog/aisle-curl" }] };
    const own = { id: "cl:1", title: "AISLE found six curl CVEs", sources: ["rss-lab"], url: "https://aisle.com/blog/aisle-curl", lead_source: "rss-lab" };
    expect(countSources(item, [own]).n).toBe(1);
    const covered = { ...own, sources: ["rss-lab", "gnews-rss"] };
    expect(countSources(item, [covered]).keys).toEqual(["co:aisle", "crawl:gnews"]);
  });
});
