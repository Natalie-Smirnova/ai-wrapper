import type { LLMMessage, LLMContentPart } from "./types";
import type { Message } from "@/types/message";
import type { Attachment } from "@/types/attachment";
import { getSignedUrl } from "@/lib/storage/client";

export async function buildContext(
  history: Message[],
  docChunks: { content: string; file_name: string }[],
  imageAttachments: Attachment[]
): Promise<LLMMessage[]> {
  const messages: LLMMessage[] = [];

  // System message with document context
  if (docChunks.length > 0) {
    const docContext = docChunks
      .map((chunk) => `[Document: ${chunk.file_name}]\n${chunk.content}`)
      .join("\n\n---\n\n");

    messages.push({
      role: "system",
      content: `The user has uploaded the following documents for reference:\n\n${docContext}`,
    });
  }

  // Build image URL map: message_id -> signed URLs
  const imagesByMessage = new Map<string, Attachment[]>();
  for (const img of imageAttachments) {
    if (!img.message_id) continue;
    const existing = imagesByMessage.get(img.message_id) || [];
    existing.push(img);
    imagesByMessage.set(img.message_id, existing);
  }

  // Convert message history
  for (const msg of history) {
    const msgImages = imagesByMessage.get(msg.id) || [];

    if (msgImages.length > 0 && msg.role === "user") {
      // Multipart message with images
      const parts: LLMContentPart[] = [{ type: "text", text: msg.content }];

      for (const img of msgImages) {
        const url = await getSignedUrl(img.storage_path);
        parts.push({ type: "image", image_url: url, mime_type: img.file_type });
      }

      messages.push({ role: msg.role, content: parts });
    } else {
      messages.push({ role: msg.role, content: msg.content });
    }
  }

  return messages;
}
