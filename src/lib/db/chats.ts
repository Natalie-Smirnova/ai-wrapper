import { db } from "./client";
import type { Chat, CreateChatInput, UpdateChatInput } from "@/types/chat";
import type { AuthContext } from "@/types/api";

export async function listChats(
  auth: AuthContext,
  limit = 50,
  cursor?: string
): Promise<{ chats: Chat[]; cursor: string | null }> {
  let query = db
    .from("chats")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (auth.userId) {
    query = query.eq("user_id", auth.userId);
  } else {
    query = query.eq("anon_id", auth.anonId!);
  }

  if (cursor) {
    query = query.lt("updated_at", cursor);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const chats = data as Chat[];
  const nextCursor =
    chats.length === limit ? chats[chats.length - 1].updated_at : null;

  return { chats, cursor: nextCursor };
}

export async function getChatById(id: string): Promise<Chat | null> {
  const { data, error } = await db
    .from("chats")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data;
}

export async function createChat(
  auth: AuthContext,
  input: CreateChatInput
): Promise<Chat> {
  const { data, error } = await db
    .from("chats")
    .insert({
      user_id: auth.userId,
      anon_id: auth.anonId,
      title: input.title || "New chat",
      provider: input.provider || "openai",
      model: input.model || "gpt-4o",
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateChat(
  id: string,
  input: UpdateChatInput
): Promise<Chat> {
  const { data, error } = await db
    .from("chats")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteChat(id: string): Promise<void> {
  const { error } = await db.from("chats").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function claimAnonymousChats(
  anonId: string,
  userId: string
): Promise<void> {
  const { error } = await db
    .from("chats")
    .update({ user_id: userId, anon_id: null })
    .eq("anon_id", anonId);

  if (error) throw new Error(error.message);
}
