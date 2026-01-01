/**
 * Fallback mechanism for category management
 * 
 * Provides fallback to hardcoded default feeds when DynamoDB is unavailable
 */

import { Category, Feed } from '../types/category.js';
import * as categoryService from './categoryService.js';

/**
 * Default feeds for fallback (matches getAllDefaultFeeds in bedrockService)
 */
const DEFAULT_FEEDS_EN = [
  {
    url: 'https://feeds.bbci.co.uk/news/rss.xml',
    title: 'BBC News',
    description: 'General news and information',
    language: 'en',
  },
  {
    url: 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml',
    title: 'The New York Times',
    description: 'In-depth articles and analysis',
    language: 'en',
  },
  {
    url: 'https://feeds.reuters.com/reuters/topNews',
    title: 'Reuters Top News',
    description: 'Breaking news and updates',
    language: 'en',
  },
  {
    url: 'https://www.theguardian.com/world/rss',
    title: 'The Guardian World News',
    description: 'Global perspective',
    language: 'en',
  },
];

const DEFAULT_FEEDS_JA = [
  {
    url: 'https://www3.nhk.or.jp/rss/news/cat0.xml',
    title: 'NHK ニュース',
    description: '一般的なニュースと情報',
    language: 'ja',
  },
  {
    url: 'https://www.asahi.com/rss/asahi/newsheadlines.rdf',
    title: '朝日新聞デジタル',
    description: '詳細な記事と分析',
    language: 'ja',
  },
  {
    url: 'https://news.yahoo.co.jp/rss/topics/top-picks.xml',
    title: 'Yahoo!ニュース',
    description: '速報とアップデート',
    language: 'ja',
  },
  {
    url: 'https://www.itmedia.co.jp/rss/2.0/news_bursts.xml',
    title: 'ITmedia NEWS',
    description: 'テクノロジーとビジネスの情報',
    language: 'ja',
  },
];

/**
 * Get category by theme with fallback to constants
 * @param theme - User's theme input
 * @param locale - Locale ('en' or 'ja')
 * @returns Category or null
 */
export async function getCategoryByThemeWithFallback(
  theme: string,
  locale: 'en' | 'ja'
): Promise<Category | null> {
  try {
    return await categoryService.getCategoryByTheme(theme, locale);
  } catch (error) {
    console.error('[Fallback] DynamoDB error in getCategoryByTheme, falling back to null:', error);
    return null;
  }
}

/**
 * Get feeds by category with fallback to default feeds
 * @param categoryId - Category ID
 * @param locale - Locale for fallback
 * @returns Array of feeds
 */
export async function getFeedsByCategoryWithFallback(
  categoryId: string,
  locale: 'en' | 'ja'
): Promise<Feed[]> {
  try {
    const feeds = await categoryService.getFeedsByCategory(categoryId);
    if (feeds.length > 0) {
      return feeds;
    }
    
    // If no feeds found, fall back to defaults
    console.log(`[Fallback] No feeds found for category ${categoryId}, using default feeds`);
    return getDefaultFeedsAsFeeds(locale, categoryId);
  } catch (error) {
    console.error(`[Fallback] DynamoDB error in getFeedsByCategory, using default feeds:`, error);
    return getDefaultFeedsAsFeeds(locale, categoryId);
  }
}

/**
 * Get all default feeds for a locale
 * @param locale - Locale ('en' or 'ja')
 * @returns Array of default feeds
 */
export function getAllDefaultFeeds(locale: 'en' | 'ja'): Array<{
  url: string;
  title: string;
  description: string;
  language: string;
}> {
  return locale === 'ja' ? DEFAULT_FEEDS_JA : DEFAULT_FEEDS_EN;
}

/**
 * Convert default feeds to Feed type
 * @param locale - Locale
 * @param categoryId - Category ID
 * @returns Array of Feed objects
 */
function getDefaultFeedsAsFeeds(locale: 'en' | 'ja', categoryId: string): Feed[] {
  const defaultFeeds = getAllDefaultFeeds(locale);
  const now = new Date().toISOString();
  
  return defaultFeeds.map((feed, index) => ({
    categoryId,
    url: feed.url,
    title: feed.title,
    description: feed.description,
    language: feed.language,
    priority: index + 1,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  }));
}
