import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as categoryService from '../../../src/services/categoryService.js';
import * as categoryRepository from '../../../src/repositories/categoryRepository.js';
import { Category, Feed } from '../../../src/types/category.js';

// Mock the repository
vi.mock('../../../src/repositories/categoryRepository.js');

describe('Category Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getCategoryByTheme', () => {
    it('should return matching category for theme', async () => {
      const mockCategories: Category[] = [
        {
          categoryId: 'technology',
          locale: 'en',
          displayName: 'Technology',
          keywords: ['tech', 'technology', 'IT'],
          order: 1,
          isActive: true,
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
        {
          categoryId: 'business',
          locale: 'en',
          displayName: 'Business',
          keywords: ['business', 'finance'],
          order: 2,
          isActive: true,
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
      ];

      vi.mocked(categoryRepository.getCategoriesByLocale).mockResolvedValue(mockCategories);

      const result = await categoryService.getCategoryByTheme('technology news', 'en');

      expect(result).not.toBeNull();
      expect(result?.categoryId).toBe('technology');
    });

    it('should perform case-insensitive keyword matching', async () => {
      const mockCategories: Category[] = [
        {
          categoryId: 'technology',
          locale: 'en',
          displayName: 'Technology',
          keywords: ['tech', 'Technology', 'IT'],
          order: 1,
          isActive: true,
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
      ];

      vi.mocked(categoryRepository.getCategoriesByLocale).mockResolvedValue(mockCategories);

      const result = await categoryService.getCategoryByTheme('TECHNOLOGY', 'en');

      expect(result).not.toBeNull();
      expect(result?.categoryId).toBe('technology');
    });

    it('should return null when no category matches', async () => {
      const mockCategories: Category[] = [
        {
          categoryId: 'technology',
          locale: 'en',
          displayName: 'Technology',
          keywords: ['tech', 'technology'],
          order: 1,
          isActive: true,
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
      ];

      vi.mocked(categoryRepository.getCategoriesByLocale).mockResolvedValue(mockCategories);

      const result = await categoryService.getCategoryByTheme('sports', 'en');

      expect(result).toBeNull();
    });

    it('should return first matching category when multiple match', async () => {
      const mockCategories: Category[] = [
        {
          categoryId: 'technology',
          locale: 'en',
          displayName: 'Technology',
          keywords: ['tech', 'news'],
          order: 1,
          isActive: true,
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
        {
          categoryId: 'general-news',
          locale: 'en',
          displayName: 'General News',
          keywords: ['news', 'general'],
          order: 2,
          isActive: true,
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
      ];

      vi.mocked(categoryRepository.getCategoriesByLocale).mockResolvedValue(mockCategories);

      const result = await categoryService.getCategoryByTheme('tech news', 'en');

      expect(result).not.toBeNull();
      expect(result?.categoryId).toBe('technology'); // First match
    });
  });

  describe('getAllCategories', () => {
    it('should return all categories when no locale specified', async () => {
      const mockCategories: Category[] = [
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
      ];

      vi.mocked(categoryRepository.getAllCategories).mockResolvedValue(mockCategories);

      const result = await categoryService.getAllCategories();

      expect(result).toEqual(mockCategories);
      expect(categoryRepository.getAllCategories).toHaveBeenCalledOnce();
    });

    it('should return categories filtered by locale', async () => {
      const mockCategories: Category[] = [
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
      ];

      vi.mocked(categoryRepository.getCategoriesByLocale).mockResolvedValue(mockCategories);

      const result = await categoryService.getAllCategories('en');

      expect(result).toEqual(mockCategories);
      expect(categoryRepository.getCategoriesByLocale).toHaveBeenCalledWith('en');
    });
  });

  describe('getCategoryById', () => {
    it('should return category by ID', async () => {
      const mockCategory: Category = {
        categoryId: 'technology',
        locale: 'en',
        displayName: 'Technology',
        keywords: ['tech'],
        order: 1,
        isActive: true,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      };

      vi.mocked(categoryRepository.getCategoryById).mockResolvedValue(mockCategory);

      const result = await categoryService.getCategoryById('technology');

      expect(result).toEqual(mockCategory);
      expect(categoryRepository.getCategoryById).toHaveBeenCalledWith('technology');
    });

    it('should return null when category not found', async () => {
      vi.mocked(categoryRepository.getCategoryById).mockResolvedValue(null);

      const result = await categoryService.getCategoryById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getFeedsByCategory', () => {
    it('should return feeds for a category', async () => {
      const mockFeeds: Feed[] = [
        {
          categoryId: 'technology',
          url: 'https://example.com/feed',
          title: 'Example Feed',
          description: 'Description',
          language: 'en',
          priority: 1,
          isActive: true,
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
      ];

      vi.mocked(categoryRepository.getFeedsByCategory).mockResolvedValue(mockFeeds);

      const result = await categoryService.getFeedsByCategory('technology');

      expect(result).toEqual(mockFeeds);
      expect(categoryRepository.getFeedsByCategory).toHaveBeenCalledWith('technology');
    });
  });

  describe('createCategory', () => {
    it('should create category with auto-generated timestamps', async () => {
      const input = {
        categoryId: 'technology',
        locale: 'en' as const,
        displayName: 'Technology',
        keywords: ['tech'],
        order: 1,
        isActive: true,
      };

      const mockCreatedCategory: Category = {
        ...input,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      };

      vi.mocked(categoryRepository.createCategory).mockResolvedValue(mockCreatedCategory);

      const result = await categoryService.createCategory(input);

      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('updatedAt');
      expect(categoryRepository.createCategory).toHaveBeenCalled();
    });
  });

  describe('updateCategory', () => {
    it('should update category', async () => {
      const updates = {
        displayName: 'Updated Technology',
      };

      const mockUpdatedCategory: Category = {
        categoryId: 'technology',
        locale: 'en',
        displayName: 'Updated Technology',
        keywords: ['tech'],
        order: 1,
        isActive: true,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-02T00:00:00.000Z',
      };

      vi.mocked(categoryRepository.updateCategory).mockResolvedValue(mockUpdatedCategory);

      const result = await categoryService.updateCategory('technology', updates);

      expect(result.displayName).toBe('Updated Technology');
      expect(categoryRepository.updateCategory).toHaveBeenCalledWith('technology', updates);
    });
  });

  describe('deleteCategory', () => {
    it('should delete category', async () => {
      vi.mocked(categoryRepository.deleteCategory).mockResolvedValue();

      await categoryService.deleteCategory('technology');

      expect(categoryRepository.deleteCategory).toHaveBeenCalledWith('technology');
    });
  });

  describe('createFeed', () => {
    it('should create feed with auto-generated timestamps', async () => {
      const input = {
        categoryId: 'technology',
        url: 'https://example.com/feed',
        title: 'Example Feed',
        description: 'Description',
        language: 'en',
        priority: 1,
        isActive: true,
      };

      const mockCreatedFeed: Feed = {
        ...input,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      };

      vi.mocked(categoryRepository.createFeed).mockResolvedValue(mockCreatedFeed);

      const result = await categoryService.createFeed(input);

      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('updatedAt');
      expect(categoryRepository.createFeed).toHaveBeenCalled();
    });
  });

  describe('updateFeed', () => {
    it('should update feed', async () => {
      const updates = {
        title: 'Updated Feed',
      };

      const mockUpdatedFeed: Feed = {
        categoryId: 'technology',
        url: 'https://example.com/feed',
        title: 'Updated Feed',
        description: 'Description',
        language: 'en',
        priority: 1,
        isActive: true,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-02T00:00:00.000Z',
      };

      vi.mocked(categoryRepository.updateFeed).mockResolvedValue(mockUpdatedFeed);

      const result = await categoryService.updateFeed('technology', 'https://example.com/feed', updates);

      expect(result.title).toBe('Updated Feed');
      expect(categoryRepository.updateFeed).toHaveBeenCalledWith('technology', 'https://example.com/feed', updates);
    });
  });

  describe('deleteFeed', () => {
    it('should delete feed', async () => {
      vi.mocked(categoryRepository.deleteFeed).mockResolvedValue();

      await categoryService.deleteFeed('technology', 'https://example.com/feed');

      expect(categoryRepository.deleteFeed).toHaveBeenCalledWith('technology', 'https://example.com/feed');
    });
  });
});
