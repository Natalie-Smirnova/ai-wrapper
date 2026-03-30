export interface LLMContentPart {
  type: "text" | "image";
  text?: string;
  image_url?: string;
  mime_type?: string;
}

export interface LLMMessage {
  role: "user" | "assistant" | "system";
  content: string | LLMContentPart[];
}

export interface LLMProvider {
  streamCompletion(
    model: string,
    messages: LLMMessage[]
  ): AsyncIterable<string>;
  generateTitle(content: string): Promise<string>;
}

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
}
