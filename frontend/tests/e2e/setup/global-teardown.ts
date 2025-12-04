import { FullConfig } from '@playwright/test';

/**
 * Global teardown for Playwright tests
 * Runs once after all tests
 */
async function globalTeardown(config: FullConfig) {
  console.log('🧹 Cleaning up after E2E tests');
  
  // Add any cleanup logic here
  // For example: clearing test data, closing connections, etc.
}

export default globalTeardown;
