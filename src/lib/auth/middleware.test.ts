import { describe, it, expect, vi } from "vitest";

// Mock the db client to avoid requiring Supabase env vars
vi.mock("@/lib/db/client", () => ({
  db: {},
}));

vi.mock("@/lib/db/anonymous", () => ({
  getSessionByToken: vi.fn(),
  createSession: vi.fn(),
}));

const { isOwner } = await import("./middleware");

import type { AuthContext } from "@/types/api";

describe("isOwner", () => {
  it("returns true when userId matches chat.user_id", () => {
    const auth: AuthContext = { userId: "user-1", anonId: null };
    const chat = { user_id: "user-1", anon_id: null };
    expect(isOwner(auth, chat)).toBe(true);
  });

  it("returns true when anonId matches chat.anon_id", () => {
    const auth: AuthContext = { userId: null, anonId: "anon-1" };
    const chat = { user_id: null, anon_id: "anon-1" };
    expect(isOwner(auth, chat)).toBe(true);
  });

  it("returns false when userId does not match", () => {
    const auth: AuthContext = { userId: "user-1", anonId: null };
    const chat = { user_id: "user-2", anon_id: null };
    expect(isOwner(auth, chat)).toBe(false);
  });

  it("returns false when anonId does not match", () => {
    const auth: AuthContext = { userId: null, anonId: "anon-1" };
    const chat = { user_id: null, anon_id: "anon-2" };
    expect(isOwner(auth, chat)).toBe(false);
  });

  it("returns false when auth has userId but chat has only anon_id", () => {
    const auth: AuthContext = { userId: "user-1", anonId: null };
    const chat = { user_id: null, anon_id: "anon-1" };
    expect(isOwner(auth, chat)).toBe(false);
  });

  it("returns false when auth has anonId but chat has only user_id", () => {
    const auth: AuthContext = { userId: null, anonId: "anon-1" };
    const chat = { user_id: "user-1", anon_id: null };
    expect(isOwner(auth, chat)).toBe(false);
  });

  it("returns false when both auth fields are null", () => {
    const auth: AuthContext = { userId: null, anonId: null };
    const chat = { user_id: "user-1", anon_id: null };
    expect(isOwner(auth, chat)).toBe(false);
  });
});
