import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { config } from '../config.js';
import { Category, Feed } from '../types/category.js';

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
 * Get a category by ID
 * @param categoryId - Category ID
 * @returns Category or null if not found
 */
export async function getCategoryById(categoryId: string): Promise<Category | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: config.dynamodbTable,
      Key: {
        PK: `CATEGORY#${categoryId}`,
        SK: 'METADATA',
      },
    })
  );

  if (!result.Item || !result.Item.isActive) {
    return null;
  }

  return mapItemToCategory(result.Item);
}

/**
 * Get all categories by locale
 * @param locale - Locale ('en' or 'ja')
 * @returns Array of categories sorted by order
 */
export async function getCategoriesByLocale(locale: 'en' | 'ja'): Promise<Category[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: config.dynamodbTable,
      IndexName: 'CategoryLocale',
      KeyConditionExpression: 'GSI1PK = :pk',
      ExpressionAttributeValues: {
        ':pk': `CATEGORY_LOCALE#${locale}`,
      },
      ScanIndexForward: true, // Ascending order by GSI1SK (ORDER#)
    })
  );

  if (!result.Items) {
    return [];
  }

  return result.Items
    .filter(item => item.isActive)
    .map(mapItemToCategory)
    .sort((a, b) => a.order - b.order);
}

/**
 * Get all categories (all locales)
 * @returns Array of categories sorted by order
 */
export async function getAllCategories(): Promise<Category[]> {
  // Query all items with PK starting with CATEGORY# and SK = METADATA
  const result = await docClient.send(
    new QueryCommand({
      TableName: config.dynamodbTable,
      KeyConditionExpression: 'begins_with(PK, :pk) AND SK = :sk',
      ExpressionAttributeValues: {
        ':pk': 'CATEGORY#',
        ':sk': 'METADATA',
      },
    })
  );

  if (!result.Items) {
    return [];
  }

  return result.Items
    .filter(item => item.isActive)
    .map(mapItemToCategory)
    .sort((a, b) => a.order - b.order);
}

/**
 * Create a new category
 * @param category - Category data
 * @returns Created category
 */
export async function createCategory(category: Category): Promise<Category> {
  const now = new Date().toISOString();
  const categoryData: Category = {
    ...category,
    createdAt: now,
    updatedAt: now,
  };

  await docClient.send(
    new PutCommand({
      TableName: config.dynamodbTable,
      Item: {
        PK: `CATEGORY#${category.categoryId}`,
        SK: 'METADATA',
        GSI1PK: `CATEGORY_LOCALE#${category.locale}`,
        GSI1SK: `ORDER#${String(category.order).padStart(5, '0')}`,
        ...categoryData,
      },
    })
  );

  console.log(`Created category: ${category.categoryId}`);
  return categoryData;
}

/**
 * Update a category
 * @param categoryId - Category ID
 * @param updates - Partial category updates
 * @returns Updated category
 */
export async function updateCategory(
  categoryId: string,
  updates: Partial<Omit<Category, 'categoryId' | 'createdAt' | 'updatedAt'>>
): Promise<Category> {
  const now = new Date().toISOString();
  
  // Build update expression dynamically
  const updateExpressions: string[] = ['updatedAt = :updatedAt'];
  const expressionAttributeValues: Record<string, any> = {
    ':updatedAt': now,
  };
  const expressionAttributeNames: Record<string, string> = {};

  if (updates.parentCategory !== undefined) {
    updateExpressions.push('parentCategory = :parentCategory');
    expressionAttributeValues[':parentCategory'] = updates.parentCategory;
  }
  if (updates.locale !== undefined) {
    updateExpressions.push('locale = :locale');
    expressionAttributeValues[':locale'] = updates.locale;
    // Update GSI1PK when locale changes
    updateExpressions.push('GSI1PK = :gsi1pk');
    expressionAttributeValues[':gsi1pk'] = `CATEGORY_LOCALE#${updates.locale}`;
  }
  if (updates.displayName !== undefined) {
    updateExpressions.push('displayName = :displayName');
    expressionAttributeValues[':displayName'] = updates.displayName;
  }
  if (updates.keywords !== undefined) {
    updateExpressions.push('keywords = :keywords');
    expressionAttributeValues[':keywords'] = updates.keywords;
  }
  if (updates.order !== undefined) {
    updateExpressions.push('#order = :order');
    expressionAttributeNames['#order'] = 'order'; // 'order' is a reserved word
    expressionAttributeValues[':order'] = updates.order;
    // Update GSI1SK when order changes
    updateExpressions.push('GSI1SK = :gsi1sk');
    expressionAttributeValues[':gsi1sk'] = `ORDER#${String(updates.order).padStart(5, '0')}`;
  }
  if (updates.isActive !== undefined) {
    updateExpressions.push('isActive = :isActive');
    expressionAttributeValues[':isActive'] = updates.isActive;
  }

  const result = await docClient.send(
    new UpdateCommand({
      TableName: config.dynamodbTable,
      Key: {
        PK: `CATEGORY#${categoryId}`,
        SK: 'METADATA',
      },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeValues: expressionAttributeValues,
      ...(Object.keys(expressionAttributeNames).length > 0 && {
        ExpressionAttributeNames: expressionAttributeNames,
      }),
      ReturnValues: 'ALL_NEW',
    })
  );

  console.log(`Updated category: ${categoryId}`);
  return mapItemToCategory(result.Attributes!);
}

/**
 * Delete a category (soft delete by setting isActive = false)
 * @param categoryId - Category ID
 */
export async function deleteCategory(categoryId: string): Promise<void> {
  await docClient.send(
    new UpdateCommand({
      TableName: config.dynamodbTable,
      Key: {
        PK: `CATEGORY#${categoryId}`,
        SK: 'METADATA',
      },
      UpdateExpression: 'SET isActive = :isActive, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':isActive': false,
        ':updatedAt': new Date().toISOString(),
      },
    })
  );

  console.log(`Deleted (soft) category: ${categoryId}`);
}

/**
 * Get all feeds for a category
 * @param categoryId - Category ID
 * @returns Array of feeds sorted by priority
 */
export async function getFeedsByCategory(categoryId: string): Promise<Feed[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: config.dynamodbTable,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `CATEGORY#${categoryId}`,
        ':sk': 'FEED#',
      },
    })
  );

  if (!result.Items) {
    return [];
  }

  return result.Items
    .filter(item => item.isActive)
    .map(mapItemToFeed)
    .sort((a, b) => a.priority - b.priority);
}

/**
 * Create a new feed
 * @param feed - Feed data
 * @returns Created feed
 */
export async function createFeed(feed: Feed): Promise<Feed> {
  const now = new Date().toISOString();
  const feedData: Feed = {
    ...feed,
    createdAt: now,
    updatedAt: now,
  };

  await docClient.send(
    new PutCommand({
      TableName: config.dynamodbTable,
      Item: {
        PK: `CATEGORY#${feed.categoryId}`,
        SK: `FEED#${feed.url}`,
        ...feedData,
      },
    })
  );

  console.log(`Created feed: ${feed.url} for category ${feed.categoryId}`);
  return feedData;
}

/**
 * Update a feed
 * @param categoryId - Category ID
 * @param url - Feed URL
 * @param updates - Partial feed updates
 * @returns Updated feed
 */
export async function updateFeed(
  categoryId: string,
  url: string,
  updates: Partial<Omit<Feed, 'categoryId' | 'url' | 'createdAt' | 'updatedAt'>>
): Promise<Feed> {
  const now = new Date().toISOString();
  
  // Build update expression dynamically
  const updateExpressions: string[] = ['updatedAt = :updatedAt'];
  const expressionAttributeValues: Record<string, any> = {
    ':updatedAt': now,
  };

  if (updates.title !== undefined) {
    updateExpressions.push('title = :title');
    expressionAttributeValues[':title'] = updates.title;
  }
  if (updates.description !== undefined) {
    updateExpressions.push('description = :description');
    expressionAttributeValues[':description'] = updates.description;
  }
  if (updates.language !== undefined) {
    updateExpressions.push('#language = :language');
    expressionAttributeValues[':language'] = updates.language;
  }
  if (updates.priority !== undefined) {
    updateExpressions.push('priority = :priority');
    expressionAttributeValues[':priority'] = updates.priority;
  }
  if (updates.isActive !== undefined) {
    updateExpressions.push('isActive = :isActive');
    expressionAttributeValues[':isActive'] = updates.isActive;
  }

  const result = await docClient.send(
    new UpdateCommand({
      TableName: config.dynamodbTable,
      Key: {
        PK: `CATEGORY#${categoryId}`,
        SK: `FEED#${url}`,
      },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeValues: expressionAttributeValues,
      ExpressionAttributeNames: {
        '#language': 'language', // 'language' might be a reserved word
      },
      ReturnValues: 'ALL_NEW',
    })
  );

  console.log(`Updated feed: ${url} for category ${categoryId}`);
  return mapItemToFeed(result.Attributes!);
}

/**
 * Delete a feed (soft delete by setting isActive = false)
 * @param categoryId - Category ID
 * @param url - Feed URL
 */
export async function deleteFeed(categoryId: string, url: string): Promise<void> {
  await docClient.send(
    new UpdateCommand({
      TableName: config.dynamodbTable,
      Key: {
        PK: `CATEGORY#${categoryId}`,
        SK: `FEED#${url}`,
      },
      UpdateExpression: 'SET isActive = :isActive, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':isActive': false,
        ':updatedAt': new Date().toISOString(),
      },
    })
  );

  console.log(`Deleted (soft) feed: ${url} for category ${categoryId}`);
}

/**
 * Map DynamoDB item to Category
 */
function mapItemToCategory(item: Record<string, any>): Category {
  return {
    categoryId: item.categoryId,
    parentCategory: item.parentCategory,
    locale: item.locale,
    displayName: item.displayName,
    keywords: item.keywords,
    order: item.order,
    isActive: item.isActive,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

/**
 * Map DynamoDB item to Feed
 */
function mapItemToFeed(item: Record<string, any>): Feed {
  return {
    categoryId: item.categoryId,
    url: item.url,
    title: item.title,
    description: item.description,
    language: item.language,
    priority: item.priority,
    isActive: item.isActive,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}
