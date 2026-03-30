"use client";

import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiStream } from "@/lib/api/client";
import type { Message } from "@/types/message";

interface StreamState {
  isStreaming: boolean;
  streamingText: string;
  error: string | null;
}

export function useSendMessage(chatId: string | null) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<StreamState>({
    isStreaming: false,
    streamingText: "",
    error: null,
  });

  const addMessageToCache = useCallback(
    (message: Message) => {
      queryClient.setQueryData<{ data: Message[] }>(
        ["messages", chatId],
        (old) => {
          const existing = old?.data ?? [];
          // Avoid duplicates
          if (existing.some((m) => m.id === message.id)) return old!;
          return { ...old, data: [...existing, message] };
        }
      );
    },
    [chatId, queryClient]
  );

  const sendMessage = useCallback(
    async (content: string, attachmentIds?: string[]) => {
      if (!chatId || !content.trim()) return;

      setState({ isStreaming: true, streamingText: "", error: null });

      try {
        const reader = await apiStream(
          `/api/chats/${chatId}/messages`,
          { content, attachment_ids: attachmentIds }
        );

        const decoder = new TextDecoder();
        let buffer = "";
        let fullText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6);

            if (data === "[DONE]") {
              setState((prev) => ({
                ...prev,
                isStreaming: false,
                streamingText: "",
              }));
              queryClient.invalidateQueries({ queryKey: ["messages", chatId] });
              queryClient.invalidateQueries({ queryKey: ["chats"] });
              return;
            }

            try {
              const parsed = JSON.parse(data);

              if (parsed.type === "text") {
                fullText += parsed.text;
                setState((prev) => ({
                  ...prev,
                  streamingText: fullText,
                }));
              } else if (parsed.type === "user_message" && parsed.message) {
                addMessageToCache(parsed.message);
              } else if (parsed.type === "assistant_message" && parsed.message) {
                addMessageToCache(parsed.message);
              } else if (parsed.type === "title") {
                queryClient.invalidateQueries({ queryKey: ["chats"] });
              } else if (parsed.type === "error") {
                setState((prev) => ({
                  ...prev,
                  isStreaming: false,
                  error: parsed.message,
                }));
                return;
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }

        // Stream ended without [DONE]
        setState((prev) => ({ ...prev, isStreaming: false }));
        queryClient.invalidateQueries({ queryKey: ["messages", chatId] });
      } catch (e) {
        setState({
          isStreaming: false,
          streamingText: "",
          error: (e as Error).message,
        });
      }
    },
    [chatId, queryClient, addMessageToCache]
  );

  return { ...state, sendMessage };
}
