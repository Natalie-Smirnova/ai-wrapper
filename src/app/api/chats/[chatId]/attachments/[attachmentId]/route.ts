import { NextRequest, NextResponse } from "next/server";
import { authenticate, isOwner, applySessionCookie } from "@/lib/auth/middleware";
import { getChatById } from "@/lib/db/chats";
import {
  getAttachmentById,
  deleteAttachment,
} from "@/lib/db/attachments";
import { deleteFile } from "@/lib/storage/client";

export async function DELETE(
  req: NextRequest,
  {
    params,
  }: { params: Promise<{ chatId: string; attachmentId: string }> }
) {
  try {
    const auth = await authenticate(req);
    const { chatId, attachmentId } = await params;
    const chat = await getChatById(chatId);

    if (!chat || !isOwner(auth, chat)) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Chat not found" } },
        { status: 404 }
      );
    }

    const attachment = await getAttachmentById(attachmentId);
    if (!attachment || attachment.chat_id !== chatId) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Attachment not found" } },
        { status: 404 }
      );
    }

    await deleteFile(attachment.storage_path);
    await deleteAttachment(attachmentId);

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
