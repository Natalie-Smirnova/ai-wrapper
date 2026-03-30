"use client";

import { useEffect, useRef } from "react";
import { useMessages } from "@/hooks/use-messages";
import { MessageBubble, StreamingBubble } from "./message-bubble";
import { Skeleton } from "@/components/ui/skeleton";

interface MessageListProps {
  chatId: string;
  streamingText: string;
  isStreaming: boolean;
}

export function MessageList({
  chatId,
  streamingText,
  isStreaming,
}: MessageListProps) {
  const { data, isLoading } = useMessages(chatId);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data?.data, streamingText]);

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-16 w-[60%] rounded-2xl" />
          </div>
        ))}
      </div>
    );
  }

  const messages = data?.data ?? [];

  return (
    <div className="flex-1 overflow-y-auto">
      {messages.length === 0 && !isStreaming && (
        <div className="flex h-full items-center justify-center">
          <div className="text-center space-y-2">
            <p className="text-lg font-medium text-muted-foreground">
              Start a conversation
            </p>
            <p className="text-sm text-muted-foreground/70">
              Send a message to begin chatting with AI
            </p>
          </div>
        </div>
      )}

      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}

      {isStreaming && streamingText && (
        <StreamingBubble text={streamingText} />
      )}

      <div ref={bottomRef} />
    </div>
  );
}
