import { NextRequest, NextResponse } from "next/server";
import { authenticate, isOwner, applySessionCookie } from "@/lib/auth/middleware";
import { getChatById, updateChat } from "@/lib/db/chats";
import {
  listMessages,
  createMessage,
  getMessageCount,
  getMessageById,
} from "@/lib/db/messages";
import {
  linkAttachmentsToMessage,
  getImageAttachmentsByChatId,
  getDocumentChunksByChatId,
} from "@/lib/db/attachments";
import { getSessionById, incrementQuestions } from "@/lib/db/anonymous";
import { getProvider } from "@/lib/llm/registry";
import { buildContext } from "@/lib/llm/context";

const ANONYMOUS_QUESTION_LIMIT = 3;

export async function GET(
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

    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor") || undefined;
    const result = await listMessages(chatId, 50, cursor);

    return applySessionCookie(
      NextResponse.json({ data: result.messages, cursor: result.cursor }),
      auth
    );
  } catch (e) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: (e as Error).message } },
      { status: 500 }
    );
  }
}

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

    // Check anonymous limit
    if (auth.anonId) {
      const session = await getSessionById(auth.anonId);
      if (session && session.questions_used >= ANONYMOUS_QUESTION_LIMIT) {
        return NextResponse.json(
          {
            error: {
              code: "LIMIT_REACHED",
              message:
                "You have reached the free question limit. Sign up for unlimited access.",
            },
          },
          { status: 403 }
        );
      }
    }

    const { content, attachment_ids } = await req.json();

    if (!content?.trim()) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Content is required" } },
        { status: 400 }
      );
    }

    // Save user message
    const createdUserMessage = await createMessage({
      chat_id: chatId,
      role: "user",
      content,
    });

    // Link attachments
    if (attachment_ids?.length) {
      await linkAttachmentsToMessage(attachment_ids, createdUserMessage.id);
    }

    const userMessage = await getMessageById(createdUserMessage.id);

    // Build LLM context
    const { messages: allMessages } = await listMessages(chatId, 100);
    const docChunks = await getDocumentChunksByChatId(chatId);
    const images = await getImageAttachmentsByChatId(chatId);
    const llmMessages = await buildContext(allMessages, docChunks, images);

    // Stream response
    const provider = getProvider(chat.provider);
    const stream = provider.streamCompletion(chat.model, llmMessages);

    const encoder = new TextEncoder();
    let fullContent = "";

    const readable = new ReadableStream({
      async start(controller) {
        try {
          // Send full user message object for immediate client display
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "user_message", message: userMessage })}\n\n`
            )
          );

          for await (const chunk of stream) {
            fullContent += chunk;
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "text", text: chunk })}\n\n`
              )
            );
          }

          // Save assistant message
          const assistantMessage = await createMessage({
            chat_id: chatId,
            role: "assistant",
            content: fullContent,
            provider: chat.provider,
            model: chat.model,
          });

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "assistant_message", message: assistantMessage })}\n\n`
            )
          );

          // Increment anonymous counter
          if (auth.anonId) {
            await incrementQuestions(auth.anonId);
          }

          // Auto-title on first exchange
          const messageCount = await getMessageCount(chatId);
          if (messageCount <= 2) {
            try {
              const title = await provider.generateTitle(fullContent);
              await updateChat(chatId, { title });
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "title", title })}\n\n`
                )
              );
            } catch {
              // Title generation failure is non-critical
            }
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "error", message: (err as Error).message })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    const sseHeaders: Record<string, string> = {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    };
    if (auth.newSessionToken) {
      const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
      sseHeaders["Set-Cookie"] =
        `session_token=${auth.newSessionToken}; HttpOnly; Path=/; Max-Age=2592000; SameSite=Lax${secure}`;
    }
    return new Response(readable, { headers: sseHeaders });
  } catch (e) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: (e as Error).message } },
      { status: 500 }
    );
  }
}
