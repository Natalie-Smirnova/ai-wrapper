import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MessageInput } from "./message-input";

vi.mock("./attachment-preview", () => ({
  AttachmentPreview: () => null,
}));

const defaultProps = {
  onSend: vi.fn(),
  isStreaming: false,
  pendingAttachments: [],
  onUpload: vi.fn(),
  onRemoveAttachment: vi.fn(),
  isUploading: false,
  disabled: false,
};

describe("MessageInput", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Bug 2: send button disabled during upload", () => {
    it("disables send button when isUploading is true", () => {
      render(
        <MessageInput {...defaultProps} isUploading={true} />
      );

      // Type some text first so the button would normally be enabled
      const textarea = screen.getByPlaceholderText("Type a message...");
      fireEvent.change(textarea, { target: { value: "Hello" } });

      const sendButton = screen.getByTitle("Send message");
      expect(sendButton).toBeDisabled();
    });

    it("does not submit on Enter when isUploading is true", () => {
      const onSend = vi.fn();
      render(
        <MessageInput {...defaultProps} onSend={onSend} isUploading={true} />
      );

      const textarea = screen.getByPlaceholderText("Type a message...");
      fireEvent.change(textarea, { target: { value: "Hello" } });
      fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });

      expect(onSend).not.toHaveBeenCalled();
    });
  });

  describe("Bug 3: text cleared before send confirmed", () => {
    it("does not clear text if onSend throws", async () => {
      const onSend = vi.fn().mockRejectedValue(new Error("Network error"));
      render(<MessageInput {...defaultProps} onSend={onSend} />);

      const textarea = screen.getByPlaceholderText("Type a message...");
      fireEvent.change(textarea, { target: { value: "Hello" } });

      const sendButton = screen.getByTitle("Send message");
      fireEvent.click(sendButton);

      // Wait for the async rejection to be handled
      await vi.waitFor(() => {
        expect(onSend).toHaveBeenCalled();
      });

      // Text should NOT be cleared since send failed
      expect(textarea).toHaveValue("Hello");
    });

    it("clears text after onSend resolves successfully", async () => {
      const onSend = vi.fn().mockResolvedValue(undefined);
      render(<MessageInput {...defaultProps} onSend={onSend} />);

      const textarea = screen.getByPlaceholderText("Type a message...");
      fireEvent.change(textarea, { target: { value: "Hello" } });

      const sendButton = screen.getByTitle("Send message");
      fireEvent.click(sendButton);

      await vi.waitFor(() => {
        expect(textarea).toHaveValue("");
      });
    });
  });
});
