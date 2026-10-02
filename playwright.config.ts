import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser', timeout: 120_000, workers: 1,
  use: { baseURL: process.env.QA_BASE_URL || 'http://localhost:3000', viewport: { width: 1366, height: 1100 }, channel: 'chrome', headless: true, screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  webServer: process.env.QA_BASE_URL ? undefined : { command: 'npm run dev', url: 'http://localhost:3000', reuseExistingServer: true },
  reporter: [['list'], ['json', { outputFile: 'artifacts/browser-report.json' }]],
});
