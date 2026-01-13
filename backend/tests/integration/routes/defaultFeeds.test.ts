/**
 * Integration tests for Default Feeds API
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { app } from '../../../src/app.js';

// Mock the default feed service
vi.mock('../../../src/services/defaultFeedService.js', () => ({
  fetchDefaultFeedArticles: vi.fn(),
  getDefaultFeeds: vi.fn(),
  isDefaultFeed: vi.fn(),
}));

describe('Default Feeds API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/default-feeds', () => {
    it('should return 400 when locale is missing', async () => {
      const res = await app.request('/api/default-feeds');
      
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid query parameters');
    });

    it('should return 400 when locale is invalid', async () => {
      const res = await app.request('/api/default-feeds?locale=invalid');
      
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid query parameters');
    });

    it('should return 400 when date format is invalid', async () => {
      const res = await app.request('/api/default-feeds?locale=en&date=2026-1-1');
      
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid query parameters');
    });

    it('should return 400 when date is in the future', async () => {
      // Get tomorrow in JST
      const nowJST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
      const todayJST = new Date(nowJST);
      todayJST.setHours(0, 0, 0, 0);
      const futureDate = new Date(todayJST);
      futureDate.setDate(todayJST.getDate() + 1);
      
      // Format as YYYY-MM-DD in JST
      const year = futureDate.getFullYear();
      const month = String(futureDate.getMonth() + 1).padStart(2, '0');
      const day = String(futureDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      const res = await app.request(`/api/default-feeds?locale=en&date=${dateStr}`);
      
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Future dates are not allowed');
    });

    it('should return 400 when date is older than 7 days', async () => {
      // Get 8 days ago in JST
      const nowJST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
      const todayJST = new Date(nowJST);
      todayJST.setHours(0, 0, 0, 0);
      const oldDate = new Date(todayJST);
      oldDate.setDate(todayJST.getDate() - 8);
      
      // Format as YYYY-MM-DD in JST
      const year = oldDate.getFullYear();
      const month = String(oldDate.getMonth() + 1).padStart(2, '0');
      const day = String(oldDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      const res = await app.request(`/api/default-feeds?locale=en&date=${dateStr}`);
      
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Dates older than 7 days are not allowed');
    });

    it('should return 200 with articles for valid English locale', async () => {
      const { fetchDefaultFeedArticles } = await import('../../../src/services/defaultFeedService.js');
      
      vi.mocked(fetchDefaultFeedArticles).mockResolvedValue({
        articles: [
          {
            title: 'Test Article',
            description: 'Description',
            link: 'https://example.com/1',
            pubDate: new Date().toISOString(),
            feedSource: 'https://example.com/feed',
            feedTitle: 'Test Feed',
            importance: 0,
          },
        ],
        totalFeeds: 4,
        successfulFeeds: 4,
      });

      const res = await app.request('/api/default-feeds?locale=en');
      
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.articles).toBeInstanceOf(Array);
      expect(body.totalFeeds).toBe(4);
      expect(body.successfulFeeds).toBe(4);
    });

    it('should return 200 with articles for valid Japanese locale', async () => {
      const { fetchDefaultFeedArticles } = await import('../../../src/services/defaultFeedService.js');
      
      vi.mocked(fetchDefaultFeedArticles).mockResolvedValue({
        articles: [
          {
            title: 'テスト記事',
            description: '説明',
            link: 'https://example.jp/1',
            pubDate: new Date().toISOString(),
            feedSource: 'https://example.jp/feed',
            feedTitle: 'テストフィード',
            importance: 0,
          },
        ],
        totalFeeds: 4,
        successfulFeeds: 4,
      });

      const res = await app.request('/api/default-feeds?locale=ja');
      
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.articles).toBeInstanceOf(Array);
      expect(body.totalFeeds).toBe(4);
      expect(body.successfulFeeds).toBe(4);
    });

    it('should return 200 with articles for valid date', async () => {
      const { fetchDefaultFeedArticles } = await import('../../../src/services/defaultFeedService.js');
      
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];

      vi.mocked(fetchDefaultFeedArticles).mockResolvedValue({
        articles: [
          {
            title: 'Test Article',
            description: 'Description',
            link: 'https://example.com/1',
            pubDate: today.toISOString(),
            feedSource: 'https://example.com/feed',
            feedTitle: 'Test Feed',
            importance: 0,
          },
        ],
        totalFeeds: 4,
        successfulFeeds: 4,
      });

      const res = await app.request(`/api/default-feeds?locale=en&date=${dateStr}`);
      
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.articles).toBeInstanceOf(Array);
      expect(fetchDefaultFeedArticles).toHaveBeenCalledWith('en', dateStr);
    });

    it('should return 200 with empty articles when all feeds fail', async () => {
      const { fetchDefaultFeedArticles } = await import('../../../src/services/defaultFeedService.js');
      
      vi.mocked(fetchDefaultFeedArticles).mockResolvedValue({
        articles: [],
        totalFeeds: 4,
        successfulFeeds: 0,
      });

      const res = await app.request('/api/default-feeds?locale=en');
      
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.articles).toEqual([]);
      expect(body.successfulFeeds).toBe(0);
    });

    it('should return 500 when service throws unexpected error', async () => {
      const { fetchDefaultFeedArticles } = await import('../../../src/services/defaultFeedService.js');
      
      vi.mocked(fetchDefaultFeedArticles).mockRejectedValue(new Error('Unexpected error'));

      const res = await app.request('/api/default-feeds?locale=en');
      
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe('Failed to fetch default feed articles');
    });

    it('should handle date at boundary (today)', async () => {
      const { fetchDefaultFeedArticles } = await import('../../../src/services/defaultFeedService.js');
      
      // Get today in JST
      const nowJST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
      
      // Format as YYYY-MM-DD in JST
      const year = nowJST.getFullYear();
      const month = String(nowJST.getMonth() + 1).padStart(2, '0');
      const day = String(nowJST.getDate()).padStart(2, '0');
      const todayStr = `${year}-${month}-${day}`;

      vi.mocked(fetchDefaultFeedArticles).mockResolvedValue({
        articles: [],
        totalFeeds: 4,
        successfulFeeds: 4,
      });

      const res = await app.request(`/api/default-feeds?locale=en&date=${todayStr}`);
      
      expect(res.status).toBe(200);
    });

    it('should handle date at boundary (6 days ago - safely within range)', async () => {
      const { fetchDefaultFeedArticles } = await import('../../../src/services/defaultFeedService.js');
      
      // Get 6 days ago in JST (safely within 7 day range to avoid timezone edge cases)
      const nowJST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
      const todayJST = new Date(nowJST);
      todayJST.setHours(0, 0, 0, 0);
      const sixDaysAgo = new Date(todayJST);
      sixDaysAgo.setDate(todayJST.getDate() - 6);
      
      // Format as YYYY-MM-DD in JST
      const year = sixDaysAgo.getFullYear();
      const month = String(sixDaysAgo.getMonth() + 1).padStart(2, '0');
      const day = String(sixDaysAgo.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      vi.mocked(fetchDefaultFeedArticles).mockResolvedValue({
        articles: [],
        totalFeeds: 4,
        successfulFeeds: 4,
      });

      const res = await app.request(`/api/default-feeds?locale=en&date=${dateStr}`);
      
      expect(res.status).toBe(200);
    });
  });
});
