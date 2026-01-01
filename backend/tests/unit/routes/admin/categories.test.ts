import { describe, it, expect, vi, beforeEach } from 'vitest';
import { app } from '../../../../src/app.js';
import * as categoryService from '../../../../src/services/categoryService.js';
import { Category, Feed } from '../../../../src/types/category.js';

// Mock the admin auth middleware to bypass authentication in tests
vi.mock('../../../../src/middleware/adminAuth.js', () => ({
  adminAuth: vi.fn(async (_c, next) => await next()),
}));

// Mock the category service
vi.mock('../../../../src/services/categoryService.js');

describe('Admin Categories API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/admin/categories', () => {
    it('should create a category successfully', async () => {
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

      vi.mocked(categoryService.createCategory).mockResolvedValue(mockCategory);

      const res = await app.request('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: 'technology',
          locale: 'en',
          displayName: 'Technology',
          keywords: ['tech', 'technology'],
          order: 1,
        }),
      });

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data).toEqual(mockCategory);
    });

    it('should return 400 for invalid input', async () => {
      const res = await app.request('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: '', // Invalid: empty string
          locale: 'en',
          displayName: 'Technology',
          keywords: [],
          order: 1,
        }),
      });

      expect(res.status).toBe(400);
    });

    it('should return 500 on service error', async () => {
      vi.mocked(categoryService.createCategory).mockRejectedValue(new Error('Database error'));

      const res = await app.request('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: 'technology',
          locale: 'en',
          displayName: 'Technology',
          keywords: ['tech'],
          order: 1,
        }),
      });

      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data).toHaveProperty('error');
    });
  });

  describe('GET /api/admin/categories', () => {
    it('should list all categories', async () => {
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

      vi.mocked(categoryService.getAllCategories).mockResolvedValue(mockCategories);

      const res = await app.request('/api/admin/categories');

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty('categories');
      expect(data.categories).toEqual(mockCategories);
    });

    it('should filter categories by locale', async () => {
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

      vi.mocked(categoryService.getAllCategories).mockResolvedValue(mockCategories);

      const res = await app.request('/api/admin/categories?locale=en');

      expect(res.status).toBe(200);
      expect(categoryService.getAllCategories).toHaveBeenCalledWith('en');
    });

    it('should return 400 for invalid locale', async () => {
      const res = await app.request('/api/admin/categories?locale=invalid');

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data).toHaveProperty('error', 'INVALID_LOCALE');
    });
  });

  describe('GET /api/admin/categories/:id', () => {
    it('should get a category by ID', async () => {
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

      vi.mocked(categoryService.getCategoryById).mockResolvedValue(mockCategory);

      const res = await app.request('/api/admin/categories/technology');

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual(mockCategory);
    });

    it('should return 404 when category not found', async () => {
      vi.mocked(categoryService.getCategoryById).mockResolvedValue(null);

      const res = await app.request('/api/admin/categories/nonexistent');

      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data).toHaveProperty('error', 'CATEGORY_NOT_FOUND');
    });
  });

  describe('PUT /api/admin/categories/:id', () => {
    it('should update a category', async () => {
      const mockExisting: Category = {
        categoryId: 'technology',
        locale: 'en',
        displayName: 'Technology',
        keywords: ['tech'],
        order: 1,
        isActive: true,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      };

      const mockUpdated: Category = {
        ...mockExisting,
        displayName: 'Updated Technology',
        updatedAt: '2025-01-02T00:00:00.000Z',
      };

      vi.mocked(categoryService.getCategoryById).mockResolvedValue(mockExisting);
      vi.mocked(categoryService.updateCategory).mockResolvedValue(mockUpdated);

      const res = await app.request('/api/admin/categories/technology', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: 'Updated Technology',
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.displayName).toBe('Updated Technology');
    });

    it('should return 404 when category not found', async () => {
      vi.mocked(categoryService.getCategoryById).mockResolvedValue(null);

      const res = await app.request('/api/admin/categories/nonexistent', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: 'Updated',
        }),
      });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/admin/categories/:id', () => {
    it('should delete a category', async () => {
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

      vi.mocked(categoryService.getCategoryById).mockResolvedValue(mockCategory);
      vi.mocked(categoryService.deleteCategory).mockResolvedValue();

      const res = await app.request('/api/admin/categories/technology', {
        method: 'DELETE',
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty('message');
    });

    it('should return 404 when category not found', async () => {
      vi.mocked(categoryService.getCategoryById).mockResolvedValue(null);

      const res = await app.request('/api/admin/categories/nonexistent', {
        method: 'DELETE',
      });

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/admin/categories/feeds', () => {
    it('should create a feed successfully', async () => {
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

      const mockFeed: Feed = {
        categoryId: 'technology',
        url: 'https://example.com/feed',
        title: 'Example Feed',
        description: 'Description',
        language: 'en',
        priority: 1,
        isActive: true,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      };

      vi.mocked(categoryService.getCategoryById).mockResolvedValue(mockCategory);
      vi.mocked(categoryService.createFeed).mockResolvedValue(mockFeed);

      const res = await app.request('/api/admin/categories/feeds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: 'technology',
          url: 'https://example.com/feed',
          title: 'Example Feed',
          description: 'Description',
          language: 'en',
          priority: 1,
        }),
      });

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data).toEqual(mockFeed);
    });

    it('should return 404 when category not found', async () => {
      vi.mocked(categoryService.getCategoryById).mockResolvedValue(null);

      const res = await app.request('/api/admin/categories/feeds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: 'nonexistent',
          url: 'https://example.com/feed',
          title: 'Example Feed',
          description: 'Description',
          language: 'en',
          priority: 1,
        }),
      });

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/admin/categories/feeds/:categoryId', () => {
    it('should list feeds by category', async () => {
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

      vi.mocked(categoryService.getCategoryById).mockResolvedValue(mockCategory);
      vi.mocked(categoryService.getFeedsByCategory).mockResolvedValue(mockFeeds);

      const res = await app.request('/api/admin/categories/feeds/technology');

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty('feeds');
      expect(data.feeds).toEqual(mockFeeds);
    });

    it('should return 404 when category not found', async () => {
      vi.mocked(categoryService.getCategoryById).mockResolvedValue(null);

      const res = await app.request('/api/admin/categories/feeds/nonexistent');

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/admin/categories/feeds/:categoryId/:url', () => {
    it('should update a feed', async () => {
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

      const mockFeed: Feed = {
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

      vi.mocked(categoryService.getCategoryById).mockResolvedValue(mockCategory);
      vi.mocked(categoryService.updateFeed).mockResolvedValue(mockFeed);

      const res = await app.request('/api/admin/categories/feeds/technology/https%3A%2F%2Fexample.com%2Ffeed', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Updated Feed',
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.title).toBe('Updated Feed');
    });
  });

  describe('DELETE /api/admin/categories/feeds/:categoryId/:url', () => {
    it('should delete a feed', async () => {
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

      vi.mocked(categoryService.getCategoryById).mockResolvedValue(mockCategory);
      vi.mocked(categoryService.deleteFeed).mockResolvedValue();

      const res = await app.request('/api/admin/categories/feeds/technology/https%3A%2F%2Fexample.com%2Ffeed', {
        method: 'DELETE',
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty('message');
    });
  });
});
