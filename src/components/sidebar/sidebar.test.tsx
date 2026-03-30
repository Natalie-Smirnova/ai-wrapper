import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { Sidebar } from "./sidebar";

const {
  mockPush,
  mockRefresh,
  mockSignOut,
  mockAuthState,
} = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockRefresh: vi.fn(),
  mockSignOut: vi.fn(),
  mockAuthState: {
    isAuthenticated: true,
    isLoading: false,
    user: {
      id: "user-1",
      email: "natallia_smirnova@gmail.com",
      display_name: null,
      avatar_url: null,
      created_at: "",
      updated_at: "",
    },
  },
}));

vi.mock("@/components/providers/auth-provider", () => ({
  useAuth: () => mockAuthState,
}));

vi.mock("@/hooks/use-realtime-chats", () => ({
  useRealtimeChats: vi.fn(),
}));

vi.mock("./new-chat-button", () => ({
  NewChatButton: () => <div>New chat button</div>,
}));

vi.mock("./chat-list", () => ({
  ChatList: () => <div>Chat list</div>,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: ComponentProps<"a"> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/api/client", () => ({
  supabase: {
    auth: {
      signOut: mockSignOut,
    },
  },
}));

describe("Sidebar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthState.isAuthenticated = true;
    mockAuthState.isLoading = false;
    mockAuthState.user = {
      id: "user-1",
      email: "natallia_smirnova@gmail.com",
      display_name: null,
      avatar_url: null,
      created_at: "",
      updated_at: "",
    };
  });

  it("renders a profile row with avatar fallback and email for authenticated users", () => {
    render(<Sidebar activeChatId="chat-1" />);

    expect(screen.getByLabelText("User avatar")).toHaveTextContent("N");
    expect(screen.getByText("natallia_smirnova@gmail.com")).toBeVisible();
    expect(screen.getByTitle("Sign out")).toBeVisible();
  });
});
