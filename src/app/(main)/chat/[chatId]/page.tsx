"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchChat } from "@/lib/api/chats";
import { ChatShell } from "@/components/chat/chat-shell";
import { Skeleton } from "@/components/ui/skeleton";

export default function ChatPage({
  params,
}: {
  params: Promise<{ chatId: string }>;
}) {
  const { chatId } = use(params);
  const { data, isLoading, error } = useQuery({
    queryKey: ["chat", chatId],
    queryFn: () => fetchChat(chatId),
  });

  if (isLoading) {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b px-4 py-3">
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="flex-1 space-y-4 p-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-16 w-[60%] rounded-2xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Chat not found</p>
      </div>
    );
  }

  return <ChatShell chat={data.data} />;
}
