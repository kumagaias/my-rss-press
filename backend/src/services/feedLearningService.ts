/**
 * Feed Learning Service
 * 
 * Automatically learns and adds successful feeds to categories based on usage patterns.
 * This service analyzes feed usage data and promotes high-quality feeds to the category database.
 */

import { getFeedUsage } from '../repositories/feedUsageRepository.js';
import { getFeedsByCategory, createFeed } from '../repositories/categoryRepository.js';
import { Feed } from '../types/category.js';

/**
 * Criteria for promoting a feed to the category database
 */
const PROMOTION_CRITERIA = {
  MIN_USAGE_COUNT: 3,        // Minimum number of times the feed must be used
  MIN_SUCCESS_RATE: 70,      // Minimum success rate (70%)
  MIN_AVERAGE_ARTICLES: 2,   // Minimum average articles per fetch
};

/**
 * Check if a feed should be promoted to the category database
 * @param url - Feed URL
 * @param categoryId - Category ID
 * @returns True if feed meets promotion criteria
 */
export async function shouldPromoteFeed(
  url: string,
  categoryId: string
): Promise<boolean> {
  try {
    // Get feed usage statistics
    const usage = await getFeedUsage(url, categoryId);
    
    if (!usage) {
      return false;
    }
    
    // Check promotion criteria
    const meetsUsageCount = usage.usageCount >= PROMOTION_CRITERIA.MIN_USAGE_COUNT;
    const meetsSuccessRate = usage.successRate >= PROMOTION_CRITERIA.MIN_SUCCESS_RATE;
    const meetsAverageArticles = usage.averageArticles >= PROMOTION_CRITERIA.MIN_AVERAGE_ARTICLES;
    
    const shouldPromote = meetsUsageCount && meetsSuccessRate && meetsAverageArticles;
    
    if (shouldPromote) {
      console.log(
        `[FeedLearning] Feed ${url} meets promotion criteria:`,
        `usage=${usage.usageCount}, success=${usage.successRate}%, avg=${usage.averageArticles}`
      );
    }
    
    return shouldPromote;
  } catch (error) {
    console.error('[FeedLearning] Error checking promotion criteria:', error);
    return false;
  }
}

/**
 * Promote a feed to the category database if it meets criteria
 * @param url - Feed URL
 * @param categoryId - Category ID
 * @param title - Feed title
 * @param description - Feed description (optional)
 * @param language - Feed language (optional)
 * @returns True if feed was promoted, false otherwise
 */
export async function promoteFeedIfQualified(
  url: string,
  categoryId: string,
  title: string,
  description?: string,
  language?: string
): Promise<boolean> {
  try {
    // Check if feed already exists in category
    const existingFeeds = await getFeedsByCategory(categoryId);
    const feedExists = existingFeeds.some(f => f.url === url);
    
    if (feedExists) {
      console.log(`[FeedLearning] Feed ${url} already exists in category ${categoryId}`);
      return false;
    }
    
    // Check if feed meets promotion criteria
    const shouldPromote = await shouldPromoteFeed(url, categoryId);
    
    if (!shouldPromote) {
      return false;
    }
    
    // Get feed usage to determine priority
    const usage = await getFeedUsage(url, categoryId);
    
    if (!usage) {
      return false;
    }
    
    // Calculate priority based on usage count and success rate
    // Higher usage count and success rate = higher priority (lower number)
    const priority = Math.max(1, 100 - Math.floor(usage.usageCount * (usage.successRate / 100)));
    
    // Create feed in category
    const feed: Feed = {
      categoryId,
      url,
      title,
      description: description || `Automatically learned feed with ${usage.usageCount} uses and ${usage.successRate}% success rate`,
      language: language || 'en',
      priority,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await createFeed(feed);
    
    console.log(
      `[FeedLearning] ✅ Promoted feed to category database:`,
      `${title} (${url}) -> ${categoryId} with priority ${priority}`
    );
    
    return true;
  } catch (error) {
    console.error('[FeedLearning] Error promoting feed:', error);
    return false;
  }
}

/**
 * Attempt to promote multiple feeds to their categories
 * This is called after successful newspaper generation
 * @param feedUrls - Array of feed URLs
 * @param categoryId - Category ID
 * @param feedTitles - Map of feed URLs to their titles
 * @param feedLanguages - Map of feed URLs to their languages
 * @returns Number of feeds promoted
 */
export async function promoteFeedsIfQualified(
  feedUrls: string[],
  categoryId: string,
  feedTitles: Map<string, string>,
  feedLanguages: Map<string, string>
): Promise<number> {
  let promotedCount = 0;
  
  const promotionPromises = feedUrls.map(async (url) => {
    const title = feedTitles.get(url) || url.split('/')[2] || url;
    const language = feedLanguages.get(url);
    
    const promoted = await promoteFeedIfQualified(
      url,
      categoryId,
      title,
      undefined, // description will be auto-generated
      language
    );
    
    if (promoted) {
      promotedCount++;
    }
  });
  
  await Promise.all(promotionPromises);
  
  if (promotedCount > 0) {
    console.log(`[FeedLearning] Promoted ${promotedCount}/${feedUrls.length} feeds to category ${categoryId}`);
  }
  
  return promotedCount;
}
