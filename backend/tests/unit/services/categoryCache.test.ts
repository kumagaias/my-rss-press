import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as categoryRepository from '../../../src/repositories/categoryRepository.js';
import { Category, Feed } from '../../../src/types/category.js';
import type { CategoryCache } from '../../../src/services/categoryCache.js';

// Mock the repository
vi.mock('../../../src/repositories/categoryRepository.js');

describe('Category Cache', () => {
  let categoryCache: CategoryCache;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Reset modules to get a fresh cache instance
    vi.resetModules();
    
    // Re-import to get fresh instance
    const cacheModule = await import('../../../src/services/categoryCache.js');
    categoryCache = cacheModule.categoryCache;
    
    // Clear the cache and reset call counts
    categoryCache.clear();
    vi.clearAllMocks(); // Clear again after preload
  });

  afterEach(() => {
    if (categoryCache) {
      categoryCache.clear();
    }
    vi.restoreAllMocks();
  });

  describe('getCategories', () => {
    const mockCategories: Category[] = [
      {
        categoryId: 'technology',
        locale: 'en',
        displayName: 'Technology',
        keywords: ['tech'],
        order: 1,
        isActive: true,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      },
    ];

    it('should fetch and cache categories on first call', async () => {
      vi.mocked(categoryRepository.getCategoriesByLocale).mockResolvedValue(mockCategories);

      const result = await categoryCache.getCategories('en');

      expect(result).toEqual(mockCategories);
      expect(categoryRepository.getCategoriesByLocale).toHaveBeenCalledWith('en');
      expect(categoryRepository.getCategoriesByLocale).toHaveBeenCalledTimes(1);
    });

    it('should return cached data on subsequent calls', async () => {
      vi.mocked(categoryRepository.getCategoriesByLocale).mockResolvedValue(mockCategories);

      // First call
      await categoryCache.getCategories('en');
      
      // Second call (should use cache)
      const result = await categoryCache.getCategories('en');

      expect(result).toEqual(mockCategories);
      expect(categoryRepository.getCategoriesByLocale).toHaveBeenCalledTimes(1); // Only called once
    });

    it('should return stale cache and refresh in background when expired', async () => {
      vi.mocked(categoryRepository.getCategoriesByLocale).mockResolvedValue(mockCategories);

      // First call to populate cache
      await categoryCache.getCategories('en');

      // Mock time passing (6 minutes = expired)
      vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 6 * 60 * 1000);

      // Second call (cache expired)
      const result = await categoryCache.getCategories('en');

      // Should return stale data immediately
      expect(result).toEqual(mockCategories);
      
      // Wait for background refresh to complete
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Repository should be called twice (initial + background refresh)
      expect(categoryRepository.getCategoriesByLocale).toHaveBeenCalledTimes(2);
    });

    it('should return stale cache on DynamoDB error', async () => {
      vi.mocked(categoryRepository.getCategoriesByLocale)
        .mockResolvedValueOnce(mockCategories)
        .mockRejectedValueOnce(new Error('DynamoDB error'));

      // First call to populate cache
      await categoryCache.getCategories('en');

      // Clear cache to force refetch
      categoryCache.clear();

      // Mock that we still have stale data (simulate expired cache)
      // Note: Accessing private property for testing purposes
      const cacheKey = 'categories:en';
      // @ts-expect-error - Accessing private property for testing
      categoryCache.categoriesCache.set(cacheKey, {
        data: mockCategories,
        timestamp: Date.now() - 10 * 60 * 1000, // 10 minutes ago (expired)
        ttl: 5 * 60 * 1000,
      });

      // Second call (should return stale cache on error)
      const result = await categoryCache.getCategories('en');

      expect(result).toEqual(mockCategories);
    });

    it('should throw error when no cache available and DynamoDB fails', async () => {
      vi.mocked(categoryRepository.getCategoriesByLocale).mockRejectedValue(new Error('DynamoDB error'));

      await expect(categoryCache.getCategories('en')).rejects.toThrow('DynamoDB error');
    });
  });

  describe('getFeeds', () => {
    const mockFeeds: Feed[] = [
      {
        categoryId: 'technology',
        url: 'https://example.com/feed',
        title: 'Example Feed',
        description: 'Description',
        language: 'en',
        priority: 1,
        isActive: true,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      },
    ];

    it('should fetch and cache feeds on first call', async () => {
      vi.mocked(categoryRepository.getFeedsByCategory).mockResolvedValue(mockFeeds);

      const result = await categoryCache.getFeeds('technology');

      expect(result).toEqual(mockFeeds);
      expect(categoryRepository.getFeedsByCategory).toHaveBeenCalledWith('technology');
      expect(categoryRepository.getFeedsByCategory).toHaveBeenCalledTimes(1);
    });

    it('should return cached data on subsequent calls', async () => {
      vi.mocked(categoryRepository.getFeedsByCategory).mockResolvedValue(mockFeeds);

      // First call
      await categoryCache.getFeeds('technology');
      
      // Second call (should use cache)
      const result = await categoryCache.getFeeds('technology');

      expect(result).toEqual(mockFeeds);
      expect(categoryRepository.getFeedsByCategory).toHaveBeenCalledTimes(1); // Only called once
    });
  });

  describe('invalidate', () => {
    it('should invalidate categories cache', async () => {
      const mockCategories: Category[] = [
        {
          categoryId: 'technology',
          locale: 'en',
          displayName: 'Technology',
          keywords: ['tech'],
          order: 1,
          isActive: true,
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
      ];

      vi.mocked(categoryRepository.getCategoriesByLocale).mockResolvedValue(mockCategories);

      // Populate cache
      await categoryCache.getCategories('en');
      expect(categoryRepository.getCategoriesByLocale).toHaveBeenCalledTimes(1);

      // Invalidate
      categoryCache.invalidate('categories:en');

      // Next call should fetch from repository again
      await categoryCache.getCategories('en');
      expect(categoryRepository.getCategoriesByLocale).toHaveBeenCalledTimes(2);
    });

    it('should invalidate feeds cache', async () => {
      const mockFeeds: Feed[] = [
        {
          categoryId: 'technology',
          url: 'https://example.com/feed',
          title: 'Example Feed',
          description: 'Description',
          language: 'en',
          priority: 1,
          isActive: true,
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
      ];

      vi.mocked(categoryRepository.getFeedsByCategory).mockResolvedValue(mockFeeds);

      // Populate cache
      await categoryCache.getFeeds('technology');
      expect(categoryRepository.getFeedsByCategory).toHaveBeenCalledTimes(1);

      // Invalidate
      categoryCache.invalidate('feeds:technology');

      // Next call should fetch from repository again
      await categoryCache.getFeeds('technology');
      expect(categoryRepository.getFeedsByCategory).toHaveBeenCalledTimes(2);
    });
  });

  describe('clear', () => {
    it('should clear all caches', async () => {
      const mockCategories: Category[] = [
        {
          categoryId: 'technology',
          locale: 'en',
          displayName: 'Technology',
          keywords: ['tech'],
          order: 1,
          isActive: true,
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
      ];

      const mockFeeds: Feed[] = [
        {
          categoryId: 'technology',
          url: 'https://example.com/feed',
          title: 'Example Feed',
          description: 'Description',
          language: 'en',
          priority: 1,
          isActive: true,
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
      ];

      vi.mocked(categoryRepository.getCategoriesByLocale).mockResolvedValue(mockCategories);
      vi.mocked(categoryRepository.getFeedsByCategory).mockResolvedValue(mockFeeds);

      // Populate caches
      await categoryCache.getCategories('en');
      await categoryCache.getFeeds('technology');

      // Clear
      categoryCache.clear();

      // Next calls should fetch from repository again
      await categoryCache.getCategories('en');
      await categoryCache.getFeeds('technology');

      expect(categoryRepository.getCategoriesByLocale).toHaveBeenCalledTimes(2);
      expect(categoryRepository.getFeedsByCategory).toHaveBeenCalledTimes(2);
    });
  });
});
