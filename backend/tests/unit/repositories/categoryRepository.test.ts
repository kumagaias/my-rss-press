import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import {
  getCategoryById,
  getCategoriesByLocale,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getFeedsByCategory,
  createFeed,
  updateFeed,
  deleteFeed,
} from '../../../src/repositories/categoryRepository.js';
import { Category, Feed } from '../../../src/types/category.js';

const ddbMock = mockClient(DynamoDBDocumentClient);

describe('Category Repository', () => {
  beforeEach(() => {
    ddbMock.reset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getCategoryById', () => {
    it('should return a category when found and active', async () => {
      const mockCategory: Category = {
        categoryId: 'technology',
        locale: 'en',
        displayName: 'Technology',
        keywords: ['tech', 'technology'],
        order: 1,
        isActive: true,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      };

      ddbMock.on(GetCommand).resolves({
        Item: {
          PK: 'CATEGORY#technology',
          SK: 'METADATA',
          ...mockCategory,
        },
      });

      const result = await getCategoryById('technology');

      expect(result).toEqual(mockCategory);
    });

    it('should return null when category not found', async () => {
      ddbMock.on(GetCommand).resolves({});

      const result = await getCategoryById('nonexistent');

      expect(result).toBeNull();
    });

    it('should return null when category is inactive', async () => {
      ddbMock.on(GetCommand).resolves({
        Item: {
          PK: 'CATEGORY#technology',
          SK: 'METADATA',
          categoryId: 'technology',
          isActive: false,
        },
      });

      const result = await getCategoryById('technology');

      expect(result).toBeNull();
    });
  });

  describe('getCategoriesByLocale', () => {
    it('should return categories for a given locale sorted by order', async () => {
      const mockCategories = [
        {
          PK: 'CATEGORY#technology',
          SK: 'METADATA',
          categoryId: 'technology',
          locale: 'en',
          displayName: 'Technology',
          keywords: ['tech'],
          order: 2,
          isActive: true,
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
        {
          PK: 'CATEGORY#business',
          SK: 'METADATA',
          categoryId: 'business',
          locale: 'en',
          displayName: 'Business',
          keywords: ['business'],
          order: 1,
          isActive: true,
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
      ];

      ddbMock.on(QueryCommand).resolves({
        Items: mockCategories,
      });

      const result = await getCategoriesByLocale('en');

      expect(result).toHaveLength(2);
      expect(result[0].categoryId).toBe('business'); // order: 1
      expect(result[1].categoryId).toBe('technology'); // order: 2
    });

    it('should filter out inactive categories', async () => {
      const mockCategories = [
        {
          categoryId: 'technology',
          locale: 'en',
          displayName: 'Technology',
          keywords: ['tech'],
          order: 1,
          isActive: true,
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
        {
          categoryId: 'business',
          locale: 'en',
          displayName: 'Business',
          keywords: ['business'],
          order: 2,
          isActive: false,
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
      ];

      ddbMock.on(QueryCommand).resolves({
        Items: mockCategories,
      });

      const result = await getCategoriesByLocale('en');

      expect(result).toHaveLength(1);
      expect(result[0].categoryId).toBe('technology');
    });

    it('should return empty array when no categories found', async () => {
      ddbMock.on(QueryCommand).resolves({});

      const result = await getCategoriesByLocale('en');

      expect(result).toEqual([]);
    });
  });

  describe('getAllCategories', () => {
    it('should return all active categories sorted by order', async () => {
      const mockCategoriesEn = [
        {
          categoryId: 'technology',
          locale: 'en',
          displayName: 'Technology',
          keywords: ['tech'],
          order: 2,
          isActive: true,
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
      ];

      const mockCategoriesJa = [
        {
          categoryId: 'business',
          locale: 'ja',
          displayName: 'ビジネス',
          keywords: ['business'],
          order: 1,
          isActive: true,
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
      ];

      // Mock both queries (en and ja) - getAllCategories now queries both locales
      ddbMock
        .on(QueryCommand, {
          IndexName: 'CategoryLocale',
          KeyConditionExpression: 'GSI1PK = :pk',
          ExpressionAttributeValues: { ':pk': 'CATEGORY_LOCALE#en' },
        })
        .resolves({ Items: mockCategoriesEn })
        .on(QueryCommand, {
          IndexName: 'CategoryLocale',
          KeyConditionExpression: 'GSI1PK = :pk',
          ExpressionAttributeValues: { ':pk': 'CATEGORY_LOCALE#ja' },
        })
        .resolves({ Items: mockCategoriesJa });

      const result = await getAllCategories();

      expect(result).toHaveLength(2);
      expect(result[0].categoryId).toBe('business'); // order: 1
      expect(result[1].categoryId).toBe('technology'); // order: 2
    });
  });

  describe('createCategory', () => {
    it('should create a category with timestamps', async () => {
      const inputCategory: Category = {
        categoryId: 'technology',
        locale: 'en',
        displayName: 'Technology',
        keywords: ['tech', 'technology'],
        order: 1,
        isActive: true,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      };

      ddbMock.on(PutCommand).resolves({});

      const result = await createCategory(inputCategory);

      expect(result).toHaveProperty('categoryId', 'technology');
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('updatedAt');
      expect(result.createdAt).toBe(result.updatedAt);
    });
  });

  describe('updateCategory', () => {
    it('should update category fields', async () => {
      const updates = {
        displayName: 'Updated Technology',
        keywords: ['tech', 'IT'],
      };

      ddbMock.on(UpdateCommand).resolves({
        Attributes: {
          categoryId: 'technology',
          locale: 'en',
          displayName: 'Updated Technology',
          keywords: ['tech', 'IT'],
          order: 1,
          isActive: true,
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-02T00:00:00.000Z',
        },
      });

      const result = await updateCategory('technology', updates);

      expect(result.displayName).toBe('Updated Technology');
      expect(result.keywords).toEqual(['tech', 'IT']);
    });
  });

  describe('deleteCategory', () => {
    it('should soft delete a category', async () => {
      ddbMock.on(UpdateCommand).resolves({});

      await expect(deleteCategory('technology')).resolves.not.toThrow();
    });
  });

  describe('getFeedsByCategory', () => {
    it('should return feeds for a category sorted by priority', async () => {
      const mockFeeds = [
        {
          categoryId: 'technology',
          url: 'https://example.com/feed2',
          title: 'Feed 2',
          description: 'Description 2',
          language: 'en',
          priority: 2,
          isActive: true,
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
        {
          categoryId: 'technology',
          url: 'https://example.com/feed1',
          title: 'Feed 1',
          description: 'Description 1',
          language: 'en',
          priority: 1,
          isActive: true,
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
      ];

      ddbMock.on(QueryCommand).resolves({
        Items: mockFeeds,
      });

      const result = await getFeedsByCategory('technology');

      expect(result).toHaveLength(2);
      expect(result[0].url).toBe('https://example.com/feed1'); // priority: 1
      expect(result[1].url).toBe('https://example.com/feed2'); // priority: 2
    });

    it('should filter out inactive feeds', async () => {
      const mockFeeds = [
        {
          categoryId: 'technology',
          url: 'https://example.com/feed1',
          title: 'Feed 1',
          description: 'Description 1',
          language: 'en',
          priority: 1,
          isActive: true,
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
        {
          categoryId: 'technology',
          url: 'https://example.com/feed2',
          title: 'Feed 2',
          description: 'Description 2',
          language: 'en',
          priority: 2,
          isActive: false,
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
      ];

      ddbMock.on(QueryCommand).resolves({
        Items: mockFeeds,
      });

      const result = await getFeedsByCategory('technology');

      expect(result).toHaveLength(1);
      expect(result[0].url).toBe('https://example.com/feed1');
    });

    it('should return empty array when no feeds found', async () => {
      ddbMock.on(QueryCommand).resolves({});

      const result = await getFeedsByCategory('technology');

      expect(result).toEqual([]);
    });
  });

  describe('createFeed', () => {
    it('should create a feed with timestamps', async () => {
      const inputFeed: Feed = {
        categoryId: 'technology',
        url: 'https://example.com/feed',
        title: 'Example Feed',
        description: 'Example Description',
        language: 'en',
        priority: 1,
        isActive: true,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      };

      ddbMock.on(PutCommand).resolves({});

      const result = await createFeed(inputFeed);

      expect(result).toHaveProperty('url', 'https://example.com/feed');
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('updatedAt');
      expect(result.createdAt).toBe(result.updatedAt);
    });
  });

  describe('updateFeed', () => {
    it('should update feed fields', async () => {
      const updates = {
        title: 'Updated Feed',
        priority: 5,
      };

      ddbMock.on(UpdateCommand).resolves({
        Attributes: {
          categoryId: 'technology',
          url: 'https://example.com/feed',
          title: 'Updated Feed',
          description: 'Description',
          language: 'en',
          priority: 5,
          isActive: true,
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-02T00:00:00.000Z',
        },
      });

      const result = await updateFeed('technology', 'https://example.com/feed', updates);

      expect(result.title).toBe('Updated Feed');
      expect(result.priority).toBe(5);
    });
  });

  describe('deleteFeed', () => {
    it('should soft delete a feed', async () => {
      ddbMock.on(UpdateCommand).resolves({});

      await expect(deleteFeed('technology', 'https://example.com/feed')).resolves.not.toThrow();
    });
  });
});
