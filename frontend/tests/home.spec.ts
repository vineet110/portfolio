import { test, expect } from "@playwright/test"

const WHATSAPP_URL = "https://wa.me/917382016152"

test.describe("Page load", () => {
  test("loads successfully with a meaningful title and visible content", async ({ page }) => {
    const pageErrors: string[] = []
    page.on("pageerror", (err) => pageErrors.push(err.message))

    const response = await page.goto("/")
    expect(response?.ok()).toBeTruthy()

    await expect(page).toHaveTitle(/sapvy/i)
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
    await expect(nav.getByRole("link", { name: "try it" })).toBeVisible()
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
  test("lists the clients; hovering one lights up its project, clicking opens it", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto("/")
    const work = page.locator("#work")
    const wall = work.getByTestId("clients")
    for (const name of ["Ambrane India", "ToyBharat", "Srikara", "Samagyo", "IPAD", "MV Manpower", "Occttro Fashion", "Chinar Scientific", "Spark", "BodhBox", "SkillXploit"]) {
      await expect(wall.getByText(name, { exact: true })).toBeAttached()
    }
    await expect(wall.getByText("Tufger", { exact: true })).toHaveCount(0)
    await expect(wall.getByText("Jewellery Store", { exact: true })).toHaveCount(0)
    const chinar = work.getByRole("button", { name: /Chinar Scientific — see the project/ })
    await chinar.scrollIntoViewIfNeeded()
    await chinar.hover()
    await expect(work.getByText("Education · Company Website").first()).toBeVisible()
    await chinar.click()
    await expect(page.getByRole("dialog")).toContainText("Chinar Scientific")
  })

  async function gotoWork(page: import("@playwright/test").Page) {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto("/")
    await page.locator("header nav").getByRole("link", { name: "work", exact: true }).click()
    await page.waitForTimeout(2500)
    return page.locator("#work")
  }

  test("says the work is made by the team, and shows what's live", async ({ page }) => {
    const section = await gotoWork(page)
    await expect(section.getByText(/made by our team/i)).toBeVisible()
    await expect(section.getByText(/3 live sites · 4 platforms/i)).toBeVisible()
  })

  test("shows all seven projects on one screen, only live sites tagged", async ({ page }) => {
    const section = await gotoWork(page)
    const expected: Record<string, [string, string]> = {
      tufger: ["Tufger", "LIVE"],
      jewellery: ["Jewellery Store", "LIVE"],
      chinar: ["Chinar Scientific", "LIVE"],
      whatsapp: ["WhatsApp Marketing Platform", ""],
      "spark-erp": ["Spark ERP", ""],
      "threat-accordme": ["Threat Accordme", ""],
      ctf: ["CTF Platform", ""],
    }
    for (const [id, [name, status]] of Object.entries(expected)) {
      await expect(section.getByTestId(`work-tile-${id}`)).toBeInViewport()
      if (status) await expect(section.getByTestId(`work-status-${id}`)).toHaveText(status)
      else await expect(section.getByTestId(`work-status-${id}`)).toHaveCount(0)
      await expect(section.getByTestId(`work-tile-${id}`).getByRole("heading", { level: 3, name, exact: true })).toBeVisible()
    }
  })

  test("is compact — no tall scroll track", async ({ page }) => {
    const section = await gotoWork(page)
    const box = await section.boundingBox()
    // grid + clients wall; a pinned scroll track would be several screens tall
    expect(box!.height).toBeLessThan(900 * 1.5)
  })

  test("hovering a project lets its world take over the section", async ({ page }) => {
    const section = await gotoWork(page)
    const before = await section.evaluate((el) => getComputedStyle(el).backgroundColor)
    await section.getByTestId("work-tile-jewellery").hover()
    await expect
      .poll(() => section.evaluate((el) => getComputedStyle(el).backgroundColor))
      .not.toBe(before)
  })

  test("resting on a live project grows it into a full-size window running the real site", async ({ page }) => {
    const section = await gotoWork(page)
    const tile = section.getByTestId("work-tile-tufger")
    const tileBox = await tile.boundingBox()
    await tile.hover()

    const stage = section.getByTestId("work-stage")
    await expect(stage).toBeVisible()
    await expect(stage.getByRole("heading", { name: "Tufger" })).toBeVisible()
    // grows into a 512 × 348 window (the Services browser window's size), bigger than the tile
    await expect.poll(async () => Math.round((await stage.boundingBox())!.width)).toBe(512)
    await expect.poll(async () => Math.round((await stage.boundingBox())!.height)).toBe(348)
    expect(512).toBeGreaterThan(tileBox!.width)
    // the real site, rendered at desktop width inside
    const frame = stage.locator("iframe")
    await expect(frame).toHaveAttribute("src", "https://tufger.vercel.app")
    await expect(frame).toHaveCSS("width", "1440px")
    await expect(stage.getByRole("link", { name: /visit site/i })).toHaveAttribute("href", "https://tufger.vercel.app")

    // moving off the work closes it
    await page.mouse.move(5, 5)
    await expect(stage).toHaveCount(0)
  })

  test("a site that blocks embedding scrolls as a full-page screenshot instead", async ({ page }) => {
    const section = await gotoWork(page)
    await section.getByTestId("work-tile-jewellery").hover()
    const stage = section.getByTestId("work-stage")
    await expect(stage).toBeVisible()
    await expect(stage.locator("iframe")).toHaveCount(0)
    await expect(stage.locator('img[src="/images/work/jewellery-full.jpg"]')).toBeVisible()
    await page.keyboard.press("Escape")
    await expect(stage).toHaveCount(0)
  })

  test("open shows a keyboard-friendly case view", async ({ page }) => {
    const section = await gotoWork(page)
    const opener = section.getByTestId("work-open-chinar")
    await opener.focus()
    await page.keyboard.press("Enter")

    const dialog = page.getByRole("dialog", { name: "Chinar Scientific" })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText("LIVE", { exact: true })).toBeVisible()
    await expect(dialog.getByRole("link", { name: /visit the live site/i })).toHaveAttribute("href", "https://chinarscientific.in/")
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

test.describe("Build your app", () => {
  test("picking a business builds the app, extras switch on, and launch takes it live", async ({ page }) => {
    await page.goto("/")
    const section = page.locator("#build")
    await section.scrollIntoViewIfNeeded()
    await expect(section.getByTestId("launch")).toBeDisabled()

    await section.getByTestId("biz-restaurant").click()
    await expect(section.getByTestId("biz-restaurant")).toHaveAttribute("aria-pressed", "true")
    await expect(section.getByTestId("app-phone")).toContainText("Spice Route")

    await section.getByTestId("feature-payments").click()
    await expect(section.getByTestId("feature-payments")).toHaveAttribute("aria-checked", "true")
    await expect(section.getByTestId("receipt")).toContainText("Payments")
    await expect(section.getByTestId("receipt-weeks")).toHaveText("≈ 4 weeks")

    await section.getByTestId("launch").click()
    const card = section.getByTestId("launch-card")
    await expect(card).toBeVisible({ timeout: 10000 })
    await expect(card).toContainText("Spice Route")
    await expect(section.getByTestId("visitors")).toHaveText("10,000")

    await card.getByRole("button", { name: /build this for real/i }).click()
    await expect(page.locator("#message")).toHaveValue(/Spice Route.*payments/i)
    await expect(page.locator("#project_type")).toHaveValue("website")
  })

  test("any business works: pick from the list or type your own", async ({ page }) => {
    await page.goto("/")
    const section = page.locator("#build")
    await section.scrollIntoViewIfNeeded()
    await section.getByTestId("biz-gym").click()
    await expect(section.getByTestId("app-phone")).toContainText("Iron Pulse")

    await section.getByTestId("biz-custom-input").fill("pet grooming")
    await section.getByTestId("biz-custom-go").click()
    await expect(section.getByTestId("app-phone")).toContainText("Pet Grooming")
    await expect(section.getByTestId("receipt")).toContainText("Pet grooming app")
  })

  test("Surprise me builds and launches an app on its own", async ({ page }) => {
    await page.goto("/")
    const section = page.locator("#build")
    await section.scrollIntoViewIfNeeded()
    await section.getByTestId("surprise").click()
    await expect(section.getByTestId("launch-card")).toBeVisible({ timeout: 20000 })
  })

  test("with reduced motion, launch goes straight to live", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.goto("/")
    const section = page.locator("#build")
    await section.scrollIntoViewIfNeeded()
    await section.getByTestId("biz-clinic").click()
    await section.getByTestId("launch").click()
    await expect(section.getByTestId("launch-card")).toContainText("CareWell")
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
    await expect(all).toContainText("Is the work in the Work section real?")
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

  test("the nav's try it link lands on the build-your-app playground", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto("/")
    await page.locator("header nav").getByRole("link", { name: "try it" }).click()
    await expect(page.locator("#build").getByRole("heading", { level: 2 })).toBeInViewport({ timeout: 4000 })
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
