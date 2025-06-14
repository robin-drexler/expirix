import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    browser: {
      enabled: true,
      provider: "playwright",
      instances: [{ browser: "chromium", headless: true }],
    },
    // Global test setup
    globals: true,
    includeTaskLocation: true,
    // Include test files
    include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts}"],
  },
});
