const {defineConfig} = require('@playwright/test');
module.exports = defineConfig({
  testDir: './tests/browser', timeout: 30000, fullyParallel: false, workers: 2,
  use: {baseURL: 'http://127.0.0.1:8001', browserName: 'chromium',
    launchOptions: {executablePath: process.env.CHROMIUM_PATH || (require('node:fs').existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined), args: ['--no-sandbox']},
    trace: 'retain-on-failure'},
  webServer: {command: 'python3 scripts/serve.py --port 8001', url: 'http://127.0.0.1:8001', reuseExistingServer: !process.env.CI},
  projects: [
    {name: 'desktop', use: {viewport: {width: 1440, height: 1000}}},
    {name: 'tablet', use: {viewport: {width: 768, height: 1024}}},
    {name: 'mobile', use: {viewport: {width: 390, height: 844}}}
  ]
});
