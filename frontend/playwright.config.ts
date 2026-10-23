import { defineConfig, devices } from "@playwright/test"

/**
 * Basic UI/visual QA suite — Chromium only, no cross-browser matrix.
 * See tests/ for scope: load, navigation, hero, images, sections,
 * contact form UI, responsiveness, overflow, and screenshots.
 */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  // More workers than this overload the single Vite dev server on first
  // load and tests time out; 2 keeps the full suite reliable.
  workers: 2,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:5173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: true,
    timeout: 30_000,
  },
})
