import { Page } from '@playwright/test';

/**
 * Helper functions for E2E tests
 */

/**
 * Wait for network idle (no network requests for a specified time)
 */
export async function waitForNetworkIdle(page: Page, timeout: number = 500) {
  await page.waitForLoadState('networkidle', { timeout });
}

/**
 * Wait for a specific API call to complete
 */
export async function waitForApiCall(page: Page, urlPattern: string | RegExp) {
  await page.waitForResponse(response => {
    const url = response.url();
    if (typeof urlPattern === 'string') {
      return url.includes(urlPattern);
    }
    return urlPattern.test(url);
  });
}

/**
 * Take a screenshot with a descriptive name
 */
export async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({ path: `test-results/screenshots/${name}.png`, fullPage: true });
}

/**
 * Check if an element is visible on the page
 */
export async function isVisible(page: Page, selector: string): Promise<boolean> {
  try {
    await page.waitForSelector(selector, { state: 'visible', timeout: 1000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the current locale from the page
 */
export async function getLocale(page: Page): Promise<'en' | 'ja'> {
  const lang = await page.evaluate(() => document.documentElement.lang);
  return lang === 'ja' ? 'ja' : 'en';
}
