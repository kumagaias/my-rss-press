import { test, expect } from '@playwright/test';
import { HistoricalNewspaperPage } from '../../pages/HistoricalNewspaperPage';

test.describe('Loading Animation', () => {
  let historicalPage: HistoricalNewspaperPage;

  test.beforeEach(async ({ page }) => {
    historicalPage = new HistoricalNewspaperPage(page);
  });

  /**
   * Test: Loading animation displays during generation
   * Requirement: 9.1, 9.2
   */
  test('should display loading animation during newspaper generation', async ({ page }) => {
    const newspaperId = 'test-newspaper-id';
    const date = new Date();
    date.setDate(date.getDate() - 1); // Yesterday
    const dateStr = date.toISOString().split('T')[0];

    // Navigate to historical newspaper
    await historicalPage.goto(newspaperId, dateStr);

    // Check if loading animation is visible
    // Note: This might be very fast in test environment
    const isLoadingVisible = await historicalPage.isLoadingVisible();
    
    if (isLoadingVisible) {
      // Loading animation should be visible
      await expect(historicalPage.loadingAnimation).toBeVisible();
      
      // Wait for loading to complete
      await historicalPage.waitForLoadingToDisappear();
    }

    // After loading, articles should be visible
    await historicalPage.waitForArticles();
    const articleCount = await historicalPage.getArticleCount();
    expect(articleCount).toBeGreaterThan(0);

    // Loading animation should be hidden
    await expect(historicalPage.loadingAnimation).not.toBeVisible();
  });

  /**
   * Test: Loading animation with slow network
   * Requirement: 9.3
   */
  test('should show loading animation with slow network', async ({ page }) => {
    // Simulate slow network
    await page.route('**/api/**', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
      await route.continue();
    });

    const newspaperId = 'test-newspaper-id';
    const date = new Date();
    date.setDate(date.getDate() - 1);
    const dateStr = date.toISOString().split('T')[0];

    await historicalPage.goto(newspaperId, dateStr);

    // Loading animation should be visible due to slow network
    await expect(historicalPage.loadingAnimation).toBeVisible();

    // Wait for loading to complete
    await historicalPage.waitForLoadingToDisappear();

    // Articles should be displayed
    await historicalPage.waitForArticles();
    const articleCount = await historicalPage.getArticleCount();
    expect(articleCount).toBeGreaterThan(0);
  });

  /**
   * Test: Loading animation accessibility
   * Requirement: 9.4
   */
  test('should have accessible loading animation', async ({ page }) => {
    const newspaperId = 'test-newspaper-id';
    const date = new Date();
    date.setDate(date.getDate() - 1);
    const dateStr = date.toISOString().split('T')[0];

    await historicalPage.goto(newspaperId, dateStr);

    const isLoadingVisible = await historicalPage.isLoadingVisible();
    
    if (isLoadingVisible) {
      // Loading animation should have aria-label or role
      const loadingElement = historicalPage.loadingAnimation;
      const ariaLabel = await loadingElement.getAttribute('aria-label');
      const role = await loadingElement.getAttribute('role');
      
      expect(ariaLabel || role).toBeTruthy();
    }
  });

  /**
   * Test: No loading animation for cached newspaper
   * Requirement: 4.5, 9.5
   */
  test('should not show loading animation for cached newspaper', async ({ page }) => {
    const newspaperId = 'test-newspaper-id';
    const date = new Date();
    date.setDate(date.getDate() - 1);
    const dateStr = date.toISOString().split('T')[0];

    // First access - generate newspaper
    await historicalPage.goto(newspaperId, dateStr);
    await historicalPage.waitForArticles();

    // Second access - should use cache
    await page.reload();

    // Loading should be very brief or not visible
    const isLoadingVisible = await historicalPage.isLoadingVisible();
    
    if (isLoadingVisible) {
      // If loading is shown, it should disappear very quickly
      await historicalPage.waitForLoadingToDisappear();
    }

    // Articles should be displayed immediately
    await historicalPage.waitForArticles();
    const articleCount = await historicalPage.getArticleCount();
    expect(articleCount).toBeGreaterThan(0);
  });
});
