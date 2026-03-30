import { apiFetch } from "./client";
import type { Message } from "@/types/message";
import type { ApiListResponse } from "@/types/api";

export async function fetchMessages(
  chatId: string,
  cursor?: string
): Promise<ApiListResponse<Message>> {
  const params = new URLSearchParams();
  if (cursor) params.set("cursor", cursor);
  return apiFetch(`/api/chats/${chatId}/messages?${params}`);
}
