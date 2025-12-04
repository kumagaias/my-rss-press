import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for the Newspaper Page
 * Represents the generated newspaper with articles in newspaper layout
 */
export class NewspaperPage {
  readonly page: Page;
  readonly newspaperTitle: Locator;
  readonly newspaperDate: Locator;
  readonly userName: Locator;
  readonly articles: Locator;
  readonly leadArticle: Locator;
  readonly topStories: Locator;
  readonly remainingArticles: Locator;
  readonly saveButton: Locator;
  readonly backToHomeButton: Locator;
  readonly settingsModal: Locator;
  readonly newspaperNameInput: Locator;
  readonly userNameInput: Locator;
  readonly isPublicCheckbox: Locator;
  readonly saveSettingsButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.newspaperTitle = page.getByRole('heading', { level: 1 });
    this.newspaperDate = page.getByTestId('newspaper-date');
    this.userName = page.getByTestId('user-name');
    this.articles = page.locator('article');
    this.leadArticle = page.getByTestId('lead-article');
    this.topStories = page.getByTestId('top-stories');
    this.remainingArticles = page.getByTestId('remaining-articles');
    this.saveButton = page.getByRole('button', { name: /保存|Save/i });
    this.backToHomeButton = page.getByRole('button', { name: /ホームに戻る|Back to Home/i });
    this.settingsModal = page.getByRole('dialog');
    this.newspaperNameInput = page.getByLabel(/新聞名|Newspaper Name/i);
    this.userNameInput = page.getByLabel(/ユーザー名|User Name/i);
    this.isPublicCheckbox = page.getByLabel(/公開|Public/i);
    this.saveSettingsButton = page.getByRole('button', { name: /設定を保存|Save Settings/i });
  }

  async clickSave() {
    await this.saveButton.click();
  }

  async fillSettings(newspaperName: string, userName: string, isPublic: boolean = true) {
    await this.newspaperNameInput.fill(newspaperName);
    await this.userNameInput.fill(userName);
    
    if (isPublic) {
      await this.isPublicCheckbox.check();
    } else {
      await this.isPublicCheckbox.uncheck();
    }
  }

  async saveSettings() {
    await this.saveSettingsButton.click();
  }

  async clickBackToHome() {
    await this.backToHomeButton.click();
  }

  async getArticleCount() {
    return await this.articles.count();
  }

  async getTopStoriesCount() {
    return await this.topStories.locator('article').count();
  }

  async getRemainingArticlesCount() {
    return await this.remainingArticles.locator('article').count();
  }
}
