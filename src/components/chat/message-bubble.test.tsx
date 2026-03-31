import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MessageBubble } from "./message-bubble";

vi.mock("./attachment-preview", () => ({
  AttachmentPreview: ({ attachment }: { attachment: { file_name: string } }) => (
    <div data-testid="attachment-preview">{attachment.file_name}</div>
  ),
}));

describe("MessageBubble", () => {
  it("renders attached files with the message", () => {
    render(
      <MessageBubble
        message={{
          id: "msg-1",
          chat_id: "chat-1",
          role: "user",
          content: "Please check this file",
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
              file_name: "brief.pdf",
              file_type: "application/pdf",
              file_size: 1024,
              storage_path: "chat-1/brief.pdf",
              category: "document",
              created_at: "2026-03-31T12:00:00Z",
            },
          ],
        }}
      />
    );

    expect(screen.getByTestId("attachment-preview")).toHaveTextContent("brief.pdf");
    expect(screen.getByText("Please check this file")).toBeInTheDocument();
  });
});
