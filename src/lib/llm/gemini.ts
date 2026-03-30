import { GoogleGenerativeAI } from "@google/generative-ai";
import type { LLMProvider, LLMMessage, LLMContentPart } from "./types";

export class GeminiProvider implements LLMProvider {
  private client: GoogleGenerativeAI;

  constructor() {
    this.client = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);
  }

  async *streamCompletion(
    model: string,
    messages: LLMMessage[]
  ): AsyncIterable<string> {
    const genModel = this.client.getGenerativeModel({ model });

    // Convert messages to Gemini format
    const history: Array<{
      role: string;
      parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }>;
    }> = [];

    for (let i = 0; i < messages.length - 1; i++) {
      const m = messages[i];
      history.push({
        role: m.role === "assistant" ? "model" : "user",
        parts: await this.toParts(m.content),
      });
    }

    // Filter out system messages from history, prepend as first user message
    const systemMessages = messages.filter((m) => m.role === "system");
    const nonSystemHistory = history.filter(
      (_, i) => messages[i].role !== "system"
    );

    const lastMessage = messages[messages.length - 1];
    const lastParts = await this.toParts(lastMessage.content);

    // Prepend system content to the first user message
    if (systemMessages.length > 0) {
      const systemText = systemMessages
        .map((m) => (typeof m.content === "string" ? m.content : ""))
        .join("\n");
      if (nonSystemHistory.length > 0 && nonSystemHistory[0].role === "user") {
        nonSystemHistory[0].parts.unshift({ text: systemText + "\n\n" });
      } else {
        lastParts.unshift({ text: systemText + "\n\n" });
      }
    }

    const chat = genModel.startChat({ history: nonSystemHistory });
    const result = await chat.sendMessageStream(lastParts);

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) yield text;
    }
  }

  async generateTitle(content: string): Promise<string> {
    const model = this.client.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(
      `Generate a short title (max 6 words) for this conversation. Return only the title, no quotes.\n\n${content}`
    );
    return result.response.text().trim() || "New chat";
  }

  private async toParts(
    content: string | LLMContentPart[]
  ): Promise<Array<{ text: string } | { inlineData: { mimeType: string; data: string } }>> {
    if (typeof content === "string") {
      return [{ text: content }];
    }

    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];

    for (const part of content) {
      if (part.type === "text") {
        parts.push({ text: part.text! });
      } else if (part.image_url) {
        try {
          const response = await fetch(part.image_url);
          if (!response.ok) {
            parts.push({ text: `[Image unavailable: fetch failed with ${response.status}]` });
            continue;
          }
          const buffer = await response.arrayBuffer();
          const base64 = Buffer.from(buffer).toString("base64");
          parts.push({
            inlineData: {
              mimeType: part.mime_type || "image/jpeg",
              data: base64,
            },
          });
        } catch {
          parts.push({ text: "[Image unavailable: failed to download]" });
        }
      }
    }

    return parts;
  }
}
