import type { Attachment } from "./attachment";

export interface Message {
  id: string;
  chat_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  provider: string | null;
  model: string | null;
  tokens_in: number | null;
  tokens_out: number | null;
  created_at: string;
  attachments?: Attachment[];
}

export interface SendMessageInput {
  content: string;
  attachment_ids?: string[];
}
