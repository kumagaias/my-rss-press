import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for the Feed Selector
 * Represents the feed selection interface with AI suggestions and manual input
 */
export class FeedSelectorPage {
  readonly page: Page;
  readonly suggestedFeeds: Locator;
  readonly manualFeedInput: Locator;
  readonly addFeedButton: Locator;
  readonly selectedFeedsList: Locator;

  constructor(page: Page) {
    this.page = page;
    this.suggestedFeeds = page.getByTestId('suggested-feeds');
    this.manualFeedInput = page.getByPlaceholder(/RSSフィードURLを入力|Enter RSS feed URL/i);
    this.addFeedButton = page.getByRole('button', { name: /追加|Add/i });
    this.selectedFeedsList = page.getByTestId('selected-feeds');
  }

  async selectFeed(index: number) {
    await this.suggestedFeeds.locator('input[type="checkbox"]').nth(index).check();
  }

  async unselectFeed(index: number) {
    await this.suggestedFeeds.locator('input[type="checkbox"]').nth(index).uncheck();
  }

  async addManualFeed(url: string) {
    await this.manualFeedInput.fill(url);
    await this.addFeedButton.click();
  }

  async removeFeed(index: number) {
    await this.selectedFeedsList.locator('button[aria-label*="削除"], button[aria-label*="Remove"]').nth(index).click();
  }

  async getSelectedFeedCount() {
    return await this.selectedFeedsList.locator('li').count();
  }

  async getSuggestedFeedCount() {
    return await this.suggestedFeeds.locator('input[type="checkbox"]').count();
  }
}
