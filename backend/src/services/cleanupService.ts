/**
 * Cleanup Service
 * Automatically deletes newspapers older than 7 days
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  QueryCommand,
  BatchWriteCommand,
} from '@aws-sdk/lib-dynamodb';
import { config } from '../config.js';

// DynamoDB client configuration
const dynamoClient = new DynamoDBClient({
  region: config.bedrockRegion,
  ...(config.dynamodbEndpoint && { endpoint: config.dynamodbEndpoint }),
});

const docClient = DynamoDBDocumentClient.from(dynamoClient);

/**
 * Clean up newspapers older than 7 days
 * @returns Object with deleted count
 */
export async function cleanupOldNewspapers(): Promise<{ deletedCount: number }> {
  console.log('Starting cleanup of old newspapers...');

  // Calculate cutoff date (7 days ago in JST)
  const nowJST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
  const sevenDaysAgo = new Date(nowJST);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const cutoffDate = sevenDaysAgo.toISOString().split('T')[0]; // YYYY-MM-DD

  console.log(`Cutoff date: ${cutoffDate} (JST)`);

  // Query old newspapers
  const oldNewspapers = await queryOldNewspapers(cutoffDate);

  console.log(`Found ${oldNewspapers.length} newspapers to delete`);

  if (oldNewspapers.length === 0) {
    return { deletedCount: 0 };
  }

  // Delete in batches (DynamoDB limit: 25 items per batch)
  let deletedCount = 0;
  const batchSize = 25;

  for (let i = 0; i < oldNewspapers.length; i += batchSize) {
    const batch = oldNewspapers.slice(i, i + batchSize);
    await deleteBatch(batch);
    deletedCount += batch.length;
    console.log(`Deleted batch: ${deletedCount}/${oldNewspapers.length}`);
  }

  console.log(`Cleanup complete: deleted ${deletedCount} newspapers`);

  return { deletedCount };
}

/**
 * Query newspapers older than cutoff date
 * @param cutoffDate - Cutoff date in YYYY-MM-DD format
 * @returns Array of items to delete
 * 
 * Note: Queries both public newspapers and historical newspapers using GSI.
 * Historical newspapers are identified by GSI1PK = 'HISTORICAL'.
 */
async function queryOldNewspapers(cutoffDate: string): Promise<Array<{ PK: string; SK: string }>> {
  const items: Array<{ PK: string; SK: string }> = [];

  // Query 1: Find old public newspapers
  await queryOldNewspapersByGSI('PUBLIC', cutoffDate, items);

  // Query 2: Find old historical newspapers
  await queryOldNewspapersByGSI('HISTORICAL', cutoffDate, items);

  return items;
}

/**
 * Query old newspapers by GSI1PK
 * @param gsi1pk - GSI1PK value ('PUBLIC' or 'HISTORICAL')
 * @param cutoffDate - Cutoff date in YYYY-MM-DD format
 * @param items - Array to append found items to
 */
async function queryOldNewspapersByGSI(
  gsi1pk: string,
  cutoffDate: string,
  items: Array<{ PK: string; SK: string }>
): Promise<void> {
  let lastEvaluatedKey: Record<string, unknown> | undefined;

  do {
    const result = await docClient.send(
      new QueryCommand({
        TableName: config.dynamodbTable,
        IndexName: 'PublicNewspapers', // Use existing GSI
        KeyConditionExpression: 'GSI1PK = :pk',
        ExpressionAttributeValues: {
          ':pk': gsi1pk,
        },
        ExclusiveStartKey: lastEvaluatedKey,
      })
    );

    if (result.Items) {
      for (const item of result.Items) {
        // Check if this is a DATE# item and if it's old enough
        if (item.SK && typeof item.SK === 'string' && item.SK.startsWith('DATE#')) {
          const date = item.SK.substring(5); // Remove 'DATE#' prefix
          if (date < cutoffDate) {
            items.push({
              PK: item.PK as string,
              SK: item.SK as string,
            });
          }
        }
      }
    }

    lastEvaluatedKey = result.LastEvaluatedKey;
  } while (lastEvaluatedKey);
}

/**
 * Delete a batch of items
 * @param items - Array of items to delete
 */
async function deleteBatch(items: Array<{ PK: string; SK: string }>): Promise<void> {
  const deleteRequests = items.map(item => ({
    DeleteRequest: {
      Key: {
        PK: item.PK,
        SK: item.SK,
      },
    },
  }));

  await docClient.send(
    new BatchWriteCommand({
      RequestItems: {
        [config.dynamodbTable]: deleteRequests,
      },
    })
  );
}
