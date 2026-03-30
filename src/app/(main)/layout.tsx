"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/sidebar/sidebar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Extract chatId from pathname
  const chatId = pathname.startsWith("/chat/")
    ? pathname.split("/chat/")[1]
    : undefined;

  return (
    <div className="flex h-full">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar activeChatId={chatId} />
      </div>

      {/* Main content */}
      <main className="flex-1 h-full overflow-hidden flex flex-col">
        {/* Mobile header with hamburger */}
        <div className="flex items-center gap-2 border-b px-3 py-2 md:hidden shrink-0">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon" className="shrink-0" />
              }
            >
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64" showCloseButton={false}>
              <Sidebar activeChatId={chatId} />
            </SheetContent>
          </Sheet>
        </div>
        <div className="flex-1 overflow-hidden">{children}</div>
      </main>
    </div>
  );
}
