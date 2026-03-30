import { NextRequest, NextResponse } from "next/server";
import { authenticate, isOwner, applySessionCookie } from "@/lib/auth/middleware";
import { getAttachmentById } from "@/lib/db/attachments";
import { getChatById } from "@/lib/db/chats";
import { getSignedUrl } from "@/lib/storage/client";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ attachmentId: string }> }
) {
  try {
    const auth = await authenticate(req);
    const { attachmentId } = await params;
    const attachment = await getAttachmentById(attachmentId);

    if (!attachment) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Attachment not found" } },
        { status: 404 }
      );
    }

    const chat = await getChatById(attachment.chat_id);
    if (!chat || !isOwner(auth, chat)) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Access denied" } },
        { status: 403 }
      );
    }

    const url = await getSignedUrl(attachment.storage_path);
    return applySessionCookie(NextResponse.json({ data: { url } }), auth);
  } catch (e) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: (e as Error).message } },
      { status: 500 }
    );
  }
}
