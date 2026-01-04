import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  recordFeedUsage,
  getPopularFeeds,
  getFeedStats,
  clearCache,
} from '../../../src/services/feedUsageService.js';
import * as feedUsageRepository from '../../../src/repositories/feedUsageRepository.js';

// Mock the repository
vi.mock('../../../src/repositories/feedUsageRepository.js');

describe('Feed Usage Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearCache(); // Clear cache before each test
  });

  afterEach(() => {
    clearCache(); // Clean up after each test
  });

  describe('recordFeedUsage', () => {
    it('should record feed usage successfully', async () => {
      const mockFeedUsage = {
        url: 'https://example.com/feed',
        categoryId: 'technology',
        title: 'Tech Feed',
        usageCount: 1,
        successRate: 100,
        averageArticles: 10,
        lastUsedAt: '2026-01-04T00:00:00.000Z',
        createdAt: '2026-01-04T00:00:00.000Z',
        updatedAt: '2026-01-04T00:00:00.000Z',
      };

      vi.mocked(feedUsageRepository.recordFeedUsage).mockResolvedValue(mockFeedUsage);

      const result = await recordFeedUsage({
        url: 'https://example.com/feed',
        categoryId: 'technology',
        title: 'Tech Feed',
        articleCount: 10,
        success: true,
      });

      expect(result).toEqual(mockFeedUsage);
      expect(feedUsageRepository.recordFeedUsage).toHaveBeenCalledWith({
        url: 'https://example.com/feed',
        categoryId: 'technology',
        title: 'Tech Feed',
        articleCount: 10,
        success: true,
      });
    });

    it('should return null on error (graceful degradation)', async () => {
      vi.mocked(feedUsageRepository.recordFeedUsage).mockRejectedValue(
        new Error('DynamoDB error')
      );

      const result = await recordFeedUsage({
        url: 'https://example.com/feed',
        categoryId: 'technology',
        title: 'Tech Feed',
        articleCount: 10,
        success: true,
      });

      expect(result).toBeNull();
    });

    it('should invalidate cache after successful recording', async () => {
      const mockFeedUsage = {
        url: 'https://example.com/feed',
        categoryId: 'technology',
        title: 'Tech Feed',
        usageCount: 1,
        successRate: 100,
        averageArticles: 10,
        lastUsedAt: '2026-01-04T00:00:00.000Z',
        createdAt: '2026-01-04T00:00:00.000Z',
        updatedAt: '2026-01-04T00:00:00.000Z',
      };

      vi.mocked(feedUsageRepository.recordFeedUsage).mockResolvedValue(mockFeedUsage);
      vi.mocked(feedUsageRepository.getPopularFeedsByCategory).mockResolvedValue([mockFeedUsage]);

      // First call - populate cache
      await getPopularFeeds('technology', 5);
      expect(feedUsageRepository.getPopularFeedsByCategory).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      await getPopularFeeds('technology', 5);
      expect(feedUsageRepository.getPopularFeedsByCategory).toHaveBeenCalledTimes(1);

      // Record usage - should invalidate cache
      await recordFeedUsage({
        url: 'https://example.com/feed',
        categoryId: 'technology',
        title: 'Tech Feed',
        articleCount: 10,
        success: true,
      });

      // Third call - cache invalidated, should fetch again
      await getPopularFeeds('technology', 5);
      expect(feedUsageRepository.getPopularFeedsByCategory).toHaveBeenCalledTimes(2);
    });
  });

  describe('getPopularFeeds', () => {
    it('should return popular feeds from repository', async () => {
      const mockFeeds = [
        {
          url: 'https://feed1.com/rss',
          categoryId: 'technology',
          title: 'Feed 1',
          usageCount: 20,
          successRate: 95,
          averageArticles: 12,
          lastUsedAt: '2026-01-04T00:00:00.000Z',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-04T00:00:00.000Z',
        },
        {
          url: 'https://feed2.com/rss',
          categoryId: 'technology',
          title: 'Feed 2',
          usageCount: 15,
          successRate: 90,
          averageArticles: 10,
          lastUsedAt: '2026-01-03T00:00:00.000Z',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-03T00:00:00.000Z',
        },
      ];

      vi.mocked(feedUsageRepository.getPopularFeedsByCategory).mockResolvedValue(mockFeeds);

      const result = await getPopularFeeds('technology', 5);

      expect(result).toEqual(mockFeeds);
      expect(feedUsageRepository.getPopularFeedsByCategory).toHaveBeenCalledWith('technology', 5);
    });

    it('should cache results for 5 minutes', async () => {
      const mockFeeds = [
        {
          url: 'https://feed1.com/rss',
          categoryId: 'technology',
          title: 'Feed 1',
          usageCount: 20,
          successRate: 95,
          averageArticles: 12,
          lastUsedAt: '2026-01-04T00:00:00.000Z',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-04T00:00:00.000Z',
        },
      ];

      vi.mocked(feedUsageRepository.getPopularFeedsByCategory).mockResolvedValue(mockFeeds);

      // First call - should fetch from repository
      const result1 = await getPopularFeeds('technology', 5);
      expect(result1).toEqual(mockFeeds);
      expect(feedUsageRepository.getPopularFeedsByCategory).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      const result2 = await getPopularFeeds('technology', 5);
      expect(result2).toEqual(mockFeeds);
      expect(feedUsageRepository.getPopularFeedsByCategory).toHaveBeenCalledTimes(1);

      // Third call - should still use cache
      const result3 = await getPopularFeeds('technology', 5);
      expect(result3).toEqual(mockFeeds);
      expect(feedUsageRepository.getPopularFeedsByCategory).toHaveBeenCalledTimes(1);
    });

    it('should respect limit parameter', async () => {
      const mockFeeds = [
        {
          url: 'https://feed1.com/rss',
          categoryId: 'technology',
          title: 'Feed 1',
          usageCount: 20,
          successRate: 95,
          averageArticles: 12,
          lastUsedAt: '2026-01-04T00:00:00.000Z',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-04T00:00:00.000Z',
        },
        {
          url: 'https://feed2.com/rss',
          categoryId: 'technology',
          title: 'Feed 2',
          usageCount: 15,
          successRate: 90,
          averageArticles: 10,
          lastUsedAt: '2026-01-03T00:00:00.000Z',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-03T00:00:00.000Z',
        },
      ];

      vi.mocked(feedUsageRepository.getPopularFeedsByCategory).mockResolvedValue(mockFeeds);

      const result = await getPopularFeeds('technology', 2);

      // Service returns all feeds from repository, then slices based on limit
      expect(result).toHaveLength(2);
      expect(result[0].url).toBe('https://feed1.com/rss');
      expect(result[1].url).toBe('https://feed2.com/rss');
      expect(feedUsageRepository.getPopularFeedsByCategory).toHaveBeenCalledWith('technology', 2);
    });

    it('should return empty array on error (graceful degradation)', async () => {
      vi.mocked(feedUsageRepository.getPopularFeedsByCategory).mockRejectedValue(
        new Error('DynamoDB error')
      );

      const result = await getPopularFeeds('technology', 5);

      expect(result).toEqual([]);
    });
  });

  describe('getFeedStats', () => {
    it('should return feed statistics', async () => {
      const mockFeedUsage = {
        url: 'https://example.com/feed',
        categoryId: 'technology',
        title: 'Tech Feed',
        usageCount: 10,
        successRate: 90,
        averageArticles: 12,
        lastUsedAt: '2026-01-04T00:00:00.000Z',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-04T00:00:00.000Z',
      };

      vi.mocked(feedUsageRepository.getFeedUsage).mockResolvedValue(mockFeedUsage);

      const result = await getFeedStats('https://example.com/feed', 'technology');

      expect(result).toEqual(mockFeedUsage);
      expect(feedUsageRepository.getFeedUsage).toHaveBeenCalledWith(
        'https://example.com/feed',
        'technology'
      );
    });

    it('should return null when feed not found', async () => {
      vi.mocked(feedUsageRepository.getFeedUsage).mockResolvedValue(null);

      const result = await getFeedStats('https://nonexistent.com/feed', 'technology');

      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      vi.mocked(feedUsageRepository.getFeedUsage).mockRejectedValue(
        new Error('DynamoDB error')
      );

      const result = await getFeedStats('https://example.com/feed', 'technology');

      expect(result).toBeNull();
    });
  });

  describe('clearCache', () => {
    it('should clear cache for specific category', async () => {
      const mockFeeds = [
        {
          url: 'https://feed1.com/rss',
          categoryId: 'technology',
          title: 'Feed 1',
          usageCount: 20,
          successRate: 95,
          averageArticles: 12,
          lastUsedAt: '2026-01-04T00:00:00.000Z',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-04T00:00:00.000Z',
        },
      ];

      vi.mocked(feedUsageRepository.getPopularFeedsByCategory).mockResolvedValue(mockFeeds);

      // Populate cache
      await getPopularFeeds('technology', 5);
      expect(feedUsageRepository.getPopularFeedsByCategory).toHaveBeenCalledTimes(1);

      // Use cache
      await getPopularFeeds('technology', 5);
      expect(feedUsageRepository.getPopularFeedsByCategory).toHaveBeenCalledTimes(1);

      // Clear cache for specific category
      clearCache('technology');

      // Should fetch again
      await getPopularFeeds('technology', 5);
      expect(feedUsageRepository.getPopularFeedsByCategory).toHaveBeenCalledTimes(2);
    });

    it('should clear all caches when no category specified', async () => {
      const mockFeeds = [
        {
          url: 'https://feed1.com/rss',
          categoryId: 'technology',
          title: 'Feed 1',
          usageCount: 20,
          successRate: 95,
          averageArticles: 12,
          lastUsedAt: '2026-01-04T00:00:00.000Z',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-04T00:00:00.000Z',
        },
      ];

      vi.mocked(feedUsageRepository.getPopularFeedsByCategory).mockResolvedValue(mockFeeds);

      // Populate caches for multiple categories
      await getPopularFeeds('technology', 5);
      await getPopularFeeds('sports', 5);
      expect(feedUsageRepository.getPopularFeedsByCategory).toHaveBeenCalledTimes(2);

      // Use caches
      await getPopularFeeds('technology', 5);
      await getPopularFeeds('sports', 5);
      expect(feedUsageRepository.getPopularFeedsByCategory).toHaveBeenCalledTimes(2);

      // Clear all caches
      clearCache();

      // Should fetch again for both
      await getPopularFeeds('technology', 5);
      await getPopularFeeds('sports', 5);
      expect(feedUsageRepository.getPopularFeedsByCategory).toHaveBeenCalledTimes(4);
    });
  });
});
