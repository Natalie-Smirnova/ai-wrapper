import { beforeEach, describe, expect, it, vi } from "vitest";

const mockFrom = vi.fn();

vi.mock("@/lib/db/client", () => ({
  db: {
    from: mockFrom,
  },
}));

function createListQuery(result: unknown) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    then: (resolve: (value: unknown) => unknown) =>
      Promise.resolve({ data: result, error: null }).then(resolve),
  };
}

function createSingleQuery(result: unknown) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: result, error: null }),
  };
}

describe("db/messages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists messages with normalized attachments", async () => {
    const query = createListQuery([
      {
        id: "msg-1",
        chat_id: "chat-1",
        role: "user",
        content: "hello",
        provider: null,
        model: null,
        tokens_in: null,
        tokens_out: null,
        created_at: "2026-03-31T12:00:00Z",
        attachments: [
          {
            id: "att-1",
            message_id: "msg-1",
            chat_id: "chat-1",
            file_name: "note.txt",
            file_type: "text/plain",
            file_size: 4,
            storage_path: "chat-1/note.txt",
            category: "document",
            created_at: "2026-03-31T12:00:00Z",
          },
        ],
      },
      {
        id: "msg-2",
        chat_id: "chat-1",
        role: "assistant",
        content: "hi",
        provider: "openai",
        model: "gpt-4o",
        tokens_in: null,
        tokens_out: null,
        created_at: "2026-03-31T12:00:01Z",
        attachments: null,
      },
    ]);
    mockFrom.mockReturnValue(query);

    const { listMessages } = await import("./messages");
    const result = await listMessages("chat-1");

    expect(mockFrom).toHaveBeenCalledWith("messages");
    expect(query.select).toHaveBeenCalledWith("*, attachments(*)");
    expect(result.messages[0].attachments).toHaveLength(1);
    expect(result.messages[1].attachments).toEqual([]);
  });

  it("loads one message with its attachments", async () => {
    const query = createSingleQuery({
      id: "msg-1",
      chat_id: "chat-1",
      role: "user",
      content: "hello",
      provider: null,
      model: null,
      tokens_in: null,
      tokens_out: null,
      created_at: "2026-03-31T12:00:00Z",
      attachments: null,
    });
    mockFrom.mockReturnValue(query);

    const { getMessageById } = await import("./messages");
    const result = await getMessageById("msg-1");

    expect(query.select).toHaveBeenCalledWith("*, attachments(*)");
    expect(query.eq).toHaveBeenCalledWith("id", "msg-1");
    expect(result.attachments).toEqual([]);
  });
});
