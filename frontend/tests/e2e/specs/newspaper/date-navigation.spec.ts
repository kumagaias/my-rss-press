import { test, expect } from '@playwright/test';
import { HistoricalNewspaperPage } from '../../pages/HistoricalNewspaperPage';

test.describe('Date Navigation', () => {
  let historicalPage: HistoricalNewspaperPage;

  test.beforeEach(async ({ page }) => {
    historicalPage = new HistoricalNewspaperPage(page);
  });

  /**
   * Test: Navigate to previous day
   * Requirement: 5.1, 5.2
   */
  test('should navigate to previous day', async ({ page }) => {
    const newspaperId = 'test-newspaper-id';
    const date = new Date();
    date.setDate(date.getDate() - 1); // Yesterday
    const dateStr = date.toISOString().split('T')[0];

    await historicalPage.goto(newspaperId, dateStr);
    await historicalPage.waitForArticles();

    const currentDate = await historicalPage.getCurrentDate();

    // Click previous day button
    await historicalPage.clickPrevDay();
    await historicalPage.waitForArticles();

    const newDate = await historicalPage.getCurrentDate();
    expect(newDate).not.toBe(currentDate);

    // Verify URL changed
    const url = page.url();
    expect(url).toContain('/newspapers/');
    expect(url).not.toContain(dateStr);
  });

  /**
   * Test: Navigate to next day
   * Requirement: 5.1, 5.2
   */
  test('should navigate to next day', async ({ page }) => {
    const newspaperId = 'test-newspaper-id';
    const date = new Date();
    date.setDate(date.getDate() - 2); // 2 days ago
    const dateStr = date.toISOString().split('T')[0];

    await historicalPage.goto(newspaperId, dateStr);
    await historicalPage.waitForArticles();

    const currentDate = await historicalPage.getCurrentDate();

    // Click next day button
    await historicalPage.clickNextDay();
    await historicalPage.waitForArticles();

    const newDate = await historicalPage.getCurrentDate();
    expect(newDate).not.toBe(currentDate);
  });

  /**
   * Test: Next day button disabled for today
   * Requirement: 5.3
   */
  test('should disable next day button for today', async ({ page }) => {
    const newspaperId = 'test-newspaper-id';
    const today = new Date().toISOString().split('T')[0];

    await historicalPage.goto(newspaperId, today);
    await historicalPage.waitForArticles();

    // Next day button should be disabled
    await expect(historicalPage.nextDayButton).toBeDisabled();
  });

  /**
   * Test: Previous day button disabled for 7 days ago
   * Requirement: 4.7, 5.3
   */
  test('should disable previous day button for 7 days ago', async ({ page }) => {
    const newspaperId = 'test-newspaper-id';
    const date = new Date();
    date.setDate(date.getDate() - 7); // 7 days ago
    const dateStr = date.toISOString().split('T')[0];

    await historicalPage.goto(newspaperId, dateStr);
    await historicalPage.waitForArticles();

    // Previous day button should be disabled
    await expect(historicalPage.prevDayButton).toBeDisabled();
  });
});
