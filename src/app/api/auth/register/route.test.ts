import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db/client", () => ({
  db: {
    auth: {
      getUser: vi.fn(),
    },
  },
}));

vi.mock("@/lib/db/users", () => ({
  getUserById: vi.fn(),
  createUser: vi.fn(),
}));

const { db } = await import("@/lib/db/client");
const { getUserById, createUser } = await import("@/lib/db/users");
const { POST } = await import("./route");

const mockGetUser = db.auth.getUser as ReturnType<typeof vi.fn>;
const mockGetUserById = getUserById as ReturnType<typeof vi.fn>;
const mockCreateUser = createUser as ReturnType<typeof vi.fn>;

function makeRequest(body: Record<string, unknown>, token?: string) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  return new Request("http://localhost/api/auth/register", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  }) as unknown as import("next/server").NextRequest;
}

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when no Authorization header is present", async () => {
    const res = await POST(makeRequest({ id: "user-1", email: "a@b.com" }));
    expect(res.status).toBe(401);
  });

  it("returns 401 when token is invalid", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: "invalid" } });

    const res = await POST(makeRequest({ id: "user-1", email: "a@b.com" }, "bad-token"));
    expect(res.status).toBe(401);
  });

  it("returns 403 when token user.id does not match body id", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "real-user-id" } },
      error: null,
    });

    const res = await POST(
      makeRequest({ id: "different-user-id", email: "a@b.com" }, "valid-token")
    );
    expect(res.status).toBe(403);
  });

  it("creates user when token matches body id", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    mockGetUserById.mockResolvedValue(null);
    mockCreateUser.mockResolvedValue({ id: "user-1" });

    const res = await POST(
      makeRequest({ id: "user-1", email: "a@b.com" }, "valid-token")
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(mockCreateUser).toHaveBeenCalledWith({
      id: "user-1",
      email: "a@b.com",
      display_name: undefined,
    });
  });

  it("returns existing user without creating when already exists", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    mockGetUserById.mockResolvedValue({ id: "user-1" });

    const res = await POST(
      makeRequest({ id: "user-1", email: "a@b.com" }, "valid-token")
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.id).toBe("user-1");
    expect(mockCreateUser).not.toHaveBeenCalled();
  });
});
