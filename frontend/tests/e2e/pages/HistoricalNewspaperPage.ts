import { Page, Locator } from '@playwright/test';

/**
 * Page Object for Historical Newspaper Page (/newspapers/[id]/[date])
 */
export class HistoricalNewspaperPage {
  readonly page: Page;
  readonly newspaperTitle: Locator;
  readonly newspaperDate: Locator;
  readonly articles: Locator;
  readonly prevDayButton: Locator;
  readonly nextDayButton: Locator;
  readonly languageFilter: Locator;
  readonly searchInput: Locator;
  readonly searchButton: Locator;
  readonly summary: Locator;
  readonly loadingAnimation: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.newspaperTitle = page.getByTestId('newspaper-title');
    this.newspaperDate = page.getByTestId('newspaper-date');
    this.articles = page.getByTestId('article');
    this.prevDayButton = page.getByRole('button', { name: /previous day|前日/i });
    this.nextDayButton = page.getByRole('button', { name: /next day|翌日/i });
    this.languageFilter = page.getByTestId('language-filter');
    this.searchInput = page.getByPlaceholder(/search|検索/i);
    this.searchButton = page.getByRole('button', { name: /search|検索/i });
    this.summary = page.getByTestId('newspaper-summary');
    this.loadingAnimation = page.getByTestId('loading-animation');
    this.errorMessage = page.getByTestId('error-message');
  }

  async goto(newspaperId: string, date: string) {
    await this.page.goto(`/newspapers/${newspaperId}/${date}`);
  }

  async clickPrevDay() {
    await this.prevDayButton.click();
  }

  async clickNextDay() {
    await this.nextDayButton.click();
  }

  async selectLanguage(language: 'JP' | 'EN' | 'ALL') {
    await this.languageFilter.selectOption(language);
  }

  async search(query: string) {
    await this.searchInput.fill(query);
    await this.searchButton.click();
  }

  async getArticleCount() {
    return await this.articles.count();
  }

  async getVisibleArticleCount() {
    const articles = await this.articles.all();
    let visibleCount = 0;
    for (const article of articles) {
      if (await article.isVisible()) {
        visibleCount++;
      }
    }
    return visibleCount;
  }

  async waitForArticles() {
    await this.articles.first().waitFor({ state: 'visible', timeout: 10000 });
  }

  async waitForLoadingToDisappear() {
    await this.loadingAnimation.waitFor({ state: 'hidden', timeout: 30000 });
  }

  async isLoadingVisible() {
    return await this.loadingAnimation.isVisible();
  }

  async getCurrentDate() {
    const dateText = await this.newspaperDate.textContent();
    return dateText?.trim() || '';
  }

  async getSummaryText() {
    return await this.summary.textContent();
  }

  async getErrorMessage() {
    return await this.errorMessage.textContent();
  }
}
