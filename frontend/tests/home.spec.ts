import { test, expect } from "@playwright/test"

const WHATSAPP_URL = "https://wa.me/917382016152"

test.describe("Page load", () => {
  test("loads successfully with a meaningful title and visible content", async ({ page }) => {
    const pageErrors: string[] = []
    page.on("pageerror", (err) => pageErrors.push(err.message))

    const response = await page.goto("/")
    expect(response?.ok()).toBeTruthy()

    await expect(page).toHaveTitle(/studio/i)
    await expect(page.locator("main")).toBeVisible()
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()

    expect(pageErrors, `Unexpected page errors: ${pageErrors.join(", ")}`).toEqual([])
  })

  test("has no severe console errors on load", async ({ page }) => {
    const severeErrors: string[] = []
    page.on("console", (msg) => {
      if (msg.type() === "error") severeErrors.push(msg.text())
    })

    await page.goto("/")
    await page.waitForLoadState("networkidle")

    expect(severeErrors, `Console errors: ${severeErrors.join(", ")}`).toEqual([])
  })
})

test.describe("Navigation", () => {
  test("shows the dock links, they scroll to their sections, and the primary CTA opens WhatsApp", async ({
    page,
  }) => {
    await page.goto("/")

    const nav = page.locator("header nav")
    await expect(nav.getByRole("link", { name: "work", exact: true })).toBeVisible()
    await expect(nav.getByRole("link", { name: "services" })).toBeVisible()
    await expect(nav.getByRole("link", { name: "process" })).toBeVisible()
    await expect(nav.getByRole("link", { name: "contact" })).toBeVisible()

    const connect = nav.getByRole("link", { name: /let's connect/i })
    await expect(connect).toBeVisible()
    await expect(connect).toHaveAttribute("href", WHATSAPP_URL)
    await expect(connect).toHaveAttribute("target", "_blank")

    await nav.getByRole("link", { name: "services" }).click()
    // Smooth-scroll can take a moment to settle; poll instead of a fixed sleep.
    await expect
      .poll(async () => {
        const box = await page.locator("#services").boundingBox()
        return Math.abs(box?.y ?? Infinity)
      }, { timeout: 3000 })
      .toBeLessThan(250)
  })

  test("mobile menu opens and its links (including connect) are reachable", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto("/")

    const menuButton = page.getByRole("button", { name: /open menu/i })
    await expect(menuButton).toBeVisible()
    await menuButton.click()

    const menu = page.getByTestId("mobile-menu")
    await expect(menu).toBeVisible()
    await expect(menu.getByRole("link", { name: /work/i, exact: false })).toBeVisible()
    await expect(menu.getByRole("link", { name: /contact/i })).toBeVisible()
    await expect(menu.getByRole("link", { name: /let's connect/i })).toHaveAttribute("href", WHATSAPP_URL)
  })
})

test.describe("Hero", () => {
  test("opens on the paper sketch with the real headline, both CTAs, and images in the DOM", async ({ page }) => {
    await page.goto("/")

    const hero = page.locator("#top")
    const headline = hero.getByRole("heading", { level: 1 })
    await expect(headline).toBeAttached()
    await expect(headline).toContainText("We make websites and apps.")
    await expect(hero.getByText(/Have an idea\? We design and build it/)).toBeAttached()

    // the page opens on paper — the nav follows the surface
    await expect(page.locator("html")).toHaveAttribute("data-surface", "paper")

    const primaryCta = hero.getByRole("link", { name: /let's connect/i })
    await expect(primaryCta).toHaveAttribute("href", WHATSAPP_URL)
    await expect(primaryCta).toHaveAttribute("target", "_blank")

    expect(await hero.locator("img").count()).toBeGreaterThanOrEqual(2)
  })

  test("focusing a CTA before the design is revealed scrolls the build forward, and view work still works", async ({
    page,
  }) => {
    await page.goto("/")
    const hero = page.locator("#top")
    const secondaryCta = hero.getByRole("link", { name: /view work/i })

    await secondaryCta.focus()
    await expect(page.locator("html")).toHaveAttribute("data-surface", "ink", { timeout: 4000 })
    await page.waitForTimeout(800)

    await secondaryCta.click()
    await page.waitForTimeout(1500)
    const workBox = await page.locator("#work").boundingBox()
    expect(workBox).not.toBeNull()
    expect(Math.abs(workBox!.y)).toBeLessThan(300)
  })

  test("still renders correctly with prefers-reduced-motion enabled", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.goto("/")

    const hero = page.locator("#top")
    await expect(hero.getByRole("heading", { level: 1 })).toContainText("We make websites and apps.")
    await expect(hero.getByRole("link", { name: /let's connect/i })).toBeVisible()
    expect(await hero.locator("img").count()).toBeGreaterThanOrEqual(2)
  })
})

test.describe("Work", () => {
  async function gotoWork(page: import("@playwright/test").Page) {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto("/")
    await page.locator("header nav").getByRole("link", { name: "work", exact: true }).click()
    await page.waitForTimeout(2500)
    return page.locator("#work")
  }

  test("keeps the honest framing: made by our team, not real client work", async ({ page }) => {
    const section = await gotoWork(page)
    await expect(section.getByText(/made by our team/i)).toBeVisible()
    await expect(section.getByText(/not real client work/i)).toBeVisible()
  })

  test("shows all five projects at once, each labelled CONCEPT or EXPERIMENTAL, on one screen", async ({ page }) => {
    const section = await gotoWork(page)
    const expected: Record<string, string> = {
      "ai-workspace": "CONCEPT",
      maison: "CONCEPT",
      pulse: "EXPERIMENTAL",
      atlas: "CONCEPT",
      flow: "EXPERIMENTAL",
    }
    for (const [id, status] of Object.entries(expected)) {
      await expect(section.getByTestId(`work-tile-${id}`)).toBeInViewport()
      await expect(section.getByTestId(`work-status-${id}`)).toHaveText(status)
    }
    for (const name of ["AI Workspace", "Maison", "Pulse", "Atlas", "Flow"]) {
      await expect(section.getByRole("heading", { level: 3, name, exact: true })).toBeVisible()
    }
  })

  test("is compact — no tall scroll track", async ({ page }) => {
    const section = await gotoWork(page)
    const box = await section.boundingBox()
    expect(box!.height).toBeLessThan(900 * 1.3)
  })

  test("hovering a project lets its world take over the section", async ({ page }) => {
    const section = await gotoWork(page)
    const before = await section.evaluate((el) => getComputedStyle(el).backgroundColor)
    await section.getByTestId("work-tile-maison").hover()
    await expect
      .poll(() => section.evaluate((el) => getComputedStyle(el).backgroundColor))
      .not.toBe(before)
  })

  test("the mini-sites are interactive (Maison's bag fills up)", async ({ page }) => {
    const section = await gotoWork(page)
    const maison = section.getByTestId("work-tile-maison")
    await maison.getByRole("button", { name: "Add to bag" }).click()
    await expect(maison.getByText("Added to bag ✓")).toBeVisible()
    await expect(maison.getByText("Bag (1)")).toBeVisible()
  })

  test("open case shows an honest, keyboard-friendly case view", async ({ page }) => {
    const section = await gotoWork(page)
    const opener = section.getByTestId("work-open-pulse")
    await opener.click()

    const dialog = page.getByRole("dialog", { name: "Pulse" })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText("EXPERIMENTAL", { exact: true })).toBeVisible()
    await expect(dialog.getByText(/concept exploration — not a live client site/i)).toBeVisible()
    await expect(dialog.getByRole("button", { name: "Close case" })).toBeFocused()

    await page.keyboard.press("Escape")
    await expect(dialog).toHaveCount(0)
    await expect(opener).toBeFocused()
  })
})

test.describe("Services", () => {
  test("shows exactly the three locked services, no pricing", async ({ page }) => {
    await page.goto("/")
    const section = page.locator("#services")
    await section.scrollIntoViewIfNeeded()

    for (const name of ["Websites", "Mobile Apps", "UI/UX Design"]) {
      await expect(section.getByRole("heading", { level: 3, name })).toBeVisible()
    }
    await expect(section.getByRole("tab")).toHaveCount(3)

    // Locked to exactly three services — no pricing tiers or plans shown.
    await expect(section.getByText(/pricing|starting at|per month|price/i)).toHaveCount(0)
  })

  test("picking a service morphs the one device into that form, with its own detail and image", async ({ page }) => {
    await page.goto("/")
    const section = page.locator("#services")
    await section.scrollIntoViewIfNeeded()
    const device = section.getByTestId("service-device")

    await section.getByTestId("service-toggle-mobile").click()
    await expect(device).toHaveAttribute("data-form", "mobile")
    await expect(section.getByTestId("service-toggle-mobile")).toHaveAttribute("aria-selected", "true")
    await expect(
      section.getByTestId("service-detail-mobile").getByText(/designed and built around how people actually use a phone/)
    ).toBeVisible()
    const mobileImg = await device.locator("img").first().getAttribute("src")
    const tall = (await device.boundingBox())!

    await section.getByTestId("service-toggle-design").click()
    await expect(device).toHaveAttribute("data-form", "design")
    await page.waitForTimeout(1200)
    const wide = (await device.boundingBox())!
    expect(wide.width).toBeGreaterThan(tall.width * 1.5)
    expect(await device.locator("img").first().getAttribute("src")).not.toBe(mobileImg)
  })

  test("the service tabs are keyboard-operable with arrow keys", async ({ page }) => {
    await page.goto("/")
    const section = page.locator("#services")
    await section.scrollIntoViewIfNeeded()

    await section.getByTestId("service-toggle-websites").click()
    await page.keyboard.press("ArrowDown")
    await expect(section.getByTestId("service-toggle-mobile")).toBeFocused()
    await expect(section.getByTestId("service-device")).toHaveAttribute("data-form", "mobile")
  })
})

test.describe("Under the hood", () => {
  test("shows the site's real stack as five layers, with a live API check and no vendor names", async ({ page }) => {
    await page.goto("/")
    const section = page.locator("#stack")
    await section.scrollIntoViewIfNeeded()

    for (const name of ["Interface", "Assistant", "API", "Data", "Quality"]) {
      await expect(section.getByRole("heading", { level: 3, name, exact: true })).toBeVisible()
    }
    await expect(section.getByTestId("api-status")).toContainText("api:")
    await expect(section.getByText(/vercel|render|railway|aws|groq|openai|supabase|neon/i)).toHaveCount(0)
  })

  test("hovering or focusing a layer makes it the active one", async ({ page }) => {
    await page.goto("/")
    const section = page.locator("#stack")
    await section.scrollIntoViewIfNeeded()

    await section.getByTestId("stack-layer-data").hover()
    await expect(section.getByTestId("stack-layer-data")).toHaveAttribute("aria-pressed", "true")
    await section.getByTestId("stack-layer-quality").focus()
    await expect(section.getByTestId("stack-layer-quality")).toHaveAttribute("aria-pressed", "true")
    await expect(section.getByTestId("stack-layer-data")).toHaveAttribute("aria-pressed", "false")
  })
})

test.describe("FAQ", () => {
  test("tapping a question sends it into the conversation and the studio answers", async ({ page }) => {
    await page.goto("/")
    const section = page.locator("#faq")
    await section.scrollIntoViewIfNeeded()
    const thread = section.getByRole("log", { name: "Conversation" })

    // opens with the first question already answered
    await expect(thread.getByText(/a rough idea is enough to start/)).toBeVisible()

    await section.getByTestId("faq-toggle-4").click()
    await expect(thread.getByText("Do you have fixed packages or pricing?")).toBeVisible()
    await expect(thread.getByText(/Every project is scoped individually/)).toBeVisible({ timeout: 3000 })
    // an asked question leaves the list
    await expect(section.getByTestId("faq-toggle-4")).toHaveCount(0)
  })

  test("every answer is available to screen readers without interacting", async ({ page }) => {
    await page.goto("/")
    const all = page.locator("#faq dl")
    await expect(all.locator("dt")).toHaveCount(7)
    await expect(all).toContainText("Are the projects in the Work section real client work?")
  })

  test("start over resets the conversation", async ({ page }) => {
    await page.goto("/")
    const section = page.locator("#faq")
    await section.scrollIntoViewIfNeeded()
    await section.getByTestId("faq-toggle-1").click()
    await section.getByRole("button", { name: /start over/i }).click()
    await expect(section.getByTestId("faq-toggle-1")).toBeVisible()
  })
})

test.describe("Process (told by the hero)", () => {
  test("names all five stages under the corrected heading", async ({ page }) => {
    await page.goto("/")
    const hero = page.locator("#top")

    await expect(hero.getByRole("heading", { level: 2 })).toContainText("One team, five stages.")
    await expect(page.getByText(/one person, five stages/i)).toHaveCount(0)
    for (const step of ["Idea", "UI/UX", "Design", "Development", "Launch"]) {
      await expect(hero.getByRole("heading", { level: 3, name: step })).toBeVisible()
    }
  })

  test("the artboard does not overlap the navigation", async ({ page }) => {
    await page.goto("/")
    const navBox = await page.locator("header nav").boundingBox()
    const boardBox = await page.getByTestId("hero-artboard").boundingBox()
    expect(navBox).not.toBeNull()
    expect(boardBox).not.toBeNull()
    expect(boardBox!.y).toBeGreaterThanOrEqual(navBox!.y + navBox!.height - 4)
  })

  test("the nav's process link lands on the UI/UX stage", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto("/")
    await page.locator("header nav").getByRole("link", { name: "process" }).click()
    await expect(page.locator("#top li[data-active] h3")).toContainText("UI/UX", { timeout: 4000 })
  })

  test("scrolling through the hero reaches every stage, ending on Launch with the deploy log live", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto("/")

    const height = (await page.locator("#top").boundingBox())!.height
    const steps = 12
    for (let i = 0; i < steps; i++) {
      await page.mouse.wheel(0, height / steps)
      await page.waitForTimeout(120)
    }

    const active = page.locator("#top li[data-active] h3")
    await expect(active).toContainText("Launch", { timeout: 4000 })
    await expect(page.getByText("live — you're looking at it.")).toBeVisible()
    await expect(page.locator("html")).toHaveAttribute("data-surface", "ink")
  })

  test("with reduced motion, the five stages are laid out flat", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.goto("/")
    const process = page.locator("#process")
    await process.scrollIntoViewIfNeeded()
    for (const step of ["Idea", "UI/UX", "Design", "Development", "Launch"]) {
      await expect(process.getByRole("heading", { level: 3, name: step })).toBeVisible()
    }
  })
})

test.describe("Contact", () => {
  test("the idea sheet notices what kind of product it is", async ({ page }) => {
    await page.goto("/")
    const section = page.locator("#contact")
    await section.scrollIntoViewIfNeeded()

    const sheet = section.getByLabel("Your idea")
    await sheet.fill("An iOS app with an AI assistant for my bakery")
    await expect(section.getByTestId("idea-signal-mobile")).toHaveAttribute("data-on", "true")
    await expect(section.getByTestId("idea-signal-ai")).toHaveAttribute("data-on", "true")
    await expect(section.getByTestId("idea-signal-design")).not.toHaveAttribute("data-on", "true")
  })

  test("WhatsApp opens with the idea already written in", async ({ page }) => {
    await page.goto("/")
    const section = page.locator("#contact")
    await section.scrollIntoViewIfNeeded()

    const whatsapp = section.getByRole("link", { name: /chat on whatsapp/i })
    await expect(whatsapp).toHaveAttribute("href", WHATSAPP_URL)
    await expect(whatsapp).toHaveAttribute("target", "_blank")
    await expect(whatsapp).toHaveAttribute("rel", /noopener/)

    await section.getByLabel("Your idea").fill("A website for my bakery")
    await expect(whatsapp).toHaveAttribute("href", `${WHATSAPP_URL}?text=${encodeURIComponent("Hi! Here's my idea: A website for my bakery")}`)
  })

  test("start a conversation reveals the enquiry fields, focuses Name, and pre-picks the project type", async ({ page }) => {
    await page.goto("/")
    const section = page.locator("#contact")
    await section.scrollIntoViewIfNeeded()

    await section.getByLabel("Your idea").fill("We need a mobile app for booking dog walkers")
    await section.getByRole("button", { name: /start a conversation/i }).click()
    await expect(section.getByLabel("Name")).toBeFocused()
    await expect(section.getByLabel("Project type")).toHaveValue("mobile")

    await section.getByLabel("Name").fill("Jane Doe")
    await section.getByLabel("Email").fill("jane@example.com")
    await expect(section.getByRole("button", { name: /send enquiry/i })).toBeVisible()
  })
})
