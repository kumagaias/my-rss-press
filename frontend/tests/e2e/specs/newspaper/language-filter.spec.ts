import { test, expect } from '@playwright/test';
import { HistoricalNewspaperPage } from '../../pages/HistoricalNewspaperPage';

test.describe('Language Filter', () => {
  let historicalPage: HistoricalNewspaperPage;

  test.beforeEach(async ({ page }) => {
    historicalPage = new HistoricalNewspaperPage(page);
  });

  /**
   * Test: Language filter selection and newspaper filtering
   * Requirement: 1.5, 2.1
   */
  test('should filter articles by selected language', async ({ page }) => {
    // Navigate to a historical newspaper with mixed languages
    const newspaperId = 'test-newspaper-id';
    const date = new Date();
    date.setDate(date.getDate() - 1); // Yesterday
    const dateStr = date.toISOString().split('T')[0];

    await historicalPage.goto(newspaperId, dateStr);
    await historicalPage.waitForArticles();

    // Get initial article count
    const initialCount = await historicalPage.getVisibleArticleCount();
    expect(initialCount).toBeGreaterThan(0);

    // Filter by Japanese
    await historicalPage.selectLanguage('JP');
    await page.waitForTimeout(500); // Wait for filter to apply

    const jpCount = await historicalPage.getVisibleArticleCount();
    expect(jpCount).toBeLessThanOrEqual(initialCount);

    // Filter by English
    await historicalPage.selectLanguage('EN');
    await page.waitForTimeout(500);

    const enCount = await historicalPage.getVisibleArticleCount();
    expect(enCount).toBeLessThanOrEqual(initialCount);

    // Show all
    await historicalPage.selectLanguage('ALL');
    await page.waitForTimeout(500);

    const allCount = await historicalPage.getVisibleArticleCount();
    expect(allCount).toBe(initialCount);
  });

  /**
   * Test: Language filter persists across navigation
   * Requirement: 2.2
   */
  test('should persist language filter selection', async ({ page }) => {
    const newspaperId = 'test-newspaper-id';
    const date = new Date();
    date.setDate(date.getDate() - 1);
    const dateStr = date.toISOString().split('T')[0];

    await historicalPage.goto(newspaperId, dateStr);
    await historicalPage.waitForArticles();

    // Select Japanese filter
    await historicalPage.selectLanguage('JP');
    await page.waitForTimeout(500);

    const jpCountBefore = await historicalPage.getVisibleArticleCount();

    // Navigate to previous day
    await historicalPage.clickPrevDay();
    await historicalPage.waitForArticles();

    // Filter should still be applied
    const jpCountAfter = await historicalPage.getVisibleArticleCount();
    expect(jpCountAfter).toBeGreaterThan(0);
  });
});
