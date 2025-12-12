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
import { fetchArticles, type Article as RSSArticle } from './rssFetcherService.js';
import { calculateImportance } from './importanceCalculator.js';
import { detectLanguages } from './languageDetectionService.js';

// DynamoDB client configuration
const dynamoClient = new DynamoDBClient({
  region: config.bedrockRegion,
  ...(config.dynamodbEndpoint && { endpoint: config.dynamodbEndpoint }),
});

const docClient = DynamoDBDocumentClient.from(dynamoClient);

/**
 * Validate date for historical newspaper
 * @param date - Date string in YYYY-MM-DD format
 * @returns Validation result with error message if invalid
 */
export function validateDate(date: string): { valid: boolean; error?: string } {
  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { valid: false, error: 'Invalid date format. Use YYYY-MM-DD' };
  }

  // Parse date components
  const [year, month, day] = date.split('-').map(Number);
  
  // Create date in JST (UTC+9)
  const targetDateUTC = new Date(Date.UTC(year, month - 1, day, -9, 0, 0, 0)); // -9 hours to get JST midnight in UTC
  
  // Check if date is valid
  if (isNaN(targetDateUTC.getTime())) {
    return { valid: false, error: 'Invalid date format. Use YYYY-MM-DD' };
  }

  // Get current date in JST
  const nowUTC = new Date();
  const nowJST = new Date(nowUTC.getTime() + (9 * 60 * 60 * 1000)); // Add 9 hours for JST
  const todayJST = new Date(Date.UTC(nowJST.getUTCFullYear(), nowJST.getUTCMonth(), nowJST.getUTCDate(), -9, 0, 0, 0)); // Today in JST as UTC

  // Check if future date
  if (targetDateUTC > todayJST) {
    return { valid: false, error: 'Future newspapers are not available' };
  }

  // Check if older than 7 days
  const sevenDaysAgo = new Date(todayJST.getTime() - (7 * 24 * 60 * 60 * 1000)); // 7 days ago

  if (targetDateUTC < sevenDaysAgo) {
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
 * @returns Newspaper data
 */
export async function getOrCreateNewspaper(
  newspaperId: string,
  date: string,
  feedUrls: string[],
  theme: string
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

  // Fetch articles for the date
  const { articles, feedLanguages } = await fetchArticlesForDate(feedUrls, date);

  if (articles.length < 3) {
    throw new Error('Insufficient articles for this date');
  }

  // Calculate importance scores
  const articlesWithImportance = await calculateImportance(articles, theme);

  // Detect languages
  let languages: string[] = [];
  try {
    languages = await detectLanguages(articlesWithImportance, feedLanguages);
  } catch (error) {
    console.error('Error detecting languages:', error);
  }

  // Create newspaper data
  const now = new Date().toISOString();
  const newspaper: NewspaperData = {
    newspaperId,
    newspaperDate: date,
    name: `Newspaper for ${date}`,
    userName: 'System',
    feedUrls,
    articles: articlesWithImportance.map(a => ({
      title: a.title,
      description: a.description,
      link: a.link,
      pubDate: a.pubDate.toISOString(), // Convert Date to string
      imageUrl: a.imageUrl,
      importance: a.importance || 0,
    })),
    languages,
    createdAt: now,
    updatedAt: now,
    viewCount: 0,
    isPublic: false,
    locale: 'en',
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
        ...newspaper,
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
