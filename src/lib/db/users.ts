import { db } from "./client";
import type { User } from "@/types/user";

export async function getUserById(id: string): Promise<User | null> {
  const { data, error } = await db
    .from("users")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data;
}

export async function createUser(user: {
  id: string;
  email: string;
  display_name?: string;
}): Promise<User> {
  const { data, error } = await db
    .from("users")
    .insert(user)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}
