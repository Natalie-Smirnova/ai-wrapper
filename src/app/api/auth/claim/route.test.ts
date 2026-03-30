import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/middleware", () => ({
  authenticate: vi.fn(),
}));

vi.mock("@/lib/db/anonymous", () => ({
  getSessionByToken: vi.fn(),
}));

vi.mock("@/lib/db/chats", () => ({
  claimAnonymousChats: vi.fn(),
}));

// Mock next/headers cookies()
const mockCookieGet = vi.fn();
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve({
    get: mockCookieGet,
  })),
}));

const { authenticate } = await import("@/lib/auth/middleware");
const { getSessionByToken } = await import("@/lib/db/anonymous");
const { claimAnonymousChats } = await import("@/lib/db/chats");
const { POST } = await import("./route");

const mockAuth = authenticate as ReturnType<typeof vi.fn>;
const mockGetSession = getSessionByToken as ReturnType<typeof vi.fn>;
const mockClaim = claimAnonymousChats as ReturnType<typeof vi.fn>;

function makeRequest(reqBody?: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/auth/claim", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(reqBody ?? {}),
  });
}

describe("POST /api/auth/claim", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reads session_token from httpOnly cookie, not from request body", async () => {
    mockAuth.mockResolvedValue({ userId: "user-1", anonId: null });
    mockCookieGet.mockReturnValue({ value: "cookie-token-123" });
    mockGetSession.mockResolvedValue({ id: "anon-1" });
    mockClaim.mockResolvedValue(undefined);

    // Send request with NO session_token in body
    const res = await POST(makeRequest());
    await res.json();

    expect(res.status).toBe(200);
    expect(mockGetSession).toHaveBeenCalledWith("cookie-token-123");
    expect(mockClaim).toHaveBeenCalledWith("anon-1", "user-1");
  });

  it("returns 401 for unauthenticated users", async () => {
    mockAuth.mockResolvedValue({ userId: null, anonId: "anon-1" });

    const res = await POST(makeRequest());
    expect(res.status).toBe(401);
  });

  it("returns success with claimed=0 when no session cookie exists", async () => {
    mockAuth.mockResolvedValue({ userId: "user-1", anonId: null });
    mockCookieGet.mockReturnValue(undefined);

    const res = await POST(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.claimed).toBe(0);
    expect(mockClaim).not.toHaveBeenCalled();
  });
});
