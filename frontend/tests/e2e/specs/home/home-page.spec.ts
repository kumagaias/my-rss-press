import { test, expect } from '@playwright/test';
import { HomePage } from '../../pages/HomePage';

test.describe('Home Page', () => {
  test('should load the home page successfully', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();
    
    // Verify the page loaded by checking for the app name
    await expect(homePage.appTitle).toContainText('MyRSSPress');
  });

  test('should display theme input field', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();
    
    // Verify theme input is visible
    await expect(homePage.themeInput).toBeVisible();
  });

  test('should display language toggle buttons', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();
    
    // Verify language buttons are visible
    await expect(homePage.languageButtonJa).toBeVisible();
    await expect(homePage.languageButtonEn).toBeVisible();
  });

  test('should display topic marquee', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();
    
    // Verify topic marquee is visible
    await expect(homePage.topicMarquee).toBeVisible();
  });

  test('should display popular newspapers section', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();
    
    // Verify popular newspapers section exists
    await expect(homePage.popularSection).toBeVisible();
  });

  test('should switch language to Japanese', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();
    
    // Switch to Japanese
    await homePage.switchToJapanese();
    
    // Wait for language change to take effect
    await page.waitForTimeout(500);
    
    // Verify Japanese button is active (contains bg-black in class attribute)
    const jaButtonClass = await homePage.languageButtonJa.getAttribute('class');
    expect(jaButtonClass).toContain('bg-black');
  });

  test('should switch language to English', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();
    
    // Switch to English
    await homePage.switchToEnglish();
    
    // Wait for language change to take effect
    await page.waitForTimeout(500);
    
    // Verify English button is active (contains bg-black in class attribute)
    const enButtonClass = await homePage.languageButtonEn.getAttribute('class');
    expect(enButtonClass).toContain('bg-black');
  });
});
