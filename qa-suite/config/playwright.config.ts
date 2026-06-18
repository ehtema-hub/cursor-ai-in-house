import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, devices } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../..')

export default defineConfig({
  testDir: path.join(ROOT, 'qa-suite/ui-tests/specs'),
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : undefined,
  reporter: [
    ['list'],
    ['html', { outputFolder: path.join(ROOT, 'qa-suite/reporting/output/ui-tests'), open: 'never' }],
    ['json', { outputFile: path.join(ROOT, 'qa-suite/reporting/output/ui-tests/results.json') }],
  ],
  use: {
    baseURL: process.env.UI_BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:5173/#tasks' },
    },
  ],
  webServer: {
    command: 'npm run dev',
    cwd: ROOT,
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
