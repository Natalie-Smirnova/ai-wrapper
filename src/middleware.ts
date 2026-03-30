import { NextRequest, NextResponse } from "next/server";

/**
 * Sets the anonymous session token cookie on every response before the page
 * or API route handler runs. This ensures the browser has a stable token
 * before firing any parallel API requests, eliminating the race condition
 * where concurrent requests each create separate anonymous sessions.
 */
export function middleware(req: NextRequest) {
  if (req.cookies.get("session_token")) {
    return NextResponse.next();
  }

  const newToken = crypto.randomUUID();
  const response = NextResponse.next();
  response.cookies.set("session_token", newToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  return response;
}

export const config = {
  matcher: "/((?!_next/static|_next/image|favicon.ico).*)",
};
