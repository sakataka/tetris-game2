import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.playwright.ts",

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,

  // Shorter timeouts for faster feedback
  timeout: 30000,
  expect: { timeout: 5000 },

  // Reporter to use
  reporter: "html",

  // Shared settings for all the projects below
  use: {
    // Base URL for the dev server
    baseURL: "http://localhost:5173",

    // Collect trace when retrying the failed test
    trace: "on-first-retry",

    // Take screenshot on failure
    screenshot: "only-on-failure",
  },

  // Configure projects - smoke test in dev, full in CI
  projects: process.env.CI
    ? [
        {
          name: "chromium",
          use: { ...devices["Desktop Chrome"] },
        },
        {
          name: "mobile",
          use: { ...devices["iPhone 12"] },
        },
      ]
    : [
        {
          name: "chromium-smoke",
          use: {
            ...devices["Desktop Chrome"],
            viewport: { width: 1280, height: 720 },
          },
        },
      ],

  // Run your local dev server before starting the tests
  webServer: {
    command: "bun run dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
  },
});
