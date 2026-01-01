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
 * Calculate similarity score between theme and keywords
 * @param theme - User's theme input
 * @param keywords - Category keywords
 * @returns Similarity score (0-100)
 */
function calculateSimilarityScore(theme: string, keywords: string[]): number {
  const normalizedTheme = theme.toLowerCase().trim();
  let maxScore = 0;
  
  for (const keyword of keywords) {
    const normalizedKeyword = keyword.toLowerCase().trim();
    
    // Exact match: 100 points
    if (normalizedTheme === normalizedKeyword) {
      return 100;
    }
    
    // Theme contains keyword or keyword contains theme: 80 points
    if (normalizedTheme.includes(normalizedKeyword) || normalizedKeyword.includes(normalizedTheme)) {
      maxScore = Math.max(maxScore, 80);
      continue;
    }
    
    // Word-level matching: 60 points
    const themeWords = normalizedTheme.split(/\s+/);
    const keywordWords = normalizedKeyword.split(/\s+/);
    
    for (const themeWord of themeWords) {
      for (const keywordWord of keywordWords) {
        if (themeWord === keywordWord) {
          maxScore = Math.max(maxScore, 60);
        } else if (themeWord.includes(keywordWord) || keywordWord.includes(themeWord)) {
          maxScore = Math.max(maxScore, 40);
        }
      }
    }
  }
  
  return maxScore;
}

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
  
  // Calculate similarity scores for all categories
  const categoriesWithScores = categories.map(category => ({
    category,
    score: calculateSimilarityScore(theme, category.keywords),
  }));
  
  // Sort by score (highest first)
  categoriesWithScores.sort((a, b) => b.score - a.score);
  
  // Return category with highest score if score > 0
  const best = categoriesWithScores[0];
  return best && best.score > 0 ? best.category : null;
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
