import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSendMessageStream = vi.fn();
const mockStartChat = vi.fn().mockReturnValue({
  sendMessageStream: mockSendMessageStream,
});
const mockGetGenerativeModel = vi.fn().mockReturnValue({
  startChat: mockStartChat,
  generateContent: vi.fn().mockResolvedValue({
    response: { text: () => "Chat Title" },
  }),
});

vi.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: class {
    getGenerativeModel = mockGetGenerativeModel;
  },
}));

// Mock global fetch for image download
const mockFetchFn = vi.fn();
vi.stubGlobal("fetch", mockFetchFn);

import { GeminiProvider } from "./gemini";
import type { LLMMessage } from "./types";

describe("GeminiProvider", () => {
  let provider: GeminiProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSendMessageStream.mockResolvedValue({
      stream: (async function* () {
        yield { text: () => "Hello" };
      })(),
    });
    provider = new GeminiProvider();
  });

  it("converts image URL to base64 inlineData", async () => {
    const fakeImageBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
    mockFetchFn.mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(fakeImageBytes.buffer),
    });

    const messages: LLMMessage[] = [
      {
        role: "user",
        content: [
          { type: "text", text: "Describe this" },
          {
            type: "image",
            image_url: "https://example.com/image.png",
            mime_type: "image/png",
          },
        ],
      },
    ];

    const stream = provider.streamCompletion("gemini-1.5-pro", messages);
    for await (const _ of stream) {
      // consume
    }

    // Verify fetch was called with the image URL
    expect(mockFetchFn).toHaveBeenCalledWith("https://example.com/image.png");

    // Check the parts sent to sendMessageStream
    const sentParts = mockSendMessageStream.mock.calls[0][0];
    const imagePart = sentParts.find((p: Record<string, unknown>) => p.inlineData !== undefined);

    expect(imagePart).toBeDefined();
    expect(imagePart.inlineData.mimeType).toBe("image/png");
    // Should be base64 string, not the URL
    expect(imagePart.inlineData.data).not.toBe("https://example.com/image.png");
    expect(imagePart.inlineData.data).toBeTruthy();
  });

  it("falls back to text when image fetch fails", async () => {
    mockFetchFn.mockResolvedValue({
      ok: false,
      status: 404,
    });

    const messages: LLMMessage[] = [
      {
        role: "user",
        content: [
          { type: "text", text: "Describe this" },
          {
            type: "image",
            image_url: "https://example.com/missing.png",
            mime_type: "image/png",
          },
        ],
      },
    ];

    const stream = provider.streamCompletion("gemini-1.5-pro", messages);
    for await (const _ of stream) {
      // consume
    }

    const sentParts = mockSendMessageStream.mock.calls[0][0];
    // No inlineData part
    const imagePart = sentParts.find((p: Record<string, unknown>) => p.inlineData !== undefined);
    expect(imagePart).toBeUndefined();

    // Should have fallback text
    const texts = sentParts.filter((p: Record<string, unknown>) => p.text !== undefined);
    expect(texts.some((p: Record<string, unknown>) => String(p.text).includes("[Image unavailable"))).toBe(true);
  });
});
