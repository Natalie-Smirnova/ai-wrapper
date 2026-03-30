import { db } from "./client";
import type { Attachment } from "@/types/attachment";

export async function createAttachment(input: {
  chat_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  category: "image" | "document";
}): Promise<Attachment> {
  const { data, error } = await db
    .from("attachments")
    .insert(input)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function linkAttachmentsToMessage(
  attachmentIds: string[],
  messageId: string
): Promise<void> {
  const { error } = await db
    .from("attachments")
    .update({ message_id: messageId })
    .in("id", attachmentIds);

  if (error) throw new Error(error.message);
}

export async function getAttachmentById(
  id: string
): Promise<Attachment | null> {
  const { data, error } = await db
    .from("attachments")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data;
}

export async function getAttachmentsByChatId(
  chatId: string
): Promise<Attachment[]> {
  const { data, error } = await db
    .from("attachments")
    .select("*")
    .eq("chat_id", chatId);

  if (error) throw new Error(error.message);
  return data;
}

export async function getImageAttachmentsByChatId(
  chatId: string
): Promise<Attachment[]> {
  const { data, error } = await db
    .from("attachments")
    .select("*")
    .eq("chat_id", chatId)
    .eq("category", "image")
    .not("message_id", "is", null);

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteAttachment(id: string): Promise<void> {
  const { error } = await db.from("attachments").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function getDocumentChunksByChatId(
  chatId: string
): Promise<{ content: string; file_name: string }[]> {
  const { data, error } = await db
    .from("document_chunks")
    .select("content, attachment_id")
    .eq("chat_id", chatId)
    .order("chunk_index", { ascending: true });

  if (error) throw new Error(error.message);

  // Get attachment names
  if (!data.length) return [];

  const attachmentIds = [...new Set(data.map((d) => d.attachment_id))];
  const { data: attachments } = await db
    .from("attachments")
    .select("id, file_name")
    .in("id", attachmentIds);

  const nameMap = new Map(attachments?.map((a) => [a.id, a.file_name]) ?? []);

  return data.map((chunk) => ({
    content: chunk.content,
    file_name: nameMap.get(chunk.attachment_id) ?? "unknown",
  }));
}

export async function createDocumentChunks(
  chunks: {
    attachment_id: string;
    chat_id: string;
    chunk_index: number;
    content: string;
  }[]
): Promise<void> {
  const { error } = await db.from("document_chunks").insert(chunks);
  if (error) throw new Error(error.message);
}
