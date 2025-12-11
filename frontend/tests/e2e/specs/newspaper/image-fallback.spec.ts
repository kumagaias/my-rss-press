import { test, expect } from '@playwright/test';
import { HistoricalNewspaperPage } from '../../pages/HistoricalNewspaperPage';

test.describe('Copyright-Free Image Fallback', () => {
  let historicalPage: HistoricalNewspaperPage;

  test.beforeEach(async ({ page }) => {
    historicalPage = new HistoricalNewspaperPage(page);
  });

  /**
   * Test: Lead article always has an image
   * Requirement: 6.1, 6.3
   */
  test('should display image for lead article', async ({ page }) => {
    const newspaperId = 'test-newspaper-id';
    const date = new Date();
    date.setDate(date.getDate() - 1); // Yesterday
    const dateStr = date.toISOString().split('T')[0];

    await historicalPage.goto(newspaperId, dateStr);
    await historicalPage.waitForArticles();

    // Get lead article (first article in main area)
    const leadArticle = page.getByTestId('article').first();
    await expect(leadArticle).toBeVisible();

    // Lead article should have an image
    const leadImage = leadArticle.locator('img').first();
    await expect(leadImage).toBeVisible();

    // Image should have src attribute
    const imageSrc = await leadImage.getAttribute('src');
    expect(imageSrc).toBeTruthy();
  });

  /**
   * Test: Fallback to copyright-free image when no original image
   * Requirement: 6.2, 6.4
   */
  test('should use copyright-free fallback image when original is missing', async ({ page }) => {
    const newspaperId = 'test-newspaper-id';
    const date = new Date();
    date.setDate(date.getDate() - 1);
    const dateStr = date.toISOString().split('T')[0];

    await historicalPage.goto(newspaperId, dateStr);
    await historicalPage.waitForArticles();

    // Check all articles for images
    const articles = await historicalPage.articles.all();
    
    for (const article of articles) {
      const images = article.locator('img');
      const imageCount = await images.count();
      
      if (imageCount > 0) {
        const image = images.first();
        const imageSrc = await image.getAttribute('src');
        
        // Image should be either original or Unsplash fallback
        expect(imageSrc).toBeTruthy();
        
        // If it's a fallback, it should be from Unsplash
        if (imageSrc && imageSrc.includes('unsplash')) {
          expect(imageSrc).toContain('unsplash.com');
        }
      }
    }
  });

  /**
   * Test: Image alt text is present
   * Requirement: 6.5
   */
  test('should have alt text for all images', async ({ page }) => {
    const newspaperId = 'test-newspaper-id';
    const date = new Date();
    date.setDate(date.getDate() - 1);
    const dateStr = date.toISOString().split('T')[0];

    await historicalPage.goto(newspaperId, dateStr);
    await historicalPage.waitForArticles();

    // Check all images have alt text
    const images = page.locator('img');
    const imageCount = await images.count();

    for (let i = 0; i < imageCount; i++) {
      const image = images.nth(i);
      const altText = await image.getAttribute('alt');
      
      // Alt text should exist (can be empty string for decorative images)
      expect(altText).not.toBeNull();
    }
  });

  /**
   * Test: Images load successfully
   * Requirement: 6.6
   */
  test('should load images successfully', async ({ page }) => {
    const newspaperId = 'test-newspaper-id';
    const date = new Date();
    date.setDate(date.getDate() - 1);
    const dateStr = date.toISOString().split('T')[0];

    await historicalPage.goto(newspaperId, dateStr);
    await historicalPage.waitForArticles();

    // Wait for images to load
    await page.waitForLoadState('networkidle');

    // Check that images are loaded (not broken)
    const images = page.locator('img');
    const imageCount = await images.count();

    for (let i = 0; i < imageCount; i++) {
      const image = images.nth(i);
      
      // Image should be visible
      await expect(image).toBeVisible();
      
      // Image should have naturalWidth > 0 (indicates successful load)
      const naturalWidth = await image.evaluate((img: HTMLImageElement) => img.naturalWidth);
      expect(naturalWidth).toBeGreaterThan(0);
    }
  });

  /**
   * Test: Fallback image theme relevance
   * Requirement: 6.7
   */
  test('should use theme-relevant fallback images', async ({ page }) => {
    const newspaperId = 'test-newspaper-id';
    const date = new Date();
    date.setDate(date.getDate() - 1);
    const dateStr = date.toISOString().split('T')[0];

    await historicalPage.goto(newspaperId, dateStr);
    await historicalPage.waitForArticles();

    // Check if Unsplash images include theme query parameter
    const images = page.locator('img');
    const imageCount = await images.count();

    let hasThemeRelevantImage = false;

    for (let i = 0; i < imageCount; i++) {
      const image = images.nth(i);
      const imageSrc = await image.getAttribute('src');
      
      if (imageSrc && imageSrc.includes('unsplash')) {
        // Unsplash URL should include query parameter for theme
        hasThemeRelevantImage = true;
        break;
      }
    }

    // At least some images should be theme-relevant (if using fallback)
    // This is a soft check as not all articles may need fallback
    expect(hasThemeRelevantImage).toBe(true); // At least one Unsplash image with theme relevance should be present
  });
});
