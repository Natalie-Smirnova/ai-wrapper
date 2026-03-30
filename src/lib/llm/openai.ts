import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import type { LLMProvider, LLMMessage, LLMContentPart } from "./types";

export class OpenAIProvider implements LLMProvider {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  private toOpenAIMessages(messages: LLMMessage[]): ChatCompletionMessageParam[] {
    return messages.map((m) => {
      if (m.role === "system") {
        return {
          role: "system" as const,
          content: typeof m.content === "string" ? m.content : m.content.map((p) => p.text ?? "").join(""),
        };
      }
      if (m.role === "assistant") {
        return {
          role: "assistant" as const,
          content: typeof m.content === "string" ? m.content : m.content.map((p) => p.text ?? "").join(""),
        };
      }
      // user
      return {
        role: "user" as const,
        content:
          typeof m.content === "string"
            ? m.content
            : m.content.map((part: LLMContentPart) =>
                part.type === "text"
                  ? { type: "text" as const, text: part.text! }
                  : { type: "image_url" as const, image_url: { url: part.image_url! } }
              ),
      };
    });
  }

  async *streamCompletion(
    model: string,
    messages: LLMMessage[]
  ): AsyncIterable<string> {
    const stream = await this.client.chat.completions.create({
      model,
      messages: this.toOpenAIMessages(messages),
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) yield content;
    }
  }

  async generateTitle(content: string): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Generate a short title (max 6 words) for this conversation. Return only the title, no quotes.",
        },
        { role: "user", content },
      ],
      max_tokens: 20,
    });

    return response.choices[0]?.message?.content?.trim() || "New chat";
  }
}
