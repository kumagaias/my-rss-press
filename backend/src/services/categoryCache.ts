import {
  getCategoriesByLocale,
  getFeedsByCategory,
} from '../repositories/categoryRepository.js';
import { Category, Feed } from '../types/category.js';

/**
 * Cache entry with data, timestamp, and TTL
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

/**
 * Category cache for in-memory caching with background refresh
 */
export class CategoryCache {
  private categoriesCache: Map<string, CacheEntry<Category[]>>;
  private feedsCache: Map<string, CacheEntry<Feed[]>>;
  private readonly TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
  private refreshInProgress: Set<string>;

  constructor() {
    this.categoriesCache = new Map();
    this.feedsCache = new Map();
    this.refreshInProgress = new Set();
  }

  /**
   * Get categories by locale with caching
   * @param locale - Locale ('en' or 'ja')
   * @returns Array of categories
   */
  async getCategories(locale: 'en' | 'ja'): Promise<Category[]> {
    const cacheKey = `categories:${locale}`;
    const cached = this.categoriesCache.get(cacheKey);

    // Cache hit - return immediately if not expired
    if (cached && !this.isExpired(cached)) {
      return cached.data;
    }

    // Cache expired - return stale data and refresh in background
    if (cached && this.isExpired(cached)) {
      console.log(`Cache expired for ${cacheKey}, returning stale data and refreshing in background`);
      this.backgroundRefresh(cacheKey, async () => {
        const categories = await getCategoriesByLocale(locale as 'en' | 'ja');
        this.categoriesCache.set(cacheKey, {
          data: categories,
          timestamp: Date.now(),
          ttl: this.TTL,
        });
        return categories;
      });
      return cached.data;
    }

    // Cache miss - fetch from DynamoDB
    try {
      const categories = await getCategoriesByLocale(locale as 'en' | 'ja');
      this.categoriesCache.set(cacheKey, {
        data: categories,
        timestamp: Date.now(),
        ttl: this.TTL,
      });
      return categories;
    } catch (error) {
      console.error(`Error fetching categories for ${locale}:`, error);
      // If we have stale cache, return it
      if (cached) {
        console.log(`Returning stale cache for ${cacheKey} due to error`);
        return cached.data;
      }
      throw error;
    }
  }

  /**
   * Get feeds by category with caching
   * @param categoryId - Category ID
   * @returns Array of feeds
   */
  async getFeeds(categoryId: string): Promise<Feed[]> {
    const cacheKey = `feeds:${categoryId}`;
    const cached = this.feedsCache.get(cacheKey);

    // Cache hit - return immediately if not expired
    if (cached && !this.isExpired(cached)) {
      return cached.data;
    }

    // Cache expired - return stale data and refresh in background
    if (cached && this.isExpired(cached)) {
      console.log(`Cache expired for ${cacheKey}, returning stale data and refreshing in background`);
      this.backgroundRefresh(cacheKey, async () => {
        const feeds = await getFeedsByCategory(categoryId);
        this.feedsCache.set(cacheKey, {
          data: feeds,
          timestamp: Date.now(),
          ttl: this.TTL,
        });
        return feeds;
      });
      return cached.data;
    }

    // Cache miss - fetch from DynamoDB
    try {
      const feeds = await getFeedsByCategory(categoryId);
      this.feedsCache.set(cacheKey, {
        data: feeds,
        timestamp: Date.now(),
        ttl: this.TTL,
      });
      return feeds;
    } catch (error) {
      console.error(`Error fetching feeds for ${categoryId}:`, error);
      // If we have stale cache, return it
      if (cached) {
        console.log(`Returning stale cache for ${cacheKey} due to error`);
        return cached.data;
      }
      throw error;
    }
  }

  /**
   * Invalidate cache for a specific key
   * @param key - Cache key to invalidate
   */
  invalidate(key: string): void {
    if (key.startsWith('categories:')) {
      this.categoriesCache.delete(key);
    } else if (key.startsWith('feeds:')) {
      this.feedsCache.delete(key);
    }
    console.log(`Invalidated cache for ${key}`);
  }

  /**
   * Clear all caches
   */
  clear(): void {
    this.categoriesCache.clear();
    this.feedsCache.clear();
    console.log('Cleared all caches');
  }

  /**
   * Check if cache entry is expired
   * @param entry - Cache entry
   * @returns True if expired
   */
  private isExpired<T>(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  /**
   * Refresh cache in background (non-blocking)
   * @param key - Cache key
   * @param refreshFn - Function to refresh the cache
   */
  private backgroundRefresh<T>(key: string, refreshFn: () => Promise<T>): void {
    // Prevent multiple concurrent refreshes for the same key
    if (this.refreshInProgress.has(key)) {
      return;
    }

    this.refreshInProgress.add(key);

    // Run refresh asynchronously without blocking
    refreshFn()
      .then(() => {
        console.log(`Background refresh completed for ${key}`);
      })
      .catch((error) => {
        console.error(`Background refresh failed for ${key}:`, error);
      })
      .finally(() => {
        this.refreshInProgress.delete(key);
      });
  }

  /**
   * Pre-load categories for all locales into cache
   */
  async preload(): Promise<void> {
    console.log('Pre-loading categories into cache...');
    try {
      await Promise.all([
        this.getCategories('en'),
        this.getCategories('ja'),
      ]);
      console.log('Categories pre-loaded successfully');
    } catch (error) {
      console.error('Error pre-loading categories:', error);
      // Don't throw - allow system to start even if pre-load fails
    }
  }
}

// Singleton instance
export const categoryCache = new CategoryCache();

/**
 * Explicit initializer to pre-load the category cache.
 * Call this from application startup code if pre-loading is desired.
 */
export async function preloadCategoryCache(): Promise<void> {
  try {
    await categoryCache.preload();
  } catch (error) {
    console.error('Failed to pre-load category cache:', error);
  }
}
