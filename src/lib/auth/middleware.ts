import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import {
  getSessionByToken,
  createSession,
} from "@/lib/db/anonymous";
import type { AuthContext } from "@/types/api";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";

const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 30,
  path: "/",
};

/** Attaches the new anonymous session cookie to a NextResponse when needed. */
export function applySessionCookie(response: NextResponse, auth: AuthContext): NextResponse {
  if (auth.newSessionToken) {
    response.cookies.set("session_token", auth.newSessionToken, SESSION_COOKIE_OPTIONS);
  }
  return response;
}

export async function authenticate(req: NextRequest): Promise<AuthContext> {
  // Try Bearer token first
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const {
      data: { user },
      error,
    } = await db.auth.getUser(token);

    if (!error && user) {
      return { userId: user.id, anonId: null };
    }
  }

  // Fall back to anonymous session cookie
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;

  if (sessionToken) {
    const session = await getSessionByToken(sessionToken);
    if (session) {
      return { userId: null, anonId: session.id };
    }
    // Token in cookie but no DB session yet (e.g. set by middleware before first API call).
    // Create session reusing the same token so all concurrent requests converge on one session.
    try {
      const newSession = await createSession(sessionToken);
      return { userId: null, anonId: newSession.id };
    } catch {
      // Race condition: another concurrent request already created it — re-fetch.
      const existing = await getSessionByToken(sessionToken);
      if (existing) return { userId: null, anonId: existing.id };
      // Fall through to create a fresh session below.
    }
  }

  // No cookie at all (direct API call bypassing middleware). Create a new session.
  const newToken = randomUUID();
  const session = await createSession(newToken);
  return { userId: null, anonId: session.id, newSessionToken: newToken };
}

export function isOwner(auth: AuthContext, chat: { user_id: string | null; anon_id: string | null }): boolean {
  if (auth.userId && chat.user_id === auth.userId) return true;
  if (auth.anonId && chat.anon_id === auth.anonId) return true;
  return false;
}
