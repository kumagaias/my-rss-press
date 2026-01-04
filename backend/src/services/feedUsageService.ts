/**
 * Service layer for feed usage tracking
 * Handles business logic, caching, and error handling
 */

import {
  recordFeedUsage as recordFeedUsageRepo,
  getFeedUsage as getFeedUsageRepo,
  getPopularFeedsByCategory as getPopularFeedsByCategoryRepo,
} from '../repositories/feedUsageRepository.js';
import { FeedUsage, RecordFeedUsageInput } from '../types/category.js';

// Simple in-memory cache for popular feeds
// Note: In Lambda environment, each instance has its own cache.
// This is acceptable as cache misses only result in DynamoDB queries,
// and the 5-minute TTL ensures reasonable freshness.
interface CacheEntry {
  data: FeedUsage[];
  expiry: number;
}

const popularFeedsCache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Record feed usage (with error handling)
 * @param input - Feed usage input
 * @returns Updated feed usage or null if failed
 */
export async function recordFeedUsage(input: RecordFeedUsageInput): Promise<FeedUsage | null> {
  try {
    const result = await recordFeedUsageRepo(input);
    
    // Invalidate cache for this category
    const cacheKey = `popular:${input.categoryId}`;
    popularFeedsCache.delete(cacheKey);
    
    console.log(`[FeedUsage] Recorded: ${input.url} for ${input.categoryId} (${input.articleCount} articles, success: ${input.success})`);
    
    return result;
  } catch (error) {
    console.error('[FeedUsage] Failed to record usage:', error);
    // Don't throw - graceful degradation
    return null;
  }
}

/**
 * Get popular feeds for a category (with caching)
 * @param categoryId - Category ID
 * @param limit - Maximum number of feeds to return
 * @returns Array of popular feeds
 */
export async function getPopularFeeds(
  categoryId: string,
  limit: number = 5
): Promise<FeedUsage[]> {
  const cacheKey = `popular:${categoryId}`;
  
  // Check cache
  const cached = popularFeedsCache.get(cacheKey);
  if (cached && Date.now() < cached.expiry) {
    console.log(`[FeedUsage] Cache hit for popular feeds: ${categoryId}`);
    return cached.data.slice(0, limit);
  }
  
  try {
    // Fetch from repository
    const feeds = await getPopularFeedsByCategoryRepo(categoryId, limit);
    
    // Cache the result
    popularFeedsCache.set(cacheKey, {
      data: feeds,
      expiry: Date.now() + CACHE_TTL,
    });
    
    console.log(`[FeedUsage] Popular feeds for ${categoryId}: ${feeds.length} feeds`);
    
    return feeds;
  } catch (error) {
    console.error('[FeedUsage] Failed to get popular feeds:', error);
    // Return empty array on error - graceful degradation
    return [];
  }
}

/**
 * Get feed statistics
 * @param url - Feed URL
 * @param categoryId - Category ID
 * @returns Feed usage statistics or null
 */
export async function getFeedStats(url: string, categoryId: string): Promise<FeedUsage | null> {
  try {
    return await getFeedUsageRepo(url, categoryId);
  } catch (error) {
    console.error('[FeedUsage] Failed to get feed stats:', error);
    return null;
  }
}

/**
 * Clear cache for a category (useful for testing)
 * @param categoryId - Category ID
 */
export function clearCache(categoryId?: string): void {
  if (categoryId) {
    const cacheKey = `popular:${categoryId}`;
    popularFeedsCache.delete(cacheKey);
    console.log(`[FeedUsage] Cache cleared for ${categoryId}`);
  } else {
    popularFeedsCache.clear();
    console.log('[FeedUsage] All cache cleared');
  }
}
