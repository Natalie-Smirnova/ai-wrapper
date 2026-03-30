"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createRealtimeClient } from "@/lib/realtime/client";
import { useAuth } from "@/components/providers/auth-provider";

export function useRealtimeChats() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const clientRef = useRef<ReturnType<typeof createRealtimeClient> | null>(
    null
  );

  useEffect(() => {
    if (!user?.id) return;

    const client = createRealtimeClient();
    clientRef.current = client;

    const channel = client
      .channel("chats-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chats",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["chats"] });
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
      client.removeAllChannels();
    };
  }, [user?.id, queryClient]);
}
