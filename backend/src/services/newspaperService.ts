import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { config } from '../config.js';
import { nanoid } from 'nanoid';
import { DEFAULT_LANGUAGE } from '../constants.js';
import { NewspaperData, Article, Locale } from '../models/newspaper.js';
import { isDefaultFeed } from './defaultFeedService.js';

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

// Re-export types for backward compatibility
export type { NewspaperData, Article, Locale };

/**
 * Save a newspaper to DynamoDB
 * @param newspaper - Newspaper data (without newspaperId)
 * @returns Newspaper ID
 */
export async function saveNewspaper(
  newspaper: Omit<NewspaperData, 'newspaperId' | 'createdAt' | 'updatedAt' | 'viewCount'>
): Promise<string> {
  const newspaperId = nanoid();
  const now = new Date().toISOString();

  // Filter out default feeds before saving
  const userFeedUrls = newspaper.feedUrls.filter(url => !isDefaultFeed(url));
  
  console.log(`[Newspaper Service] Filtered feeds: ${newspaper.feedUrls.length} -> ${userFeedUrls.length}`);

  const newspaperData: NewspaperData = {
    newspaperId,
    name: newspaper.name,
    userName: newspaper.userName,
    feedUrls: userFeedUrls, // Only user-selected feeds
    articles: newspaper.articles,
    createdAt: now,
    updatedAt: now,
    viewCount: 0,
    isPublic: newspaper.isPublic,
    locale: newspaper.locale,
    languages: newspaper.languages,
    summary: newspaper.summary,
    newspaperDate: newspaper.newspaperDate,
  };

  // Save to DynamoDB
  await docClient.send(
    new PutCommand({
      TableName: config.dynamodbTable,
      Item: {
        PK: `NEWSPAPER#${newspaperId}`,
        SK: 'METADATA',
        ...newspaperData,
        // GSI keys for public newspapers
        ...(newspaper.isPublic && {
          GSI1PK: 'PUBLIC',
          GSI1SK: `VIEWS#${String(0).padStart(10, '0')}#${newspaperId}`,
          GSI2PK: 'PUBLIC',
          GSI2SK: `CREATED#${now}#${newspaperId}`,
        }),
      },
    })
  );

  console.log(`Saved newspaper: ${newspaperId}`);
  return newspaperId;
}

/**
 * Get a newspaper by ID
 * @param newspaperId - Newspaper ID
 * @returns Newspaper data or null if not found
 */
export async function getNewspaper(newspaperId: string): Promise<NewspaperData | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: config.dynamodbTable,
      Key: {
        PK: `NEWSPAPER#${newspaperId}`,
        SK: 'METADATA',
      },
    })
  );

  if (!result.Item) {
    return null;
  }

  return {
    newspaperId: result.Item.newspaperId,
    name: result.Item.name,
    userName: result.Item.userName,
    feedUrls: result.Item.feedUrls,
    articles: result.Item.articles,
    createdAt: result.Item.createdAt,
    updatedAt: result.Item.updatedAt,
    viewCount: result.Item.viewCount,
    isPublic: result.Item.isPublic,
    locale: result.Item.locale || DEFAULT_LANGUAGE.LOCALE,
    languages: result.Item.languages || [], // Default to empty array for backward compatibility
    summary: result.Item.summary,
    newspaperDate: result.Item.newspaperDate,
  };
}

/**
 * Get public newspapers sorted by popularity or recency
 * @param sortBy - Sort order ('popular' or 'recent')
 * @param limit - Maximum number of newspapers to return
 * @returns Array of newspapers
 */
export async function getPublicNewspapers(
  sortBy: 'popular' | 'recent',
  limit: number = 10
): Promise<NewspaperData[]> {
  const indexName = sortBy === 'popular' ? 'PublicNewspapers' : 'RecentNewspapers';
  const sortKeyPrefix = sortBy === 'popular' ? 'VIEWS#' : 'CREATED#';
  
  // Use correct GSI attributes based on sort order
  // Popular uses GSI1 (GSI1PK/GSI1SK), Recent uses GSI2 (GSI2PK/GSI2SK)
  const pkAttribute = sortBy === 'popular' ? 'GSI1PK' : 'GSI2PK';
  const skAttribute = sortBy === 'popular' ? 'GSI1SK' : 'GSI2SK';

  const result = await docClient.send(
    new QueryCommand({
      TableName: config.dynamodbTable,
      IndexName: indexName,
      KeyConditionExpression: `${pkAttribute} = :pk AND begins_with(${skAttribute}, :sk)`,
      ExpressionAttributeValues: {
        ':pk': 'PUBLIC',
        ':sk': sortKeyPrefix,
      },
      Limit: limit,
      ScanIndexForward: false, // Descending order
    })
  );

  if (!result.Items) {
    return [];
  }

  return result.Items.map(item => ({
    newspaperId: item.newspaperId,
    name: item.name,
    userName: item.userName,
    feedUrls: item.feedUrls,
    articles: item.articles, // Include articles in the response
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    viewCount: item.viewCount,
    isPublic: item.isPublic,
    locale: item.locale || DEFAULT_LANGUAGE.LOCALE,
    languages: item.languages || [], // Default to empty array for backward compatibility
    summary: item.summary,
    newspaperDate: item.newspaperDate,
  }));
}

/**
 * Increment view count for a newspaper using atomic counter operation
 * This prevents race conditions when multiple concurrent requests increment the count
 * @param newspaperId - Newspaper ID
 */
export async function incrementViewCount(newspaperId: string): Promise<void> {
  // Use atomic ADD operation to increment view count
  // This prevents race conditions from concurrent requests
  const result = await docClient.send(
    new UpdateCommand({
      TableName: config.dynamodbTable,
      Key: {
        PK: `NEWSPAPER#${newspaperId}`,
        SK: 'METADATA',
      },
      UpdateExpression: 'ADD viewCount :inc SET updatedAt = :now',
      ExpressionAttributeValues: {
        ':inc': 1,
        ':now': new Date().toISOString(),
      },
      ReturnValues: 'ALL_NEW',
    })
  );

  // Update GSI1SK with the new view count for proper sorting in popular newspapers
  if (result.Attributes) {
    const newViewCount = result.Attributes.viewCount as number;
    
    await docClient.send(
      new UpdateCommand({
        TableName: config.dynamodbTable,
        Key: {
          PK: `NEWSPAPER#${newspaperId}`,
          SK: 'METADATA',
        },
        UpdateExpression: 'SET GSI1SK = :gsi1sk',
        ExpressionAttributeValues: {
          ':gsi1sk': `VIEWS#${String(newViewCount).padStart(10, '0')}#${newspaperId}`,
        },
      })
    );

    console.log(`Incremented view count for newspaper ${newspaperId}: ${newViewCount}`);
  }
}

/**
 * Update newspaper's editorial column
 * Used for async editorial column generation after newspaper creation
 * 
 * @param newspaperId - Newspaper ID
 * @param editorialColumn - Editorial column content
 */
export async function updateNewspaperEditorialColumn(
  newspaperId: string,
  editorialColumn: string
): Promise<void> {
  try {
    await docClient.send(
      new UpdateCommand({
        TableName: config.dynamodbTable,
        Key: {
          PK: `NEWSPAPER#${newspaperId}`,
          SK: 'METADATA',
        },
        UpdateExpression: 'SET editorialColumn = :column, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':column': editorialColumn,
          ':updatedAt': new Date().toISOString(),
        },
      })
    );

    console.log(`Updated editorial column for newspaper ${newspaperId}`);
  } catch (error) {
    console.error(`Failed to update editorial column for newspaper ${newspaperId}:`, error);
    throw error;
  }
}

/**
 * Update historical newspaper's editorial column
 * Used for async editorial column generation for date-based newspapers
 * 
 * @param newspaperId - Base newspaper ID (without DATE# prefix)
 * @param date - Date string in YYYY-MM-DD format
 * @param editorialColumn - Editorial column content
 */
export async function updateHistoricalNewspaperEditorialColumn(
  newspaperId: string,
  date: string,
  editorialColumn: string
): Promise<void> {
  try {
    await docClient.send(
      new UpdateCommand({
        TableName: config.dynamodbTable,
        Key: {
          PK: `NEWSPAPER#${newspaperId}`,
          SK: `DATE#${date}`,
        },
        UpdateExpression: 'SET editorialColumn = :column, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':column': editorialColumn,
          ':updatedAt': new Date().toISOString(),
        },
      })
    );

    console.log(`Updated editorial column for historical newspaper ${newspaperId} on ${date}`);
  } catch (error) {
    console.error(`Failed to update editorial column for historical newspaper ${newspaperId} on ${date}:`, error);
    throw error;
  }
}
