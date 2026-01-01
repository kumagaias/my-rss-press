/**
 * Repository for feed usage tracking
 * Tracks which feeds are successfully used in newspaper generation
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { config } from '../config.js';
import { FeedUsage, RecordFeedUsageInput } from '../types/category.js';

// DynamoDB client
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'ap-northeast-1',
  ...(config.dynamodbEndpoint && { endpoint: config.dynamodbEndpoint }),
});

const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

const TABLE_NAME = config.dynamodbTable;

/**
 * Record or update feed usage
 * @param input - Feed usage input
 * @returns Updated feed usage
 */
export async function recordFeedUsage(input: RecordFeedUsageInput): Promise<FeedUsage> {
  const now = new Date().toISOString();
  
  // Try to get existing usage
  const existing = await getFeedUsage(input.url, input.categoryId);
  
  if (existing) {
    // Update existing usage
    const newUsageCount = existing.usageCount + 1;
    const newSuccessCount = existing.successRate * existing.usageCount / 100 + (input.success ? 1 : 0);
    const newSuccessRate = (newSuccessCount / newUsageCount) * 100;
    const newAverageArticles = 
      (existing.averageArticles * existing.usageCount + input.articleCount) / newUsageCount;
    
    const result = await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `FEED_USAGE#${input.url}`,
          SK: `CATEGORY#${input.categoryId}`,
        },
        UpdateExpression: 
          'SET usageCount = :count, lastUsedAt = :lastUsed, successRate = :rate, ' +
          'averageArticles = :avg, updatedAt = :updated',
        ExpressionAttributeValues: {
          ':count': newUsageCount,
          ':lastUsed': now,
          ':rate': newSuccessRate,
          ':avg': newAverageArticles,
          ':updated': now,
        },
        ReturnValues: 'ALL_NEW',
      })
    );
    
    return result.Attributes as FeedUsage;
  } else {
    // Create new usage record
    const feedUsage: FeedUsage = {
      url: input.url,
      categoryId: input.categoryId,
      title: input.title,
      usageCount: 1,
      lastUsedAt: now,
      successRate: input.success ? 100 : 0,
      averageArticles: input.articleCount,
      createdAt: now,
      updatedAt: now,
    };
    
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: `FEED_USAGE#${input.url}`,
          SK: `CATEGORY#${input.categoryId}`,
          GSI1PK: `CATEGORY#${input.categoryId}`,
          GSI1SK: `USAGE_COUNT#${String(feedUsage.usageCount).padStart(10, '0')}`,
          ...feedUsage,
        },
      })
    );
    
    return feedUsage;
  }
}

/**
 * Get feed usage for a specific feed and category
 * @param url - Feed URL
 * @param categoryId - Category ID
 * @returns Feed usage or null
 */
export async function getFeedUsage(url: string, categoryId: string): Promise<FeedUsage | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `FEED_USAGE#${url}`,
        SK: `CATEGORY#${categoryId}`,
      },
    })
  );
  
  if (!result.Item) {
    return null;
  }
  
  const { PK, SK, GSI1PK, GSI1SK, ...feedUsage } = result.Item;
  return feedUsage as FeedUsage;
}

/**
 * Get popular feeds for a category (sorted by usage count)
 * @param categoryId - Category ID
 * @param limit - Maximum number of feeds to return
 * @returns Array of feed usage sorted by usage count (descending)
 */
export async function getPopularFeedsByCategory(
  categoryId: string,
  limit: number = 10
): Promise<FeedUsage[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :pk',
      ExpressionAttributeValues: {
        ':pk': `CATEGORY#${categoryId}`,
      },
      ScanIndexForward: false, // Descending order
      Limit: limit,
    })
  );
  
  if (!result.Items || result.Items.length === 0) {
    return [];
  }
  
  return result.Items.map(item => {
    const { PK, SK, GSI1PK, GSI1SK, ...feedUsage } = item;
    return feedUsage as FeedUsage;
  }).sort((a, b) => b.usageCount - a.usageCount); // Sort by usage count
}
