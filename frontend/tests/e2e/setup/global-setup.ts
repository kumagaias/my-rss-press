import { chromium, FullConfig } from '@playwright/test';

/**
 * Global setup for Playwright tests
 * Runs once before all tests
 */
async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use;
  
  console.log(`🚀 Starting E2E tests against: ${baseURL}`);
  
  // Verify the application is running
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    await page.goto(baseURL || 'http://localhost:3000', { timeout: 30000 });
    console.log('✅ Application is accessible');
  } catch (error) {
    console.error('❌ Failed to access application:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;
