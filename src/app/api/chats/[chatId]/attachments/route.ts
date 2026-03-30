import { NextRequest, NextResponse } from "next/server";
import { authenticate, isOwner, applySessionCookie } from "@/lib/auth/middleware";
import { getChatById } from "@/lib/db/chats";
import {
  createAttachment,
  createDocumentChunks,
} from "@/lib/db/attachments";
import { uploadFile } from "@/lib/storage/client";
import { extractText, chunkText } from "@/lib/documents/parser";
import { randomUUID } from "crypto";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const DOCUMENT_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const auth = await authenticate(req);
    const { chatId } = await params;
    const chat = await getChatById(chatId);

    if (!chat || !isOwner(auth, chat)) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Chat not found" } },
        { status: 404 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "No file provided" } },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "File too large (max 10MB)" } },
        { status: 400 }
      );
    }

    const isImage = IMAGE_TYPES.includes(file.type);
    const isDocument = DOCUMENT_TYPES.includes(file.type);

    if (!isImage && !isDocument) {
      return NextResponse.json(
        {
          error: {
            code: "BAD_REQUEST",
            message: "Unsupported file type. Supported: images (JPEG, PNG, GIF, WebP) and documents (PDF, DOCX, TXT, MD)",
          },
        },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split(".").pop() || "bin";
    const storagePath = `${chatId}/${randomUUID()}.${ext}`;

    await uploadFile(storagePath, buffer, file.type);

    const attachment = await createAttachment({
      chat_id: chatId,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      storage_path: storagePath,
      category: isImage ? "image" : "document",
    });

    if (isDocument) {
      try {
        const text = await extractText(buffer, file.type);
        const chunks = chunkText(text);
        await createDocumentChunks(
          chunks.map((content, index) => ({
            attachment_id: attachment.id,
            chat_id: chatId,
            chunk_index: index,
            content,
          }))
        );
      } catch {
        // Document processing failure is non-critical
      }
    }

    return applySessionCookie(
      NextResponse.json({ data: attachment }, { status: 201 }),
      auth
    );
  } catch (e) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: (e as Error).message } },
      { status: 500 }
    );
  }
}
