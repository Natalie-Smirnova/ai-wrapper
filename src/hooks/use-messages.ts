"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchMessages } from "@/lib/api/messages";

export function useMessages(chatId: string | null) {
  return useQuery({
    queryKey: ["messages", chatId],
    queryFn: () => fetchMessages(chatId!),
    enabled: !!chatId,
  });
}
