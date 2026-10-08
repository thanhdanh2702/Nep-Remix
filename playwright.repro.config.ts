import { defineConfig } from '@playwright/test';
import acceptance from './playwright.config';

export default defineConfig({
  ...acceptance,
  testDir: './tests/repro',
  reporter: [['list']],
});
