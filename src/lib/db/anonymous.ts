import { db } from "./client";
import type { AnonymousSession } from "@/types/user";

export async function getSessionByToken(
  token: string
): Promise<AnonymousSession | null> {
  const { data, error } = await db
    .from("anonymous_sessions")
    .select("*")
    .eq("session_token", token)
    .single();

  if (error) return null;
  return data;
}

export async function createSession(
  sessionToken: string
): Promise<AnonymousSession> {
  const { data, error } = await db
    .from("anonymous_sessions")
    .insert({ session_token: sessionToken })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function incrementQuestions(id: string): Promise<void> {
  const { error } = await db.rpc("increment_questions_used", {
    session_id: id,
  });

  if (error) {
    // Fallback: manual increment
    const session = await db
      .from("anonymous_sessions")
      .select("questions_used")
      .eq("id", id)
      .single();

    if (session.data) {
      await db
        .from("anonymous_sessions")
        .update({ questions_used: session.data.questions_used + 1 })
        .eq("id", id);
    }
  }
}

export async function getSessionById(
  id: string
): Promise<AnonymousSession | null> {
  const { data, error } = await db
    .from("anonymous_sessions")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data;
}
