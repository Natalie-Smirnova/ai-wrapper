"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type { ModelInfo } from "@/lib/llm/types";
import type { ApiResponse } from "@/types/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

interface ModelSelectorProps {
  provider: string;
  model: string;
  onChange: (provider: string, model: string) => void;
}

export function ModelSelector({
  provider,
  model,
  onChange,
}: ModelSelectorProps) {
  const { data } = useQuery({
    queryKey: ["models"],
    queryFn: () => apiFetch<ApiResponse<ModelInfo[]>>("/api/models"),
  });

  const models = data?.data ?? [];
  const currentModel = models.find(
    (m) => m.id === model && m.provider === provider
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="sm" className="gap-1 text-xs" />
        }
      >
        {currentModel?.name ?? model}
        <ChevronDown className="h-3 w-3" />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {models.map((m) => (
          <DropdownMenuItem
            key={`${m.provider}-${m.id}`}
            onClick={() => onChange(m.provider, m.id)}
          >
            <span className="flex-1">{m.name}</span>
            <span className="text-xs text-muted-foreground ml-2">
              {m.provider}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
