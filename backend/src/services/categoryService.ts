import {
  getCategoryById as getCategoryByIdRepo,
  getCategoriesByLocale as getCategoriesByLocaleRepo,
  getAllCategories as getAllCategoriesRepo,
  createCategory as createCategoryRepo,
  updateCategory as updateCategoryRepo,
  deleteCategory as deleteCategoryRepo,
  getFeedsByCategory as getFeedsByCategoryRepo,
  createFeed as createFeedRepo,
  updateFeed as updateFeedRepo,
  deleteFeed as deleteFeedRepo,
} from '../repositories/categoryRepository.js';
import {
  Category,
  Feed,
  CreateCategoryInput,
  CreateFeedInput,
  UpdateCategoryInput,
  UpdateFeedInput,
} from '../types/category.js';

/**
 * Get a category by matching theme keywords
 * @param theme - User's theme input
 * @param locale - Locale ('en' or 'ja')
 * @returns Matching category or null
 */
export async function getCategoryByTheme(
  theme: string,
  locale: 'en' | 'ja'
): Promise<Category | null> {
  const categories = await getCategoriesByLocaleRepo(locale);
  
  // Normalize theme for case-insensitive matching
  const normalizedTheme = theme.toLowerCase();
  
  // Find first category where any keyword matches the theme
  const matchingCategory = categories.find(category =>
    category.keywords.some(keyword =>
      normalizedTheme.includes(keyword.toLowerCase())
    )
  );
  
  return matchingCategory || null;
}

/**
 * Get all categories, optionally filtered by locale
 * @param locale - Optional locale filter
 * @returns Array of categories sorted by order
 */
export async function getAllCategories(locale?: 'en' | 'ja'): Promise<Category[]> {
  if (locale) {
    return getCategoriesByLocaleRepo(locale);
  }
  return getAllCategoriesRepo();
}

/**
 * Get a category by ID
 * @param categoryId - Category ID
 * @returns Category or null if not found
 */
export async function getCategoryById(categoryId: string): Promise<Category | null> {
  return getCategoryByIdRepo(categoryId);
}

/**
 * Get all feeds for a category
 * @param categoryId - Category ID
 * @returns Array of feeds sorted by priority
 */
export async function getFeedsByCategory(categoryId: string): Promise<Feed[]> {
  return getFeedsByCategoryRepo(categoryId);
}

/**
 * Create a new category
 * @param input - Category input (without timestamps)
 * @returns Created category
 */
export async function createCategory(input: CreateCategoryInput): Promise<Category> {
  const now = new Date().toISOString();
  
  const category: Category = {
    ...input,
    createdAt: now,
    updatedAt: now,
  };
  
  return createCategoryRepo(category);
}

/**
 * Update a category
 * @param categoryId - Category ID
 * @param updates - Partial category updates
 * @returns Updated category
 */
export async function updateCategory(
  categoryId: string,
  updates: UpdateCategoryInput
): Promise<Category> {
  return updateCategoryRepo(categoryId, updates);
}

/**
 * Delete a category (soft delete)
 * @param categoryId - Category ID
 */
export async function deleteCategory(categoryId: string): Promise<void> {
  return deleteCategoryRepo(categoryId);
}

/**
 * Create a new feed
 * @param input - Feed input (without timestamps)
 * @returns Created feed
 */
export async function createFeed(input: CreateFeedInput): Promise<Feed> {
  const now = new Date().toISOString();
  
  const feed: Feed = {
    ...input,
    createdAt: now,
    updatedAt: now,
  };
  
  return createFeedRepo(feed);
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
  updates: UpdateFeedInput
): Promise<Feed> {
  return updateFeedRepo(categoryId, url, updates);
}

/**
 * Delete a feed (soft delete)
 * @param categoryId - Category ID
 * @param url - Feed URL
 */
export async function deleteFeed(categoryId: string, url: string): Promise<void> {
  return deleteFeedRepo(categoryId, url);
}
