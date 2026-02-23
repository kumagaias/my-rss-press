/**
 * Categories API Routes
 * 
 * Endpoints for retrieving categories and their feeds for the RSS Database page
 */

import { Hono } from 'hono';
import { getAllCategories, getFeedsByCategory } from '../services/categoryService.js';

const router = new Hono();

/**
 * GET /api/categories
 * Get all categories with their feeds
 * 
 * Query params:
 * - locale: 'en' | 'ja' (optional)
 * 
 * Response:
 * {
 *   categories: Array<{
 *     id: string;
 *     name: string;
 *     description: string;
 *     locale: 'en' | 'ja';
 *     keywords: string[];
 *     order: number;
 *     feedCount: number;
 *   }>;
 *   totalFeeds: number;
 * }
 */
router.get('/', async (c) => {
  try {
    const locale = c.req.query('locale') as 'en' | 'ja' | undefined;
    
    console.log(`[Categories API] Fetching categories, locale: ${locale || 'all'}`);
    
    // Get all categories
    const categories = await getAllCategories(locale);
    
    // Get feed counts for each category
    const categoriesWithCounts = await Promise.all(
      categories.map(async (category) => {
        const feeds = await getFeedsByCategory(category.categoryId);
        // Only count active feeds
        const activeFeeds = feeds.filter(f => f.isActive);
        
        return {
          id: category.categoryId,
          name: category.displayName,
          description: category.parentCategory || '',
          locale: category.locale,
          keywords: category.keywords,
          order: category.order,
          feedCount: activeFeeds.length,
        };
      })
    );
    
    // Calculate total feeds
    const totalFeeds = categoriesWithCounts.reduce((sum, cat) => sum + cat.feedCount, 0);
    
    console.log(`[Categories API] Found ${categoriesWithCounts.length} categories, ${totalFeeds} total feeds`);
    
    return c.json({
      categories: categoriesWithCounts,
      totalFeeds,
    });
  } catch (error) {
    console.error('[Categories API] Error fetching categories:', error);
    return c.json({ error: 'Failed to fetch categories' }, 500);
  }
});

/**
 * GET /api/categories/:categoryId/feeds
 * Get all feeds for a specific category
 * 
 * Response:
 * {
 *   feeds: Array<{
 *     url: string;
 *     title: string;
 *     description?: string;
 *     language?: string;
 *     priority: number;
 *   }>;
 * }
 */
router.get('/:categoryId/feeds', async (c) => {
  try {
    const categoryId = c.req.param('categoryId');
    
    console.log(`[Categories API] Fetching feeds for category: ${categoryId}`);
    
    // Get feeds for category
    const feeds = await getFeedsByCategory(categoryId);
    
    // Filter out inactive feeds
    const activeFeeds = feeds.filter(f => f.isActive);
    
    // Return only necessary fields
    const feedsResponse = activeFeeds.map(feed => ({
      url: feed.url,
      title: feed.title,
      description: feed.description,
      language: feed.language,
      priority: feed.priority,
    }));
    
    console.log(`[Categories API] Found ${feedsResponse.length} feeds for category ${categoryId}`);
    
    return c.json({
      feeds: feedsResponse,
    });
  } catch (error) {
    console.error('[Categories API] Error fetching feeds:', error);
    return c.json({ error: 'Failed to fetch feeds' }, 500);
  }
});

export default router;
