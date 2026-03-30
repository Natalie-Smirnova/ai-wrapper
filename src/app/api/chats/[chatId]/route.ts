import { NextRequest, NextResponse } from "next/server";
import { authenticate, isOwner, applySessionCookie } from "@/lib/auth/middleware";
import {
  getChatById,
  updateChat,
  deleteChat,
} from "@/lib/db/chats";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const auth = await authenticate(req);
    const { chatId } = await params;
    const chat = await getChatById(chatId);

    if (!chat) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Chat not found" } },
        { status: 404 }
      );
    }

    if (!isOwner(auth, chat)) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Access denied" } },
        { status: 403 }
      );
    }

    return applySessionCookie(NextResponse.json({ data: chat }), auth);
  } catch (e) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: (e as Error).message } },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const auth = await authenticate(req);
    const { chatId } = await params;
    const chat = await getChatById(chatId);

    if (!chat) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Chat not found" } },
        { status: 404 }
      );
    }

    if (!isOwner(auth, chat)) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Access denied" } },
        { status: 403 }
      );
    }

    const body = await req.json();
    const updated = await updateChat(chatId, body);

    return applySessionCookie(NextResponse.json({ data: updated }), auth);
  } catch (e) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: (e as Error).message } },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const auth = await authenticate(req);
    const { chatId } = await params;
    const chat = await getChatById(chatId);

    if (!chat) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Chat not found" } },
        { status: 404 }
      );
    }

    if (!isOwner(auth, chat)) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Access denied" } },
        { status: 403 }
      );
    }

    await deleteChat(chatId);

    return applySessionCookie(
      NextResponse.json({ data: { deleted: true } }),
      auth
    );
  } catch (e) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: (e as Error).message } },
      { status: 500 }
    );
  }
}
