import { test, expect } from "@playwright/test"

const viewports = {
  desktop: { width: 1440, height: 900 },
  tablet: { width: 1024, height: 768 },
  mobile: { width: 390, height: 844 },
}

test.describe("Responsive layout", () => {
  for (const [name, size] of Object.entries(viewports)) {
    test(`no horizontal overflow at ${name} (${size.width}x${size.height})`, async ({ page }) => {
      await page.setViewportSize(size)
      await page.goto("/")
      await page.waitForLoadState("networkidle")

      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }))

      // Small tolerance for scrollbar/subpixel rounding.
      expect(
        scrollWidth - clientWidth,
        `scrollWidth (${scrollWidth}) exceeds clientWidth (${clientWidth}) at ${name}`
      ).toBeLessThanOrEqual(2)
    })

    test(`nav and hero CTA remain usable at ${name}`, async ({ page }) => {
      await page.setViewportSize(size)
      await page.goto("/")

      if (name === "mobile") {
        await expect(page.getByRole("button", { name: /open menu/i })).toBeVisible()
      } else {
        await expect(page.locator("header nav").getByRole("link", { name: "work", exact: true })).toBeVisible()
      }

      const primaryCta = page.getByRole("link", { name: /let's connect/i }).first()
      await expect(primaryCta).toBeVisible()
      const box = await primaryCta.boundingBox()
      expect(box).not.toBeNull()
      expect(box!.x).toBeGreaterThanOrEqual(0)
      expect(box!.x + box!.width).toBeLessThanOrEqual(size.width + 2)
    })
  }
})

test.describe("Hero on mobile", () => {
  test("the artboard stays within the viewport, below the nav", async ({ page }) => {
    await page.setViewportSize(viewports.mobile)
    await page.goto("/")
    const board = await page.getByTestId("hero-artboard").boundingBox()
    expect(board).not.toBeNull()
    expect(board!.x).toBeGreaterThanOrEqual(0)
    expect(board!.x + board!.width).toBeLessThanOrEqual(viewports.mobile.width + 2)
    expect(board!.y + board!.height).toBeLessThanOrEqual(viewports.mobile.height + 2)
  })

  test("respects prefers-reduced-motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.setViewportSize(viewports.mobile)
    await page.goto("/")
    await expect(page.locator("#top").getByRole("heading", { level: 1 })).toBeVisible()
    await expect(page.locator("#process").getByRole("heading", { level: 3, name: "Launch" })).toBeAttached()
  })
})

test.describe("Visual QA screenshots", () => {
  test("homepage hero", async ({ page }) => {
    await page.setViewportSize(viewports.desktop)
    await page.goto("/")
    await page.waitForTimeout(1200) // let entrance animations settle
    await page.screenshot({ path: "test-results/screenshots/01-hero.png" })
  })

  test("selected work", async ({ page }) => {
    await page.setViewportSize(viewports.desktop)
    await page.goto("/")
    await page.locator("#work").scrollIntoViewIfNeeded()
    await page.waitForTimeout(800)
    await page.screenshot({ path: "test-results/screenshots/02-selected-work.png" })
  })

  test("services and process", async ({ page }) => {
    await page.setViewportSize(viewports.desktop)
    await page.goto("/")
    await page.locator("#services").scrollIntoViewIfNeeded()
    await page.waitForTimeout(800)
    await page.screenshot({ path: "test-results/screenshots/03-services.png" })

    await page.locator("#process").scrollIntoViewIfNeeded()
    await page.waitForTimeout(800)
    await page.screenshot({ path: "test-results/screenshots/04-process.png" })
  })

  test("contact section", async ({ page }) => {
    await page.setViewportSize(viewports.desktop)
    await page.goto("/")
    await page.locator("#contact").scrollIntoViewIfNeeded()
    await page.waitForTimeout(800)
    await page.screenshot({ path: "test-results/screenshots/05-contact.png" })
  })

  test("mobile homepage", async ({ page }) => {
    await page.setViewportSize(viewports.mobile)
    await page.goto("/")
    await page.waitForTimeout(1200)
    await page.screenshot({ path: "test-results/screenshots/06-mobile-home.png" })
  })
})
