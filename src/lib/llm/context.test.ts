import { describe, it, expect, vi } from "vitest";
import type { Message } from "@/types/message";
import type { Attachment } from "@/types/attachment";

vi.mock("@/lib/storage/client", () => ({
  getSignedUrl: vi.fn((path: string) =>
    Promise.resolve(`https://signed.example.com/${path}`)
  ),
}));

const { buildContext } = await import("./context");

function makeMessage(
  overrides: Partial<Message> & { id: string; role: Message["role"]; content: string }
): Message {
  return {
    chat_id: "chat-1",
    provider: null,
    model: null,
    tokens_in: null,
    tokens_out: null,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

function makeAttachment(
  overrides: Partial<Attachment> & { id: string; message_id: string | null }
): Attachment {
  return {
    chat_id: "chat-1",
    file_name: "image.png",
    file_type: "image/png",
    file_size: 1024,
    storage_path: "chats/chat-1/image.png",
    category: "image",
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

describe("buildContext", () => {
  it("returns empty array for empty inputs", async () => {
    const result = await buildContext([], [], []);
    expect(result).toEqual([]);
  });

  it("converts plain text messages", async () => {
    const history: Message[] = [
      makeMessage({ id: "m1", role: "user", content: "Hello" }),
      makeMessage({ id: "m2", role: "assistant", content: "Hi there!" }),
    ];

    const result = await buildContext(history, [], []);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ role: "user", content: "Hello" });
    expect(result[1]).toEqual({ role: "assistant", content: "Hi there!" });
  });

  it("prepends system message with document context", async () => {
    const docChunks = [
      { content: "Chunk one text", file_name: "doc.pdf" },
      { content: "Chunk two text", file_name: "doc.pdf" },
    ];

    const result = await buildContext([], docChunks, []);
    expect(result).toHaveLength(1);
    expect(result[0].role).toBe("system");
    expect(result[0].content).toContain("[Document: doc.pdf]");
    expect(result[0].content).toContain("Chunk one text");
    expect(result[0].content).toContain("Chunk two text");
  });

  it("creates multipart user messages with images", async () => {
    const history: Message[] = [
      makeMessage({ id: "m1", role: "user", content: "Look at this" }),
    ];
    const images: Attachment[] = [
      makeAttachment({
        id: "a1",
        message_id: "m1",
        storage_path: "chats/chat-1/photo.jpg",
        file_type: "image/jpeg",
      }),
    ];

    const result = await buildContext(history, [], images);
    expect(result).toHaveLength(1);
    expect(result[0].role).toBe("user");
    expect(Array.isArray(result[0].content)).toBe(true);

    const parts = result[0].content as Array<{ type: string; text?: string; image_url?: string }>;
    expect(parts[0]).toEqual({ type: "text", text: "Look at this" });
    expect(parts[1].type).toBe("image");
    expect(parts[1].image_url).toContain("photo.jpg");
  });

  it("does not add image parts to assistant messages", async () => {
    const history: Message[] = [
      makeMessage({ id: "m1", role: "assistant", content: "Response" }),
    ];
    const images: Attachment[] = [
      makeAttachment({ id: "a1", message_id: "m1" }),
    ];

    const result = await buildContext(history, [], images);
    expect(result).toHaveLength(1);
    expect(typeof result[0].content).toBe("string");
  });

  it("ignores attachments without message_id", async () => {
    const history: Message[] = [
      makeMessage({ id: "m1", role: "user", content: "test" }),
    ];
    const images: Attachment[] = [
      makeAttachment({ id: "a1", message_id: null }),
    ];

    const result = await buildContext(history, [], images);
    expect(result).toHaveLength(1);
    expect(typeof result[0].content).toBe("string");
  });

  it("combines documents and images with message history", async () => {
    const history: Message[] = [
      makeMessage({ id: "m1", role: "user", content: "Analyze this" }),
      makeMessage({ id: "m2", role: "assistant", content: "Sure" }),
    ];
    const docChunks = [{ content: "Doc content", file_name: "file.txt" }];
    const images: Attachment[] = [
      makeAttachment({ id: "a1", message_id: "m1" }),
    ];

    const result = await buildContext(history, docChunks, images);
    expect(result).toHaveLength(3); // system + user (multipart) + assistant
    expect(result[0].role).toBe("system");
    expect(result[1].role).toBe("user");
    expect(Array.isArray(result[1].content)).toBe(true);
    expect(result[2].role).toBe("assistant");
  });
});
