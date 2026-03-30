"use client";

import { useCallback } from "react";
import { useSendMessage } from "@/hooks/use-send-message";
import { useAttachments } from "@/hooks/use-attachments";
import { useUpdateChat } from "@/hooks/use-chats";
import { useAuth } from "@/components/providers/auth-provider";
import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";
import { ModelSelector } from "./model-selector";
import { AnonBanner } from "@/components/layout/anon-banner";
import type { Chat } from "@/types/chat";

interface ChatShellProps {
  chat: Chat;
}

export function ChatShell({ chat }: ChatShellProps) {
  const { isAnonymous, questionsUsed, questionsLimit } = useAuth();
  const { isStreaming, streamingText, error, sendMessage } = useSendMessage(
    chat.id
  );
  const {
    pendingAttachments,
    isUploading,
    upload,
    remove,
    clear,
  } = useAttachments(chat.id);
  const updateChat = useUpdateChat();

  const limitReached = isAnonymous && questionsUsed >= questionsLimit;

  const handleSend = useCallback(
    async (content: string, attachIds?: string[]) => {
      await sendMessage(content, attachIds);
      clear();
    },
    [sendMessage, clear]
  );

  const handleModelChange = useCallback(
    (provider: string, model: string) => {
      updateChat.mutate({
        chatId: chat.id,
        input: { provider, model },
      });
    },
    [chat.id, updateChat]
  );

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-2 shrink-0">
        <h2 className="text-sm font-medium truncate">{chat.title}</h2>
        <ModelSelector
          provider={chat.provider}
          model={chat.model}
          onChange={handleModelChange}
        />
      </div>

      {isAnonymous && <AnonBanner used={questionsUsed} limit={questionsLimit} />}

      {/* Messages */}
      <MessageList
        chatId={chat.id}
        streamingText={streamingText}
        isStreaming={isStreaming}
      />

      {/* Error */}
      {error && (
        <div className="mx-4 mb-2 p-3 text-sm text-red-500 bg-red-50 dark:bg-red-950/20 rounded-md">
          {error}
        </div>
      )}

      {/* Input */}
      <MessageInput
        onSend={handleSend}
        isStreaming={isStreaming}
        pendingAttachments={pendingAttachments}
        onUpload={upload}
        onRemoveAttachment={remove}
        isUploading={isUploading}
        disabled={limitReached}
      />
    </div>
  );
}
