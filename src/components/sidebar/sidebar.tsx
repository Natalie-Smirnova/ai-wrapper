"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { useRealtimeChats } from "@/hooks/use-realtime-chats";
import { NewChatButton } from "./new-chat-button";
import { ChatList } from "./chat-list";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LogIn, LogOut, Bot } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/api/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface SidebarProps {
  activeChatId?: string;
}

export function Sidebar({ activeChatId }: SidebarProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();
  const identityLabel =
    user?.display_name?.trim() || user?.email?.trim() || "User";
  const avatarFallback = identityLabel.charAt(0).toUpperCase();

  // Enable realtime sync for authenticated users
  useRealtimeChats();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex h-full w-64 flex-col border-r bg-muted/30 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 p-4 shrink-0">
        <Bot className="h-6 w-6 text-primary" />
        <span className="font-semibold text-lg">AI Chat</span>
      </div>

      <div className="px-3 pb-2 shrink-0">
        <NewChatButton />
      </div>

      <Separator className="shrink-0" />

      {/* Chat list */}
      <ChatList activeChatId={activeChatId} />

      <Separator className="shrink-0" />

      {/* Footer - Auth */}
      <div className="p-3 shrink-0">
        {isLoading ? (
          <div className="h-8" />
        ) : isAuthenticated ? (
          <div className="flex min-w-0 items-center gap-3">
            <Avatar size="lg" aria-label="User avatar">
              {user?.avatar_url ? (
                <AvatarImage src={user.avatar_url} alt={identityLabel} />
              ) : null}
              <AvatarFallback>{avatarFallback}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <span
                className="block truncate text-sm text-muted-foreground"
                title={user?.email ?? undefined}
              >
                {user?.email}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Link
            href="/login"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-2.5 h-8 text-sm font-medium hover:bg-muted hover:text-foreground transition-colors"
          >
            <LogIn className="h-4 w-4" />
            Sign in
          </Link>
        )}
      </div>
    </div>
  );
}
