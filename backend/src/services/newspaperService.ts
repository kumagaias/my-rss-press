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

export interface NewspaperData {
  newspaperId: string;
  name: string;
  userName: string;
  feedUrls: string[];
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

  const result = await docClient.send(
    new QueryCommand({
      TableName: config.dynamodbTable,
      IndexName: indexName,
      KeyConditionExpression: 'GSI1PK = :pk AND begins_with(GSI1SK, :sk)',
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
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    viewCount: item.viewCount,
    isPublic: item.isPublic,
  }));
}

/**
 * Increment view count for a newspaper
 * @param newspaperId - Newspaper ID
 */
export async function incrementViewCount(newspaperId: string): Promise<void> {
  // Get current newspaper data
  const newspaper = await getNewspaper(newspaperId);
  if (!newspaper) {
    throw new Error(`Newspaper not found: ${newspaperId}`);
  }

  const newViewCount = newspaper.viewCount + 1;

  // Update view count
  await docClient.send(
    new UpdateCommand({
      TableName: config.dynamodbTable,
      Key: {
        PK: `NEWSPAPER#${newspaperId}`,
        SK: 'METADATA',
      },
      UpdateExpression: 'SET viewCount = :count, updatedAt = :now, GSI1SK = :gsi1sk',
      ExpressionAttributeValues: {
        ':count': newViewCount,
        ':now': new Date().toISOString(),
        ':gsi1sk': `VIEWS#${String(newViewCount).padStart(10, '0')}#${newspaperId}`,
      },
    })
  );

  console.log(`Incremented view count for newspaper ${newspaperId}: ${newViewCount}`);
}
