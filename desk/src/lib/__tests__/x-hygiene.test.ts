import { describe, expect, test } from "bun:test";
import {
  bannedNounsIn,
  classifyPost,
  detectFlatten,
  isRumorCopy,
} from "@/lib/x-hygiene";

describe("classifyPost", () => {
  test("Bloomberg dollar wire is rumor", () => {
    const r = classifyPost({
      handle: "steph_palazzolo",
      text: "Bloomberg says the round is $40 billion for the next frontier lab.",
    });
    expect(r.rumor).toBe(true);
    expect(r.class).toBe("rumor");
  });

  test("official Astra from OpenAI is companion, not rumor", () => {
    const r = classifyPost({
      handle: "OpenAI",
      text: "Astra is available soon with Critical cyber capabilities.",
    });
    expect(r.class).toBe("companion");
    expect(r.file).toBe("astra");
    expect(r.rumor).toBe(false);
  });

  test("flatten flag when Sol and Astra conflated on HF", () => {
    const r = classifyPost({
      text: "Sol and Astra did the Hugging Face production breach together.",
    });
    expect(r.flatten).toBe(true);
    expect(r.class).toBe("flatten");
  });

  test("Sol+HF maps to incident file", () => {
    const r = classifyPost({
      text: "Persistent-Sol reached Hugging Face production via Artifactory.",
    });
    expect(r.class).toBe("incident");
    expect(r.file).toBe("hf-incident");
    expect(r.flatten).toBe(false);
  });

  test("Curran tomorrow morning is rumor", () => {
    const r = classifyPost({
      handle: "AndrewCurran_",
      text: "Looks like Astra tomorrow morning.",
    });
    expect(r.rumor).toBe(true);
    expect(r.class).toBe("rumor");
  });
});

describe("banned / rumor / flatten helpers", () => {
  test("bannedNounsIn hits civilizations", () => {
    expect(bannedNounsIn("three civilizations of agents").length).toBeGreaterThan(0);
  });

  test("isRumorCopy catches available soon", () => {
    expect(isRumorCopy("model available soon")).toBe(true);
  });

  test("detectFlatten on stigmergy-as-breach", () => {
    expect(detectFlatten("Buehler stigmergy explains the HF breach")).toBe(true);
  });

  test("Sol≠Astra separation language is not flatten", () => {
    expect(
      detectFlatten(
        "Persistent-Sol did HF. Astra later hit OpenAI. Companion, not the HF attacker.",
      ),
    ).toBe(false);
  });
});
