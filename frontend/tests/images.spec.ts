import { test, expect } from "@playwright/test"

/**
 * Image validation — highest priority QA check.
 *
 * Checking that an <img> tag exists is not enough: a broken remote image
 * still renders an <img> element, it just shows alt text / a broken-image
 * icon. The only reliable signal that an image actually rendered is
 * naturalWidth > 0 on the loaded HTMLImageElement.
 */

test("every image on the page has a non-empty src, useful alt text, and actually loaded", async ({ page }) => {
  await page.goto("/")

  // Let lazy-loaded images below the fold get a chance to load.
  await page.evaluate(async () => {
    window.scrollTo(0, document.body.scrollHeight)
    await new Promise((r) => setTimeout(r, 500))
    window.scrollTo(0, 0)
  })
  await page.waitForLoadState("networkidle")

  const images = page.locator("img")
  const count = await images.count()
  expect(count, "expected at least one <img> on the page").toBeGreaterThan(0)

  const failures: string[] = []

  for (let i = 0; i < count; i++) {
    const img = images.nth(i)
    const src = await img.getAttribute("src")
    const alt = await img.getAttribute("alt")

    if (!src || src.trim() === "") {
      failures.push(`image #${i}: missing or empty src`)
      continue
    }
    if (!alt || alt.trim().length < 3) {
      failures.push(`image #${i} (${src}): missing or trivial alt text`)
    }

    // Some images (e.g. hero fragments) are only shown above a large
    // breakpoint and are legitimately not rendered at this viewport — that's
    // responsive design, not a broken image, so skip loading checks for them.
    if (!(await img.isVisible())) continue

    await img.scrollIntoViewIfNeeded()
    const { naturalWidth, naturalHeight, complete } = await img.evaluate((el: HTMLImageElement) => ({
      naturalWidth: el.naturalWidth,
      naturalHeight: el.naturalHeight,
      complete: el.complete,
    }))

    if (!complete || naturalWidth === 0 || naturalHeight === 0) {
      failures.push(`image #${i} (${src}): failed to load (naturalWidth=${naturalWidth}, complete=${complete})`)
    }
  }

  expect(failures, `Broken/invalid images found:\n${failures.join("\n")}`).toEqual([])
})

test("hero collage images (some shown only from sm/md/2xl breakpoints up) load correctly at wide desktop", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 1080 })
  await page.goto("/")

  const fragments = page.locator("#top img")
  const count = await fragments.count()
  expect(count).toBeGreaterThanOrEqual(2)

  for (let i = 0; i < count; i++) {
    const img = fragments.nth(i)
    await expect(img).toBeVisible()
    const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth)
    expect(naturalWidth).toBeGreaterThan(0)
  }
})

test("no failed network requests for image resources", async ({ page }) => {
  const failedImageRequests: string[] = []
  page.on("requestfailed", (request) => {
    if (request.resourceType() === "image") {
      failedImageRequests.push(`${request.url()} — ${request.failure()?.errorText}`)
    }
  })
  page.on("response", (response) => {
    if (response.request().resourceType() === "image" && response.status() >= 400) {
      failedImageRequests.push(`${response.url()} — HTTP ${response.status()}`)
    }
  })

  await page.goto("/")
  await page.evaluate(async () => {
    window.scrollTo(0, document.body.scrollHeight)
    await new Promise((r) => setTimeout(r, 500))
  })
  await page.waitForLoadState("networkidle")

  expect(failedImageRequests, `Failed image requests:\n${failedImageRequests.join("\n")}`).toEqual([])
})
