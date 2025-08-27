/**
 * Playwright Configuration for Load Testing
 */

const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  // Test directory
  testDir: './tests',
  
  // Global test timeout
  timeout: 120000, // 2 minutes per test
  
  // Global expect timeout
  expect: {
    timeout: 10000 // 10 seconds for expect assertions
  },
  
  // Run tests in files in parallel
  fullyParallel: true,
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter to use
  reporter: [
    ['html'],
    ['json', { outputFile: 'results/test-results.json' }],
    ['junit', { outputFile: 'results/junit-results.xml' }]
  ],
  
  // Shared settings for all projects
  use: {
    // Browser context options
    headless: true,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    
    // Collect trace when retrying the failed test
    trace: 'on-first-retry',
    
    // Take screenshot on failure
    screenshot: 'only-on-failure',
    
    // Record video on failure
    video: 'retain-on-failure'
  },
  
  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Additional options for load testing
        launchOptions: {
          args: [
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor'
          ]
        }
      },
    }
  ],
  
  // Global setup and teardown
  globalSetup: require.resolve('./scripts/global-setup.js'),
  globalTeardown: require.resolve('./scripts/global-teardown.js'),
  
  // Output directory for test artifacts
  outputDir: 'results/test-artifacts',
  
  // Web Server (if needed for local testing)
  webServer: process.env.APP_URL ? undefined : {
    command: 'npm run dev',
    port: 5173,
    cwd: '../',
    reuseExistingServer: !process.env.CI,
    timeout: 120000
  }
});