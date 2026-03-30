import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock all dependencies before imports
vi.mock("@/lib/auth/middleware", () => ({
  authenticate: vi.fn(),
  isOwner: vi.fn(),
  applySessionCookie: (response: unknown) => response,
}));

vi.mock("@/lib/db/attachments", () => ({
  getAttachmentById: vi.fn(),
}));

vi.mock("@/lib/db/chats", () => ({
  getChatById: vi.fn(),
}));

vi.mock("@/lib/storage/client", () => ({
  getSignedUrl: vi.fn(),
}));

const { authenticate, isOwner } = await import("@/lib/auth/middleware");
const { getAttachmentById } = await import("@/lib/db/attachments");
const { getChatById } = await import("@/lib/db/chats");
const { getSignedUrl } = await import("@/lib/storage/client");
const { GET } = await import("./route");

const mockAuth = authenticate as ReturnType<typeof vi.fn>;
const mockIsOwner = isOwner as ReturnType<typeof vi.fn>;
const mockGetAttachment = getAttachmentById as ReturnType<typeof vi.fn>;
const mockGetChat = getChatById as ReturnType<typeof vi.fn>;
const mockGetSignedUrl = getSignedUrl as ReturnType<typeof vi.fn>;

function makeRequest() {
  return new NextRequest("http://localhost/api/attachments/att-1/url");
}

function makeParams(attachmentId = "att-1") {
  return { params: Promise.resolve({ attachmentId }) };
}

describe("GET /api/attachments/:attachmentId/url", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 403 when caller does not own the attachment's chat", async () => {
    mockAuth.mockResolvedValue({ userId: "user-2", anonId: null });
    mockGetAttachment.mockResolvedValue({
      id: "att-1",
      chat_id: "chat-1",
      storage_path: "path/to/file",
    });
    mockGetChat.mockResolvedValue({
      id: "chat-1",
      user_id: "user-1",
      anon_id: null,
    });
    mockIsOwner.mockReturnValue(false);

    const res = await GET(makeRequest(), makeParams());
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error.code).toBe("FORBIDDEN");
  });

  it("returns signed URL when caller owns the attachment's chat", async () => {
    mockAuth.mockResolvedValue({ userId: "user-1", anonId: null });
    mockGetAttachment.mockResolvedValue({
      id: "att-1",
      chat_id: "chat-1",
      storage_path: "path/to/file",
    });
    mockGetChat.mockResolvedValue({
      id: "chat-1",
      user_id: "user-1",
      anon_id: null,
    });
    mockIsOwner.mockReturnValue(true);
    mockGetSignedUrl.mockResolvedValue("https://signed.url/path");

    const res = await GET(makeRequest(), makeParams());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.url).toBe("https://signed.url/path");
  });

  it("returns 404 when attachment does not exist", async () => {
    mockAuth.mockResolvedValue({ userId: "user-1", anonId: null });
    mockGetAttachment.mockResolvedValue(null);

    const res = await GET(makeRequest(), makeParams());
    expect(res.status).toBe(404);
  });

  it("returns 403 when parent chat does not exist", async () => {
    mockAuth.mockResolvedValue({ userId: "user-1", anonId: null });
    mockGetAttachment.mockResolvedValue({
      id: "att-1",
      chat_id: "chat-1",
      storage_path: "path/to/file",
    });
    mockGetChat.mockResolvedValue(null);

    const res = await GET(makeRequest(), makeParams());
    // Returns 403 (not 404) to avoid leaking attachment existence
    expect(res.status).toBe(403);
  });
});
