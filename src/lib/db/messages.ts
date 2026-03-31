import { db } from "./client";
import type { Message } from "@/types/message";
import type { Attachment } from "@/types/attachment";

type MessageRow = Omit<Message, "attachments"> & {
  attachments?: Attachment[] | null;
};

function normalizeMessage(row: MessageRow): Message {
  return {
    ...row,
    attachments: row.attachments ?? [],
  };
}

export async function listMessages(
  chatId: string,
  limit = 50,
  cursor?: string
): Promise<{ messages: Message[]; cursor: string | null }> {
  let query = db
    .from("messages")
    .select("*, attachments(*)")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (cursor) {
    query = query.gt("created_at", cursor);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const messages = (data as MessageRow[]).map(normalizeMessage);
  const nextCursor =
    messages.length === limit
      ? messages[messages.length - 1].created_at
      : null;

  return { messages, cursor: nextCursor };
}

export async function getMessageById(id: string): Promise<Message> {
  const { data, error } = await db
    .from("messages")
    .select("*, attachments(*)")
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  return normalizeMessage(data as MessageRow);
}

export async function createMessage(input: {
  chat_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  provider?: string;
  model?: string;
  tokens_in?: number;
  tokens_out?: number;
}): Promise<Message> {
  const { data, error } = await db
    .from("messages")
    .insert(input)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getMessageCount(chatId: string): Promise<number> {
  const { count, error } = await db
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("chat_id", chatId);

  if (error) throw new Error(error.message);
  return count ?? 0;
}
