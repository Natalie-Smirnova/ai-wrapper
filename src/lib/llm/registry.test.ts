import { describe, it, expect, vi } from "vitest";

// Mock providers as classes
vi.mock("./openai", () => ({
  OpenAIProvider: class {
    streamCompletion = vi.fn();
    generateTitle = vi.fn();
  },
}));

vi.mock("./gemini", () => ({
  GeminiProvider: class {
    streamCompletion = vi.fn();
    generateTitle = vi.fn();
  },
}));

const { getProvider, listModels } = await import("./registry");

describe("listModels", () => {
  it("returns all available models", () => {
    const models = listModels();
    expect(models).toHaveLength(4);
    expect(models.map((m) => m.id)).toEqual([
      "gpt-4o",
      "gpt-4o-mini",
      "gemini-1.5-pro",
      "gemini-1.5-flash",
    ]);
  });

  it("each model has id, name, and provider", () => {
    for (const model of listModels()) {
      expect(model).toHaveProperty("id");
      expect(model).toHaveProperty("name");
      expect(model).toHaveProperty("provider");
    }
  });

  it("includes both openai and gemini providers", () => {
    const providers = [...new Set(listModels().map((m) => m.provider))];
    expect(providers).toContain("openai");
    expect(providers).toContain("gemini");
  });
});

describe("getProvider", () => {
  it("returns a provider for 'openai'", () => {
    const provider = getProvider("openai");
    expect(provider).toBeDefined();
    expect(provider.streamCompletion).toBeDefined();
    expect(provider.generateTitle).toBeDefined();
  });

  it("returns a provider for 'gemini'", () => {
    const provider = getProvider("gemini");
    expect(provider).toBeDefined();
  });

  it("throws for unknown provider name", () => {
    expect(() => getProvider("unknown")).toThrow("Unknown provider: unknown");
  });

  it("caches provider instances", () => {
    const a = getProvider("openai");
    const b = getProvider("openai");
    expect(a).toBe(b);
  });
});
