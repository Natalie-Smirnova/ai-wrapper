import { NextRequest, NextResponse } from "next/server";
import { authenticate, applySessionCookie } from "@/lib/auth/middleware";
import { listChats, createChat } from "@/lib/db/chats";

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticate(req);
    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor") || undefined;
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const result = await listChats(auth, limit, cursor);

    return applySessionCookie(
      NextResponse.json({ data: result.chats, cursor: result.cursor }),
      auth
    );
  } catch (e) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: (e as Error).message } },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticate(req);
    const body = await req.json();

    const chat = await createChat(auth, body);

    return applySessionCookie(
      NextResponse.json({ data: chat }, { status: 201 }),
      auth
    );
  } catch (e) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: (e as Error).message } },
      { status: 500 }
    );
  }
}
