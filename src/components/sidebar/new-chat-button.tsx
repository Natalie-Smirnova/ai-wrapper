"use client";

import { useRouter } from "next/navigation";
import { useCreateChat } from "@/hooks/use-chats";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function NewChatButton() {
  const router = useRouter();
  const createChat = useCreateChat();

  async function handleClick() {
    const result = await createChat.mutateAsync({});
    router.push(`/chat/${result.data.id}`);
  }

  return (
    <Button
      onClick={handleClick}
      disabled={createChat.isPending}
      className="w-full gap-2"
      variant="outline"
    >
      <Plus className="h-4 w-4" />
      New chat
    </Button>
  );
}
