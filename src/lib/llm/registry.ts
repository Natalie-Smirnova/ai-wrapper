import type { LLMProvider, ModelInfo } from "./types";
import { OpenAIProvider } from "./openai";
import { GeminiProvider } from "./gemini";

const providers: Record<string, LLMProvider> = {};

function getOrCreate(name: string): LLMProvider {
  if (!providers[name]) {
    switch (name) {
      case "openai":
        providers[name] = new OpenAIProvider();
        break;
      case "gemini":
        providers[name] = new GeminiProvider();
        break;
      default:
        throw new Error(`Unknown provider: ${name}`);
    }
  }
  return providers[name];
}

export function getProvider(name: string): LLMProvider {
  return getOrCreate(name);
}

export function listModels(): ModelInfo[] {
  return [
    { id: "gpt-4o", name: "GPT-4o", provider: "openai" },
    { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "openai" },
    { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", provider: "gemini" },
    { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", provider: "gemini" },
  ];
}
