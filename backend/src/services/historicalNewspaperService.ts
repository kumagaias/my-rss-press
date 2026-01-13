/**
 * Historical Newspaper Service
 * Handles date-based newspaper generation and retrieval
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { config } from '../config.js';
import { NewspaperData } from '../models/newspaper.js';
import { fetchArticles, balanceArticlesAcrossFeeds, type Article as RSSArticle } from './rssFetcherService.js';
import { calculateImportance } from './importanceCalculator.js';
import { detectLanguages } from './languageDetectionService.js';
import { getNewspaper } from './newspaperService.js';
import { fetchDefaultFeedArticles, isDefaultFeed, getDefaultFeeds } from './defaultFeedService.js';
import { limitDefaultFeedArticles, type FeedMetadata } from './articleLimiter.js';

// DynamoDB client configuration
const dynamoClient = new DynamoDBClient({
  region: config.bedrockRegion,
  ...(config.dynamodbEndpoint && { endpoint: config.dynamodbEndpoint }),
});

const docClient = DynamoDBDocumentClient.from(dynamoClient, {
  marshallOptions: {
    removeUndefinedValues: true, // Remove undefined values to prevent DynamoDB errors
  },
});

/**
 * Validate date for historical newspaper
 * @param date - Date string in YYYY-MM-DD format
 * @returns Validation result with error message if invalid
 */
export function validateDate(date: string): { valid: boolean; error?: string } {
  // Parse date as JST (Asia/Tokyo)
  const targetDate = new Date(date + 'T00:00:00+09:00');
  
  // Check if date is valid
  if (isNaN(targetDate.getTime())) {
    return { valid: false, error: 'Invalid date format. Use YYYY-MM-DD' };
  }

  // Get current date in JST
  const nowJST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
  const todayJST = new Date(nowJST);
  todayJST.setHours(0, 0, 0, 0);

  // Check if future date
  if (targetDate > todayJST) {
    return { valid: false, error: 'Future newspapers are not available' };
  }

  // Check if older than 7 days
  const sevenDaysAgo = new Date(todayJST);
  sevenDaysAgo.setDate(todayJST.getDate() - 7);

  if (targetDate < sevenDaysAgo) {
    return { valid: false, error: 'Newspapers older than 7 days are not available' };
  }

  return { valid: true };
}

/**
 * Fetch articles for a specific date
 * @param feedUrls - Array of RSS feed URLs
 * @param date - Date string in YYYY-MM-DD format (JST)
 * @returns Object with articles and feedLanguages
 */
export async function fetchArticlesForDate(
  feedUrls: string[],
  date: string
): Promise<{ articles: RSSArticle[]; feedLanguages: Map<string, string> }> {
  // Parse target date as JST
  const targetDate = new Date(date + 'T00:00:00+09:00');
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);

  // Get current time in JST
  const nowJST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
  const todayJST = new Date(nowJST);
  todayJST.setHours(0, 0, 0, 0);

  // Determine end time (avoid mutating targetDate)
  const endTime = targetDate.getTime() === todayJST.getTime()
    ? nowJST // Today: up to current time
    : new Date(new Date(targetDate).setHours(23, 59, 59, 999)); // Other days: end of day

  console.log(`Fetching articles for date: ${date} (JST)`);
  console.log(`Time range: ${startOfDay.toISOString()} to ${endTime.toISOString()}`);

  // Fetch articles from feeds (initially 7 days, extend to 14 if needed)
  let result = await fetchArticles(feedUrls, 7); // Fetch last 7 days
  let allArticles = result.articles;
  const feedLanguages = result.feedLanguages;

  // Filter by date range
  let articles = allArticles.filter(article => {
    const pubDate = new Date(article.pubDate);
    return pubDate >= startOfDay && pubDate <= endTime;
  });

  console.log(`Found ${articles.length} articles for ${date}`);

  // If insufficient articles, extend search to 14 days and re-filter
  const minArticles = 8;
  if (articles.length < minArticles) {
    console.log(`Insufficient articles (${articles.length}), extending search to 14 days`);
    
    // Fetch articles from last 14 days
    result = await fetchArticles(feedUrls, 14);
    allArticles = result.articles;
    
    // Calculate extended date range (7 days before target date)
    const sevenDaysBefore = new Date(startOfDay);
    sevenDaysBefore.setDate(sevenDaysBefore.getDate() - 7);

    // Re-filter with extended range
    articles = allArticles.filter(article => {
      const pubDate = new Date(article.pubDate);
      return pubDate >= sevenDaysBefore && pubDate <= endTime;
    });

    console.log(`Extended search found ${articles.length} articles`);
  }

  // Sort by publication date (newest first)
  articles.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

  // Select 8-15 articles
  const targetCount = Math.floor(Math.random() * 8) + 8; // 8-15
  const selectedArticles = articles.slice(0, Math.min(targetCount, articles.length));

  console.log(`Selected ${selectedArticles.length} articles for newspaper`);

  return { articles: selectedArticles, feedLanguages };
}

/**
 * Get or create a historical newspaper for a specific date
 * @param newspaperId - Newspaper ID
 * @param date - Date string in YYYY-MM-DD format
 * @param feedUrls - Array of RSS feed URLs
 * @param theme - User theme
 * @param locale - User locale (en/ja)
 * @returns Newspaper data
 */
export async function getOrCreateNewspaper(
  newspaperId: string,
  date: string,
  feedUrls: string[],
  theme: string,
  locale: 'en' | 'ja' = 'en'
): Promise<NewspaperData> {
  // Validate date
  const validation = validateDate(date);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Check if newspaper already exists for this date
  const existing = await getNewspaperByDate(newspaperId, date);
  if (existing) {
    console.log(`Found existing newspaper for ${newspaperId} on ${date}`);
    return existing;
  }

  console.log(`Creating new newspaper for ${newspaperId} on ${date}`);

  // Get original newspaper metadata for name and userName
  const originalNewspaper = await getNewspaper(newspaperId);
  const newspaperName = originalNewspaper?.name || `Newspaper for ${date}`;
  const userName = originalNewspaper?.userName || 'System';

  // Separate user feeds and default feeds
  const userFeeds = feedUrls.filter(url => !isDefaultFeed(url));
  const hasDefaultFeeds = userFeeds.length < feedUrls.length;
  
  console.log(`[Historical Newspaper] User feeds: ${userFeeds.length}, Has default feeds: ${hasDefaultFeeds}`);

  // Fetch articles from user-selected feeds
  const { articles: userArticles, feedLanguages } = await fetchArticlesForDate(userFeeds, date);
  
  // Fetch articles from default feeds
  let defaultArticles: RSSArticle[] = [];
  try {
    const defaultFeedResult = await fetchDefaultFeedArticles(locale, date, 2);
    // Convert Article (string pubDate) to RSSArticle (Date pubDate)
    // Filter out any articles without feedSource to avoid runtime errors
    defaultArticles = defaultFeedResult.articles
      .filter(a => a.feedSource != null)
      .map(a => ({
        title: a.title,
        description: a.description,
        link: a.link,
        pubDate: new Date(a.pubDate),
        imageUrl: a.imageUrl,
        feedSource: a.feedSource,
        feedTitle: a.feedTitle,
        importance: a.importance,
      }));
    console.log(`[Historical Newspaper] Fetched ${defaultArticles.length} articles from default feeds`);
  } catch (error) {
    console.error('[Historical Newspaper] Failed to fetch default feeds:', error);
    console.warn('[Historical Newspaper] Proceeding without default feed articles; the generated newspaper may contain fewer or less diverse articles than usual.');
    // Continue without default feed articles
  }

  // Merge articles
  const allArticles = [...userArticles, ...defaultArticles];
  console.log(`[Historical Newspaper] Total articles before balancing: ${allArticles.length}`);

  // Apply article balancing (same as regular newspaper generation)
  // Target count: 8-15 articles, use upper bound for balancing
  const balancedArticles = balanceArticlesAcrossFeeds(allArticles, 15);
  console.log(`[Historical Newspaper] Articles after balancing: ${balancedArticles.length}`);

  // Create feed metadata for article limiter
  const feedMetadata: FeedMetadata[] = [];
  const allFeedUrls = [...userFeeds, ...getDefaultFeeds(locale).map(f => f.url)];
  for (const url of allFeedUrls) {
    const isDefault = isDefaultFeed(url);
    feedMetadata.push({ url, isDefault });
  }

  // Apply article limits (including default feed limits)
  const limitedArticles = limitDefaultFeedArticles(balancedArticles, feedMetadata);
  console.log(`[Historical Newspaper] Articles after limiting: ${limitedArticles.length}`);

  // Require at least 1 article (reduced from 3 for better UX)
  if (limitedArticles.length < 1) {
    throw new Error('No articles found for this date. Please try a different date or add more RSS feeds.');
  }

  // Calculate importance scores
  const articlesWithImportance = await calculateImportance(limitedArticles, theme);

  // Select 8-15 articles by importance
  const targetCount = Math.floor(Math.random() * 8) + 8; // 8-15
  const selectedArticles = articlesWithImportance
    .sort((a, b) => (b.importance || 0) - (a.importance || 0))
    .slice(0, Math.min(targetCount, articlesWithImportance.length));

  console.log(`[Historical Newspaper] Selected ${selectedArticles.length} articles for newspaper`);

  // Detect languages
  let languages: string[] = [];
  try {
    languages = await detectLanguages(selectedArticles, feedLanguages);
  } catch (error) {
    console.error('Error detecting languages:', error);
  }

  // Create newspaper data
  const now = new Date().toISOString();
  const newspaper: NewspaperData = {
    newspaperId,
    newspaperDate: date,
    name: newspaperName,
    userName: userName,
    feedUrls: userFeeds, // Only save user-selected feeds
    articles: selectedArticles.map(a => ({
      title: a.title,
      description: a.description,
      link: a.link,
      pubDate: a.pubDate.toISOString(), // Convert Date to string
      imageUrl: a.imageUrl,
      importance: a.importance || 0,
      feedSource: a.feedSource,
      feedTitle: a.feedTitle,
    })),
    languages,
    createdAt: now,
    updatedAt: now,
    viewCount: 0,
    isPublic: false,
    locale,
  };

  // Save to DynamoDB
  await saveNewspaperByDate(newspaper);

  return newspaper;
}

/**
 * Get a newspaper by date
 * @param newspaperId - Newspaper ID
 * @param date - Date string in YYYY-MM-DD format
 * @returns Newspaper data or null if not found
 */
async function getNewspaperByDate(
  newspaperId: string,
  date: string
): Promise<NewspaperData | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: config.dynamodbTable,
      Key: {
        PK: `NEWSPAPER#${newspaperId}`,
        SK: `DATE#${date}`,
      },
    })
  );

  if (!result.Item) {
    return null;
  }

  return {
    newspaperId: result.Item.newspaperId,
    newspaperDate: result.Item.newspaperDate,
    name: result.Item.name,
    userName: result.Item.userName,
    feedUrls: result.Item.feedUrls,
    articles: result.Item.articles,
    languages: result.Item.languages || [],
    summary: result.Item.summary,
    createdAt: result.Item.createdAt,
    updatedAt: result.Item.updatedAt,
    viewCount: result.Item.viewCount,
    isPublic: result.Item.isPublic,
    locale: result.Item.locale || 'en',
  };
}

/**
 * Save a newspaper by date
 * @param newspaper - Newspaper data
 * 
 * Note: Sets GSI attributes for cleanup service to find historical newspapers.
 * Uses a special GSI1PK pattern 'HISTORICAL' to distinguish from public newspapers.
 */
async function saveNewspaperByDate(newspaper: NewspaperData): Promise<void> {
  // Remove undefined values from newspaper object
  // DynamoDB does not allow undefined values
  const cleanNewspaper: Record<string, any> = {};
  for (const [key, value] of Object.entries(newspaper)) {
    if (value !== undefined) {
      cleanNewspaper[key] = value;
    }
  }

  await docClient.send(
    new PutCommand({
      TableName: config.dynamodbTable,
      Item: {
        PK: `NEWSPAPER#${newspaper.newspaperId}`,
        SK: `DATE#${newspaper.newspaperDate}`,
        // Set GSI attributes for cleanup service
        // Use 'HISTORICAL' prefix to distinguish from public newspapers
        GSI1PK: 'HISTORICAL',
        GSI1SK: `DATE#${newspaper.newspaperDate}#${newspaper.newspaperId}`,
        ...cleanNewspaper,
      },
    })
  );

  console.log(`Saved newspaper for ${newspaper.newspaperId} on ${newspaper.newspaperDate}`);
}

/**
 * Get all available dates for a newspaper
 * @param newspaperId - Newspaper ID
 * @returns Array of date strings
 */
export async function getAvailableDates(newspaperId: string): Promise<string[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: config.dynamodbTable,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `NEWSPAPER#${newspaperId}`,
        ':sk': 'DATE#',
      },
    })
  );

  if (!result.Items) {
    return [];
  }

  return result.Items
    .map(item => item.newspaperDate as string)
    .filter(date => date) // Filter out undefined
    .sort()
    .reverse(); // Most recent first
}
