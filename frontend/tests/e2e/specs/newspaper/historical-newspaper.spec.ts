import { test, expect } from '@playwright/test';
import { HistoricalNewspaperPage } from '../../pages/HistoricalNewspaperPage';

test.describe('Historical Newspaper Generation', () => {
  let historicalPage: HistoricalNewspaperPage;

  test.beforeEach(async ({ page }) => {
    historicalPage = new HistoricalNewspaperPage(page);
  });

  /**
   * Test: First access generates historical newspaper
   * Requirement: 4.1, 4.2, 4.3
   */
  test('should generate historical newspaper on first access', async ({ page }) => {
    const newspaperId = 'test-newspaper-id';
    const date = new Date();
    date.setDate(date.getDate() - 1); // Yesterday
    const dateStr = date.toISOString().split('T')[0];

    // First access
    await historicalPage.goto(newspaperId, dateStr);

    // Should show loading animation
    const isLoading = await historicalPage.isLoadingVisible();
    if (isLoading) {
      await historicalPage.waitForLoadingToDisappear();
    }

    // Should display articles
    await historicalPage.waitForArticles();
    const articleCount = await historicalPage.getArticleCount();
    expect(articleCount).toBeGreaterThan(0);
    expect(articleCount).toBeLessThanOrEqual(15);

    // Should display newspaper date
    const displayedDate = await historicalPage.getCurrentDate();
    expect(displayedDate).toContain(dateStr);
  });

  /**
   * Test: Second access retrieves cached newspaper
   * Requirement: 4.5
   */
  test('should retrieve cached newspaper on second access', async ({ page }) => {
    const newspaperId = 'test-newspaper-id';
    const date = new Date();
    date.setDate(date.getDate() - 1);
    const dateStr = date.toISOString().split('T')[0];

    // First access
    await historicalPage.goto(newspaperId, dateStr);
    await historicalPage.waitForArticles();
    const firstArticleCount = await historicalPage.getArticleCount();

    // Second access (reload page)
    await page.reload();
    await historicalPage.waitForArticles();
    const secondArticleCount = await historicalPage.getArticleCount();

    // Should have same articles (cached)
    expect(secondArticleCount).toBe(firstArticleCount);

    // Should load faster (no loading animation or very short)
    const isLoading = await historicalPage.isLoadingVisible();
    if (isLoading) {
      // If loading is shown, it should disappear quickly
      await historicalPage.waitForLoadingToDisappear();
    }
  });

  /**
   * Test: Reject future dates
   * Requirement: 4.6
   */
  test('should reject future dates', async ({ page }) => {
    const newspaperId = 'test-newspaper-id';
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1); // Tomorrow
    const dateStr = futureDate.toISOString().split('T')[0];

    await historicalPage.goto(newspaperId, dateStr);

    // Should show error message
    const errorMessage = await historicalPage.getErrorMessage();
    expect(errorMessage).toMatch(/future|未来/i);

    // Should not show articles
    const articleCount = await historicalPage.getArticleCount();
    expect(articleCount).toBe(0);
  });

  /**
   * Test: Reject dates older than 7 days
   * Requirement: 4.7
   */
  test('should reject dates older than 7 days', async ({ page }) => {
    const newspaperId = 'test-newspaper-id';
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 8); // 8 days ago
    const dateStr = oldDate.toISOString().split('T')[0];

    await historicalPage.goto(newspaperId, dateStr);

    // Should show error message
    const errorMessage = await historicalPage.getErrorMessage();
    expect(errorMessage).toMatch(/7 days|7日/i);

    // Should not show articles
    const articleCount = await historicalPage.getArticleCount();
    expect(articleCount).toBe(0);
  });

  /**
   * Test: Valid date range (today to 7 days ago)
   * Requirement: 4.3, 4.4
   */
  test('should accept dates within valid range', async ({ page }) => {
    const newspaperId = 'test-newspaper-id';

    // Test multiple dates within valid range
    for (let daysAgo = 0; daysAgo <= 7; daysAgo++) {
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      const dateStr = date.toISOString().split('T')[0];

      await historicalPage.goto(newspaperId, dateStr);
      await historicalPage.waitForArticles();

      const articleCount = await historicalPage.getArticleCount();
      expect(articleCount).toBeGreaterThan(0);
    }
  });
});
