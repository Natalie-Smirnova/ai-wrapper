import { test, expect } from "@playwright/test";

test.describe("Model switching", () => {
  test("switches to Gemini 2.5 Flash and sends a message without legacy model errors", async ({
    page,
  }) => {
    const chatId = "chat-1";
    let currentChat = {
      id: chatId,
      user_id: null,
      anon_id: "anon-1",
      title: "New chat",
      provider: "openai",
      model: "gpt-4o",
      created_at: "2026-03-31T09:00:00.000Z",
      updated_at: "2026-03-31T09:00:00.000Z",
    };
    let patchPayload: { provider?: string; model?: string } | null = null;

    await page.route("**/api/auth/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            authenticated: false,
            user: null,
            anonymous: true,
            questions_used: 0,
            questions_limit: 3,
          },
        }),
      });
    });

    await page.route(`**/api/chats/${chatId}`, async (route) => {
      if (route.request().method() === "PATCH") {
        patchPayload = (await route.request().postDataJSON()) as {
          provider?: string;
          model?: string;
        };
        currentChat = {
          ...currentChat,
          ...patchPayload,
          updated_at: "2026-03-31T09:05:00.000Z",
        };
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ data: currentChat }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: currentChat }),
      });
    });

    await page.route("**/api/chats?**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: [currentChat], cursor: null }),
      });
    });

    await page.route("**/api/models", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: [
            { id: "gpt-4o", name: "GPT-4o", provider: "openai" },
            { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "openai" },
            {
              id: "gemini-2.5-pro",
              name: "Gemini 2.5 Pro",
              provider: "gemini",
            },
            {
              id: "gemini-2.5-flash",
              name: "Gemini 2.5 Flash",
              provider: "gemini",
            },
          ],
        }),
      });
    });

    await page.route(`**/api/chats/${chatId}/messages?**`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: [], cursor: null }),
      });
    });

    await page.route(`**/api/chats/${chatId}/messages`, async (route) => {
      const requestBody = (await route.request().postDataJSON()) as {
        content?: string;
      };

      if (currentChat.provider !== "gemini" || currentChat.model !== "gemini-2.5-flash") {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({
            error: {
              message: `Unexpected chat model ${currentChat.provider}/${currentChat.model}`,
            },
          }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "text/event-stream",
        body: [
          `data: ${JSON.stringify({
            type: "user_message",
            message: {
              id: "msg-user-1",
              chat_id: chatId,
              role: "user",
              content: requestBody.content ?? "",
              provider: null,
              model: null,
              created_at: "2026-03-31T09:06:00.000Z",
            },
          })}\n\n`,
          `data: ${JSON.stringify({ type: "text", text: "Gemini is working." })}\n\n`,
          `data: ${JSON.stringify({
            type: "assistant_message",
            message: {
              id: "msg-assistant-1",
              chat_id: chatId,
              role: "assistant",
              content: "Gemini is working.",
              provider: "gemini",
              model: "gemini-2.5-flash",
              created_at: "2026-03-31T09:06:01.000Z",
            },
          })}\n\n`,
          "data: [DONE]\n\n",
        ].join(""),
      });
    });

    await page.goto(`/chat/${chatId}`);
    await expect(page.getByRole("button", { name: /gpt-4o/i })).toBeVisible();

    await page.getByRole("button", { name: /gpt-4o/i }).click();
    await expect(page.getByText("Gemini 2.5 Flash")).toBeVisible();
    await expect(page.getByText("Gemini 1.5 Flash")).toHaveCount(0);

    await page.getByRole("menuitem", { name: /gemini 2\.5 flash/i }).click();

    await expect
      .poll(() => patchPayload)
      .toEqual({ provider: "gemini", model: "gemini-2.5-flash" });
    await expect(page.getByRole("button", { name: /gemini 2\.5 flash/i })).toBeVisible();

    await page.getByPlaceholder("Type a message...").fill("How do you work?");
    await page.getByTitle("Send message").click();

    await expect(page.getByText("How do you work?")).toBeVisible();
    await expect(page.getByText("Gemini is working.")).toBeVisible();
    await expect(page.getByText(/unexpected chat model/i)).toHaveCount(0);
    await expect(page.getByText(/models\/gemini-1\.5-flash/i)).toHaveCount(0);
  });
});
