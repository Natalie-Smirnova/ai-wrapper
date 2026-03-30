"use client";

import { useChats } from "@/hooks/use-chats";
import { ChatListItem } from "./chat-list-item";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

interface ChatListProps {
  activeChatId?: string;
}

export function ChatList({ activeChatId }: ChatListProps) {
  const { data, isLoading } = useChats();

  if (isLoading) {
    return (
      <div className="space-y-2 p-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  const chats = data?.data ?? [];

  if (chats.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        No conversations yet
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="space-y-1 p-2">
        {chats.map((chat) => (
          <ChatListItem
            key={chat.id}
            chat={chat}
            isActive={chat.id === activeChatId}
          />
        ))}
      </div>
    </ScrollArea>
  );
}
