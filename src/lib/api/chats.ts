import { apiFetch } from "./client";
import type { Chat, CreateChatInput, UpdateChatInput } from "@/types/chat";
import type { ApiResponse, ApiListResponse } from "@/types/api";

export async function fetchChats(
  cursor?: string
): Promise<ApiListResponse<Chat>> {
  const params = new URLSearchParams();
  if (cursor) params.set("cursor", cursor);
  return apiFetch(`/api/chats?${params}`);
}

export async function fetchChat(chatId: string): Promise<ApiResponse<Chat>> {
  return apiFetch(`/api/chats/${chatId}`);
}

export async function createChat(
  input: CreateChatInput
): Promise<ApiResponse<Chat>> {
  return apiFetch("/api/chats", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateChat(
  chatId: string,
  input: UpdateChatInput
): Promise<ApiResponse<Chat>> {
  return apiFetch(`/api/chats/${chatId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function deleteChat(chatId: string): Promise<void> {
  await apiFetch(`/api/chats/${chatId}`, { method: "DELETE" });
}
