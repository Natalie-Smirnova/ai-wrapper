import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/lib/auth/middleware";
import { getSessionByToken } from "@/lib/db/anonymous";
import { claimAnonymousChats } from "@/lib/db/chats";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticate(req);

    if (!auth.userId) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Must be authenticated" } },
        { status: 401 }
      );
    }

    // Read session_token from httpOnly cookie (JS cannot access it client-side)
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;

    if (!sessionToken) {
      return NextResponse.json({ data: { claimed: 0 } });
    }

    const session = await getSessionByToken(sessionToken);
    if (!session) {
      return NextResponse.json({ data: { claimed: 0 } });
    }

    await claimAnonymousChats(session.id, auth.userId);

    return NextResponse.json({ data: { claimed: 1 } });
  } catch (e) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: (e as Error).message } },
      { status: 500 }
    );
  }
}
