import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';
import {
  recordFeedUsage,
  getFeedUsage,
  getPopularFeedsByCategory,
} from '../../../src/repositories/feedUsageRepository.js';

const ddbMock = mockClient(DynamoDBDocumentClient);

describe('Feed Usage Repository', () => {
  beforeEach(() => {
    ddbMock.reset();
    vi.clearAllMocks();
  });

  describe('recordFeedUsage', () => {
    it('should create a new feed usage record', async () => {
      // Mock: No existing record
      ddbMock.on(GetCommand).resolves({
        Item: undefined,
      });

      // Mock: Put new record
      ddbMock.on(PutCommand).resolves({});

      const result = await recordFeedUsage({
        url: 'https://example.com/feed',
        categoryId: 'technology',
        title: 'Tech Feed',
        articleCount: 10,
        success: true,
      });

      expect(result).toBeDefined();
      expect(result.url).toBe('https://example.com/feed');
      expect(result.categoryId).toBe('technology');
      expect(result.usageCount).toBe(1);
      expect(result.successRate).toBe(100);
      expect(result.averageArticles).toBe(10);
    });

    it('should update existing feed usage record', async () => {
      // Mock: Existing record
      ddbMock.on(GetCommand).resolves({
        Item: {
          PK: 'FEED_USAGE#https://example.com/feed',
          SK: 'CATEGORY#technology',
          url: 'https://example.com/feed',
          categoryId: 'technology',
          title: 'Tech Feed',
          usageCount: 5,
          successRate: 80,
          averageArticles: 8,
          lastUsedAt: '2026-01-01T00:00:00.000Z',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      });

      // Mock: Update record
      ddbMock.on(UpdateCommand).resolves({
        Attributes: {
          url: 'https://example.com/feed',
          categoryId: 'technology',
          title: 'Tech Feed',
          usageCount: 6,
          successRate: 83.33,
          averageArticles: 8.33,
          lastUsedAt: '2026-01-04T00:00:00.000Z',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-04T00:00:00.000Z',
        },
      });

      const result = await recordFeedUsage({
        url: 'https://example.com/feed',
        categoryId: 'technology',
        title: 'Tech Feed',
        articleCount: 10,
        success: true,
      });

      expect(result).toBeDefined();
      expect(result.usageCount).toBe(6);
      expect(result.successRate).toBeCloseTo(83.33, 1);
      expect(result.averageArticles).toBeCloseTo(8.33, 1);
    });

    it('should calculate statistics correctly for failed usage', async () => {
      // Mock: Existing record with 100% success rate
      ddbMock.on(GetCommand).resolves({
        Item: {
          PK: 'FEED_USAGE#https://example.com/feed',
          SK: 'CATEGORY#technology',
          url: 'https://example.com/feed',
          categoryId: 'technology',
          title: 'Tech Feed',
          usageCount: 4,
          successRate: 100,
          averageArticles: 10,
          lastUsedAt: '2026-01-01T00:00:00.000Z',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      });

      // Mock: Update with failed usage
      ddbMock.on(UpdateCommand).resolves({
        Attributes: {
          url: 'https://example.com/feed',
          categoryId: 'technology',
          title: 'Tech Feed',
          usageCount: 5,
          successRate: 80, // 4 successes out of 5 total
          averageArticles: 8, // (10*4 + 0*1) / 5
          lastUsedAt: '2026-01-04T00:00:00.000Z',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-04T00:00:00.000Z',
        },
      });

      const result = await recordFeedUsage({
        url: 'https://example.com/feed',
        categoryId: 'technology',
        title: 'Tech Feed',
        articleCount: 0,
        success: false,
      });

      expect(result.successRate).toBe(80);
      expect(result.averageArticles).toBe(8);
    });
  });

  describe('getFeedUsage', () => {
    it('should return feed usage when it exists', async () => {
      ddbMock.on(GetCommand).resolves({
        Item: {
          PK: 'FEED_USAGE#https://example.com/feed',
          SK: 'CATEGORY#technology',
          url: 'https://example.com/feed',
          categoryId: 'technology',
          title: 'Tech Feed',
          usageCount: 10,
          successRate: 90,
          averageArticles: 12,
          lastUsedAt: '2026-01-04T00:00:00.000Z',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-04T00:00:00.000Z',
        },
      });

      const result = await getFeedUsage('https://example.com/feed', 'technology');

      expect(result).toBeDefined();
      expect(result?.url).toBe('https://example.com/feed');
      expect(result?.usageCount).toBe(10);
      expect(result?.successRate).toBe(90);
    });

    it('should return null when feed usage does not exist', async () => {
      ddbMock.on(GetCommand).resolves({
        Item: undefined,
      });

      const result = await getFeedUsage('https://nonexistent.com/feed', 'technology');

      expect(result).toBeNull();
    });
  });

  describe('getPopularFeedsByCategory', () => {
    it('should return popular feeds sorted by usage count', async () => {
      ddbMock.on(QueryCommand).resolves({
        Items: [
          {
            PK: 'FEED_USAGE#https://feed1.com/rss',
            SK: 'CATEGORY#technology',
            GSI1PK: 'CATEGORY#technology',
            GSI1SK: 'USAGE_COUNT#0000000020',
            url: 'https://feed1.com/rss',
            categoryId: 'technology',
            title: 'Feed 1',
            usageCount: 20,
            successRate: 95,
            averageArticles: 12,
            lastUsedAt: '2026-01-04T00:00:00.000Z',
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-04T00:00:00.000Z',
          },
          {
            PK: 'FEED_USAGE#https://feed2.com/rss',
            SK: 'CATEGORY#technology',
            GSI1PK: 'CATEGORY#technology',
            GSI1SK: 'USAGE_COUNT#0000000015',
            url: 'https://feed2.com/rss',
            categoryId: 'technology',
            title: 'Feed 2',
            usageCount: 15,
            successRate: 90,
            averageArticles: 10,
            lastUsedAt: '2026-01-03T00:00:00.000Z',
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-03T00:00:00.000Z',
          },
          {
            PK: 'FEED_USAGE#https://feed3.com/rss',
            SK: 'CATEGORY#technology',
            GSI1PK: 'CATEGORY#technology',
            GSI1SK: 'USAGE_COUNT#0000000010',
            url: 'https://feed3.com/rss',
            categoryId: 'technology',
            title: 'Feed 3',
            usageCount: 10,
            successRate: 85,
            averageArticles: 8,
            lastUsedAt: '2026-01-02T00:00:00.000Z',
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-02T00:00:00.000Z',
          },
        ],
      });

      const result = await getPopularFeedsByCategory('technology', 10);

      expect(result).toHaveLength(3);
      expect(result[0].url).toBe('https://feed1.com/rss');
      expect(result[0].usageCount).toBe(20);
      expect(result[1].url).toBe('https://feed2.com/rss');
      expect(result[1].usageCount).toBe(15);
      expect(result[2].url).toBe('https://feed3.com/rss');
      expect(result[2].usageCount).toBe(10);
    });

    it('should return empty array when no feeds found', async () => {
      ddbMock.on(QueryCommand).resolves({
        Items: [],
      });

      const result = await getPopularFeedsByCategory('nonexistent', 10);

      expect(result).toEqual([]);
    });

    it('should respect the limit parameter', async () => {
      ddbMock.on(QueryCommand).resolves({
        Items: [
          {
            PK: 'FEED_USAGE#https://feed1.com/rss',
            SK: 'CATEGORY#technology',
            GSI1PK: 'CATEGORY#technology',
            GSI1SK: 'USAGE_COUNT#0000000020',
            url: 'https://feed1.com/rss',
            categoryId: 'technology',
            title: 'Feed 1',
            usageCount: 20,
            successRate: 95,
            averageArticles: 12,
            lastUsedAt: '2026-01-04T00:00:00.000Z',
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-04T00:00:00.000Z',
          },
        ],
      });

      await getPopularFeedsByCategory('technology', 5);

      // Verify QueryCommand was called with correct limit
      const calls = ddbMock.commandCalls(QueryCommand);
      expect(calls).toHaveLength(1);
      expect(calls[0].args[0].input.Limit).toBe(5);
    });
  });
});
