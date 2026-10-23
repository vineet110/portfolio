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
  test("shows the typed headline, both CTAs, and the floating project windows", async ({ page }) => {
    await page.goto("/")

    const hero = page.locator("#top")
    const headline = hero.getByRole("heading", { level: 1 })
    await expect(headline).toBeVisible()
    await expect(headline).toContainText("We make websites and apps.")

    await expect(hero.getByText(/Have an idea\? We design and build it/)).toBeVisible()

    const primaryCta = hero.getByRole("link", { name: /let's connect/i })
    await expect(primaryCta).toBeVisible()
    await expect(primaryCta).toHaveAttribute("href", WHATSAPP_URL)
    await expect(primaryCta).toHaveAttribute("target", "_blank")

    const secondaryCta = hero.getByRole("link", { name: /view work/i })
    await expect(secondaryCta).toBeVisible()

    // The floating windows are real project previews, not stock imagery.
    const heroImages = hero.locator("img")
    expect(await heroImages.count()).toBeGreaterThanOrEqual(2)

    await secondaryCta.click()
    await page.waitForTimeout(600)
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
  test("shows the corrected heading and honest, non-client-claiming supporting copy", async ({ page }) => {
    await page.goto("/")
    const section = page.locator("#work")
    await section.scrollIntoViewIfNeeded()

    await expect(section.getByRole("heading", { level: 2 })).toContainText("Made by our team.")
    await expect(page.getByText(/windows we've opened/i)).toHaveCount(0)
    await expect(section.getByText(/not real client work/i)).toBeVisible()
  })

  test("shows heading, every project name, and the default active project", async ({ page }) => {
    await page.goto("/")
    const section = page.locator("#work")
    // Align precisely to the top of the section — it's a tall scroll track
    // driving five projects, so scrollIntoViewIfNeeded's "nearest edge"
    // behavior can land mid-track instead of at project 0.
    await page.evaluate(() => document.getElementById("work")?.scrollIntoView({ block: "start" }))

    await expect(section.getByRole("heading", { level: 2 })).toBeVisible()
    for (const name of ["AI Workspace", "Maison", "Pulse", "Atlas", "Flow"]) {
      await expect(section.getByRole("heading", { level: 3, name })).toBeVisible()
    }

    // AI Workspace is the default active project, and it's a CONCEPT.
    await expect(section.getByTestId("work-index-ai-workspace")).toHaveAttribute("data-active", "true")
    await expect(section.getByTestId("work-status-badge")).toHaveText("CONCEPT")
    await expect(section.getByText(/concept exploration — not a live client site/i)).toBeVisible()
  })

  test("selecting a different project brings it forward and updates its status label", async ({ page }) => {
    await page.goto("/")
    const section = page.locator("#work")
    await section.scrollIntoViewIfNeeded()

    // Pulse is EXPERIMENTAL — switching to it should swap both the active
    // flag and the visible status badge.
    await section.getByTestId("work-index-pulse").click()

    await expect(section.getByTestId("work-index-pulse")).toHaveAttribute("data-active", "true")
    await expect(section.getByTestId("work-index-ai-workspace")).toHaveAttribute("data-active", "false")
    await expect(section.getByTestId("work-status-badge")).toHaveText("EXPERIMENTAL")
  })

  test("selecting a project is keyboard-operable", async ({ page }) => {
    await page.goto("/")
    const section = page.locator("#work")
    await section.scrollIntoViewIfNeeded()

    await section.getByTestId("work-index-maison").press("Enter")
    await expect(section.getByTestId("work-index-maison")).toHaveAttribute("data-active", "true")
  })

  test("a project's page-preview tabs are interactive", async ({ page }) => {
    await page.goto("/")
    const activeWindow = page.locator("#work").getByTestId("work-active-window")
    await activeWindow.scrollIntoViewIfNeeded()

    // AI Workspace is active by default.
    const workspaceTab = activeWindow.getByRole("button", { name: "Workspace", exact: true })
    await expect(workspaceTab).toBeVisible()
    await workspaceTab.click()
    await expect(activeWindow.getByText("ai-workspace.app — workspace")).toBeVisible()
  })

  test("the kinetic stage occupies a compact scroll length, not a huge one", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto("/")

    // The whole Work section (heading + the fixed-height scroll track that
    // drives the five-project sequence) must stay within a bounded, compact
    // multiple of the viewport height — not many screens of scrolling.
    const box = await page.locator("#work").boundingBox()
    expect(box).not.toBeNull()
    expect(box!.height).toBeLessThan(900 * 3.2)
  })

  test("only one active project window is dominant, with secondary windows behind it", async ({ page }) => {
    await page.goto("/")
    const stage = page.locator("[data-testid=work-stage]")
    await stage.scrollIntoViewIfNeeded()

    await expect(stage.getByTestId("work-active-window")).toHaveCount(1)
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

    // Locked to exactly three services — no pricing tiers or plans shown.
    await expect(section.getByText(/pricing|starting at|per month|price/i)).toHaveCount(0)
  })

  test("opening a service reveals its detail and its own supporting image", async ({ page }) => {
    await page.goto("/")
    const section = page.locator("#services")
    await section.scrollIntoViewIfNeeded()

    await section.getByTestId("service-toggle-mobile").click()
    const mobileDetail = section.getByTestId("service-detail-mobile")
    await expect(mobileDetail.getByText(/designed and built around how people actually use a phone/)).toBeVisible()
    const mobileImgSrc = await mobileDetail.locator("img").getAttribute("src")

    await section.getByTestId("service-toggle-design").click()
    const designDetail = section.getByTestId("service-detail-design")
    await expect(designDetail.locator("img")).toHaveAttribute("src", /.+/)
    const designImgSrc = await designDetail.locator("img").getAttribute("src")

    expect(designImgSrc).not.toBe(mobileImgSrc)
  })
})

test.describe("Process", () => {
  test("shows all five build-log steps without clipped text", async ({ page }) => {
    await page.goto("/")
    const section = page.locator("#process")
    await section.scrollIntoViewIfNeeded()

    for (const step of ["Idea", "UI/UX", "Design", "Development", "Launch"]) {
      await expect(section.getByRole("heading", { level: 3, name: step, exact: true })).toBeVisible()
    }
  })

  test("shows the corrected process heading, not the old one-person wording", async ({ page }) => {
    await page.goto("/")
    const section = page.locator("#process")
    await section.scrollIntoViewIfNeeded()

    await expect(section.getByRole("heading", { level: 2 })).toContainText("One team, five stages.")
    await expect(page.getByText(/one person, five stages/i)).toHaveCount(0)
  })

  test("only one process character is active/visible at a time, and it actually loads", async ({ page }) => {
    await page.goto("/")
    const stage = page.locator("[data-testid=process-stage]")
    await stage.scrollIntoViewIfNeeded()

    const activeCharacters = stage.getByTestId("process-active-character")
    await expect(activeCharacters).toHaveCount(1)

    const img = activeCharacters.locator("img")
    await expect(img).toBeVisible()
    const { naturalWidth, src } = await img.evaluate((el: HTMLImageElement) => ({
      naturalWidth: el.naturalWidth,
      src: el.src,
    }))
    expect(naturalWidth).toBeGreaterThan(0)
    expect(src).toMatch(/process-(planning|uiux|design|development|launch)/)
  })

  test("the process stage does not overlap the navigation", async ({ page }) => {
    await page.goto("/")
    const stage = page.locator("[data-testid=process-stage]")
    await stage.scrollIntoViewIfNeeded()

    const navBox = await page.locator("header nav").boundingBox()
    const stageBox = await stage.boundingBox()
    expect(navBox).not.toBeNull()
    expect(stageBox).not.toBeNull()
    expect(stageBox!.y).toBeGreaterThanOrEqual(navBox!.y + navBox!.height - 4)
  })

  test("the full five-phase journey fits in a compact scroll length", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto("/")

    const box = await page.locator("#process").boundingBox()
    expect(box).not.toBeNull()
    // Header + a ~170vh track, comfortably under 2.5 viewport heights total.
    expect(box!.height).toBeLessThan(900 * 2.5)
  })

  test("scrolling through the section reaches every phase, ending on Launch", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto("/")
    const section = page.locator("#process")
    await section.scrollIntoViewIfNeeded()

    const box = (await section.boundingBox())!
    const steps = 6
    for (let i = 0; i <= steps; i++) {
      await page.mouse.wheel(0, box.height / steps)
      await page.waitForTimeout(50)
    }

    await expect(page.locator("[data-testid=process-active-character]")).toHaveAttribute("data-phase", "launch")
  })
})

test.describe("Contact", () => {
  test("shows the contact form with all expected fields and a submit button", async ({ page }) => {
    await page.goto("/")
    const section = page.locator("#contact")
    await section.scrollIntoViewIfNeeded()

    const name = section.getByLabel("Name")
    const email = section.getByLabel("Email")
    const projectType = section.getByLabel("Project type")
    const message = section.getByLabel("Tell us about it")
    const submit = section.getByRole("button", { name: /send enquiry/i })

    await expect(name).toBeVisible()
    await expect(email).toBeVisible()
    await expect(projectType).toBeVisible()
    await expect(message).toBeVisible()
    await expect(submit).toBeVisible()

    await name.click()
    await name.fill("Jane Doe")
    await expect(name).toHaveValue("Jane Doe")

    await email.fill("jane@example.com")
    await expect(email).toHaveValue("jane@example.com")

    await message.fill("We would like to discuss a new product build.")
    await expect(message).toHaveValue("We would like to discuss a new product build.")
  })

  test("shows both primary contact actions side by side, equal weight", async ({ page }) => {
    await page.goto("/")
    const section = page.locator("#contact")
    await section.scrollIntoViewIfNeeded()

    const whatsapp = section.getByRole("link", { name: /chat on whatsapp/i })
    await expect(whatsapp).toBeVisible()
    await expect(whatsapp).toHaveAttribute("href", WHATSAPP_URL)
    await expect(whatsapp).toHaveAttribute("target", "_blank")
    await expect(whatsapp).toHaveAttribute("rel", /noopener/)

    const startConversation = section.getByRole("button", { name: /start a conversation/i })
    await expect(startConversation).toBeVisible()

    // Equal visual importance — same row on desktop (same top position).
    const whatsappBox = await whatsapp.boundingBox()
    const startBox = await startConversation.boundingBox()
    expect(whatsappBox).not.toBeNull()
    expect(startBox).not.toBeNull()
    expect(Math.abs(whatsappBox!.y - startBox!.y)).toBeLessThan(12)
  })

  test("start a conversation scrolls to and focuses the form", async ({ page }) => {
    await page.goto("/")
    const section = page.locator("#contact")
    await section.scrollIntoViewIfNeeded()

    await section.getByRole("button", { name: /start a conversation/i }).click()
    await expect(section.getByLabel("Name")).toBeFocused()
  })
})
