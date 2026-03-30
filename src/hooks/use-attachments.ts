"use client";

import { useState, useCallback } from "react";
import {
  uploadAttachment,
  deleteAttachment as apiDeleteAttachment,
} from "@/lib/api/attachments";
import type { Attachment } from "@/types/attachment";

export function useAttachments(chatId: string | null) {
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const upload = useCallback(
    async (file: File) => {
      if (!chatId) return null;
      setIsUploading(true);
      try {
        const result = await uploadAttachment(chatId, file);
        setPendingAttachments((prev) => [...prev, result.data]);
        return result.data;
      } finally {
        setIsUploading(false);
      }
    },
    [chatId]
  );

  const remove = useCallback(
    async (attachmentId: string) => {
      if (!chatId) return;
      await apiDeleteAttachment(chatId, attachmentId);
      setPendingAttachments((prev) =>
        prev.filter((a) => a.id !== attachmentId)
      );
    },
    [chatId]
  );

  const clear = useCallback(() => {
    setPendingAttachments([]);
  }, []);

  return {
    pendingAttachments,
    isUploading,
    upload,
    remove,
    clear,
    attachmentIds: pendingAttachments.map((a) => a.id),
  };
}
