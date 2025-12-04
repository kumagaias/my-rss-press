import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for the Home Page
 * Represents the unified home screen with theme input, feed management, and popular newspapers
 */
export class HomePage {
  readonly page: Page;
  readonly appTitle: Locator;
  readonly themeInput: Locator;
  readonly suggestButton: Locator;
  readonly generateButton: Locator;
  readonly popularNewspapers: Locator;
  readonly recentNewspapers: Locator;
  readonly sortByPopular: Locator;
  readonly sortByRecent: Locator;
  readonly languageButtonJa: Locator;
  readonly languageButtonEn: Locator;
  readonly topicMarquee: Locator;
  readonly popularSection: Locator;

  constructor(page: Page) {
    this.page = page;
    // Header elements
    this.appTitle = page.locator('h1');
    // Use exact match and more specific selector for language buttons
    this.languageButtonJa = page.getByRole('button', { name: '日本語', exact: true });
    this.languageButtonEn = page.getByRole('button', { name: 'EN', exact: true });
    
    // Theme input section
    this.themeInput = page.locator('input[type="text"]').first();
    this.suggestButton = page.locator('button[type="submit"]').first();
    this.topicMarquee = page.locator('.animate-marquee-slow').first();
    
    // Feed selection section
    this.generateButton = page.getByRole('button', { name: /新聞を生成|Generate Newspaper/i });
    
    // Popular newspapers section
    this.popularSection = page.locator('text=人気の新聞').or(page.locator('text=Popular Newspapers'));
    this.popularNewspapers = page.getByTestId('popular-newspapers');
    this.recentNewspapers = page.getByTestId('recent-newspapers');
    this.sortByPopular = page.getByRole('button', { name: /人気順|Popular/i });
    this.sortByRecent = page.getByRole('button', { name: /新着順|Recent/i });
  }

  async goto() {
    await this.page.goto('/');
  }

  async enterTheme(theme: string) {
    await this.themeInput.fill(theme);
  }

  async clickSuggestFeeds() {
    await this.suggestButton.click();
  }

  async clickGenerateNewspaper() {
    await this.generateButton.click();
  }

  async getPopularNewspaperCount() {
    return await this.popularNewspapers.locator('article').count();
  }

  async clickSortByPopular() {
    await this.sortByPopular.click();
  }

  async clickSortByRecent() {
    await this.sortByRecent.click();
  }

  async clickNewspaperCard(index: number) {
    await this.popularNewspapers.locator('article').nth(index).click();
  }

  async switchToJapanese() {
    await this.languageButtonJa.click();
  }

  async switchToEnglish() {
    await this.languageButtonEn.click();
  }

  async clickTopicKeyword(keyword: string) {
    await this.page.getByRole('button', { name: keyword }).click();
  }

  async isAppTitleVisible() {
    return await this.appTitle.isVisible();
  }

  async getAppTitleText() {
    return await this.appTitle.textContent();
  }
}
