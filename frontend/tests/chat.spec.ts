import { test, expect, type Page } from "@playwright/test"

const CHAT_ANSWER = "We make websites and apps — websites, mobile apps, and UI/UX design."

async function mockChatApi(page: Page, options: { delayMs?: number; source?: string } = {}) {
  await page.route("**/api/chat", async (route) => {
    if (options.delayMs) {
      await new Promise((resolve) => setTimeout(resolve, options.delayMs))
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ answer: CHAT_ANSWER, source: options.source ?? "knowledge" }),
    })
  })
}

async function mockChatLeadApi(page: Page) {
  const requests: unknown[] = []
  await page.route("**/api/chat-lead", async (route) => {
    const body = route.request().postDataJSON()
    requests.push(body)
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        conversation_id: body.conversation_id,
        name: body.name ?? null,
        email: body.email ?? null,
        phone: body.phone ?? null,
      }),
    })
  })
  return requests
}

async function sendChatMessage(page: Page, text: string) {
  const input = page.getByRole("textbox", { name: "Message" })
  await input.fill(text)
  await page.getByRole("button", { name: "Send message" }).click()
}

test.describe("Sapvy Assistant chatbot", () => {
  test("launcher is visible on load", async ({ page }) => {
    await page.goto("/")
    await expect(page.getByTestId("chat-launcher")).toBeVisible()
  })

  test("opens the panel and shows the greeting and quick prompts", async ({ page }) => {
    await page.goto("/")
    await page.getByTestId("chat-launcher").click()

    await expect(page.getByTestId("chat-panel")).toBeVisible()
    await expect(page.getByTestId("chat-greeting")).toContainText("Sapvy Assistant")

    const quickPrompts = page.getByTestId("chat-quick-prompts")
    await expect(quickPrompts.getByRole("button", { name: "What do you offer?" })).toBeVisible()
    await expect(quickPrompts.getByRole("button", { name: "How can I start a project?" })).toBeVisible()
    await expect(
      quickPrompts.getByRole("button", { name: "What kind of products do you build?" })
    ).toBeVisible()
    await expect(quickPrompts.getByRole("button", { name: "Can I work with your team?" })).toBeVisible()
  })

  test("input accepts text", async ({ page }) => {
    await page.goto("/")
    await page.getByTestId("chat-launcher").click()

    const input = page.getByRole("textbox", { name: "Message" })
    await input.fill("What do you offer?")
    await expect(input).toHaveValue("What do you offer?")
  })

  test("sending a message shows a loading state, then renders the response", async ({ page }) => {
    await mockChatApi(page, { delayMs: 400 })
    await page.goto("/")
    await page.getByTestId("chat-launcher").click()

    await page.getByRole("textbox", { name: "Message" }).fill("What do you offer?")
    await page.getByRole("button", { name: "Send message" }).click()

    await expect(page.getByTestId("chat-loading")).toBeVisible()
    await expect(page.getByText(CHAT_ANSWER)).toBeVisible()
    await expect(page.getByTestId("chat-loading")).toHaveCount(0)
  })

  test("quick prompt buttons send their message and render the response", async ({ page }) => {
    await mockChatApi(page)
    await page.goto("/")
    await page.getByTestId("chat-launcher").click()

    await page
      .getByTestId("chat-quick-prompts")
      .getByRole("button", { name: "What do you offer?" })
      .click()

    await expect(page.getByTestId("chat-messages").getByText("What do you offer?", { exact: true })).toBeVisible()
    await expect(page.getByText(CHAT_ANSWER)).toBeVisible()
  })

  test("close button hides the panel", async ({ page }) => {
    await page.goto("/")
    await page.getByTestId("chat-launcher").click()
    await expect(page.getByTestId("chat-panel")).toBeVisible()

    await page.getByTestId("chat-close").click()
    await expect(page.getByTestId("chat-panel")).toHaveCount(0)
  })

  test("clear conversation resets the chat back to quick prompts", async ({ page }) => {
    await mockChatApi(page)
    await page.goto("/")
    await page.getByTestId("chat-launcher").click()

    await page.getByRole("textbox", { name: "Message" }).fill("What do you offer?")
    await page.getByRole("button", { name: "Send message" }).click()
    await expect(page.getByText(CHAT_ANSWER)).toBeVisible()
    await expect(page.getByTestId("chat-quick-prompts")).toHaveCount(0)

    await page.getByRole("button", { name: "Clear conversation" }).click()
    await expect(page.getByTestId("chat-quick-prompts")).toBeVisible()
    await expect(page.getByText(CHAT_ANSWER)).toHaveCount(0)
  })

  test("mobile layout: launcher and panel fit within the viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto("/")

    await expect(page.getByTestId("chat-launcher")).toBeVisible()
    await page.getByTestId("chat-launcher").click()

    const panel = page.getByTestId("chat-panel")
    await expect(panel).toBeVisible()
    const box = await panel.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.x).toBeGreaterThanOrEqual(0)
    expect(box!.x + box!.width).toBeLessThanOrEqual(391)
  })
})

test.describe("Sapvy Assistant lead capture", () => {
  test("first two messages behave normally, no capture prompt", async ({ page }) => {
    await mockChatApi(page)
    await mockChatLeadApi(page)
    await page.goto("/")
    await page.getByTestId("chat-launcher").click()

    await sendChatMessage(page, "What do you offer?")
    await expect(page.getByTestId("chat-messages").getByText(CHAT_ANSWER)).toBeVisible()

    await sendChatMessage(page, "Do you build mobile apps?")
    await expect(page.getByTestId("chat-messages").getByText(CHAT_ANSWER)).toHaveCount(2)

    await expect(page.getByText(/what should i call you/i)).toHaveCount(0)
  })

  test("third message triggers name capture, original message is answered after, name is used", async ({
    page,
  }) => {
    await mockChatApi(page)
    const leadRequests = await mockChatLeadApi(page)
    await page.goto("/")
    await page.getByTestId("chat-launcher").click()

    await sendChatMessage(page, "What do you offer?")
    await sendChatMessage(page, "Do you build mobile apps?")
    await sendChatMessage(page, "What's your process?")

    const messages = page.getByTestId("chat-messages")
    await expect(messages.getByText(/what should i call you/i)).toBeVisible()
    // The third message must still be visible, not lost.
    await expect(messages.getByText("What's your process?", { exact: true })).toBeVisible()
    await expect(messages.getByText(CHAT_ANSWER)).toHaveCount(2) // only the first two answers so far

    await sendChatMessage(page, "Vineet")

    await expect(messages.getByText(/thanks, vineet/i)).toBeVisible()
    // The original third message is now answered too.
    await expect(messages.getByText(CHAT_ANSWER)).toHaveCount(3)

    expect(leadRequests.some((r: any) => r.name === "Vineet")).toBe(true)

    // Name is used naturally later, without asking for it again.
    await sendChatMessage(page, "Do you offer packages?")
    await expect(messages.getByText(/what should i call you/i)).toHaveCount(1)
  })

  test("fifth message triggers email capture, original message is answered after", async ({ page }) => {
    await mockChatApi(page)
    const leadRequests = await mockChatLeadApi(page)
    await page.goto("/")
    await page.getByTestId("chat-launcher").click()

    await sendChatMessage(page, "What do you offer?") // message 1
    await sendChatMessage(page, "Do you build mobile apps?") // message 2
    await sendChatMessage(page, "What's your process?") // message 3 — triggers name capture
    await sendChatMessage(page, "Vineet") // answers the name prompt, doesn't count as a message
    await sendChatMessage(page, "Do you offer packages?") // message 4
    await sendChatMessage(page, "Can I see your work?") // message 5 — triggers email capture

    const messages = page.getByTestId("chat-messages")
    await expect(messages.getByText(/best email to reach you/i)).toBeVisible()
    await expect(messages.getByText("Can I see your work?", { exact: true })).toBeVisible()

    // Invalid email is rejected without losing the buffered original message.
    await sendChatMessage(page, "not-an-email")
    await expect(messages.getByText(/doesn't look quite right/i)).toBeVisible()

    await sendChatMessage(page, "vineet@example.com")
    await expect(messages.getByText(/got it/i)).toBeVisible()

    expect(leadRequests.some((r: any) => r.email === "vineet@example.com")).toBe(true)
  })

  test("phone stays optional and skip is respected without repeated asking", async ({ page }) => {
    await mockChatApi(page)
    await mockChatLeadApi(page)
    await page.goto("/")
    await page.getByTestId("chat-launcher").click()

    await sendChatMessage(page, "What do you offer?")
    await sendChatMessage(page, "Do you build mobile apps?")
    await sendChatMessage(page, "What's your process?")

    const messages = page.getByTestId("chat-messages")
    await expect(messages.getByText(/what should i call you/i)).toBeVisible()

    // Decline instead of giving a name.
    await sendChatMessage(page, "prefer not to say")
    await expect(messages.getByText(/no problem/i)).toBeVisible()
    // The original third message is still answered.
    await expect(messages.getByText(CHAT_ANSWER)).toHaveCount(3)

    // Never asked again after declining.
    await sendChatMessage(page, "Can I see your work?")
    await expect(messages.getByText(/what should i call you/i)).toHaveCount(1)
  })
})
