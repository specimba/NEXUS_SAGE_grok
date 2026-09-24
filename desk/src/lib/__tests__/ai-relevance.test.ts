import { describe, expect, test } from "bun:test";
import { isAiRelevant, isAiRelevantTitle, isLabItemAiRelevant } from "@/lib/ai-relevance";
import { isHnAiRelevant } from "@/lib/hn-pulse";

describe("shared AI-relevance gate", () => {
  test("must-reject: NVIDIA GeForce NOW game post (lab RSS + GNews)", () => {
    const t = "Contain the Chaos: ‘CONTROL Resonant’ Launches on GeForce NOW";
    expect(isLabItemAiRelevant("nvidia", t)).toBe(false);
    expect(isAiRelevantTitle(`${t} - NVIDIA Blog`)).toBe(false);
    // the NVIDIA domain never rescues a general-company post
    expect(isLabItemAiRelevant("nvidia-dev", "Contain the Chaos: CONTROL Resonant Launches on GeForce NOW")).toBe(false);
  });

  test("must-reject: Antennagate (HN) — generic company name alone never qualifies", () => {
    const t = "Steve Jobs iPhone 4 Antennagate press conference Q&A";
    expect(isHnAiRelevant(t, "https://www.youtube.com/watch?v=x")).toBe(false);
    expect(isAiRelevant("Google fined under GDPR", "https://example.com")).toBe(false);
  });

  test("keeps AI posts from general-company feeds", () => {
    expect(isLabItemAiRelevant("nvidia", "At AI Day Singapore, NVIDIA and Partners Showcase AI Advancements")).toBe(true);
    expect(isLabItemAiRelevant("nvidia-dev", "Speeding up LLM inference with TensorRT")).toBe(true);
    expect(isLabItemAiRelevant("google-research", "Automating coherent long-form video generation")).toBe(true);
  });

  test("AI-lab-only feeds pass untouched", () => {
    expect(isLabItemAiRelevant("openai", "Harvey turns legal context into stronger drafts")).toBe(true);
    expect(isLabItemAiRelevant("deepmind", "Advancing Private AI Compute")).toBe(true);
    expect(isLabItemAiRelevant("huggingface", "Welcome to the team")).toBe(true);
  });
});

describe("AI-relevance recall on real 2026-09-24 drops", () => {
  test("keeps AI research titles without the literal word AI", () => {
    expect(isAiRelevantTitle("Transfer learning for genomic prediction in underrepresented populations")).toBe(true);
    expect(isAiRelevantTitle('ToolGrad: Efficient tool-use dataset generation with textual "gradients"')).toBe(true);
    expect(isAiRelevantTitle("GraphRAG: A Practitioner's Guide to 6 Advanced Architectural Patterns")).toBe(true);
    expect(isAiRelevantTitle("Turn Your Latest Observations Into Timely Weather Decisions With NVIDIA Earth-2")).toBe(true);
  });
  test("still rejects infra / people / game posts from company feeds", () => {
    expect(isLabItemAiRelevant("nvidia", "Sakeena Fiza Helps NVIDIA Hardware Succeed at Scale")).toBe(false);
    expect(isLabItemAiRelevant("nvidia", "Cute Critters Come to the Cloud: ‘Aniimo’ Launches on GeForce NOW")).toBe(false);
    expect(isLabItemAiRelevant("ms-research", "Verifying Rust cryptography in SymCrypt, from standards to code")).toBe(false);
  });
});
