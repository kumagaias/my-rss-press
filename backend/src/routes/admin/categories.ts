import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import {
  createCategorySchema,
  updateCategorySchema,
  createFeedSchema,
  updateFeedSchema,
} from '../../validators/categoryValidators.js';
import * as categoryService from '../../services/categoryService.js';
import { adminAuth } from '../../middleware/adminAuth.js';

const app = new Hono();

// Apply authentication middleware to all admin routes
app.use('/*', adminAuth);

// ============================================================
// Category Endpoints
// ============================================================

/**
 * POST /api/admin/categories
 * Create a new category
 */
app.post('/', zValidator('json', createCategorySchema), async (c) => {
  try {
    const data = c.req.valid('json');
    
    const category = await categoryService.createCategory({
      ...data,
      isActive: true,
    });
    
    return c.json(category, 201);
  } catch (error) {
    console.error('Error creating category:', error);
    return c.json(
      {
        error: 'CATEGORY_CREATE_FAILED',
        message: error instanceof Error ? error.message : 'Failed to create category',
      },
      500
    );
  }
});

/**
 * GET /api/admin/categories
 * List all categories (optionally filtered by locale)
 */
app.get('/', async (c) => {
  try {
    const locale = c.req.query('locale') as 'en' | 'ja' | undefined;
    
    if (locale && locale !== 'en' && locale !== 'ja') {
      return c.json(
        {
          error: 'INVALID_LOCALE',
          message: 'Locale must be "en" or "ja"',
        },
        400
      );
    }
    
    const categories = await categoryService.getAllCategories(locale);
    
    return c.json({ categories });
  } catch (error) {
    console.error('Error listing categories:', error);
    return c.json(
      {
        error: 'CATEGORY_LIST_FAILED',
        message: error instanceof Error ? error.message : 'Failed to list categories',
      },
      500
    );
  }
});

/**
 * GET /api/admin/categories/:id
 * Get a category by ID
 */
app.get('/:id', async (c) => {
  try {
    const categoryId = c.req.param('id');
    
    const category = await categoryService.getCategoryById(categoryId);
    
    if (!category) {
      return c.json(
        {
          error: 'CATEGORY_NOT_FOUND',
          message: `Category '${categoryId}' not found`,
        },
        404
      );
    }
    
    return c.json(category);
  } catch (error) {
    console.error('Error getting category:', error);
    return c.json(
      {
        error: 'CATEGORY_GET_FAILED',
        message: error instanceof Error ? error.message : 'Failed to get category',
      },
      500
    );
  }
});

/**
 * PUT /api/admin/categories/:id
 * Update a category
 */
app.put('/:id', zValidator('json', updateCategorySchema), async (c) => {
  try {
    const categoryId = c.req.param('id');
    const updates = c.req.valid('json');
    
    // Check if category exists
    const existing = await categoryService.getCategoryById(categoryId);
    if (!existing) {
      return c.json(
        {
          error: 'CATEGORY_NOT_FOUND',
          message: `Category '${categoryId}' not found`,
        },
        404
      );
    }
    
    const category = await categoryService.updateCategory(categoryId, updates);
    
    return c.json(category);
  } catch (error) {
    console.error('Error updating category:', error);
    return c.json(
      {
        error: 'CATEGORY_UPDATE_FAILED',
        message: error instanceof Error ? error.message : 'Failed to update category',
      },
      500
    );
  }
});

/**
 * DELETE /api/admin/categories/:id
 * Deactivate a category (soft delete)
 */
app.delete('/:id', async (c) => {
  try {
    const categoryId = c.req.param('id');
    
    // Check if category exists
    const existing = await categoryService.getCategoryById(categoryId);
    if (!existing) {
      return c.json(
        {
          error: 'CATEGORY_NOT_FOUND',
          message: `Category '${categoryId}' not found`,
        },
        404
      );
    }
    
    await categoryService.deleteCategory(categoryId);
    
    return c.json({ message: 'Category deactivated successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    return c.json(
      {
        error: 'CATEGORY_DELETE_FAILED',
        message: error instanceof Error ? error.message : 'Failed to delete category',
      },
      500
    );
  }
});

// ============================================================
// Feed Endpoints
// ============================================================

/**
 * POST /api/admin/feeds
 * Create a new feed
 */
app.post('/feeds', zValidator('json', createFeedSchema), async (c) => {
  try {
    const data = c.req.valid('json');
    
    // Check if category exists
    const category = await categoryService.getCategoryById(data.categoryId);
    if (!category) {
      return c.json(
        {
          error: 'CATEGORY_NOT_FOUND',
          message: `Category '${data.categoryId}' not found`,
        },
        404
      );
    }
    
    const feed = await categoryService.createFeed({
      ...data,
      isActive: true,
    });
    
    return c.json(feed, 201);
  } catch (error) {
    console.error('Error creating feed:', error);
    return c.json(
      {
        error: 'FEED_CREATE_FAILED',
        message: error instanceof Error ? error.message : 'Failed to create feed',
      },
      500
    );
  }
});

/**
 * GET /api/admin/feeds/:categoryId
 * List feeds by category
 */
app.get('/feeds/:categoryId', async (c) => {
  try {
    const categoryId = c.req.param('categoryId');
    
    // Check if category exists
    const category = await categoryService.getCategoryById(categoryId);
    if (!category) {
      return c.json(
        {
          error: 'CATEGORY_NOT_FOUND',
          message: `Category '${categoryId}' not found`,
        },
        404
      );
    }
    
    const feeds = await categoryService.getFeedsByCategory(categoryId);
    
    return c.json({ feeds });
  } catch (error) {
    console.error('Error listing feeds:', error);
    return c.json(
      {
        error: 'FEED_LIST_FAILED',
        message: error instanceof Error ? error.message : 'Failed to list feeds',
      },
      500
    );
  }
});

/**
 * PUT /api/admin/feeds/:categoryId/:url
 * Update a feed
 */
app.put('/feeds/:categoryId/:url', zValidator('json', updateFeedSchema), async (c) => {
  try {
    const categoryId = c.req.param('categoryId');
    const url = decodeURIComponent(c.req.param('url'));
    const updates = c.req.valid('json');
    
    // Check if category exists
    const category = await categoryService.getCategoryById(categoryId);
    if (!category) {
      return c.json(
        {
          error: 'CATEGORY_NOT_FOUND',
          message: `Category '${categoryId}' not found`,
        },
        404
      );
    }
    
    const feed = await categoryService.updateFeed(categoryId, url, updates);
    
    return c.json(feed);
  } catch (error) {
    console.error('Error updating feed:', error);
    return c.json(
      {
        error: 'FEED_UPDATE_FAILED',
        message: error instanceof Error ? error.message : 'Failed to update feed',
      },
      500
    );
  }
});

/**
 * DELETE /api/admin/feeds/:categoryId/:url
 * Deactivate a feed (soft delete)
 */
app.delete('/feeds/:categoryId/:url', async (c) => {
  try {
    const categoryId = c.req.param('categoryId');
    const url = decodeURIComponent(c.req.param('url'));
    
    // Check if category exists
    const category = await categoryService.getCategoryById(categoryId);
    if (!category) {
      return c.json(
        {
          error: 'CATEGORY_NOT_FOUND',
          message: `Category '${categoryId}' not found`,
        },
        404
      );
    }
    
    await categoryService.deleteFeed(categoryId, url);
    
    return c.json({ message: 'Feed deactivated successfully' });
  } catch (error) {
    console.error('Error deleting feed:', error);
    return c.json(
      {
        error: 'FEED_DELETE_FAILED',
        message: error instanceof Error ? error.message : 'Failed to delete feed',
      },
      500
    );
  }
});

export default app;
