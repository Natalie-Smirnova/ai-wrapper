"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface AnonBannerProps {
  used: number;
  limit: number;
}

export function AnonBanner({ used, limit }: AnonBannerProps) {
  const remaining = Math.max(0, limit - used);

  return (
    <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-950/20 border-b px-4 py-2">
      <div className="flex items-center gap-2 text-sm">
        <Badge variant="secondary" className="text-xs">
          {remaining} / {limit}
        </Badge>
        <span className="text-amber-800 dark:text-amber-200">
          {remaining > 0
            ? `${remaining} free question${remaining !== 1 ? "s" : ""} remaining`
            : "Free questions used up"}
        </span>
      </div>
      <Link
        href="/signup"
        className="text-sm font-medium text-primary hover:underline"
      >
        Sign up for unlimited
      </Link>
    </div>
  );
}
