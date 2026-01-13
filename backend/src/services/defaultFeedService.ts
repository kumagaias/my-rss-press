/**
 * Default Feed Service
 * 
 * Centralized management of default RSS feeds.
 * Provides functions to fetch articles from default feeds with date filtering and article limits.
 */

import Parser from 'rss-parser';
import type { Article } from '../models/newspaper.js';

const parser = new Parser();

// Default feed configuration
export interface DefaultFeed {
  url: string;
  title: string;
  language: 'EN' | 'JP';
}

// Response from fetchDefaultFeedArticles
export interface DefaultFeedArticlesResponse {
  articles: Article[];
  totalFeeds: number;
  successfulFeeds: number;
}

// Default feeds for English locale
const DEFAULT_FEEDS_EN: DefaultFeed[] = [
  { url: 'https://www.bbc.com/news/world/rss.xml', title: 'BBC News', language: 'EN' },
  { url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml', title: 'New York Times', language: 'EN' },
  { url: 'https://www.theguardian.com/world/rss', title: 'The Guardian', language: 'EN' },
  { url: 'https://www.reuters.com/rssFeed/worldNews', title: 'Reuters', language: 'EN' },
];

// Default feeds for Japanese locale
const DEFAULT_FEEDS_JP: DefaultFeed[] = [
  { url: 'https://www.nhk.or.jp/rss/news/cat0.xml', title: 'NHK News', language: 'JP' },
  { url: 'https://news.yahoo.co.jp/rss/topics/top-picks.xml', title: 'Yahoo News', language: 'JP' },
  { url: 'https://www.asahi.com/rss/asahi/newsheadlines.rdf', title: 'Asahi Shimbun', language: 'JP' },
  { url: 'https://rss.itmedia.co.jp/rss/2.0/news_bursts.xml', title: 'ITmedia', language: 'JP' },
];

/**
 * Get default feeds for a locale
 * @param locale - Language locale ('en' or 'ja')
 * @returns Array of default feeds
 */
export function getDefaultFeeds(locale: 'en' | 'ja'): DefaultFeed[] {
  return locale === 'ja' ? DEFAULT_FEEDS_JP : DEFAULT_FEEDS_EN;
}

/**
 * Check if a URL is a default feed
 * @param url - Feed URL to check
 * @returns True if URL is a default feed
 */
export function isDefaultFeed(url: string): boolean {
  const allDefaultFeeds = [...DEFAULT_FEEDS_EN, ...DEFAULT_FEEDS_JP];
  return allDefaultFeeds.some(feed => feed.url === url);
}

/**
 * Fetch articles from default feeds
 * @param locale - Language locale ('en' or 'ja')
 * @param date - Optional date in YYYY-MM-DD format (JST)
 * @param articlesPerFeed - Maximum articles per feed (default: 2)
 * @returns Articles from default feeds with metadata
 */
export async function fetchDefaultFeedArticles(
  locale: 'en' | 'ja',
  date?: string,
  articlesPerFeed: number = 2
): Promise<DefaultFeedArticlesResponse> {
  const defaultFeeds = getDefaultFeeds(locale);
  const results: Article[] = [];
  let successfulFeeds = 0;

  console.log(`[Default Feed] Fetching articles for locale: ${locale}, date: ${date || 'last 7 days'}, limit: ${articlesPerFeed}/feed`);

  // Fetch articles from all default feeds in parallel
  const fetchPromises = defaultFeeds.map(async (feed) => {
    try {
      const articles = await fetchArticlesFromFeed(feed, date, articlesPerFeed);
      if (articles.length > 0) {
        successfulFeeds++;
        console.log(`[Default Feed] ${feed.title}: ${articles.length} articles`);
        return articles;
      }
      console.log(`[Default Feed] ${feed.title}: No articles found`);
      return [];
    } catch (error) {
      console.error(`[Default Feed] Failed to fetch from ${feed.title}:`, error);
      return [];
    }
  });

  const allResults = await Promise.all(fetchPromises);
  allResults.forEach(articles => results.push(...articles));

  console.log(`[Default Feed] Total: ${results.length} articles from ${successfulFeeds}/${defaultFeeds.length} feeds`);

  return {
    articles: results,
    totalFeeds: defaultFeeds.length,
    successfulFeeds,
  };
}

/**
 * Fetch articles from a single feed
 * @param feed - Default feed configuration
 * @param date - Optional date in YYYY-MM-DD format (JST)
 * @param limit - Maximum articles to return
 * @returns Array of articles
 */
async function fetchArticlesFromFeed(
  feed: DefaultFeed,
  date?: string,
  limit: number = 2
): Promise<Article[]> {
  // Fetch RSS feed with timeout
  const rssFeed = await parser.parseURL(feed.url);
  
  // Parse articles
  let articles: Article[] = rssFeed.items.map(item => ({
    title: item.title || '',
    description: item.contentSnippet || item.content || '',
    link: item.link || '',
    pubDate: item.pubDate ? new Date(item.pubDate) : new Date(),
    imageUrl: extractImageUrl(item),
    feedSource: feed.url,
    feedTitle: feed.title,
    importance: 0, // Will be calculated later
  }));

  // Filter by date if specified
  if (date) {
    articles = filterArticlesByDate(articles, date);
  } else {
    // Default: last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    articles = articles.filter(a => new Date(a.pubDate) >= sevenDaysAgo);
  }

  // Sort by date (newest first) and limit
  articles.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
  return articles.slice(0, limit);
}

/**
 * Filter articles by date (JST timezone)
 * @param articles - Articles to filter
 * @param dateStr - Date in YYYY-MM-DD format
 * @returns Filtered articles
 */
function filterArticlesByDate(articles: Article[], dateStr: string): Article[] {
  // All dates in JST (Asia/Tokyo)
  const targetDate = new Date(dateStr + 'T00:00:00+09:00');
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);

  // Get current time in JST
  const nowJST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
  const todayJST = new Date(nowJST);
  todayJST.setHours(0, 0, 0, 0);

  // End time: current time if today, otherwise end of day
  const endTime = targetDate.getTime() === todayJST.getTime()
    ? nowJST
    : new Date(targetDate.setHours(23, 59, 59, 999));

  // Filter articles within date range
  let filtered = articles.filter(article => {
    const pubDate = new Date(article.pubDate);
    return pubDate >= startOfDay && pubDate <= endTime;
  });

  // If insufficient articles, expand to 7 days prior
  if (filtered.length < 2) {
    const sevenDaysAgo = new Date(startOfDay);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    filtered = articles.filter(article => {
      const pubDate = new Date(article.pubDate);
      return pubDate >= sevenDaysAgo && pubDate <= endTime;
    });
  }

  return filtered;
}

/**
 * Extract image URL from RSS item
 * @param item - RSS feed item
 * @returns Image URL or undefined
 */
function extractImageUrl(item: any): string | undefined {
  // Priority 1: Enclosure
  if (item.enclosure?.url) {
    return item.enclosure.url;
  }

  // Priority 2: Media RSS
  if (item['media:content']?.$?.url) {
    return item['media:content'].$.url;
  }

  if (item['media:thumbnail']?.$?.url) {
    return item['media:thumbnail'].$.url;
  }

  // Priority 3: Image in content
  const content = item.content || item['content:encoded'] || '';
  const imgMatch = content.match(/<img[^>]+src="([^">]+)"/);
  if (imgMatch) {
    return imgMatch[1];
  }

  return undefined;
}
