import { Page } from '@playwright/test';

/**
 * API helper functions for E2E tests
 */

/**
 * Mock API response for testing
 */
export async function mockApiResponse(
  page: Page,
  urlPattern: string | RegExp,
  response: any,
  status: number = 200
) {
  await page.route(urlPattern, async route => {
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  });
}

/**
 * Intercept and log API calls
 */
export async function interceptApiCalls(page: Page, urlPattern: string | RegExp) {
  const calls: Array<{ url: string; method: string; body: any }> = [];
  
  await page.route(urlPattern, async route => {
    const request = route.request();
    calls.push({
      url: request.url(),
      method: request.method(),
      body: request.postDataJSON(),
    });
    await route.continue();
  });
  
  return calls;
}

/**
 * Wait for multiple API calls to complete
 */
export async function waitForMultipleApiCalls(
  page: Page,
  urlPatterns: Array<string | RegExp>
) {
  await Promise.all(
    urlPatterns.map(pattern =>
      page.waitForResponse(response => {
        const url = response.url();
        if (typeof pattern === 'string') {
          return url.includes(pattern);
        }
        return pattern.test(url);
      })
    )
  );
}
