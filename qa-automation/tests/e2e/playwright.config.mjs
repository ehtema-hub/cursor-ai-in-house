import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, devices } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../../..')
const FRONTEND = path.join(ROOT, 'frontend')

export default defineConfig({
  testDir: '.',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ['html', { outputFolder: path.join(ROOT, 'qa-automation/reports/output/e2e'), open: 'never' }],
    ['list'],
  ],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:5173/#tasks' },
    },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 12'] } },
  ],
  webServer: [
    {
      command:
        'bash -c "python -m pip install -q -r requirements.txt && rm -f e2e_test.db && FLASK_ENV=development FLASK_DEBUG=0 DATABASE_URL=sqlite:///e2e_test.db JWT_SECRET_KEY=e2e-test-jwt-secret-key-32chars!! ALLOW_TEST_RESET=1 python -c \\"from app import create_app; from app.extensions import db; app=create_app(\\\\\\"development\\\\\\"); app.app_context().push(); db.create_all()\\" && FLASK_DEBUG=0 python run.py"',
      cwd: path.join(ROOT, 'backend'),
      url: 'http://localhost:5000/health',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: 'npm run dev',
      cwd: FRONTEND,
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
  ],
})
