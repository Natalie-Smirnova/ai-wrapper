"use client";

import { useState, useRef, useCallback } from "react";
import { AttachmentPreview } from "./attachment-preview";
import type { Attachment } from "@/types/attachment";
import { Send, Paperclip } from "lucide-react";

interface MessageInputProps {
  onSend: (content: string, attachmentIds?: string[]) => Promise<void> | void;
  isStreaming: boolean;
  pendingAttachments: Attachment[];
  onUpload: (file: File) => void;
  onRemoveAttachment: (id: string) => void;
  isUploading: boolean;
  disabled?: boolean;
}

export function MessageInput({
  onSend,
  isStreaming,
  pendingAttachments,
  onUpload,
  onRemoveAttachment,
  isUploading,
  disabled,
}: MessageInputProps) {
  const [text, setText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(async () => {
    if (!text.trim() || isStreaming || isUploading || disabled) return;

    const attachmentIds = pendingAttachments.map((a) => a.id);
    try {
      await onSend(text.trim(), attachmentIds.length > 0 ? attachmentIds : undefined);
      setText("");
    } catch {
      // Keep text so user can retry
    }
  }, [text, isStreaming, isUploading, disabled, pendingAttachments, onSend]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) onUpload(file);
        return;
      }
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    for (const file of files) {
      onUpload(file);
    }
    e.target.value = "";
  }

  return (
    <div className="border-t bg-background px-3 py-2 md:px-4 md:py-3 shrink-0">
      {/* Pending attachments */}
      {pendingAttachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {pendingAttachments.map((attachment) => (
            <AttachmentPreview
              key={attachment.id}
              attachment={attachment}
              onRemove={() => onRemoveAttachment(attachment.id)}
              compact
            />
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        {/* File upload button */}
        <button
          type="button"
          className="shrink-0 h-10 w-10 inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          onClick={() => fileInputRef.current?.click()}
          disabled={isStreaming || disabled}
          title="Attach file"
        >
          <Paperclip className="h-5 w-5" />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*,.pdf,.docx,.txt,.md"
          multiple
          onChange={handleFileChange}
        />

        {/* Text input */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={
            disabled
              ? "Sign up to continue chatting..."
              : "Type a message..."
          }
          disabled={isStreaming || disabled}
          className="h-10 max-h-[200px] flex-1 min-w-0 resize-none rounded-full border border-input bg-transparent px-4 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
          rows={1}
        />

        {/* Send button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!text.trim() || isStreaming || isUploading || disabled}
          className="shrink-0 h-10 w-10 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          title="Send message"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>

      {isUploading && (
        <p className="mt-2 text-xs text-muted-foreground animate-pulse">
          Uploading file...
        </p>
      )}
    </div>
  );
}
