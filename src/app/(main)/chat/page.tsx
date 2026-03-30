"use client";

import { useRouter } from "next/navigation";
import { useCreateChat } from "@/hooks/use-chats";
import { Button } from "@/components/ui/button";
import { Bot, Plus } from "lucide-react";

export default function NewChatPage() {
  const router = useRouter();
  const createChat = useCreateChat();

  async function handleNewChat() {
    const result = await createChat.mutateAsync({});
    router.push(`/chat/${result.data.id}`);
  }

  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center space-y-6 max-w-md px-4">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Bot className="h-8 w-8 text-primary" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Welcome to AI Chat</h1>
          <p className="text-muted-foreground">
            Start a conversation with an AI assistant. Choose from multiple models
            including GPT-4o and Gemini.
          </p>
        </div>
        <Button
          onClick={handleNewChat}
          disabled={createChat.isPending}
          size="lg"
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Start a new chat
        </Button>
      </div>
    </div>
  );
}
