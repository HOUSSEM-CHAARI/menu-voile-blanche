import { defineConfig, devices } from '@playwright/test'

const PORT = 4322
const TEST_DB = 'file:./data/test.db'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    // Uses the Chrome already installed on the machine; no browser download needed.
    channel: 'chrome',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'mobile', use: { ...devices['Pixel 7'], channel: 'chrome' } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'], channel: 'chrome' } },
  ],
  webServer: {
    // Rebuilds a dedicated test database so tests never touch data/menu.db.
    command: 'node --import tsx scripts/reset.ts && npm run build && node ./dist/server/entry.mjs',
    url: `http://localhost:${PORT}/fr`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: { PORT: String(PORT), HOST: 'localhost', DATABASE_URL: TEST_DB },
  },
})
