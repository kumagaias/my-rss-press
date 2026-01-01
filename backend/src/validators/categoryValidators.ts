import { z } from 'zod';

/**
 * Validation schema for creating a category
 */
export const createCategorySchema = z.object({
  categoryId: z.string().min(1).max(50),
  parentCategory: z.string().optional(),
  locale: z.enum(['en', 'ja']),
  displayName: z.string().min(1).max(100),
  keywords: z.array(z.string()).min(1),
  order: z.number().int().min(0),
});

/**
 * Validation schema for updating a category
 */
export const updateCategorySchema = z.object({
  parentCategory: z.string().optional(),
  locale: z.enum(['en', 'ja']).optional(),
  displayName: z.string().min(1).max(100).optional(),
  keywords: z.array(z.string()).min(1).optional(),
  order: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

/**
 * Validation schema for creating a feed
 */
export const createFeedSchema = z.object({
  categoryId: z.string().min(1),
  url: z.string().url(),
  title: z.string().min(1).max(200),
  description: z.string().max(500),
  language: z.string().length(2),
  priority: z.number().int().min(0),
});

/**
 * Validation schema for updating a feed
 */
export const updateFeedSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional(),
  language: z.string().length(2).optional(),
  priority: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});
