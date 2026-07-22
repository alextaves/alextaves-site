import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  reporter: 'list',
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 30000,
  },
  use: {
    baseURL: 'http://localhost:5173',
  },
  // WebKit isn't installable on this machine's macOS version, and the worst
  // bugs found in this project were Safari/WebKit-specific (touch-capability
  // detection, video autoplay on a detached element) — this suite catches
  // logic regressions (wrong isMobile boundary, desktop math drift, console
  // errors, broken panel/video counts), not real-device browser quirks.
  // Always confirm on a real iPhone (Safari *and* Chrome) before shipping.
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
})
