import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: false,
  workers: 1,
  timeout: 45_000,
  use: {
    baseURL: "http://127.0.0.1:3108",
    launchOptions: process.env.PLAYWRIGHT_CHROME_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROME_PATH } : {},
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "mobile",use: { ...devices["iPhone 13"],defaultBrowserType: "chromium" } },
    { name: "desktop",use: { viewport: { width: 1440,height: 1100 },colorScheme: "dark",reducedMotion: "reduce" } },
  ],
  webServer: [
    { command: "node tests/fixtures/supabase.mjs",url: "http://127.0.0.1:55439/health",reuseExistingServer: false },
    { command: "node tests/fixtures/start-app.mjs",url: "http://127.0.0.1:3108/login",reuseExistingServer: false,timeout: 180_000,
      env: { NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:55439",NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_browser_test_only" } },
  ],
});
