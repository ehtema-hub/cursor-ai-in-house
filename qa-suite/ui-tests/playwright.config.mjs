import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, devices } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../..')
const FRONTEND = path.join(ROOT, 'frontend')

const baseHost = process.env.UI_BASE_URL || 'http://localhost:5173'
const useExternalServer = Boolean(process.env.UI_BASE_URL)

export default defineConfig({
  testDir: path.join(__dirname, 'specs'),
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { outputFolder: path.join(ROOT, 'qa-suite/reporting/output/ui-tests'), open: 'never' }],
    ['json', { outputFile: path.join(ROOT, 'qa-suite/reporting/output/ui-tests/results.json') }],
  ],
  use: {
    baseURL: baseHost,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], baseURL: `${baseHost}/#tasks` },
    },
  ],
  webServer: useExternalServer
    ? undefined
    : {
        command: 'npm run dev',
        cwd: FRONTEND,
        url: 'http://localhost:5173',
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
      },
})
