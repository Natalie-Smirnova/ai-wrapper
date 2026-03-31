"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchChats,
  createChat as apiCreateChat,
  updateChat as apiUpdateChat,
  deleteChat as apiDeleteChat,
} from "@/lib/api/chats";
import type { CreateChatInput, UpdateChatInput } from "@/types/chat";

export function useChats() {
  return useQuery({
    queryKey: ["chats"],
    queryFn: () => fetchChats(),
  });
}

export function useCreateChat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateChatInput) => apiCreateChat(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });
}

export function useUpdateChat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      chatId,
      input,
    }: {
      chatId: string;
      input: UpdateChatInput;
    }) => apiUpdateChat(chatId, input),
    onSuccess: (updatedChat, { chatId }) => {
      queryClient.setQueryData(["chat", chatId], updatedChat);
      queryClient.invalidateQueries({ queryKey: ["chat", chatId] });
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });
}

export function useDeleteChat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (chatId: string) => apiDeleteChat(chatId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });
}
