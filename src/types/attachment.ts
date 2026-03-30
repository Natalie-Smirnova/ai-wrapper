export interface Attachment {
  id: string;
  message_id: string | null;
  chat_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  category: "image" | "document";
  created_at: string;
}
