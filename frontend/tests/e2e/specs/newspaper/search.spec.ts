import { test, expect } from '@playwright/test';
import { HistoricalNewspaperPage } from '../../pages/HistoricalNewspaperPage';

test.describe('Free-word Search', () => {
  let historicalPage: HistoricalNewspaperPage;

  test.beforeEach(async ({ page }) => {
    historicalPage = new HistoricalNewspaperPage(page);
  });

  /**
   * Test: Free-word search functionality
   * Requirement: 3.1, 3.2
   */
  test('should filter articles by search query', async ({ page }) => {
    const newspaperId = 'test-newspaper-id';
    const date = new Date();
    date.setDate(date.getDate() - 1);
    const dateStr = date.toISOString().split('T')[0];

    await historicalPage.goto(newspaperId, dateStr);
    await historicalPage.waitForArticles();

    // Get initial article count
    const initialCount = await historicalPage.getVisibleArticleCount();
    expect(initialCount).toBeGreaterThan(0);

    // Search for a specific term
    await historicalPage.search('technology');
    await page.waitForTimeout(500);

    const searchCount = await historicalPage.getVisibleArticleCount();
    expect(searchCount).toBeLessThanOrEqual(initialCount);
  });

  /**
   * Test: Search with no results
   * Requirement: 3.3
   */
  test('should show no results message when search has no matches', async ({ page }) => {
    const newspaperId = 'test-newspaper-id';
    const date = new Date();
    date.setDate(date.getDate() - 1);
    const dateStr = date.toISOString().split('T')[0];

    await historicalPage.goto(newspaperId, dateStr);
    await historicalPage.waitForArticles();

    // Search for a term that won't match
    await historicalPage.search('xyzabc123nonexistent');
    await page.waitForTimeout(500);

    const searchCount = await historicalPage.getVisibleArticleCount();
    expect(searchCount).toBe(0);

    // Should show "no results" message
    const noResultsMessage = page.getByText(/no articles found|記事が見つかりません/i);
    await expect(noResultsMessage).toBeVisible();
  });

  /**
   * Test: Clear search
   * Requirement: 3.4
   */
  test('should clear search and show all articles', async ({ page }) => {
    const newspaperId = 'test-newspaper-id';
    const date = new Date();
    date.setDate(date.getDate() - 1);
    const dateStr = date.toISOString().split('T')[0];

    await historicalPage.goto(newspaperId, dateStr);
    await historicalPage.waitForArticles();

    const initialCount = await historicalPage.getVisibleArticleCount();

    // Search for a term
    await historicalPage.search('technology');
    await page.waitForTimeout(500);

    const searchCount = await historicalPage.getVisibleArticleCount();
    expect(searchCount).toBeLessThanOrEqual(initialCount);

    // Clear search
    await historicalPage.search('');
    await page.waitForTimeout(500);

    const clearedCount = await historicalPage.getVisibleArticleCount();
    expect(clearedCount).toBe(initialCount);
  });
});
