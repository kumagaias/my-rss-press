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

// DynamoDB client configuration
const dynamoClient = new DynamoDBClient({
  region: config.bedrockRegion,
  ...(config.dynamodbEndpoint && { endpoint: config.dynamodbEndpoint }),
});

const docClient = DynamoDBDocumentClient.from(dynamoClient);

export interface Article {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  imageUrl?: string;
  importance: number;
}

export interface NewspaperData {
  newspaperId: string;
  name: string;
  userName: string;
  feedUrls: string[];
  articles?: Article[];
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  isPublic: boolean;
}

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

  const newspaperData: NewspaperData = {
    newspaperId,
    name: newspaper.name,
    userName: newspaper.userName,
    feedUrls: newspaper.feedUrls,
    articles: newspaper.articles,
    createdAt: now,
    updatedAt: now,
    viewCount: 0,
    isPublic: newspaper.isPublic,
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
