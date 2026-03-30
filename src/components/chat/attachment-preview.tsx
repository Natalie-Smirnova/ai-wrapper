"use client";

import { useState, useEffect } from "react";
import { getAttachmentUrl } from "@/lib/api/attachments";
import type { Attachment } from "@/types/attachment";
import { Button } from "@/components/ui/button";
import { X, FileText, Image as ImageIcon } from "lucide-react";

interface AttachmentPreviewProps {
  attachment: Attachment;
  onRemove?: () => void;
  compact?: boolean;
}

export function AttachmentPreview({
  attachment,
  onRemove,
  compact,
}: AttachmentPreviewProps) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (attachment.category === "image") {
      getAttachmentUrl(attachment.id)
        .then((res) => setUrl(res.data.url))
        .catch(() => {});
    }
  }, [attachment.id, attachment.category]);

  if (attachment.category === "image") {
    return (
      <div className="relative group inline-block">
        {url ? (
          <img
            src={url}
            alt={attachment.file_name}
            className={
              compact
                ? "h-16 w-16 rounded object-cover"
                : "max-h-64 rounded-lg object-contain"
            }
          />
        ) : (
          <div
            className={`${compact ? "h-16 w-16" : "h-32 w-32"} rounded bg-muted flex items-center justify-center`}
          >
            <ImageIcon className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
        {onRemove && (
          <Button
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-5 w-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={onRemove}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="relative group inline-flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2">
      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
      <span className="text-sm truncate max-w-[200px]">
        {attachment.file_name}
      </span>
      {onRemove && (
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={onRemove}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
