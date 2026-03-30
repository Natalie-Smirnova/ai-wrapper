import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

// Mock apiStream
const mockReader = {
  read: vi.fn(),
};

vi.mock("@/lib/api/client", () => ({
  apiStream: vi.fn(() => Promise.resolve(mockReader)),
}));

import { useSendMessage } from "./use-send-message";

function encodeSSE(events: string[]): Uint8Array[] {
  const encoder = new TextEncoder();
  return events.map((e) => encoder.encode(e));
}

function setupReader(chunks: Uint8Array[]) {
  let callIndex = 0;
  mockReader.read.mockImplementation(async () => {
    if (callIndex < chunks.length) {
      return { done: false, value: chunks[callIndex++] };
    }
    return { done: true, value: undefined };
  });
}

describe("useSendMessage", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  function wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children
    );
  }

  it("adds user_message to the messages query cache immediately", async () => {
    // Seed messages cache
    queryClient.setQueryData(["messages", "chat-1"], { data: [] });

    const userMsg = {
      id: "m1",
      chat_id: "chat-1",
      role: "user",
      content: "Hello",
      created_at: "2024-01-01",
    };

    setupReader(
      encodeSSE([
        `data: ${JSON.stringify({ type: "user_message", message: userMsg })}\n\n`,
        'data: {"type":"text","text":"Hi"}\n\n',
        "data: [DONE]\n\n",
      ])
    );

    const { result } = renderHook(() => useSendMessage("chat-1"), { wrapper });

    await act(async () => {
      await result.current.sendMessage("Hello");
    });

    // Verify user message was added to cache
    const cached = queryClient.getQueryData<{ data: unknown[] }>(["messages", "chat-1"]);
    expect(cached?.data).toContainEqual(expect.objectContaining({ id: "m1", role: "user" }));
  });

  it("adds assistant_message to the messages query cache", async () => {
    queryClient.setQueryData(["messages", "chat-1"], { data: [] });

    const assistantMsg = {
      id: "m2",
      chat_id: "chat-1",
      role: "assistant",
      content: "Hi there",
      created_at: "2024-01-01",
    };

    setupReader(
      encodeSSE([
        'data: {"type":"text","text":"Hi there"}\n\n',
        `data: ${JSON.stringify({ type: "assistant_message", message: assistantMsg })}\n\n`,
        "data: [DONE]\n\n",
      ])
    );

    const { result } = renderHook(() => useSendMessage("chat-1"), { wrapper });

    await act(async () => {
      await result.current.sendMessage("Hello");
    });

    const cached = queryClient.getQueryData<{ data: unknown[] }>(["messages", "chat-1"]);
    expect(cached?.data).toContainEqual(
      expect.objectContaining({ id: "m2", role: "assistant" })
    );
  });
});
