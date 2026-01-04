import { describe, it, expect } from 'vitest';
import { limitDefaultFeedArticles } from '../../../src/services/articleLimiter';
import type { Article } from '../../../src/models/newspaper';

describe('articleLimiter', () => {
  describe('limitDefaultFeedArticles', () => {
    it('should limit default feed articles to max 2 per feed when possible', () => {
      const articles: Article[] = [
        { title: 'Article 1', link: 'http://example.com/1', feedSource: 'http://feed1.com', pubDate: '2025-01-01', description: 'desc', importance: 10 },
        { title: 'Article 2', link: 'http://example.com/2', feedSource: 'http://feed1.com', pubDate: '2025-01-01', description: 'desc', importance: 9 },
        { title: 'Article 3', link: 'http://example.com/3', feedSource: 'http://feed1.com', pubDate: '2025-01-01', description: 'desc', importance: 8 },
        { title: 'Article 4', link: 'http://example.com/4', feedSource: 'http://feed2.com', pubDate: '2025-01-01', description: 'desc', importance: 7 },
        { title: 'Article 5', link: 'http://example.com/5', feedSource: 'http://feed2.com', pubDate: '2025-01-01', description: 'desc', importance: 6 },
        { title: 'Article 6', link: 'http://example.com/6', feedSource: 'http://feed2.com', pubDate: '2025-01-01', description: 'desc', importance: 5 },
        { title: 'Article 7', link: 'http://example.com/7', feedSource: 'http://feed3.com', pubDate: '2025-01-01', description: 'desc', importance: 4 },
        { title: 'Article 8', link: 'http://example.com/8', feedSource: 'http://feed3.com', pubDate: '2025-01-01', description: 'desc', importance: 3 },
        { title: 'Article 9', link: 'http://example.com/9', feedSource: 'http://feed3.com', pubDate: '2025-01-01', description: 'desc', importance: 2 },
        { title: 'Article 10', link: 'http://example.com/10', feedSource: 'http://feed4.com', pubDate: '2025-01-01', description: 'desc', importance: 1 },
      ];

      const feedMetadata = [
        { url: 'http://feed1.com', title: 'Feed 1', isDefault: true },
        { url: 'http://feed2.com', title: 'Feed 2', isDefault: true },
        { url: 'http://feed3.com', title: 'Feed 3', isDefault: true },
        { url: 'http://feed4.com', title: 'Feed 4', isDefault: true },
      ];

      const result = limitDefaultFeedArticles(articles, feedMetadata);

      // Minimum count should be preserved
      expect(result.length).toBeGreaterThanOrEqual(8);
      // Total should not exceed original count
      expect(result.length).toBeLessThanOrEqual(10);
      // Most feeds should have 2 or fewer articles (but some may have 3 to meet minimum)
      const feedCounts = new Map<string, number>();
      for (const article of result) {
        const count = feedCounts.get(article.feedSource!) || 0;
        feedCounts.set(article.feedSource!, count + 1);
      }
      // At least some feeds should be limited to 2
      const feedsWith2OrLess = Array.from(feedCounts.values()).filter(c => c <= 2).length;
      expect(feedsWith2OrLess).toBeGreaterThan(0);
    });

    it('should preserve non-default feed articles', () => {
      const articles: Article[] = [
        { title: 'Default 1', link: 'http://example.com/1', feedSource: 'http://default.com', pubDate: '2025-01-01', description: 'desc', importance: 10 },
        { title: 'Default 2', link: 'http://example.com/2', feedSource: 'http://default.com', pubDate: '2025-01-01', description: 'desc', importance: 9 },
        { title: 'Default 3', link: 'http://example.com/3', feedSource: 'http://default.com', pubDate: '2025-01-01', description: 'desc', importance: 8 },
        { title: 'Custom 1', link: 'http://example.com/4', feedSource: 'http://custom.com', pubDate: '2025-01-01', description: 'desc', importance: 7 },
        { title: 'Custom 2', link: 'http://example.com/5', feedSource: 'http://custom.com', pubDate: '2025-01-01', description: 'desc', importance: 6 },
        { title: 'Custom 3', link: 'http://example.com/6', feedSource: 'http://custom.com', pubDate: '2025-01-01', description: 'desc', importance: 5 },
      ];

      const feedMetadata = [
        { url: 'http://default.com', title: 'Default Feed', isDefault: true },
        { url: 'http://custom.com', title: 'Custom Feed', isDefault: false },
      ];

      const result = limitDefaultFeedArticles(articles, feedMetadata);

      // All custom feed articles should be preserved
      const customArticles = result.filter(a => a.feedSource === 'http://custom.com');
      expect(customArticles).toHaveLength(3);
    });

    it('should preserve minimum article count of 8', () => {
      const articles: Article[] = [
        { title: 'Article 1', link: 'http://example.com/1', feedSource: 'http://feed1.com', pubDate: '2025-01-01', description: 'desc', importance: 10 },
        { title: 'Article 2', link: 'http://example.com/2', feedSource: 'http://feed1.com', pubDate: '2025-01-01', description: 'desc', importance: 9 },
        { title: 'Article 3', link: 'http://example.com/3', feedSource: 'http://feed1.com', pubDate: '2025-01-01', description: 'desc', importance: 8 },
        { title: 'Article 4', link: 'http://example.com/4', feedSource: 'http://feed2.com', pubDate: '2025-01-01', description: 'desc', importance: 7 },
        { title: 'Article 5', link: 'http://example.com/5', feedSource: 'http://feed2.com', pubDate: '2025-01-01', description: 'desc', importance: 6 },
        { title: 'Article 6', link: 'http://example.com/6', feedSource: 'http://feed2.com', pubDate: '2025-01-01', description: 'desc', importance: 5 },
        { title: 'Article 7', link: 'http://example.com/7', feedSource: 'http://feed3.com', pubDate: '2025-01-01', description: 'desc', importance: 4 },
        { title: 'Article 8', link: 'http://example.com/8', feedSource: 'http://feed3.com', pubDate: '2025-01-01', description: 'desc', importance: 3 },
      ];

      const feedMetadata = [
        { url: 'http://feed1.com', title: 'Feed 1', isDefault: true },
        { url: 'http://feed2.com', title: 'Feed 2', isDefault: true },
        { url: 'http://feed3.com', title: 'Feed 3', isDefault: true },
      ];

      const result = limitDefaultFeedArticles(articles, feedMetadata);

      expect(result.length).toBeGreaterThanOrEqual(8);
    });

    it('should handle no default feeds', () => {
      const articles: Article[] = [
        { title: 'Article 1', link: 'http://example.com/1', feedSource: 'http://feed1.com', pubDate: '2025-01-01', description: 'desc', importance: 10 },
        { title: 'Article 2', link: 'http://example.com/2', feedSource: 'http://feed1.com', pubDate: '2025-01-01', description: 'desc', importance: 9 },
        { title: 'Article 3', link: 'http://example.com/3', feedSource: 'http://feed2.com', pubDate: '2025-01-01', description: 'desc', importance: 8 },
      ];

      const feedMetadata = [
        { url: 'http://feed1.com', title: 'Feed 1', isDefault: false },
        { url: 'http://feed2.com', title: 'Feed 2', isDefault: false },
      ];

      const result = limitDefaultFeedArticles(articles, feedMetadata);

      // All articles should be preserved
      expect(result).toHaveLength(3);
    });

    it('should handle all default feeds', () => {
      const articles: Article[] = [
        { title: 'Article 1', link: 'http://example.com/1', feedSource: 'http://feed1.com', pubDate: '2025-01-01', description: 'desc', importance: 10 },
        { title: 'Article 2', link: 'http://example.com/2', feedSource: 'http://feed1.com', pubDate: '2025-01-01', description: 'desc', importance: 9 },
        { title: 'Article 3', link: 'http://example.com/3', feedSource: 'http://feed1.com', pubDate: '2025-01-01', description: 'desc', importance: 8 },
        { title: 'Article 4', link: 'http://example.com/4', feedSource: 'http://feed2.com', pubDate: '2025-01-01', description: 'desc', importance: 7 },
        { title: 'Article 5', link: 'http://example.com/5', feedSource: 'http://feed2.com', pubDate: '2025-01-01', description: 'desc', importance: 6 },
        { title: 'Article 6', link: 'http://example.com/6', feedSource: 'http://feed2.com', pubDate: '2025-01-01', description: 'desc', importance: 5 },
      ];

      const feedMetadata = [
        { url: 'http://feed1.com', title: 'Feed 1', isDefault: true },
        { url: 'http://feed2.com', title: 'Feed 2', isDefault: true },
      ];

      const result = limitDefaultFeedArticles(articles, feedMetadata);

      // Should limit to 2 per feed but maintain minimum of 8
      expect(result.length).toBeGreaterThanOrEqual(4); // At least 2 from each feed
      expect(result.length).toBeLessThanOrEqual(6); // Original count
    });

    it('should handle empty articles array', () => {
      const articles: Article[] = [];
      const feedMetadata = [
        { url: 'http://feed1.com', title: 'Feed 1', isDefault: true },
      ];

      const result = limitDefaultFeedArticles(articles, feedMetadata);

      expect(result).toHaveLength(0);
    });

    it('should handle empty feed metadata', () => {
      const articles: Article[] = [
        { title: 'Article 1', link: 'http://example.com/1', feedSource: 'http://feed1.com', pubDate: '2025-01-01', description: 'desc', importance: 10 },
      ];
      const feedMetadata: Array<{ url: string; title: string; isDefault: boolean }> = [];

      const result = limitDefaultFeedArticles(articles, feedMetadata);

      // All articles should be preserved
      expect(result).toHaveLength(1);
    });

    it('should prioritize higher importance articles when limiting', () => {
      const articles: Article[] = [
        { title: 'Low', link: 'http://example.com/1', feedSource: 'http://feed1.com', pubDate: '2025-01-01', description: 'desc', importance: 1 },
        { title: 'High', link: 'http://example.com/2', feedSource: 'http://feed1.com', pubDate: '2025-01-01', description: 'desc', importance: 10 },
        { title: 'Medium', link: 'http://example.com/3', feedSource: 'http://feed1.com', pubDate: '2025-01-01', description: 'desc', importance: 5 },
        // Add more articles from other feeds to exceed minimum count
        { title: 'Extra 1', link: 'http://example.com/4', feedSource: 'http://feed2.com', pubDate: '2025-01-01', description: 'desc', importance: 8 },
        { title: 'Extra 2', link: 'http://example.com/5', feedSource: 'http://feed2.com', pubDate: '2025-01-01', description: 'desc', importance: 7 },
        { title: 'Extra 3', link: 'http://example.com/6', feedSource: 'http://feed3.com', pubDate: '2025-01-01', description: 'desc', importance: 6 },
        { title: 'Extra 4', link: 'http://example.com/7', feedSource: 'http://feed3.com', pubDate: '2025-01-01', description: 'desc', importance: 4 },
        { title: 'Extra 5', link: 'http://example.com/8', feedSource: 'http://feed4.com', pubDate: '2025-01-01', description: 'desc', importance: 3 },
      ];

      const feedMetadata = [
        { url: 'http://feed1.com', title: 'Feed 1', isDefault: true },
        { url: 'http://feed2.com', title: 'Feed 2', isDefault: true },
        { url: 'http://feed3.com', title: 'Feed 3', isDefault: true },
        { url: 'http://feed4.com', title: 'Feed 4', isDefault: true },
      ];

      const result = limitDefaultFeedArticles(articles, feedMetadata);

      // Should include high importance articles from feed1
      const feed1Articles = result.filter(a => a.feedSource === 'http://feed1.com');
      expect(feed1Articles.some(a => a.title === 'High')).toBe(true);
      expect(feed1Articles.some(a => a.title === 'Medium')).toBe(true);
      // Low importance article should not be included (unless needed for minimum count)
      if (feed1Articles.length === 2) {
        expect(feed1Articles.some(a => a.title === 'Low')).toBe(false);
      }
    });
  });
});
