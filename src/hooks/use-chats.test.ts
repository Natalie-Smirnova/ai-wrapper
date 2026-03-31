import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const mockUpdateChat = vi.fn();

vi.mock("@/lib/api/chats", () => ({
  fetchChats: vi.fn(),
  createChat: vi.fn(),
  updateChat: (...args: unknown[]) => mockUpdateChat(...args),
  deleteChat: vi.fn(),
}));

import { useUpdateChat } from "./use-chats";

describe("useUpdateChat", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    mockUpdateChat.mockResolvedValue({
      data: {
        id: "chat-1",
        title: "New chat",
        provider: "gemini",
        model: "gemini-2.5-flash",
      },
    });
  });

  function wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children
    );
  }

  it("invalidates both chat list and active chat after a model change", async () => {
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useUpdateChat(), { wrapper });

    result.current.mutate({
      chatId: "chat-1",
      input: { provider: "gemini", model: "gemini-2.5-flash" },
    });

    await waitFor(() => {
      expect(mockUpdateChat).toHaveBeenCalledWith("chat-1", {
        provider: "gemini",
        model: "gemini-2.5-flash",
      });
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["chats"] });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["chat", "chat-1"],
      });
    });
  });
});
